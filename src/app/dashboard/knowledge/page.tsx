"use client";

import React, { useState, useEffect, useRef } from "react";
import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { IconWithBackground } from "@/ui/components/IconWithBackground";
import { Button } from "@/ui/components/Button";
import { TextField } from "@/ui/components/TextField";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import * as SubframeCore from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { ListRow } from "@/ui/components/ListRow";
import { Alert } from "@/ui/components/Alert";
import { DialogLayout } from "@/ui/layouts/DialogLayout";
import { 
  fetchResources, 
  uploadFile, 
  uploadMultipleFiles,
  addLink,
  deleteResource,
  getDownloadUrl,
  type KnowledgeResource
} from "@/utils/knowledgeResources";
import { formatRelativeTime } from "@/utils/dateUtils";

function Knowledge() {
  // States for resources
  const [resources, setResources] = useState<KnowledgeResource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // States for file upload
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // States for link addition
  const [linkUrl, setLinkUrl] = useState("");
  const [isAddingLink, setIsAddingLink] = useState(false);
  
  // States for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resourceToDelete, setResourceToDelete] = useState<KnowledgeResource | null>(null);

  // Fetch resources on component mount
  useEffect(() => {
    loadResources();
  }, []);

  // Function to load resources
  const loadResources = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a production app, get organizationId from auth context
      const organizationId = "5380e9d2-9adf-4338-b4f6-2e59b75d349d";
      
      const { data, error: fetchError } = await fetchResources(organizationId);
      
      if (fetchError) {
        throw new Error("Failed to load knowledge resources");
      }
      
      setResources(data || []);
    } catch (err) {
      console.error("Error loading resources:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle file input change
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // In a production app, get these values from auth context
      const organizationId = "5380e9d2-9adf-4338-b4f6-2e59b75d349d";
      const userId = "a0d6ba16-6093-4086-ad69-72df4c720010";
      
      const files = Array.from(event.target.files);
      
      // If multiple files, use bulk upload
      if (files.length > 1) {
        const result = await uploadMultipleFiles(files, organizationId, userId);
        
        if (!result.success) {
          throw new Error(`Some files failed to upload: ${result.errors.length} errors`);
        }
        
        setSuccessMessage(`Successfully uploaded ${result.resources.length} files`);
      } else {
        // Single file upload
        const result = await uploadFile(files[0], organizationId, userId);
        
        if (!result.success) {
          throw new Error("Failed to upload file");
        }
        
        setSuccessMessage("File uploaded successfully");
      }
      
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      
      // Refresh resources
      await loadResources();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error uploading file(s):", err);
      setError(err instanceof Error ? err.message : "Failed to upload file(s)");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    
    if (!e.dataTransfer.files || e.dataTransfer.files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // In a production app, get these values from auth context
      const organizationId = "5380e9d2-9adf-4338-b4f6-2e59b75d349d";
      const userId = "ya0d6ba16-6093-4086-ad69-72df4c720010";
      
      const files = Array.from(e.dataTransfer.files);
      
      // Use bulk upload for all files
      const result = await uploadMultipleFiles(files, organizationId, userId);
      
      if (!result.success) {
        throw new Error(`Some files failed to upload: ${result.errors.length} errors`);
      }
      
      setSuccessMessage(`Successfully uploaded ${result.resources.length} files`);
      
      // Refresh resources
      await loadResources();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error uploading dropped file(s):", err);
      setError(err instanceof Error ? err.message : "Failed to upload file(s)");
    } finally {
      setIsUploading(false);
    }
  };

  // Handle URL submission
  const handleAddLink = async () => {
    if (!linkUrl.trim()) return;
    
    setIsAddingLink(true);
    setError(null);
    
    try {
      // In a production app, get these values from auth context
      const organizationId = "5380e9d2-9adf-4338-b4f6-2e59b75d349d";
      const userId = "a0d6ba16-6093-4086-ad69-72df4c720010";
      
      // Try to extract name from URL
      let name = "";
      try {
        const url = new URL(linkUrl);
        name = url.hostname;
      } catch (e) {
        // If URL parsing fails, use the raw input
        name = linkUrl;
      }
      
      const result = await addLink(linkUrl, name, organizationId, userId);
      
      if (!result.success) {
        throw new Error("Failed to add link");
      }
      
      setSuccessMessage("Link added successfully");
      setLinkUrl(""); // Clear the input
      
      // Refresh resources
      await loadResources();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error("Error adding link:", err);
      setError(err instanceof Error ? err.message : "Failed to add link");
    } finally {
      setIsAddingLink(false);
    }
  };

  // Handle delete confirmation
  const handleDeleteClick = (resource: KnowledgeResource) => {
    setResourceToDelete(resource);
    setDeleteDialogOpen(true);
  };

  // Handle resource deletion
  const confirmDelete = async () => {
    if (!resourceToDelete) return;
    
    try {
      // In a production app, get organizationId from auth context
      const organizationId = "5380e9d2-9adf-4338-b4f6-2e59b75d349d";
      
      const { success, error: deleteError } = await deleteResource(
        resourceToDelete.id,
        organizationId
      );
      
      if (!success) {
        throw new Error(deleteError || "Failed to delete resource");
      }
      
      setSuccessMessage(`${resourceToDelete.name} deleted successfully`);
      
      // Refresh resources
      await loadResources();
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
      
      // Close dialog
      setDeleteDialogOpen(false);
      setResourceToDelete(null);
    } catch (err) {
      console.error("Error deleting resource:", err);
      setError(err instanceof Error ? err.message : "Failed to delete resource");
    }
  };

  // Handle resource download/open
  const handleOpenResource = async (resource: KnowledgeResource) => {
    try {
      // In a production app, get organizationId from auth context
      const organizationId = "5380e9d2-9adf-4338-b4f6-2e59b75d349d";
      
      const { url, error: urlError } = await getDownloadUrl(
        resource.id,
        organizationId
      );
      
      if (!url) {
        throw new Error(urlError || "Failed to get resource URL");
      }
      
      // Open the URL in a new tab
      window.open(url, '_blank');
    } catch (err) {
      console.error("Error opening resource:", err);
      setError(err instanceof Error ? err.message : "Failed to open resource");
    }
  };

  // Filter resources by type
  const fileResources = resources.filter(r => r.type === 'file');
  const linkResources = resources.filter(r => r.type === 'link');

  // Function to get favicon for a URL
  const getFaviconUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      return `https://www.google.com/s2/favicons?domain=${parsedUrl.hostname}&sz=64`;
    } catch (e) {
      return "https://via.placeholder.com/64";
    }
  };

  // Function to get file icon based on extension
  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return "https://res.cloudinary.com/subframe/image/upload/v1723780779/uploads/302/rpnpvey9vgpe15ktp8j6.png";
      case 'doc':
      case 'docx':
        return "https://res.cloudinary.com/subframe/image/upload/v1723780745/uploads/302/jgwyrplshzrzw8uvhv4j.png";
      case 'xls':
      case 'xlsx':
        return "https://res.cloudinary.com/subframe/image/upload/v1723780751/uploads/302/vxtovq8qcgzuqnugyhjp.png";
      case 'ppt':
      case 'pptx':
        return "https://res.cloudinary.com/subframe/image/upload/v1723780754/uploads/302/yrtjw6qn46qd8lf3jlpr.png";
      case 'txt':
      case 'md':
        return "https://res.cloudinary.com/subframe/image/upload/v1723780741/uploads/302/iocrneldnziecxz0a86f.png";
      default:
        return "https://res.cloudinary.com/subframe/image/upload/v1723780741/uploads/302/iocrneldnziecxz0a86f.png";
    }
  };

  return (
    <InviteTeamMembers>
      <div className="flex h-full w-full flex-col items-start">
        <div className="flex w-full flex-col items-center gap-4 bg-default-background px-12 py-12 overflow-auto">
          <div className="flex w-full max-w-[768px] flex-col items-start gap-8">
            <Breadcrumbs>
              <Breadcrumbs.Item>Guide</Breadcrumbs.Item>
              <Breadcrumbs.Divider />
              <Breadcrumbs.Item active={true}>Knowledge</Breadcrumbs.Item>
            </Breadcrumbs>
            
            {/* Success and error messages */}
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
            
            <div className="flex w-full items-start gap-4">
              <div className="flex items-center justify-center gap-3">
                <IconWithBackground size="large" icon="FeatherBookOpen" />
                <span className="text-heading-1 font-heading-1 text-default-font">
                  Knowledge
                </span>
              </div>
            </div>
            
            {/* File upload area */}
            <div 
              className="flex w-full flex-col items-start gap-4 rounded-lg border-2 border-dashed border-neutral-200 px-8 py-12"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="flex w-full flex-col items-center justify-center gap-4">
                <IconWithBackground
                  variant="neutral"
                  size="x-large"
                  icon="FeatherUploadCloud"
                />
                <div className="flex flex-col items-center gap-2">
                  <span className="text-body-bold font-body-bold text-default-font">
                    Drag and drop your files here
                  </span>
                  <span className="text-body font-body text-subtext-color">
                    or click to select files from your computer
                  </span>
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  multiple
                  className="hidden"
                />
                <Button
                  icon="FeatherUpload"
                  onClick={() => fileInputRef.current?.click()}
                  loading={isUploading}
                  disabled={isUploading}
                >
                  {isUploading ? "Uploading..." : "Upload Files"}
                </Button>
              </div>
            </div>
            
            {/* URL input area */}
            <div className="flex w-full flex-col items-start gap-4">
              <span className="text-body-bold font-body-bold text-default-font">
                Or add a URL
              </span>
              <TextField
                className="h-auto w-full flex-none"
                label=""
                helpText=""
                icon="FeatherLink"
              >
                <TextField.Input
                  placeholder="Paste a link to your document"
                  value={linkUrl}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                    setLinkUrl(e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddLink();
                    }
                  }}
                />
              </TextField>
              <Button
                variant="neutral-secondary"
                onClick={handleAddLink}
                loading={isAddingLink}
                disabled={!linkUrl.trim() || isAddingLink}
              >
                {isAddingLink ? "Adding..." : "Add URL"}
              </Button>
            </div>
            
            {/* Uploaded files section */}
            <div className="flex w-full flex-col items-start gap-4">
              <span className="text-body-bold font-body-bold text-default-font">
                Uploaded Documents
              </span>
              {isLoading ? (
                <div className="text-center w-full py-4">Loading files...</div>
              ) : fileResources.length === 0 ? (
                <div className="text-center w-full py-4 text-subtext-color">
                  No files uploaded yet. Upload your first file above.
                </div>
              ) : (
                <div className="flex w-full flex-col items-start gap-2">
                  {fileResources.map((resource) => (
                    <div 
                      key={resource.id}
                      className="flex w-full items-center gap-4 rounded-md bg-neutral-50 px-4 py-4 cursor-pointer"
                      onClick={() => handleOpenResource(resource)}
                    >
                      <img
                        className="h-10 w-10 flex-none rounded-md object-cover"
                        src={getFileIcon(resource.name)}
                        alt={resource.name}
                      />
                      <div className="flex items-start justify-between grow">
                        <div className="flex flex-col items-start">
                          <span className="text-body-bold font-body-bold text-default-font">
                            {resource.name}
                          </span>
                          <span className="text-caption font-caption text-subtext-color">
                            Added {formatRelativeTime(resource.created_at)}
                          </span>
                        </div>
                        <SubframeCore.DropdownMenu.Root>
                          <SubframeCore.DropdownMenu.Trigger asChild={true}>
                            <IconButton
                              size="small"
                              icon="FeatherMoreHorizontal"
                              onClick={(e) => e.stopPropagation()}
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
                                  icon="FeatherDownloadCloud"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenResource(resource);
                                  }}
                                >
                                  Download
                                </DropdownMenu.DropdownItem>
                                <DropdownMenu.DropdownItem 
                                  icon="FeatherTrash"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(resource);
                                  }}
                                >
                                  Delete
                                </DropdownMenu.DropdownItem>
                              </DropdownMenu>
                            </SubframeCore.DropdownMenu.Content>
                          </SubframeCore.DropdownMenu.Portal>
                        </SubframeCore.DropdownMenu.Root>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Submitted links section */}
            <div className="flex w-full flex-col items-start gap-4">
              <span className="text-body-bold font-body-bold text-default-font">
                Submitted Links
              </span>
              {isLoading ? (
                <div className="text-center w-full py-4">Loading links...</div>
              ) : linkResources.length === 0 ? (
                <div className="text-center w-full py-4 text-subtext-color">
                  No links added yet. Add your first link above.
                </div>
              ) : (
                <div className="flex w-full flex-col items-start gap-2">
                  {linkResources.map((resource) => (
                    <div 
                      key={resource.id}
                      className="flex w-full items-center gap-4 rounded-md bg-neutral-50 px-4 py-4 cursor-pointer"
                      onClick={() => handleOpenResource(resource)}
                    >
                      <img
                        className="h-10 w-10 flex-none rounded-md object-cover"
                        src={getFaviconUrl(resource.file_url)}
                        alt={resource.name}
                      />
                      <div className="flex items-start justify-between grow">
                        <div className="flex flex-col items-start">
                          <span className="text-body-bold font-body-bold text-default-font">
                            {resource.name}
                          </span>
                          <span className="text-caption font-caption text-subtext-color">
                            {(() => {
                              try {
                                return new URL(resource.file_url).hostname;
                              } catch (e) {
                                return resource.file_url;
                              }
                            })()}
                          </span>
                        </div>
                        <SubframeCore.DropdownMenu.Root>
                          <SubframeCore.DropdownMenu.Trigger asChild={true}>
                            <IconButton
                              size="small"
                              icon="FeatherMoreHorizontal"
                              onClick={(e) => e.stopPropagation()}
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
                                  icon="FeatherExternalLink"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenResource(resource);
                                  }}
                                >
                                  Open Link
                                </DropdownMenu.DropdownItem>
                                <DropdownMenu.DropdownItem 
                                  icon="FeatherCopy"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigator.clipboard.writeText(resource.file_url);
                                  }}
                                >
                                  Copy Link
                                </DropdownMenu.DropdownItem>
                                <DropdownMenu.DropdownItem 
                                  icon="FeatherTrash"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteClick(resource);
                                  }}
                                >
                                  Remove
                                </DropdownMenu.DropdownItem>
                              </DropdownMenu>
                            </SubframeCore.DropdownMenu.Content>
                          </SubframeCore.DropdownMenu.Portal>
                        </SubframeCore.DropdownMenu.Root>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <DialogLayout open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <div className="flex h-full w-full flex-col items-start gap-6 px-6 py-6">
          <div className="flex w-full items-start justify-between">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Confirm Deletion
              </span>
              <span className="text-body font-body text-subtext-color">
                Are you sure you want to delete "{resourceToDelete?.name}"? This action cannot be undone.
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

export default Knowledge;