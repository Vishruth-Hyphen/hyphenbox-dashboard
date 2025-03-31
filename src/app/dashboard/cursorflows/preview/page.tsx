"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { Alert } from "@/ui/components/Alert";
import { TextField } from "@/ui/components/TextField";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import * as SubframeCore from "@subframe/core";
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
  rollbackCursorFlow
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

// Placeholder image when no screenshot is available
const PLACEHOLDER_IMAGE = "https://gazvscvowgdojkbkxnmk.supabase.co/storage/v1/object/public/screenshots//Screenshot%202025-03-19%20at%209.47.29%20PM.png";



function CursorFlowPreview() {
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
  const [showAlert, setShowAlert] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

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
        });
        setStepTexts(textMap);
      }
    } catch (error) {
      console.error('Error loading cursor flow:', error);
      setError('An error occurred while loading the cursor flow');
    } finally {
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
    if (!step || !step.step_data?.position) return;
    
    const imageContainer = imageContainerRefs.current[stepId];
    if (!imageContainer) return;
    
    // Get container dimensions
    const rect = imageContainer.getBoundingClientRect();
    
    // Calculate mouse movement
    const deltaX = event.clientX - dragStartPos.x;
    const deltaY = event.clientY - dragStartPos.y;
    
    // Calculate new cursor position
    const oldPos = step.step_data.position;
    let newX = oldPos.x + deltaX;
    let newY = oldPos.y + deltaY;
    
    // Confine to container bounds
    newX = Math.max(0, Math.min(newX, rect.width));
    newY = Math.max(0, Math.min(newY, rect.height));
    
    // Update step in local state with new position
    setSteps(prevSteps => 
      prevSteps.map(s => 
        s.id === stepId 
          ? {
              ...s,
              step_data: {
                ...s.step_data,
                position: { x: newX, y: newY }
              }
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
  const handleEndDrag = () => {
    setDraggingStepId(null);
    setDragStartPos(null);
  };

  // Function to save changes to steps
  const saveChanges = async () => {
    if (!flowId) return;
    
    setIsSaving(true);
    try {
      // Update all steps with latest annotation text and position
      const updatedSteps = steps.map(step => ({
        ...step,
        annotation_text: stepTexts[step.id] || step.annotation_text,
        // Position updates are already in the step_data
      }));
      
      const { success, error: saveError } = await saveSteps(updatedSteps);
      
      if (!success) {
        console.error('Failed to save steps:', saveError);
        setError('Failed to save changes');
        return;
      }
      
      setHasUnsavedChanges(false);
      setSuccessMessage('Changes saved successfully');
      
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

  // Updated function to use viewport data from step_data
  const getCursorPositionPercentage = (step: any) => {
    if (!step || !step.step_data || !step.step_data.position) return null;
    
    // Get cursor position from step data
    const cursorPosition = {
      x: step.step_data.position.x,
      y: step.step_data.position.y
    };
    
    // Get viewport data from step data
    const viewport = step.step_data.element?.viewport || {
      width: 1920, // fallback values if viewport data isn't available
      height: 1080,
      scrollX: 0,
      scrollY: 0,
      devicePixelRatio: 1
    };
    
    // Calculate absolute position (accounting for scroll)
    const absoluteX = cursorPosition.x + (viewport.scrollX || 0);
    const absoluteY = cursorPosition.y + (viewport.scrollY || 0);
    
    // Calculate percentages based on viewport dimensions
    const xPercent = (absoluteX / viewport.width) * 100;
    const yPercent = (absoluteY / viewport.height) * 100;
    
    // Apply device pixel ratio correction if needed
    // (only if your screenshots don't already account for this)
    // const correctedXPercent = xPercent / viewport.devicePixelRatio;
    // const correctedYPercent = yPercent / viewport.devicePixelRatio;
    
    return {
      xPercent,
      yPercent
    };
  };

  // Update the CursorOverlay component to add debugging info if needed
  const CursorOverlay = ({ step, text }: { step: any; text: string }) => {
    const positionPercentage = getCursorPositionPercentage(step);
    const isCurrentlyDragging = draggingStepId === step.id;
    
    if (!positionPercentage) return null;
    
    return (
      <div 
        className={`absolute pointer-events-auto ${isCurrentlyDragging ? 'z-50' : 'z-10'} ${flow.status === 'draft' ? 'cursor-move' : 'pointer-events-none'}`}
        style={{
          left: `${positionPercentage.xPercent}%`,
          top: `${positionPercentage.yPercent}%`,
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

  // Add this useEffect for window-level event handlers
  useEffect(() => {
    if (!draggingStepId) return;
    
    const handleWindowMouseMove = (e: MouseEvent) => {
      if (!draggingStepId || !dragStartPos) return;
      
      const step = steps.find(s => s.id === draggingStepId);
      if (!step || !step.step_data?.position) return;
      
      const imageContainer = imageContainerRefs.current[draggingStepId];
      if (!imageContainer) return;
      
      // Same calculation as in handleDrag
      const rect = imageContainer.getBoundingClientRect();
      const deltaX = e.clientX - dragStartPos.x;
      const deltaY = e.clientY - dragStartPos.y;
      
      const oldPos = step.step_data.position;
      let newX = oldPos.x + deltaX;
      let newY = oldPos.y + deltaY;
      
      newX = Math.max(0, Math.min(newX, rect.width));
      newY = Math.max(0, Math.min(newY, rect.height));
      
      setSteps(prevSteps => 
        prevSteps.map(s => 
          s.id === draggingStepId 
            ? {
                ...s,
                step_data: {
                  ...s.step_data,
                  position: { x: newX, y: newY }
                }
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

  if (isLoading) {
    return (
      <InviteTeamMembers>
        <div className="container max-w-none flex h-full w-full flex-col items-center justify-center bg-default-background py-12">
          <span className="text-body font-body text-default-font">Loading cursor flow...</span>
        </div>
      </InviteTeamMembers>
    );
  }

  if (error) {
    return (
      <InviteTeamMembers>
        <div className="container max-w-none flex h-full w-full flex-col items-center justify-center gap-4 bg-default-background py-12">
          <span className="text-body-bold font-body-bold text-error-500">{error}</span>
          <Button onClick={goBackToList}>Back to Cursor Flows</Button>
        </div>
      </InviteTeamMembers>
    );
  }

  if (!flow) {
    return (
      <InviteTeamMembers>
        <div className="container max-w-none flex h-full w-full flex-col items-center justify-center gap-4 bg-default-background py-12">
          <span className="text-body-bold font-body-bold text-default-font">Cursor flow not found</span>
          <Button onClick={goBackToList}>Back to Cursor Flows</Button>
        </div>
      </InviteTeamMembers>
    );
  }

  // Filter to get only click steps for the main display
  const clickSteps = activeSteps.filter(step => getStepType(step) === 'click');

  return (
    <InviteTeamMembers>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-6 bg-default-background py-12">
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
            <div className="flex w-full items-center gap-2">
              <span className="text-heading-2 font-heading-2 text-default-font">
                {flowName}
              </span>
              <Badge variant={getBadgeVariantForStatus(flow.status)}>
                {flow.status.charAt(0).toUpperCase() + flow.status.slice(1)}
              </Badge>
            </div>
          </div>
          
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
        
        <div className="flex w-full grow shrink-0 basis-0 flex-wrap items-start">
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
                          helpText=""
                          icon="FeatherMousePointer2"
                          className="w-full"
                        >
                          <TextField.Input
                            placeholder="Add a description for this click"
                            value={stepTexts[clickStep.id] || ''}
                            onChange={(e) => {
                              if (flow.status === 'draft') {
                                handleTextChange(clickStep.id, e.target.value);
                              }
                            }}
                            onBlur={() => flow.status === 'draft' ? saveAnnotation(clickStep.id) : null}
                            disabled={flow.status !== 'draft'}
                            readOnly={flow.status !== 'draft'}
                            className="w-full"
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
    </InviteTeamMembers>
  );
}

export default CursorFlowPreview; 