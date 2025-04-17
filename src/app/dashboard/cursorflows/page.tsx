"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from "@/hooks/useAuth";
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

// Add interface for the audience type
interface Audience {
  id: string;
  name: string;
}

// Update the CursorFlow type to include audiences
interface ExtendedCursorFlow extends CursorFlow {
  audiences?: Audience[];
  audienceName?: string;
}

// Component that uses searchParams
function CursorFlowsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const { getOrganizationId, currentOrgId, currentOrgName } = useOrganization();
  
  // State to control the open/closed state of the upload dialog
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  // State to store cursor flows fetched from database
  const [cursorFlows, setCursorFlows] = useState<ExtendedCursorFlow[]>([]);
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

  // Function to load cursor flows data - update to take organizationId parameter
  const loadCursorFlows = useCallback(async (orgId: string) => {
    if (!orgId) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await fetchCursorFlowsWithAudiences(orgId);
      
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
  }, []);

  // Update effect to use currentOrgId directly
  useEffect(() => {
    // If the organization ID is available from the hook, load the data
    if (currentOrgId) {
      loadCursorFlows(currentOrgId);
    }
  }, [currentOrgId, loadCursorFlows]); // depend on currentOrgId and loadCursorFlows

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
    if (!selectedFile || !flowName.trim() || !currentOrgId || !session?.user?.id) {
      alert('Please select a file and enter a name for the flow. Missing required information.');
      return;
    }

    setIsUploading(true);
    try {
      const result = await processJsonForCursorFlow(
        selectedFile,
        flowName,
        currentOrgId,
        session.user.id
      );

      if (!result.success) {
        console.error('Error processing cursor flow:', result.error);
        alert(flowId ? 'Failed to update cursor flow' : 'Failed to create cursor flow');
        return;
      }

      // Check text generation status
      let message = flowId ? 'Flow updated' : 'Flow created';
      
      if (result.textGenerated) {
        message += ` successfully with ${result.textProcessedCount} steps automatically annotated!`;
      } else if (result.error) {
        console.warn('Partial success:', result.error);
        message += ', but some steps may not have been processed correctly.';
      } else {
        message += ' successfully!';
      }
      
      alert(message);

      // Refresh the cursor flows list
      if (currentOrgId) {
        await loadCursorFlows(currentOrgId);
      }
      
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
        if (currentOrgId) {
          await loadCursorFlows(currentOrgId);
        }
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

  // Function to handle flow request submission
  const handleFlowRequestSubmit = async () => {
    if (!requestFlowName.trim() || !currentOrgId || !session?.user?.id) {
      alert('Please enter a flow name and ensure you are logged in.');
      return;
    }
    
    try {
      const { success, error, flowId } = await createCursorFlowRequest(
        requestFlowName,
        requestFlowContext || null,
        currentOrgId,
        session.user.id
      );
      
      if (success) {
        alert('Flow request submitted successfully! Our team will create this flow for you.');
        
        // Refresh the cursor flows list to show the requested flow
        if (currentOrgId) {
          await loadCursorFlows(currentOrgId);
        }
        
        // Close the dialog and reset state
        setIsRequestFlowDialogOpen(false);
        setRequestFlowName("");
        setRequestFlowContext("");
      } else {
        console.error('Error creating flow request:', error);
        alert('Failed to submit flow request. Please try again.');
      }
    } catch (error) {
      console.error('Error during flow request submission:', error);
      alert('An error occurred while submitting your flow request.');
    }
  };

  // If no organization ID is available, show loading or error state
  if (!currentOrgId) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading...</h2>
          <p className="text-gray-500">Please wait while we set up your workspace.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-8 bg-default-background py-12">
        <Breadcrumbs>
          <Breadcrumbs.Item>Guide</Breadcrumbs.Item>
          <Breadcrumbs.Divider />
          <Breadcrumbs.Item active={true}>Cursor Flows</Breadcrumbs.Item>
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
                  subtitle={
                    <div className="flex flex-wrap gap-2 mt-1">
                      {flow.audiences && flow.audiences.length > 0 ? (
                        flow.audiences.map((audience: Audience) => (
                          <span
                            key={audience.id}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200 transition-colors"
                          >
                            {audience.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-gray-500 text-sm">No audience</span>
                      )}
                    </div>
                  }
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
                Are you sure you want to delete &quot;{flowToDelete?.name}&quot;? This action cannot be undone.
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
    </>
  );
}

// Main component with Suspense boundary
export default function CursorFlows() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading cursor flows...</div>}>
      <CursorFlowsContent />
    </Suspense>
  );
}