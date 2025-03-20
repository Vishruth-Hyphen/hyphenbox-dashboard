"use client";

import React, { useState, useEffect } from "react";
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
  markStepAsRemoved,
  saveSteps,
  type CursorFlowStepData 
} from "@/utils/cursorflowsteps";
import { 
  getBadgeVariantForStatus, 
  publishCursorFlow,
  rollbackCursorFlow
} from "@/utils/cursorflows";

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

  // Function to save changes to steps
  const saveChanges = async () => {
    if (!flowId) return;
    
    setIsSaving(true);
    try {
      // Update all steps with latest annotation text
      const updatedSteps = steps.map(step => ({
        ...step,
        annotation_text: stepTexts[step.id] || step.annotation_text
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

  // Function to remove a step
  const removeStep = async (stepToRemove: CursorFlowStepData) => {
    try {
      // Mark step as removed in the database
      const { success, error } = await markStepAsRemoved(stepToRemove.id);
      
      if (!success) {
        console.error('Failed to mark step as removed:', error);
        return;
      }
      
      // Update local state to reflect the change
      setSteps((prev: CursorFlowStepData[]) => 
        prev.map(step => 
          step.id === stepToRemove.id 
            ? { ...step, is_removed: true } 
            : step
        )
      );
      
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error removing step:', error);
    }
  };

  // Function to restore a step
  const restoreStep = async (stepToRestore: CursorFlowStepData) => {
    try {
      // Mark step as not removed in the database
      const { success, error } = await markStepAsRemoved(stepToRestore.id, false);
      
      if (!success) {
        console.error('Failed to restore step:', error);
        return;
      }
      
      // Update local state to reflect the change
      setSteps((prev: CursorFlowStepData[]) => 
        prev.map(step => 
          step.id === stepToRestore.id 
            ? { ...step, is_removed: false } 
            : step
        )
      );
      
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Error restoring step:', error);
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

  // Get active and removed steps
  const activeSteps = steps.filter(step => !step.is_removed);
  const removedSteps = steps.filter(step => step.is_removed);

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
        
        <div className="flex w-full grow shrink-0 basis-0 flex-wrap items-start gap-6">
          <div className="flex min-w-[576px] grow shrink-0 basis-0 flex-col items-start gap-6">
            {activeSteps.length === 0 ? (
              <div className="flex w-full items-center justify-center p-8 border border-dashed border-neutral-border rounded-md">
                <span className="text-body font-body text-subtext-color">No active steps available for this cursor flow</span>
              </div>
            ) : (
              activeSteps.map((step, index) => (
                <div key={step.id} className="flex w-full flex-col items-start rounded-md border border-solid border-neutral-border bg-default-background">
                  <div className="flex w-full items-center justify-between border-b border-solid border-neutral-border px-4 py-3">
                    <span className="text-body-bold font-body-bold text-default-font">
                      Step {index + 1}
                    </span>
                    {flow.status === 'draft' && (
                      <Button
                        variant="destructive-secondary"
                        icon="FeatherTrash"
                        onClick={() => removeStep(step)}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <div className="flex w-full flex-col items-start gap-4 px-4 py-4">
                    <img
                      className="w-full grow shrink-0 basis-0 rounded-md object-cover"
                      src={step.screenshot_url || PLACEHOLDER_IMAGE}
                      alt={`Step ${index + 1}`}
                    />
                    <TextField
                      label="Cursor Text"
                      helpText=""
                      icon="FeatherMousePointer2"
                    >
                      <TextField.Input
                        placeholder="Add a description for this step"
                        value={stepTexts[step.id] || ''}
                        onChange={(e) => flow.status === 'draft' ? handleTextChange(step.id, e.target.value) : null}
                        onBlur={() => flow.status === 'draft' ? saveAnnotation(step.id) : null}
                        disabled={flow.status !== 'draft'}
                        readOnly={flow.status !== 'draft'}
                      />
                    </TextField>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <div className="flex w-80 flex-none flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 self-start">
            <span className="text-heading-3 font-heading-3 text-default-font">
              Removed Steps
            </span>
            {removedSteps.length === 0 ? (
              <span className="text-body font-body text-subtext-color">No removed steps</span>
            ) : (
              <div className="flex w-full flex-col items-start gap-4">
                {removedSteps.map((step, index) => (
                  <div key={step.id} className="flex w-full items-center gap-4 rounded-md border border-solid border-neutral-border bg-neutral-50 px-4 py-4">
                    <img
                      className="h-16 w-16 flex-none rounded-sm object-cover"
                      src={step.screenshot_url || PLACEHOLDER_IMAGE}
                      alt={`Removed Step ${index + 1}`}
                    />
                    <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
                      <span className="text-body-bold font-body-bold text-default-font">
                        Step {index + 1}
                      </span>
                      {flow.status === 'draft' && (
                        <Button
                          variant="neutral-secondary"
                          size="small"
                          onClick={() => restoreStep(step)}
                        >
                          Restore
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </InviteTeamMembers>
  );
}

export default CursorFlowPreview; 