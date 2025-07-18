"use client";

import React, { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { Alert } from "@/ui/components/Alert";
import { TextField } from "@/ui/components/TextField";
import * as SubframeCore from "@subframe/core";
import { TextArea } from "@/ui/components/TextArea";
import { Switch } from "@/ui/components/Switch";
import { 
  getCursorFlowWithSteps, 
  updateStepAnnotation, 
  saveSteps,
  type CursorFlowStepData,
  updateStepCursorPosition
} from "@/utils/cursorflowsteps";
import { 
  getBadgeVariantForStatus, 
  publishCursorFlow,
  rollbackCursorFlow,
  updateCursorFlow,
  triggerEmbeddingGeneration
} from "@/utils/cursorflows";
import {
  hasValidScreenshot,
  getStepType,
  getNavigationUrl,
  getDisplayUrl,
  truncateUrl,
  getCursorPosition,
  getClickedText,
  getElementTagName,
  getCursorPositionPercentage
} from "@/utils/element-utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.error("CRITICAL: NEXT_PUBLIC_API_URL is not defined. API calls will fail.");
}

// Placeholder image when no screenshot is available
// const PLACEHOLDER_IMAGE = "https://gazvscvowgdojkbkxnmk.supabase.co/storage/v1/object/public/screenshots//Screenshot%202025-03-19%20at%209.47.29%20PM.png";

