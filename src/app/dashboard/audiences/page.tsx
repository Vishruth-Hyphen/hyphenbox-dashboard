"use client";

import React, { useState, useEffect } from "react";
import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { Button } from "@/ui/components/Button";
import { Table } from "@/ui/components/Table";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import * as SubframeCore from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { DialogLayout } from "@/ui/layouts/DialogLayout";
import { TextField } from "@/ui/components/TextField";
import { Select } from "@/ui/components/Select";
import { Alert } from "@/ui/components/Alert";
import { 
  fetchAudiences,
  fetchAudienceFlowCounts,
  createAudienceWithFlows,
  type AudienceData
} from "@/utils/audiences";
import { 
  fetchCursorFlows,
  fetchUnassignedCursorFlows
} from "@/utils/cursorflows";
import { type CursorFlow } from "@/lib/supabase";
import { formatRelativeTime } from "@/utils/dateUtils";

function Audiences() {
  // State for audiences and cursor flows
  const [audiences, setAudiences] = useState<AudienceData[]>([]);
  const [cursorFlows, setCursorFlows] = useState<CursorFlow[]>([]);
  const [flowCounts, setFlowCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [audienceName, setAudienceName] = useState("");
  const [audienceDescription, setAudienceDescription] = useState("");
  const [selectedCursorFlowIds, setSelectedCursorFlowIds] = useState<string[]>([]);
  const [selectedFlowsDisplay, setSelectedFlowsDisplay] = useState<{id: string, name: string}[]>([]);
  
  // State for form submission
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load audiences and cursor flows on component mount
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Load audiences
        const { data: audiencesData, error: audiencesError } = await fetchAudiences();
        
        if (audiencesError) {
          console.error('Error fetching audiences:', audiencesError);
          setError('Failed to load audiences');
          return;
        }
        
        if (audiencesData) {
          setAudiences(audiencesData);
          
          // Get flow counts for each audience
          const audienceIds = audiencesData.map((a: AudienceData) => a.id);
          const { data: countsData } = await fetchAudienceFlowCounts(audienceIds);
          
          if (countsData) {
            setFlowCounts(countsData);
          }
        }
        
        // We continue to load all flows for the main page view
        const { data: allFlowsData, error: allFlowsError } = await fetchCursorFlows();
        
        if (allFlowsError) {
          console.error('Error fetching all cursor flows:', allFlowsError);
          setError('Failed to load cursor flows');
          return;
        }
        
        // Load only unassigned cursor flows for the dropdown in the create audience modal
        const { data: unassignedFlowsData, error: unassignedFlowsError } = await fetchUnassignedCursorFlows();
        
        if (unassignedFlowsError) {
          console.error('Error fetching unassigned cursor flows:', unassignedFlowsError);
          setError('Failed to load available cursor flows');
          return;
        }
        
        // Use the unassigned flows for the selection dropdown
        setCursorFlows(unassignedFlowsData || []);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('An error occurred while loading data');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  // Handle selecting a cursor flow
  const handleSelectCursorFlow = (flowId: string) => {
    if (!flowId || selectedCursorFlowIds.includes(flowId)) return;
    
    // Find the flow details to display
    const selectedFlow = cursorFlows.find(flow => flow.id === flowId);
    
    if (selectedFlow) {
      setSelectedCursorFlowIds([...selectedCursorFlowIds, flowId]);
      setSelectedFlowsDisplay([...selectedFlowsDisplay, {
        id: selectedFlow.id, 
        name: selectedFlow.name
      }]);
    }
  };
  
  // Handle removing a selected flow
  const handleRemoveSelectedFlow = (flowId: string) => {
    setSelectedCursorFlowIds(selectedCursorFlowIds.filter(id => id !== flowId));
    setSelectedFlowsDisplay(selectedFlowsDisplay.filter(flow => flow.id !== flowId));
  };

  // Reset form state when closing dialog
  const handleCloseDialog = () => {
    setIsCreateDialogOpen(false);
    setAudienceName("");
    setAudienceDescription("");
    setSelectedCursorFlowIds([]);
    setSelectedFlowsDisplay([]);
  };
  
  // Handle creating a new audience
  const handleCreateAudience = async () => {
    if (!audienceName.trim()) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Get organization_id and user_id from the first cursor flow
      if (cursorFlows.length === 0) {
        setError('No cursor flows found to get organization ID');
        return;
      }
      
      const sampleFlow = cursorFlows[0];
      const organizationId = sampleFlow.organization_id;
      const userId = sampleFlow.created_by;
      
      if (!organizationId || !userId) {
        setError('Could not determine organization ID or user ID');
        return;
      }
      
      console.log('Using IDs:', { organizationId, userId });
      
      const { success, audienceId, error: createError } = await createAudienceWithFlows(
        {
          name: audienceName,
          description: audienceDescription,
          organization_id: organizationId,
          created_by: userId
        },
        selectedCursorFlowIds
      );
      
      if (!success || !audienceId) {
        console.error('Failed to create audience:', createError);
        setError('Failed to create audience');
        return;
      }
      
      // Show success message
      setSuccessMessage('Audience created successfully!');
      
      // Reload audiences to get the updated list
      const { data: refreshedAudiences } = await fetchAudiences();
      if (refreshedAudiences) {
        setAudiences(refreshedAudiences);
        
        // Update flow counts
        const audienceIds = refreshedAudiences.map((a: AudienceData) => a.id);
        const { data: countsData } = await fetchAudienceFlowCounts(audienceIds);
        
        if (countsData) {
          setFlowCounts(countsData);
        }
      }
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Close the dialog
      handleCloseDialog();
    } catch (err) {
      console.error('Error creating audience:', err);
      setError('An error occurred while creating the audience');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add a function to handle opening the create audience dialog
  const handleOpenCreateDialog = async () => {
    setIsCreateDialogOpen(true);
    
    // When opening the dialog, fetch the latest unassigned flows
    try {
      setError(null);
      
      const { data: unassignedFlowsData, error: unassignedFlowsError } = await fetchUnassignedCursorFlows();
      
      if (unassignedFlowsError) {
        console.error('Error fetching unassigned cursor flows:', unassignedFlowsError);
        setError('Failed to load available cursor flows');
        return;
      }
      
      setCursorFlows(unassignedFlowsData || []);
    } catch (err) {
      console.error('Error loading unassigned flows:', err);
      setError('Failed to load available cursor flows');
    }
  };

  return (
    <InviteTeamMembers>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-8 bg-default-background py-12">
        <div className="flex w-full items-center justify-between">
          <Breadcrumbs>
            <Breadcrumbs.Item>Guide</Breadcrumbs.Item>
            <Breadcrumbs.Divider />
            <Breadcrumbs.Item active={true}>Audiences</Breadcrumbs.Item>
          </Breadcrumbs>
          <Button
            icon="FeatherPlus"
            onClick={handleOpenCreateDialog}
          >
            Create Audience
          </Button>
        </div>
        
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
        
        <div className="flex w-full flex-col items-start gap-8 overflow-hidden overflow-x-auto flex-shrink-0">
          {isLoading ? (
            <div className="flex w-full items-center justify-center p-12">
              <span className="text-body font-body text-subtext-color">Loading audiences...</span>
            </div>
          ) : audiences.length === 0 ? (
            <div className="flex w-full items-center justify-center p-12 border border-dashed border-neutral-border rounded-md">
              <span className="text-body font-body text-subtext-color">No audiences found. Create your first audience.</span>
            </div>
          ) : (
            <Table
              header={
                <Table.HeaderRow>
                  <Table.HeaderCell>AUDIENCE NAME</Table.HeaderCell>
                  <Table.HeaderCell>CURSOR FLOWS</Table.HeaderCell>
                  <Table.HeaderCell>CREATED</Table.HeaderCell>
                  <Table.HeaderCell />
                </Table.HeaderRow>
              }
            >
              {audiences.map((audience) => (
                <Table.Row 
                  key={audience.id} 
                  onClick={() => window.location.href = `/dashboard/audiences/audienceFlows?id=${audience.id}`}
                  className="cursor-pointer hover:bg-neutral-50"
                >
                  <Table.Cell>
                    <div className="flex items-center gap-2">
                      <SubframeCore.Icon 
                        name="FeatherUsers" 
                        className="text-body font-body text-neutral-500"
                      />
                      <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                        {audience.name}
                      </span>
                    </div>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      {flowCounts[audience.id] || 0} flows
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      {formatRelativeTime(audience.created_at)}
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex grow shrink-0 basis-0 items-center justify-end">
                      <SubframeCore.DropdownMenu.Root>
                        <SubframeCore.DropdownMenu.Trigger asChild={true}>
                          <IconButton
                            icon="FeatherMoreHorizontal"
                            onClick={(event: React.MouseEvent<HTMLButtonElement>) => {
                              // Stop propagation to prevent row click from triggering
                              event.stopPropagation();
                            }}
                          />
                        </SubframeCore.DropdownMenu.Trigger>
                        <SubframeCore.DropdownMenu.Portal>
                          <SubframeCore.DropdownMenu.Content
                            side="bottom"
                            align="end"
                            sideOffset={4}
                            asChild={true}
                          >
                            <DropdownMenu>
                              <DropdownMenu.DropdownItem 
                                icon="FeatherList"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  window.location.href = `/dashboard/audiences/audienceFlows?id=${audience.id}`;
                                }}
                              >
                                View Flows
                              </DropdownMenu.DropdownItem>
                              <DropdownMenu.DropdownItem icon="FeatherEdit2">
                                Edit
                              </DropdownMenu.DropdownItem>
                              <DropdownMenu.DropdownItem icon="FeatherTrash">
                                Delete
                              </DropdownMenu.DropdownItem>
                            </DropdownMenu>
                          </SubframeCore.DropdownMenu.Content>
                        </SubframeCore.DropdownMenu.Portal>
                      </SubframeCore.DropdownMenu.Root>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table>
          )}
        </div>
      </div>
      
      {/* Create Audience Dialog */}
      <DialogLayout open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <div className="flex h-full w-full flex-col items-start gap-6 px-6 py-6">
          <div className="flex w-full flex-col items-start gap-1">
            <span className="text-heading-3 font-heading-3 text-default-font">
              Create an Audience
            </span>
            <span className="text-body font-body text-subtext-color">
              Define a new audience for your campaign
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
            <TextField
              className="h-auto w-full flex-none"
              label="Audience Name"
              helpText="Choose a descriptive name for your audience"
            >
              <TextField.Input
                placeholder="e.g., High-Engagement Millennials"
                value={audienceName}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                  setAudienceName(event.target.value)
                }
              />
            </TextField>
            
            <TextField
              className="h-auto w-full flex-none"
              label="Description"
              helpText="Optional description for this audience"
            >
              <TextField.Input
                placeholder="e.g., Users who engage frequently with our content"
                value={audienceDescription}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                  setAudienceDescription(event.target.value)
                }
              />
            </TextField>
            
            <div className="flex w-full flex-col items-start gap-2">
              <Select
                className="h-auto w-full flex-none"
                label="Cursor Flows"
                placeholder={cursorFlows.length > 0 ? "Select existing cursor flows" : "No unassigned flows available"}
                helpText="Only flows that aren't already assigned to an audience are shown here"
                value={undefined}
                onValueChange={handleSelectCursorFlow}
              >
                {cursorFlows.length > 0 ? (
                  cursorFlows.map(flow => (
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
              onClick={handleCreateAudience}
              loading={isSubmitting}
              disabled={!audienceName.trim() || isSubmitting}
            >
              Create Audience
            </Button>
          </div>
        </div>
      </DialogLayout>
    </InviteTeamMembers>
  );
}

export default Audiences;