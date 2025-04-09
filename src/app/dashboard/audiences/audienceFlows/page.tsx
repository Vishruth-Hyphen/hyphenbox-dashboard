"use client";

import React, { useState, useEffect, Suspense, useContext } from "react";
import { useSearchParams } from "next/navigation";
import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { Button } from "@/ui/components/Button";
import { Badge } from "@/ui/components/Badge";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import * as SubframeCore from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { HomeListItem } from "@/ui/components/HomeListItem";
import { Alert } from "@/ui/components/Alert";
import Link from "next/link";
import { 
  fetchAudiences, 
  fetchAudienceCursorFlows, 
  removeFlowFromAudience,
  addFlowsToAudience,
  type AudienceData
} from "@/utils/audiences";
import { 
  fetchUnassignedCursorFlows
} from "@/utils/cursorflows";
import { type CursorFlow } from "@/lib/supabase";
import { getBadgeVariantForStatus } from "@/utils/cursorflows";
import { DialogLayout } from "@/ui/layouts/DialogLayout";
import { TextField } from "@/ui/components/TextField";
import { Select } from "@/ui/components/Select";
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

function AudienceFlowsContent() {
  const searchParams = useSearchParams();
  const audienceId = searchParams.get("id");
  const { session } = useAuth();
  const { getOrganizationId, currentOrgId, currentOrgName } = useOrganization();
  const router = useRouter();
  
  const [audience, setAudience] = useState<AudienceData | null>(null);
  const [flows, setFlows] = useState<CursorFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [removingFlowId, setRemovingFlowId] = useState<string | null>(null);
  
  // State for add flows dialog
  const [isAddFlowsDialogOpen, setIsAddFlowsDialogOpen] = useState(false);
  const [unassignedFlows, setUnassignedFlows] = useState<CursorFlow[]>([]);
  const [selectedFlowIds, setSelectedFlowIds] = useState<string[]>([]);
  const [selectedFlowsDisplay, setSelectedFlowsDisplay] = useState<{id: string, name: string}[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load audience and its flows
  useEffect(() => {
    const loadData = async () => {
      if (!audienceId) {
        setError("No audience ID provided");
        setIsLoading(false);
        return;
      }

      if (!currentOrgId) {
        setError("No organization selected");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch audience details - pass organizationId for filtering
        const { data: audiencesData, error: audienceError } = await fetchAudiences(currentOrgId);
        if (audienceError) {
          throw new Error("Failed to load audience details");
        }

        const currentAudience = audiencesData?.find(a => a.id === audienceId) || null;
        if (!currentAudience) {
          throw new Error("Audience not found");
        }
        
        setAudience(currentAudience);
        
        // Fetch flows for this audience
        const { data: flowsData, error: flowsError } = await fetchAudienceCursorFlows(audienceId);
        if (flowsError) {
          throw new Error("Failed to load cursor flows");
        }
        
        setFlows(flowsData || []);
      } catch (err) {
        console.error("Error loading audience data:", err);
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setIsLoading(false);
      }
    };
    
    if (audienceId && currentOrgId) {
      loadData();
    }
  }, [audienceId, currentOrgId]);

  // Handle removing a flow from the audience
  const handleRemoveFlow = async (flowId: string) => {
    setRemovingFlowId(flowId);
    setError(null);
    
    try {
      const { success, error: removeError } = await removeFlowFromAudience(flowId);
      
      if (!success) {
        throw new Error(removeError || "Failed to remove flow from audience");
      }
      
      // Update the local state to reflect the removal
      setFlows(prev => prev.filter(flow => flow.id !== flowId));
      setSuccessMessage("Flow successfully removed from audience");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error removing flow:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setRemovingFlowId(null);
    }
  };

  // Handle opening the add flows dialog
  const handleOpenAddFlowsDialog = async () => {
    if (!audienceId || !currentOrgId) return;
    setError(null);
    setIsAddFlowsDialogOpen(true);
    
    try {
      // Load unassigned flows with organization filtering
      const { data, error: fetchError } = await fetchUnassignedCursorFlows(currentOrgId);
      
      if (fetchError) {
        throw new Error("Failed to load available flows");
      }
      
      setUnassignedFlows(data || []);
    } catch (err) {
      console.error("Error loading unassigned flows:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    }
  };
  
  // Handle selecting a flow
  const handleSelectFlow = (flowId: string) => {
    if (!flowId || selectedFlowIds.includes(flowId)) return;
    
    // Find the flow details to display
    const selectedFlow = unassignedFlows.find(flow => flow.id === flowId);
    
    if (selectedFlow) {
      setSelectedFlowIds([...selectedFlowIds, flowId]);
      setSelectedFlowsDisplay([...selectedFlowsDisplay, {
        id: selectedFlow.id, 
        name: selectedFlow.name
      }]);
    }
  };
  
  // Handle removing a selected flow
  const handleRemoveSelectedFlow = (flowId: string) => {
    setSelectedFlowIds(selectedFlowIds.filter(id => id !== flowId));
    setSelectedFlowsDisplay(selectedFlowsDisplay.filter(flow => flow.id !== flowId));
  };
  
  // Reset dialog state
  const handleCloseDialog = () => {
    setIsAddFlowsDialogOpen(false);
    setSelectedFlowIds([]);
    setSelectedFlowsDisplay([]);
    setIsSubmitting(false);
  };
  
  // Handle adding flows to the audience
  const handleAddFlows = async () => {
    if (!audienceId || selectedFlowIds.length === 0) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const { success, error: addError } = await addFlowsToAudience(audienceId, selectedFlowIds);
      
      if (!success) {
        throw new Error(addError || "Failed to add flows to audience");
      }
      
      // Refresh the flows list
      const { data: newFlowsData, error: flowsError } = await fetchAudienceCursorFlows(audienceId);
      if (flowsError) {
        throw new Error("Flows were added but failed to refresh the list");
      }
      
      setFlows(newFlowsData || []);
      setSuccessMessage(`${selectedFlowIds.length} ${selectedFlowIds.length === 1 ? 'flow' : 'flows'} successfully added to audience`);
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      handleCloseDialog();
    } catch (err) {
      console.error("Error adding flows:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
      setIsSubmitting(false);
    }
  };

  return (
    <InviteTeamMembers>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-8 bg-default-background py-12">
        <Breadcrumbs>
          <Breadcrumbs.Item>
            <Link href="/dashboard">Guide</Link>
          </Breadcrumbs.Item>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item>
            <Link href="/dashboard/audiences">Audiences</Link>
          </Breadcrumbs.Item>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>{audience?.name || "Loading..."}</Breadcrumbs.Item>
        </Breadcrumbs>
        
        {/* Show org name for super admins */}
        {session?.user?.is_super_admin && currentOrgName && (
          <div className="w-full mb-2">
            <div className="flex items-center">
              <Badge variant="neutral">Organization: {currentOrgName}</Badge>
              <Button 
                variant="neutral-tertiary" 
                size="small"
                className="ml-2"
                onClick={() => router.push('/dashboard/organizations')}
              >
                Change
              </Button>
            </div>
          </div>
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
        
        {error && (
          <Alert
            title="Error"
            description={error}
            variant="error"
            actions={
              <IconButton
                icon="FeatherX"
                onClick={() => setError(null)}
              />
            }
          />
        )}
        
        <div className="flex w-full items-center gap-2">
          <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
            {audience?.name || "Loading..."}
          </span>
          <div className="flex items-center gap-2">
            <Link href="/dashboard/audiences">
              <Button variant="neutral-tertiary">
                Back to Audiences
              </Button>
            </Link>
            <Button
              icon="FeatherPlus"
              onClick={handleOpenAddFlowsDialog}
              disabled={isLoading}
            >
              Add Flows
            </Button>
          </div>
        </div>
        
        {/* Add audience ID display below the heading */}
        {audience && (
          <div className="flex items-center -mt-6 mb-2">
            <span className="text-sm text-gray-500 mr-2">ID: {audience.id}</span>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(audience.id);
                // Show temporary "Copied!" tooltip
                const tooltip = document.createElement('span');
                tooltip.textContent = 'Copied!';
                tooltip.className = 'absolute text-xs text-green-600 ml-6';
                const button = document.activeElement;
                button?.parentNode?.appendChild(tooltip);
                setTimeout(() => tooltip.remove(), 2000);
              }}
              className="p-1 rounded hover:bg-gray-100"
              title="Copy ID to clipboard"
            >
              <SubframeCore.Icon name="FeatherClipboard" className="h-3 w-3 text-gray-500" />
            </button>
          </div>
        )}
        
        {isLoading ? (
          <div className="flex w-full items-center justify-center p-12">
            <span className="text-body font-body text-subtext-color">Loading flows...</span>
          </div>
        ) : (
          <div className="flex w-full flex-col items-start gap-4">
            <div className="flex w-full items-center gap-2 border-b border-solid border-neutral-border py-2">
              <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
                {flows.length} {flows.length === 1 ? "flow" : "flows"}
              </span>
            </div>
            
            {flows.length === 0 ? (
              <div className="flex w-full items-center justify-center p-12 border border-dashed border-neutral-border rounded-md">
                <span className="text-body font-body text-subtext-color">
                  No flows associated with this audience
                </span>
              </div>
            ) : (
              <div className="flex w-full flex-col items-start gap-2">
                <div className="flex w-full items-center border-b border-solid border-neutral-border py-2 text-body font-body text-subtext-color">
                  <span className="text-body font-body text-default-font flex-1">
                    Name
                  </span>
                  <div className="flex items-center justify-end gap-4 w-48">
                    <span className="text-body font-body text-default-font">
                      Status
                    </span>
                    <span className="w-10"></span>
                  </div>
                </div>
                
                {flows.map((flow) => (
                  <HomeListItem
                    key={flow.id}
                    icon="FeatherMousePointer"
                    title={flow.name}
                    subtitle={flow.status.charAt(0).toUpperCase() + flow.status.slice(1)}
                    metadata=""
                  >
                    <Badge variant={getBadgeVariantForStatus(flow.status)}>
                      {flow.status.charAt(0).toUpperCase() + flow.status.slice(1)}
                    </Badge>
                    <SubframeCore.DropdownMenu.Root>
                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                        <IconButton
                          icon="FeatherMoreHorizontal"
                          disabled={removingFlowId === flow.id}
                        />
                      </SubframeCore.DropdownMenu.Trigger>
                      <SubframeCore.DropdownMenu.Portal>
                        <SubframeCore.DropdownMenu.Content
                          side="bottom"
                          align="start"
                          sideOffset={4}
                          asChild={true}
                        >
                          <DropdownMenu>
                            <DropdownMenu.DropdownItem icon="FeatherPlay">
                              Preview (Coming Soon)
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem 
                              icon="FeatherTrash"
                              onClick={() => handleRemoveFlow(flow.id)}
                              disabled={removingFlowId === flow.id}
                            >
                              {removingFlowId === flow.id ? "Removing..." : "Remove from audience"}
                            </DropdownMenu.DropdownItem>
                          </DropdownMenu>
                        </SubframeCore.DropdownMenu.Content>
                      </SubframeCore.DropdownMenu.Portal>
                    </SubframeCore.DropdownMenu.Root>
                  </HomeListItem>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Add Flows Dialog */}
      <DialogLayout open={isAddFlowsDialogOpen} onOpenChange={setIsAddFlowsDialogOpen}>
        <div className="flex h-full w-full flex-col items-start gap-6 px-6 py-6">
          <div className="flex w-full flex-col items-start gap-1">
            <span className="text-heading-3 font-heading-3 text-default-font">
              Add Flows to Audience
            </span>
            <span className="text-body font-body text-subtext-color">
              Select flows to add to {audience?.name || "this audience"}
            </span>
          </div>
          
          {error && (
            <Alert
              title="Error"
              description={error}
              variant="error"
              actions={
                <IconButton
                  icon="FeatherX"
                  onClick={() => setError(null)}
                />
              }
            />
          )}
          
          <div className="flex w-full flex-col items-start gap-6">
            <div className="flex w-full flex-col items-start gap-2">
              <Select
                className="h-auto w-full flex-none"
                label="Available Cursor Flows"
                placeholder={unassignedFlows.length > 0 ? "Select cursor flows to add" : "No unassigned flows available"}
                helpText="Only flows that aren't already assigned to an audience are shown here"
                value={undefined}
                onValueChange={handleSelectFlow}
              >
                {unassignedFlows.length > 0 ? (
                  unassignedFlows.map(flow => (
                    <Select.Item key={flow.id} value={flow.id}>
                      {flow.name}
                    </Select.Item>
                  ))
                ) : (
                  <Select.Item value="no-flows" disabled>No unassigned flows available</Select.Item>
                )}
              </Select>
              
              {selectedFlowsDisplay.length > 0 && (
                <div className="flex w-full flex-col items-start gap-2 border-t border-solid border-neutral-border pt-2">
                  <div className="flex w-full items-center gap-2">
                    <span className="text-caption font-caption text-default-font">
                      Selected Cursor Flows
                    </span>
                  </div>
                  <div className="flex w-full flex-col items-start gap-2">
                    {selectedFlowsDisplay.map((flow) => (
                      <div key={flow.id} className="flex w-full items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <SubframeCore.Icon
                            className="text-body font-body text-success-500"
                            name="FeatherCheck"
                          />
                          <span className="text-body font-body text-default-font">
                            {flow.name}
                          </span>
                        </div>
                        <IconButton
                          icon="FeatherX"
                          onClick={() => handleRemoveSelectedFlow(flow.id)}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              variant="neutral-tertiary"
              onClick={handleCloseDialog}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAddFlows}
              loading={isSubmitting}
              disabled={selectedFlowIds.length === 0 || isSubmitting}
            >
              Add to Audience
            </Button>
          </div>
        </div>
      </DialogLayout>
    </InviteTeamMembers>
  );
}

export default function AudienceFlows() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading audience flows...</div>}>
      <AudienceFlowsContent />
    </Suspense>
  );
}