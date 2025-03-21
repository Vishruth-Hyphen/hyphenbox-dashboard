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
  deleteCursorFlow
} from "@/utils/cursorflows";

function CursorFlows() {
  const router = useRouter();
  // Define organizationId once at the component level
  const organizationId = '996b5d3d-801c-4619-8648-7e4d27deecf5';
  
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
  const navigateToPreview = (flowId: string, flowName: string) => {
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
      // Use the organizationId defined at the component level
      const userId = 'a0d6ba16-6093-4086-ad69-72df4c720010';
      
      const result = await processJsonForCursorFlow(
        selectedFile,
        flowName,
        organizationId,
        userId
      );

      if (!result.success) {
        console.error('Error creating cursor flow:', result.error);
        alert('Failed to create cursor flow');
        return;
      }

      // If there was a partial error (flow created but steps had issues)
      if (result.error) {
        console.warn('Partial success:', result.error);
        alert('Flow created, but some steps may not have been processed correctly.');
      } else {
        alert('Flow and steps created successfully!');
      }

      // Refresh the cursor flows list
      await loadCursorFlows();
      
      // Close the dialog and reset state
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setFlowName("");
      
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload and process JSON');
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
          <Button
            icon="FeatherPlus"
            onClick={() => setIsUploadDialogOpen(true)}
          >
            Create Flow
          </Button>
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
                  icon="FeatherMousePointer"
                  title={flow.name}
                  subtitle={flow.audienceName || "No audience"}
                  metadata=""
                  onClick={() => navigateToPreview(flow.id, flow.name)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-end gap-4 w-48">
                    <Badge variant={getBadgeVariantForStatus(flow.status)}>
                      {flow.status.charAt(0).toUpperCase() + flow.status.slice(1)}
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
                            <DropdownMenu.DropdownItem 
                              icon="FeatherPlay"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigateToPreview(flow.id, flow.name);
                              }}
                            >
                              Preview
                            </DropdownMenu.DropdownItem>
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
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUploadJson} 
              disabled={isUploading || !selectedFile || !flowName.trim()}
            >
              {isUploading ? "Uploading..." : "Upload File"}
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
    </InviteTeamMembers>
  );
}

export default CursorFlows;