"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { Button } from "@/ui/components/Button";
import { Badge } from "@/ui/components/Badge";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import * as SubframeCore from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { HomeListItem } from "@/ui/components/HomeListItem";
import { DialogLayout } from "@/ui/layouts/DialogLayout";
import { IconWithBackground } from "@/ui/components/IconWithBackground";
import { type CursorFlow } from "@/lib/supabase";
import { 
  fetchCursorFlows, 
  fetchCursorFlowsWithAudiences,
  processJsonForCursorFlow, 
  getBadgeVariantForStatus,
  deleteCursorFlow,
  createCursorFlowRequest
} from "@/utils/cursorflows";
import { TextField } from "@/ui/components/TextField";
import { TextArea } from "@/ui/components/TextArea";

function CursorFlows() {
  const router = useRouter();
  // Define organizationId once at the component level
  const organizationId = process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID as string;
  
  // State to control the open/closed state of the upload dialog
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  // State to store cursor flows fetched from database
  const [cursorFlows, setCursorFlows] = useState<(CursorFlow & { audienceName?: string })[]>([]);
  // State to track loading status
  const [isLoading, setIsLoading] = useState(true);
  // State for the flow name
  const [flowName, setFlowName] = useState("");
  // Reference to file input
  const fileInputRef = useRef<HTMLInputElement>(null);
  // State to track file selection
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  // State for loading during upload
  const [isUploading, setIsUploading] = useState(false);
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [flowToDelete, setFlowToDelete] = useState<CursorFlow | null>(null);
  
  // New state for request flow modal
  const [isRequestFlowDialogOpen, setIsRequestFlowDialogOpen] = useState(false);
  const [requestFlowName, setRequestFlowName] = useState("");
  const [requestFlowContext, setRequestFlowContext] = useState("");

  // Add a new state variable for Flow ID
  const [flowId, setFlowId] = useState("");

  // Fetch cursor flows on component mount
  useEffect(() => {
    loadCursorFlows();
  }, []);

  // Function to load cursor flows data
  const loadCursorFlows = async () => {
    setIsLoading(true);
    try {
      // Use the organizationId defined at the component level
      const { data, error } = await fetchCursorFlowsWithAudiences(organizationId);
      
      if (error) {
        console.error('Error fetching cursor flows:', error);
        return;
      }
      
      setCursorFlows(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle file selection
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setSelectedFile(event.target.files[0]);
    }
  };

  // Function to handle the file upload button click
  const handleSelectFileClick = () => {
    fileInputRef.current?.click();
  };

  // Function to navigate to the preview page
  const navigateToPreview = (flowId: string, flowName: string, status: string) => {
    // Don't navigate if the flow is in "requested" status
    if (status === 'requested') {
      alert('This flow is currently being created and is not yet available for preview.');
      return;
    }
    
    router.push(`/dashboard/cursorflows/preview?flowId=${flowId}&name=${encodeURIComponent(flowName)}`);
  };

  // Function to handle the JSON upload
  const handleUploadJson = async () => {
    if (!selectedFile || !flowName.trim()) {
      alert('Please select a file and enter a name for the flow');
      return;
    }

    setIsUploading(true);
    try {
      const userId = 'a0d6ba16-6093-4086-ad69-72df4c720010';
      
      // If flowId is provided, update existing flow. Otherwise, create a new one.
      const result = await processJsonForCursorFlow(
        selectedFile,
        flowName,
        organizationId,
        userId,
        flowId.trim() || undefined // Pass undefined if empty string
      );

      if (!result.success) {
        console.error('Error processing cursor flow:', result.error);
        alert(flowId ? 'Failed to update cursor flow' : 'Failed to create cursor flow');
        return;
      }

      // If there was a partial error (flow created/updated but steps had issues)
      if (result.error) {
        console.warn('Partial success:', result.error);
        alert('Flow ' + (flowId ? 'updated' : 'created') + ', but some steps may not have been processed correctly.');
      } else {
        alert('Flow ' + (flowId ? 'updated' : 'created') + ' successfully!');
      }

      // Refresh the cursor flows list
      await loadCursorFlows();
      
      // Close the dialog and reset state
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setFlowName("");
      setFlowId("");
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to ' + (flowId ? 'update' : 'upload') + ' and process JSON');
    } finally {
      setIsUploading(false);
    }
  };

  // Function to handle delete button click
  const handleDeleteClick = (e: React.MouseEvent, flow: CursorFlow) => {
    e.stopPropagation(); // Prevent triggering the item click
    setFlowToDelete(flow);
    setDeleteDialogOpen(true);
  };

  // Function to confirm and execute deletion
  const confirmDelete = async () => {
    if (!flowToDelete) return;
    
    try {
      const { success, error } = await deleteCursorFlow(flowToDelete.id);
      
      if (success) {
        // Refresh the list after successful deletion
        await loadCursorFlows();
        setDeleteDialogOpen(false);
        setFlowToDelete(null);
      } else {
        console.error('Failed to delete cursor flow:', error);
        alert('Failed to delete the cursor flow. Please try again.');
      }
    } catch (error) {
      console.error('Error during deletion:', error);
      alert('An error occurred while deleting the cursor flow.');
    }
  };

  // Function to handle the flow request submission
  const handleFlowRequestSubmit = async () => {
    if (!requestFlowName.trim()) {
      return;
    }
    
    try {
      const userId = 'a0d6ba16-6093-4086-ad69-72df4c720010';
      
      const { success, error } = await createCursorFlowRequest(
        requestFlowName,
        requestFlowContext || null,
        organizationId,
        userId
      );
      
      if (success) {
        alert('Flow request submitted successfully!');
        setRequestFlowName("");
        setRequestFlowContext("");
        setIsRequestFlowDialogOpen(false);
        
        // Reload the cursor flows to show the new requested flow
        await loadCursorFlows();
      } else {
        console.error('Error submitting flow request:', error);
        alert('Failed to submit flow request. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while submitting your request.');
    }
  };

  return (
    <InviteTeamMembers>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-8 bg-default-background py-12">
        <Breadcrumbs>
          <Breadcrumbs.Item>Guide</Breadcrumbs.Item>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>Cursor Flows</Breadcrumbs.Item>
        </Breadcrumbs>
        <div className="flex w-full items-center gap-2">
          <span className="grow shrink-0 basis-0 text-heading-3 font-heading-3 text-default-font">
            Cursor Flows
          </span>
          <div className="flex items-center gap-2">
            <Button
              className="h-8 grow shrink-0 basis-0"
              variant="neutral-primary"
              icon="FeatherPlus"
              onClick={() => setIsUploadDialogOpen(true)}
            >
              Create
            </Button>
            <Button
              icon="FeatherWorkflow"
              onClick={() => setIsRequestFlowDialogOpen(true)}
            >
              Request a flow
            </Button>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-4">
          <div className="flex w-full items-center gap-2 border-b border-solid border-neutral-border py-2">
            <span className="grow shrink-0 basis-0 text-body-bold font-body-bold text-default-font">
              {isLoading ? 'Loading...' : `${cursorFlows.length} flows`}
            </span>
          </div>
          <div className="flex w-full flex-col items-start gap-2">
            <div className="flex w-full items-center border-b border-solid border-neutral-border py-2 text-body font-body text-subtext-color">
              <span className="text-body font-body text-default-font flex-1">
                Name
              </span>
              <div className="flex items-center justify-end gap-4 w-48">
                <span className="text-body font-body text-default-font">
                  Status
                </span>
                <span className="w-10"></span> {/* Space for menu button */}
              </div>
            </div>
            
            {isLoading ? (
              <div className="py-4 text-center w-full">Loading cursor flows...</div>
            ) : cursorFlows.length === 0 ? (
              <div className="py-4 text-center w-full">No cursor flows found. Create your first flow!</div>
            ) : (
              cursorFlows.map((flow) => (
                <HomeListItem
                  key={flow.id}
                  icon={flow.status === 'requested' ? "FeatherClock" : "FeatherMousePointer"}
                  title={flow.name}
                  subtitle={flow.audienceName || "No audience"}
                  metadata=""
                  onClick={() => navigateToPreview(flow.id, flow.name, flow.status)}
                  className={`cursor-pointer ${flow.status === 'requested' ? 'opacity-70' : ''}`}
                >
                  <div className="flex items-center justify-end gap-4 w-48">
                    <Badge variant={getBadgeVariantForStatus(flow.status)}>
                      {flow.status.toLowerCase() === 'published' 
                        ? 'Live' 
                        : flow.status.charAt(0).toUpperCase() + flow.status.slice(1)}
                    </Badge>
                    <SubframeCore.DropdownMenu.Root>
                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                        <IconButton
                          icon="FeatherMoreHorizontal"
                          onClick={(e) => e.stopPropagation()}
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
                            {flow.status !== 'requested' && (
                              <DropdownMenu.DropdownItem 
                                icon="FeatherPlay"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigateToPreview(flow.id, flow.name, flow.status);
                                }}
                              >
                                Preview
                              </DropdownMenu.DropdownItem>
                            )}
                            <DropdownMenu.DropdownItem icon="FeatherEdit2">
                              Edit
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem 
                              icon="FeatherTrash"
                              onClick={(e) => handleDeleteClick(e, flow)}
                            >
                              Delete
                            </DropdownMenu.DropdownItem>
                          </DropdownMenu>
                        </SubframeCore.DropdownMenu.Content>
                      </SubframeCore.DropdownMenu.Portal>
                    </SubframeCore.DropdownMenu.Root>
                  </div>
                </HomeListItem>
              ))
            )}
          </div>
        </div>
      </div>

      {/* JSON Upload Dialog */}
      <DialogLayout open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <div className="flex h-full w-full flex-col items-start gap-6 px-6 py-6">
          <div className="flex w-full items-start justify-between">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Upload JSON File
              </span>
              <span className="text-body font-body text-subtext-color">
                Select a JSON file to upload and process
              </span>
            </div>
            <SubframeCore.Icon
              className="text-body font-body text-neutral-500 cursor-pointer"
              name="FeatherX"
              onClick={() => setIsUploadDialogOpen(false)}
            />
          </div>
          
          {/* Flow name input */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Flow Name
            </label>
            <input
              type="text"
              value={flowName}
              onChange={(e) => setFlowName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
              placeholder="Enter flow name"
            />
          </div>
          
          {/* Optional Flow ID input */}
          <div className="w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Flow ID (Optional)
            </label>
            <input
              type="text"
              value={flowId}
              onChange={(e) => setFlowId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-500 focus:border-brand-500"
              placeholder="Provide existing Flow ID to update"
            />
            <p className="mt-1 text-xs text-gray-500">
              If provided, this will update an existing flow instead of creating a new one
            </p>
          </div>
          
          <div className="flex w-full flex-col items-center justify-center gap-4 rounded-md bg-neutral-50 px-12 py-12">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".json"
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-4">
              <IconWithBackground size="large" icon="FeatherUpload" />
              <span className="text-body font-body text-subtext-color text-center">
                {selectedFile ? selectedFile.name : "Drag file here or"}
              </span>
            </div>
            <Button
              variant="brand-tertiary"
              onClick={handleSelectFileClick}
            >
              Select JSON file
            </Button>
          </div>
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              variant="neutral-tertiary"
              onClick={() => {
                setIsUploadDialogOpen(false);
                setSelectedFile(null);
                setFlowName("");
                setFlowId("");
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadJson} 
              disabled={isUploading || !selectedFile || !flowName.trim()}
            >
              {isUploading ? "Uploading..." : flowId ? "Update Flow" : "Create Flow"}
            </Button>
          </div>
        </div>
      </DialogLayout>

      {/* Delete Confirmation Dialog */}
      <DialogLayout open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <div className="flex h-full w-full flex-col items-start gap-6 px-6 py-6">
          <div className="flex w-full items-start justify-between">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Confirm Deletion
              </span>
              <span className="text-body font-body text-subtext-color">
                Are you sure you want to delete "{flowToDelete?.name}"? This action cannot be undone.
              </span>
            </div>
            <SubframeCore.Icon
              className="text-body font-body text-neutral-500 cursor-pointer"
              name="FeatherX"
              onClick={() => setDeleteDialogOpen(false)}
            />
          </div>
          
          <div className="flex w-full items-center justify-end gap-2 mt-4">
            <Button
              variant="neutral-tertiary"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive-primary"
              onClick={confirmDelete}
            >
              Delete
            </Button>
          </div>
        </div>
      </DialogLayout>

      {/* Request Flow Dialog */}
      <DialogLayout open={isRequestFlowDialogOpen} onOpenChange={setIsRequestFlowDialogOpen}>
        <div className="flex h-full w-full flex-col items-start gap-6 px-6 py-6">
          <div className="flex w-full items-start justify-between">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Request a flow
              </span>
              <span className="text-body font-body text-subtext-color">
                Tell us what flow you need and our browser agent creates it
              </span>
            </div>
            <SubframeCore.Icon
              className="text-body font-body text-neutral-500 cursor-pointer"
              name="FeatherX"
              onClick={() => setIsRequestFlowDialogOpen(false)}
            />
          </div>
          <div className="flex w-full flex-col items-start gap-6">
            <TextField
              className="h-auto w-full flex-none"
              label="Flow name"
              helpText="What do you want this walkthrough to do?"
            >
              <TextField.Input
                placeholder="e.g. Product Tour Flow"
                value={requestFlowName}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                  setRequestFlowName(event.target.value)
                }
              />
            </TextField>
            <TextArea
              className="h-auto w-full flex-none"
              label="Additional context (optional)"
              helpText=""
            >
              <TextArea.Input
                placeholder="Provide optional product related context to help the agent create this flow"
                value={requestFlowContext}
                onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => 
                  setRequestFlowContext(event.target.value)
                }
              />
            </TextArea>
          </div>
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              variant="neutral-tertiary"
              onClick={() => setIsRequestFlowDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleFlowRequestSubmit}
              disabled={!requestFlowName.trim()}
            >
              Submit request
            </Button>
          </div>
        </div>
      </DialogLayout>
    </InviteTeamMembers>
  );
}

export default CursorFlows;