// Create a wrapper component that uses searchParams
function CursorFlowPreviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const flowId = searchParams.get('flowId');
  const flowName = searchParams.get('name') || 'Cursor Flow';

  // State for the cursor flow and its steps
  const [flow, setFlow] = useState<any>(null);
  const [steps, setSteps] = useState<CursorFlowStepData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stepTexts, setStepTexts] = useState<{[key: string]: string}>({});
  const [flowDescription, setFlowDescription] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editableFlowName, setEditableFlowName] = useState(flowName);
  const [showAlert, setShowAlert] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);
  
  // State for AI text generation - now per step
  const [generatingSteps, setGeneratingSteps] = useState<Set<string>>(new Set());
  const [textGenerationProgress, setTextGenerationProgress] = useState(0);

  // Add state for tracking drag operations
  const [draggingStepId, setDraggingStepId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState<{x: number, y: number} | null>(null);
  
  // Reference to store image container elements
  const imageContainerRefs = useRef<{[key: string]: HTMLDivElement | null}>({});

  // Load the cursor flow and steps on component mount
  useEffect(() => {
    if (flowId) {
      loadCursorFlow(flowId);
    } else {
      setError('No flow ID provided');
      setIsLoading(false);
    }
  }, [flowId]);

  // Function to check if text generation is needed and trigger it
  const checkAndTriggerTextGeneration = async (flowData: any) => {
    try {
      if (!API_BASE_URL) {
        console.error('[TEXT_GENERATION] API base URL not configured');
        return;
      }
      
      console.log('[TEXT_GENERATION] Checking for steps needing AI generation');
      
      // Get steps that need AI generation
      const response = await fetch(`${API_BASE_URL}/api/dashboard/flows/${flowData.id}/steps-needing-ai`);
      const result = await response.json();
      
      if (!result.success) {
        console.error('[TEXT_GENERATION] Failed to get steps needing AI:', result.error);
        return;
      }
      
      const stepsNeedingAI = result.steps || [];
      
      if (stepsNeedingAI.length === 0) {
        console.log('[TEXT_GENERATION] No steps need AI generation');
        return;
      }
      
      console.log(`[TEXT_GENERATION] Found ${stepsNeedingAI.length} steps needing AI generation`);
      
      // Mark all steps that need generation as generating
      const stepsNeedingGenerationSet = new Set<string>(stepsNeedingAI.map((step: any) => step.id));
      setGeneratingSteps(stepsNeedingGenerationSet);
      setTextGenerationProgress(0);
      
      // Process each step individually
      let completedSteps = 0;
      
      for (const step of stepsNeedingAI) {
        try {
          console.log(`[TEXT_GENERATION] Processing step ${step.id}...`);
          
          const stepResponse = await fetch(`${API_BASE_URL}/api/dashboard/steps/${step.id}/generate-text`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          const stepResult = await stepResponse.json();
          
          if (stepResult.success) {
            console.log(`[TEXT_GENERATION] Step ${step.id} processed successfully`);
            
            // Update the step text in the UI immediately
            if (stepResult.annotation_text) {
              setStepTexts(prev => ({
                ...prev,
                [step.id]: stepResult.annotation_text
              }));
            }
            
            // Remove this step from generating set
            setGeneratingSteps(prev => {
              const newSet = new Set(prev);
              newSet.delete(step.id);
              return newSet;
            });
          } else {
            console.warn(`[TEXT_GENERATION] Failed to process step ${step.id}:`, stepResult.error);
            // Remove from generating set even if failed
            setGeneratingSteps(prev => {
              const newSet = new Set(prev);
              newSet.delete(step.id);
              return newSet;
            });
          }
          
          completedSteps++;
          
          // Update progress
          const progress = Math.round((completedSteps / stepsNeedingAI.length) * 100);
          setTextGenerationProgress(progress);
          
        } catch (stepError) {
          console.error(`[TEXT_GENERATION] Error processing step ${step.id}:`, stepError);
          completedSteps++;
          
          // Remove from generating set on error
          setGeneratingSteps(prev => {
            const newSet = new Set(prev);
            newSet.delete(step.id);
            return newSet;
          });
          
          // Update progress
          const progress = Math.round((completedSteps / stepsNeedingAI.length) * 100);
          setTextGenerationProgress(progress);
        }
      }
      
      console.log(`[TEXT_GENERATION] Text generation complete! ${completedSteps}/${stepsNeedingAI.length} steps processed`);
      
      // Clear all generating states
      setGeneratingSteps(new Set());
      
      if (completedSteps > 0) {
        setSuccessMessage('AI tooltips generated successfully!');
        setTimeout(() => setSuccessMessage(null), 3000);
      }
      
    } catch (error) {
      console.error('[TEXT_GENERATION] Error triggering text generation:', error);
      setGeneratingSteps(new Set());
    }
  };
  
  // Function to reload flow data (used after text generation completes)
  const reloadFlowData = async (id: string) => {
    try {
      const { flow: flowData, steps: stepsData, error: apiError } = await getCursorFlowWithSteps(id);
      
      if (apiError) {
        console.error('Failed to reload flow data:', apiError);
        return;
      }

      if (stepsData) {
        setSteps(stepsData);
        
        // Update step text state with new annotation texts
        const textMap: {[key: string]: string} = {};
        stepsData.forEach(step => {
          textMap[step.id] = step.annotation_text || '';
          if (step.is_highlight_step === undefined) {
            step.is_highlight_step = false;
          }
        });
        setStepTexts(textMap);
      }
    } catch (error) {
      console.error('Error reloading flow data:', error);
    }
  };

  // Function to load cursor flow data
  const loadCursorFlow = async (id: string) => {
    setIsLoading(true);
    try {
      const { flow: flowData, steps: stepsData, error: apiError } = await getCursorFlowWithSteps(id);
      
      if (apiError) {
        setError('Failed to load cursor flow: ' + apiError.message);
        return;
      }

      setFlow(flowData);
      
      if (stepsData) {
        setSteps(stepsData);
        
        // Initialize step text state with annotation texts
        const textMap: {[key: string]: string} = {};
        stepsData.forEach(step => {
          textMap[step.id] = step.annotation_text || '';
          // Ensure is_highlight_step has a default value if not present
          if (step.is_highlight_step === undefined) {
            step.is_highlight_step = false;
          }
        });
        setStepTexts(textMap);
      }
      
      // Initialize flow description state
      setFlowDescription(flowData?.description || '');
      setEditableFlowName(flowData?.name || flowName);
      
      // Set loading to false first, then start text generation in background
      setIsLoading(false);
      
      // Start text generation in background - don't await it
      if (stepsData) {
        checkAndTriggerTextGeneration(flowData);
      }
    } catch (error) {
      console.error('Error loading cursor flow:', error);
      setError('An error occurred while loading the cursor flow');
      setIsLoading(false);
    }
  };

  // Function to handle annotation text changes
  const handleTextChange = (stepId: string, text: string) => {
    setStepTexts(prev => ({
      ...prev,
      [stepId]: text
    }));
    setHasUnsavedChanges(true);
  };

  // Function to handle description changes
  const handleDescriptionChange = (text: string) => {
    setFlowDescription(text);
    setHasUnsavedChanges(true);
  };

  // Function to start dragging
  const handleStartDrag = (stepId: string, event: React.MouseEvent) => {
    if (flow.status !== 'draft') return;
    
    const step = steps.find(s => s.id === stepId);
    if (!step) return;
    
    event.preventDefault();
    setDraggingStepId(stepId);
    
    // Store initial cursor position when drag starts
    setDragStartPos({
      x: event.clientX,
      y: event.clientY
    });
  };
  
  // Function to handle dragging movement
  const handleDrag = (stepId: string, event: React.MouseEvent) => {
    if (draggingStepId !== stepId || !dragStartPos) return;
    
    const step = steps.find(s => s.id === stepId);
    if (!step || step.cursor_position_x === undefined || step.cursor_position_y === undefined) {
      console.error('Missing cursor position data for step:', stepId);
      return;
    }
    
    const imageContainer = imageContainerRefs.current[stepId];
    if (!imageContainer) return;
    
    // Get container dimensions
    const containerRect = imageContainer.getBoundingClientRect();
    
    // Find the actual image element within the container
    const imageElement = imageContainer.querySelector('img');
    if (!imageElement) {
      console.error('Image element not found in container');
      return;
    }
    
    // Get image dimensions and position within the container
    const imageRect = imageElement.getBoundingClientRect();
    
    // Get viewport data from step data
    const viewport = step.step_data.element?.viewport || {
      width: 1920,
      height: 1080,
    };
    
    // Use container dimensions for calculations instead of image dimensions
    // This allows positioning throughout the container
    const deltaXPercent = ((event.clientX - dragStartPos.x) / containerRect.width) * 100;
    const deltaYPercent = ((event.clientY - dragStartPos.y) / containerRect.height) * 100;
    
    // Calculate actual pixel movement based on original viewport
    const deltaX = (deltaXPercent / 100) * viewport.width;
    const deltaY = (deltaYPercent / 100) * viewport.height;
    
    // Calculate new cursor position using only dedicated columns
    let newX = step.cursor_position_x + deltaX;
    let newY = step.cursor_position_y + deltaY;
    
    // Confine to viewport bounds
    newX = Math.max(0, Math.min(newX, viewport.width));
    newY = Math.max(0, Math.min(newY, viewport.height));
    
    // Update step in local state with new position in dedicated columns only
    setSteps(prevSteps => 
      prevSteps.map(s => 
        s.id === stepId 
          ? {
              ...s,
              cursor_position_x: newX,
              cursor_position_y: newY
            }
          : s
      )
    );
    
    // Update drag start position for next movement
    setDragStartPos({
      x: event.clientX,
      y: event.clientY
    });
    
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);
  };
  
  // Function to end dragging
  const handleEndDrag = async () => {
    if (draggingStepId) {
      const step = steps.find(s => s.id === draggingStepId);
      if (step && step.cursor_position_x !== undefined && step.cursor_position_y !== undefined) {
        // Save position using dedicated columns
        await saveCursorPosition(draggingStepId, {
          x: step.cursor_position_x,
          y: step.cursor_position_y
        });
      } else {
        console.error('Missing cursor position data for step:', draggingStepId);
      }
    }
    
    setDraggingStepId(null);
    setDragStartPos(null);
  };

  // Function to save changes to steps, flow name, and description
  const saveChanges = async () => {
    if (!flowId || !flow) return;
    
    setIsSaving(true);
    try {
      // Update all steps with latest annotation text and position
      const updatedSteps = steps.map(step => ({
        ...step,
        annotation_text: stepTexts[step.id] || step.annotation_text,
        is_highlight_step: step.is_highlight_step === undefined ? false : step.is_highlight_step,
        // Position updates are handled separately via handleEndDrag/saveCursorPosition for now
      }));
      
      const { success: stepsSuccess, error: stepsError } = await saveSteps(updatedSteps);
      
      if (!stepsSuccess) {
        console.error('Failed to save steps:', stepsError);
        setError('Failed to save step changes');
        setIsSaving(false);
        return;
      }
      
      // Prepare updates for flow details (name and description)
      const flowUpdates: { name?: string; description?: string | null } = {};
      if (editableFlowName !== flow.name) {
        flowUpdates.name = editableFlowName;
      }
      if (flowDescription !== flow.description) {
        flowUpdates.description = flowDescription;
      }

      // Persist flow details if there are changes
      if (Object.keys(flowUpdates).length > 0) {
        const { success: flowUpdateSuccess, error: flowUpdateError } = await updateCursorFlow(flowId, flowUpdates);
        if (!flowUpdateSuccess) {
          console.error('Failed to update flow details:', flowUpdateError);
          // Even if flow update fails, steps were saved. Maybe show partial success?
          setError('Failed to save flow name/description changes');
          setIsSaving(false);
          return;
        } else {
          // Update local flow state if name changed
          if (flowUpdates.name) {
            setFlow((prev: any) => ({ ...prev, name: flowUpdates.name }));
          }
          // Potentially update description in local state too if needed immediately
          if (flowUpdates.description !== undefined) {
            setFlow((prev: any) => ({ ...prev, description: flowUpdates.description }));
          }
        }
      } else {
        // No flow details changes, steps were saved successfully
      }
       
      setHasUnsavedChanges(false);
      setSuccessMessage('Changes saved successfully');
      
      // Trigger embedding generation in the background (fire and forget)
      triggerEmbeddingGeneration(flowId).then((result: { success: boolean; message?: string; error?: any }) => {
        if (!result.success) {
          console.warn(`[Embedding Trigger] Failed to start embedding generation for flow ${flowId}:`, result.error);
          // Optionally show a non-blocking warning to the user
        }
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error saving changes:', error);
      setError('An error occurred while saving changes');
    } finally {
      setIsSaving(false);
    }
  };

  // Function to save annotation text
  const saveAnnotation = async (stepId: string) => {
    try {
      const { success, error } = await updateStepAnnotation(stepId, stepTexts[stepId] || '');
      
      if (!success) {
        console.error('Failed to update annotation:', error);
      }
      
      // Mark as saved only for this specific annotation
      // Overall hasUnsavedChanges might still be true for other changes
    } catch (error) {
      console.error('Error updating annotation:', error);
    }
  };

  // Function to publish flow
  const publishFlow = async () => {
    if (!flowId) return;
    
    // Save any pending changes first
    if (hasUnsavedChanges) {
      await saveChanges();
    }
    
    setIsPublishing(true);
    try {
      const { success, error: publishError } = await publishCursorFlow(flowId);
      
      if (!success) {
        console.error('Failed to publish flow:', publishError);
        setError('Failed to publish flow');
        return;
      }
      
      // Update local state
      setFlow((prev: any) => ({ ...prev, status: 'live' }));
      setSuccessMessage('Flow published successfully!');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error publishing flow:', error);
      setError('An error occurred while publishing the flow');
    } finally {
      setIsPublishing(false);
    }
  };

  // Function to rollback flow
  const rollbackFlow = async () => {
    if (!flowId) return;
    
    setIsRollingBack(true);
    try {
      const { success, error: rollbackError } = await rollbackCursorFlow(flowId);
      
      if (!success) {
        console.error('Failed to roll back flow:', rollbackError);
        setError('Failed to roll back flow');
        return;
      }
      
      // Update local state
      setFlow((prev: any) => ({ ...prev, status: 'draft' }));
      setEditableFlowName(flow?.name || flowName);
      setSuccessMessage('Flow rolled back to draft successfully');
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (error) {
      console.error('Error rolling back flow:', error);
      setError('An error occurred while rolling back the flow');
    } finally {
      setIsRollingBack(false);
    }
  };

  // Function to go back to cursor flows list
  const goBackToList = () => {
    router.push('/dashboard/cursorflows');
  };

  // Function to handle deleting a step (soft delete)
  const handleDeleteStep = (stepId: string) => {
    if (flow?.status !== 'draft') return;

    if (window.confirm('Are you sure you want to delete this step? This change will be saved when you next click "Save Changes".')) {
      setSteps(prevSteps =>
        prevSteps.map(step =>
          step.id === stepId ? { ...step, is_removed: true } : step
        )
      );
      setHasUnsavedChanges(true);
    }
  };

  // Get only active steps - we don't care about removed steps anymore
  const activeSteps = steps.filter(step => !step.is_removed);

  // Helper function to get the "from" URL for navigation steps
  const getFromUrl = (step: any): string | null => {
    if (getStepType(step) !== 'navigation') return null;
    
    // Extract the fromPage URL for navigation steps
    return step?.step_data?.fromPage?.url || null;
  };

  // Helper function to display the navigation card between click steps
  const NavigationCard = ({ fromUrl, toUrl }: { fromUrl: string; toUrl: string }) => {
    return (
      <div className="flex grow shrink-0 basis-0 flex-col items-start gap-6 self-stretch rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 shadow-sm mb-6">
        <span className="w-full text-heading-3 font-heading-3 text-default-font">
          Navigation
        </span>
        <div className="flex w-full flex-col items-start">
          <div className="flex w-full items-start gap-4">
            <div className="flex flex-col items-center self-stretch">
              <div className="flex h-0.5 w-0.5 flex-none flex-col items-center gap-2 bg-default-background" />
              <div className="flex h-4 w-4 flex-none flex-col items-start gap-2 rounded-full border-2 border-solid border-brand-600" />
              <div className="flex w-0.5 grow shrink-0 basis-0 flex-col items-center gap-2 bg-brand-600" />
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-16 pb-6">
              <div className="flex w-full items-center gap-40">
                <div className="flex grow shrink-0 basis-0 flex-col items-start">
                  <span className="w-full text-body-bold font-body-bold text-default-font">
                    From
                  </span>
                  <div className="flex w-full items-center gap-2">
                    <SubframeCore.Icon
                      className="text-body font-body text-default-font"
                      name="FeatherLink"
                    />
                    <span className="grow shrink-0 basis-0 text-body font-body text-default-font">
                      {truncateUrl(fromUrl)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex w-full items-start gap-4">
            <div className="flex flex-col items-center self-stretch">
              <div className="flex h-0.5 w-0.5 flex-none flex-col items-center gap-2 bg-brand-600" />
              <div className="flex h-4 w-4 flex-none flex-col items-start gap-2 rounded-full border-2 border-solid border-brand-600" />
            </div>
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 pb-6">
              <div className="flex w-full flex-col items-start">
                <span className="w-full text-body-bold font-body-bold text-default-font">
                  To
                </span>
                <div className="flex w-full items-center gap-2">
                  <SubframeCore.Icon
                    className="text-body font-body text-default-font"
                    name="FeatherLink"
                  />
                  <span className="grow shrink-0 basis-0 text-body font-body text-default-font">
                    {truncateUrl(toUrl)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Updated getCursorPositionPercentage function to use dedicated columns
  const getCursorPositionPercentage = (step: any) => {
    if (step.cursor_position_x === undefined || step.cursor_position_y === undefined) {
      console.error('Missing cursor position data for step:', step.id);
      return null;
    }
    
    // Get viewport data from step data
    const viewport = step.step_data.element?.viewport || {
      width: 1920,
      height: 1080,
      scrollX: 0,
      scrollY: 0,
      devicePixelRatio: 1
    };
    
    // Calculate percentages based on viewport dimensions
    const xPercent = (step.cursor_position_x / viewport.width) * 100;
    const yPercent = (step.cursor_position_y / viewport.height) * 100;
    
    return { xPercent, yPercent };
  };

  // Update the CursorOverlay component to add debugging info if needed
  const CursorOverlay = ({ step, text }: { step: any; text: string }) => {
    const isCurrentlyDragging = draggingStepId === step.id;
    
    if (step.cursor_position_x === undefined || step.cursor_position_y === undefined) {
      console.error('Missing cursor position data for step:', step.id);
      return null;
    }
    
    // Get viewport data from step data
    const viewport = step.step_data.element?.viewport || {
      width: 1920,
      height: 1080
    };
    
    // Calculate position as percentage of original viewport using dedicated columns
    const xPercent = (step.cursor_position_x / viewport.width) * 100;
    const yPercent = (step.cursor_position_y / viewport.height) * 100;
    
    return (
      <div 
        className={`absolute pointer-events-auto ${isCurrentlyDragging ? 'z-50' : 'z-10'} ${flow.status === 'draft' ? 'cursor-move' : 'pointer-events-none'}`}
        style={{
          left: `${xPercent}%`,
          top: `${yPercent}%`,
          transform: `translate(-50%, -50%) ${isCurrentlyDragging ? 'scale(1.2)' : ''}`,
          transition: isCurrentlyDragging ? 'none' : 'transform 0.2s ease'
        }}
        onMouseDown={flow.status === 'draft' ? (e) => handleStartDrag(step.id, e) : undefined}
        onMouseMove={flow.status === 'draft' ? (e) => handleDrag(step.id, e) : undefined}
        onMouseUp={flow.status === 'draft' ? () => handleEndDrag() : undefined}
        onMouseLeave={flow.status === 'draft' && isCurrentlyDragging ? () => handleEndDrag() : undefined}
      >
        {/* Cursor pointer icon */}
        <div className="relative">
          <SubframeCore.Icon
            name="FeatherMousePointer2"
            className={`${isCurrentlyDragging ? 'text-brand-800' : 'text-brand-600'} h-7 w-7 drop-shadow-md`}
          />
          
          {/* Text bubble with fixed width and proper word wrapping */}
          {text && (
            <div className="absolute left-8 top-0 w-48 rounded-md bg-brand-600 px-3 py-2 text-white shadow-md">
              <p className="text-sm m-0 whitespace-normal break-words">
                {text}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Update window-level handlers to use dedicated columns
  useEffect(() => {
    if (!draggingStepId) return;
    
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!draggingStepId || !dragStartPos) return;
      
      const step = steps.find(s => s.id === draggingStepId);
      if (!step || step.cursor_position_x === undefined || step.cursor_position_y === undefined) {
        console.error('Missing cursor position data for step:', draggingStepId);
        return;
      }
      
      const imageContainer = imageContainerRefs.current[draggingStepId];
      if (!imageContainer) return;
      
      // Get container dimensions
      const containerRect = imageContainer.getBoundingClientRect();
      
      // Find the actual image element within the container (for debugging)
      const imageElement = imageContainer.querySelector('img');
      if (!imageElement) {
        console.error('Image element not found in container');
        return;
      }
      
      // Get viewport data from step data
      const viewport = step.step_data.element?.viewport || {
        width: 1920,
        height: 1080,
      };
      
      // Use container dimensions for calculations instead of image dimensions
      const deltaXPercent = ((e.clientX - dragStartPos.x) / containerRect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStartPos.y) / containerRect.height) * 100;
      
      // Calculate actual pixel movement based on original viewport
      const deltaX = (deltaXPercent / 100) * viewport.width;
      const deltaY = (deltaYPercent / 100) * viewport.height;
      
      // Calculate new cursor position using only dedicated columns
      let newX = step.cursor_position_x + deltaX;
      let newY = step.cursor_position_y + deltaY;
      
      // Confine to viewport bounds
      newX = Math.max(0, Math.min(newX, viewport.width));
      newY = Math.max(0, Math.min(newY, viewport.height));
      
      // Update step in local state with new position
      setSteps(prevSteps => 
        prevSteps.map(s => 
          s.id === draggingStepId 
            ? {
                ...s,
                cursor_position_x: newX,
                cursor_position_y: newY
              }
            : s
        )
      );
      
      setDragStartPos({
        x: e.clientX,
        y: e.clientY
      });
      
      setHasUnsavedChanges(true);
    };
    
    const handleWindowMouseUp = () => {
      setDraggingStepId(null);
      setDragStartPos(null);
    };
    
    window.addEventListener('mousemove', handleWindowMouseMove);
    window.addEventListener('mouseup', handleWindowMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleWindowMouseMove);
      window.removeEventListener('mouseup', handleWindowMouseUp);
    };
  }, [draggingStepId, dragStartPos, steps, setHasUnsavedChanges]);

  // Replace the existing saveCursorPosition function with this one
  const saveCursorPosition = async (stepId: string, position: { x: number, y: number }) => {
    try {
      if (!API_BASE_URL) {
        console.error('API base URL not configured');
        return { success: false, error: 'API base URL not configured' };
      }
      
      // Use the dedicated columns instead of updating the step_data JSONB
      const response = await fetch(`${API_BASE_URL}/api/cursorflow-steps/${stepId}/position`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          cursor_position_x: position.x,
          cursor_position_y: position.y 
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error updating cursor position:', error);
      return { success: false, error };
    }
  };

  const handleStepTypeChange = (stepId: string, isHighlight: boolean) => {
    setSteps(prevSteps =>
      prevSteps.map(step =>
        step.id === stepId ? { ...step, is_highlight_step: isHighlight } : step
      )
    );
    setHasUnsavedChanges(true);
  };

  if (isLoading) {
    return (
      <>
        <div className="container max-w-none flex h-full w-full flex-col items-center justify-center bg-default-background py-12">
          <span className="text-body font-body text-default-font">Loading cursor flow...</span>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <div className="container max-w-none flex h-full w-full flex-col items-center justify-center gap-4 bg-default-background py-12">
          <span className="text-body-bold font-body-bold text-error-500">{error}</span>
          <Button onClick={goBackToList}>Back to Cursor Flows</Button>
        </div>
      </>
    );
  }

  if (!flow) {
    return (
      <>
        <div className="container max-w-none flex h-full w-full flex-col items-center justify-center gap-4 bg-default-background py-12">
          <span className="text-body-bold font-body-bold text-default-font">Cursor flow not found</span>
          <Button onClick={goBackToList}>Back to Cursor Flows</Button>
        </div>
      </>
    );
  }

  // Filter to get only click steps for the main display
  const clickSteps = activeSteps.filter(step => getStepType(step) === 'click');

  return ( 
      <>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-6 bg-default-background pt-12">
        <div className="flex w-full flex-wrap items-center justify-between">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
            <Breadcrumbs>
              <Breadcrumbs.Item onClick={goBackToList} className="cursor-pointer">Guide</Breadcrumbs.Item>
              <Breadcrumbs.Divider />
              <Breadcrumbs.Item onClick={goBackToList} className="cursor-pointer">Cursor Flows</Breadcrumbs.Item>
              <Breadcrumbs.Divider />
              <Breadcrumbs.Item active={true}>
                {flowName}
              </Breadcrumbs.Item>
            </Breadcrumbs>
            <div 
              className={`flex w-full items-center gap-2 ${flow?.status === 'draft' ? 'cursor-pointer' : ''}`}
              onClick={() => {
                if (flow?.status === 'draft' && !isEditingTitle) {
                  setIsEditingTitle(true);
                }
              }}
            >
              {isEditingTitle && flow?.status === 'draft' ? (
                <TextField className="grow shrink-0 basis-0">
                  <TextField.Input 
                    value={editableFlowName}
                    onChange={(e) => {
                      setEditableFlowName(e.target.value);
                      setHasUnsavedChanges(true);
                    }}
                    onBlur={() => setIsEditingTitle(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        setIsEditingTitle(false);
                      } else if (e.key === 'Enter') {
                        setIsEditingTitle(false);
                      }
                    }}
                    autoFocus
                    className="text-heading-2 font-heading-2"
                  />
                </TextField>
              ) : (
                <span className="text-heading-2 font-heading-2 text-default-font">
                  {editableFlowName}
                </span>
              )}
              <Badge variant={getBadgeVariantForStatus(flow.status)}>
                {flow.status.charAt(0).toUpperCase() + flow.status.slice(1)}
              </Badge>
            </div>
          </div>
          
          {/* Flow Description TextArea */}
          
          
          <div className="flex items-center gap-2">
            {flow.status === 'draft' ? (
              // Draft mode controls
              <>
                <Button
                  variant="neutral-secondary"
                  onClick={saveChanges}
                  loading={isSaving}
                  disabled={!hasUnsavedChanges}
                >
                  Save Changes
                </Button>
                <Button
                  variant="neutral-secondary"
                  onClick={() => alert('Preview feature coming soon')}
                >
                  Preview
                </Button>
                <Button 
                  onClick={publishFlow}
                  loading={isPublishing}
                  disabled={flow.status === 'live'}
                >
                  Publish
                </Button>
              </>
            ) : (
              // Published mode controls
              <>
                <Button
                  variant="neutral-secondary"
                  onClick={() => alert('Preview feature coming soon')}
                >
                  Preview
                </Button>
                <Button
                  variant="destructive-secondary"
                  onClick={rollbackFlow}
                  loading={isRollingBack}
                >
                  Rollback
                </Button>
              </>
            )}
          </div>
        </div>
        
        {flow.status === 'draft' && showAlert && (
          <Alert
            title="This flow is in draft mode"
            description="Publish your changes to make them visible to users."
            actions={
              <IconButton
                icon="FeatherX"
                onClick={() => setShowAlert(false)}
              />
            }
          />
        )}
        
        {successMessage && (
          <Alert
            title={successMessage}
            variant="success"
            actions={
              <IconButton
                icon="FeatherX"
                onClick={() => setSuccessMessage(null)}
              />
            }
          />
        )}
        
        {generatingSteps.size > 0 && (
          <Alert
            title={`Generating AI tooltips... ${textGenerationProgress}%`}
            description={`AI is analyzing screenshots to create helpful tooltips. ${generatingSteps.size} tooltips remaining.`}
            actions={
              <div className="flex items-center gap-2">
                <div className="w-32 bg-neutral-200 rounded-full h-2">
                  <div 
                    className="bg-brand-600 h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${textGenerationProgress}%` }}
                  ></div>
                </div>
                <span className="text-sm text-subtext-color">{textGenerationProgress}%</span>
              </div>
            }
          />
        )}
        
        <div className="flex w-full grow shrink-0 basis-0 flex-wrap items-start">
          <div className="w-full pb-4">
            <div className="flex w-full items-center justify-between border-b border-solid border-neutral-border py-3">
                <span className="text-body-bold font-body-bold text-default-font">
                  Description
                </span>
              </div>
            <TextArea
              className="w-full"
            >
              <TextArea.Input
                placeholder="Enter flow description..."
                value={flowDescription}
                onChange={(e) => {
                  if (flow.status === 'draft') {
                    handleDescriptionChange(e.target.value);
                  }
                }}
                disabled={flow.status !== 'draft'}
                readOnly={flow.status !== 'draft'}
                rows={3}
              />
            </TextArea>
          </div>
          <div className="flex min-w-[576px] grow shrink-0 basis-0 flex-col items-start gap-6">
            {clickSteps.length === 0 ? (
              <div className="flex w-full items-center justify-center p-8 border border-dashed border-neutral-border rounded-md">
                <span className="text-body font-body text-subtext-color">No active steps available for this cursor flow</span>
              </div>
            ) : (
              clickSteps.map((clickStep, index) => {
                // Find if there's a navigation step after this click step
                const nextStepIndex = activeSteps.findIndex(s => s.id === clickStep.id) + 1;
                const nextStep = nextStepIndex < activeSteps.length ? activeSteps[nextStepIndex] : null;
                const hasNavigationAfter = nextStep && getStepType(nextStep) === 'navigation';
                
                return (
                  <React.Fragment key={clickStep.id}>
                    <div className="flex w-full items-center justify-between border-b border-solid border-neutral-border px-4 py-3">
                      <span className="text-body-bold font-body-bold text-default-font">
                        Step {index + 1}
                      </span>
                      {/* Moved Toggle for Step Type Here - Always show, disable if not draft */} 
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-default-font mr-2">
                          Highlight Step
                        </span>
                        <Switch
                          checked={clickStep.is_highlight_step || false}
                          onCheckedChange={flow.status === 'draft' 
                            ? (checked) => handleStepTypeChange(clickStep.id, checked) 
                            : undefined
                          }
                          disabled={flow.status !== 'draft'}
                          className={flow.status !== 'draft' ? 'opacity-70 cursor-not-allowed' : ''}
                        />
                        {flow.status === 'draft' && (
                          <IconButton
                            icon="FeatherTrash2"
                            variant="destructive-secondary"
                            onClick={() => handleDeleteStep(clickStep.id)}
                            className="ml-3"
                            aria-label="Delete step"
                          />
                        )}
                      </div>
                    </div>
                    <div className="flex w-full flex-col items-start rounded-md border border-solid border-neutral-border bg-default-background">
                      <div className="flex w-full items-center justify-between border-b border-solid border-neutral-border px-4 py-3">
                        {hasValidScreenshot(clickStep) ? (
                          <div 
                            className="relative w-full"
                            ref={(el) => imageContainerRefs.current[clickStep.id] = el}
                          >
                            <img
                              className="w-full grow shrink-0 basis-0 rounded-md object-cover"
                              src={clickStep.screenshot_url || ''}
                              alt={`Step ${index + 1}`}
                            />
                            <CursorOverlay 
                              step={clickStep} 
                              text={stepTexts[clickStep.id] || ''} 
                            />
                          </div>
                        ) : (
                          <div className="w-full p-6 bg-neutral-50 rounded-md flex items-center justify-center">
                            <span className="text-body font-body text-subtext-color">
                              No screenshot available
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex w-full flex-col items-start gap-4 px-4 py-4">
                        <TextField
                          label="Cursor Text"
                          helpText={generatingSteps.has(clickStep.id) ? "AI is generating tooltip..." : ""}
                          icon="FeatherMousePointer2"
                          className="w-full"
                        >
                          <TextField.Input
                            placeholder={
                              generatingSteps.has(clickStep.id) 
                                ? "AI is generating tooltip..." 
                                : "Add a description for this click"
                            }
                            value={
                              generatingSteps.has(clickStep.id) && !stepTexts[clickStep.id]
                                ? "Generating..." 
                                : (stepTexts[clickStep.id] || '')
                            }
                            onChange={(e) => {
                              if (flow.status === 'draft' && !generatingSteps.has(clickStep.id)) {
                                handleTextChange(clickStep.id, e.target.value);
                              }
                            }}
                            onBlur={() => {
                              if (flow.status === 'draft' && !generatingSteps.has(clickStep.id)) {
                                saveAnnotation(clickStep.id);
                              }
                            }}
                            disabled={flow.status !== 'draft' || generatingSteps.has(clickStep.id)}
                            readOnly={flow.status !== 'draft' || generatingSteps.has(clickStep.id)}
                            className={`w-full ${generatingSteps.has(clickStep.id) && !stepTexts[clickStep.id] ? 'animate-pulse bg-neutral-50' : ''}`}
                          />
                        </TextField>
                      </div>
                    </div>
                    
                    {/* If there's a navigation after this click, render the navigation card */}
                    {hasNavigationAfter && (
                      <NavigationCard 
                        fromUrl={getFromUrl(nextStep) || ''} 
                        toUrl={getNavigationUrl(nextStep) || ''}
                      />
                    )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// Main component with Suspense boundary
export default function CursorFlowPreview() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading flow preview...</div>}>
      <CursorFlowPreviewContent />
    </Suspense>
  );
} 