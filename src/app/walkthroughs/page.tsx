"use client";

import React, { useEffect, useState } from "react";
import { DefaultPageLayout } from "@/subframe/layouts/DefaultPageLayout";
import { Button } from "@/subframe/components/Button";
import { HomeCard } from "@/subframe/components/HomeCard";
import { DropdownMenu } from "@/subframe/components/DropdownMenu";
import * as SubframeCore from "@subframe/core";
import { IconButton } from "@/subframe/components/IconButton";
import { HomeListItem } from "@/subframe/components/HomeListItem";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import { walkthroughService, type Walkthrough } from '@/lib/walkthroughs';
import { Progress } from "@/subframe/components/Progress";
import { IconWithBackground } from "@/subframe/components/IconWithBackground";
import { Dialog } from "@/subframe/components/Dialog";
import { toast } from "@/subframe/components/Toast";
export default function WalkthroughsPage() {
  const [walkthroughs, setWalkthroughs] = useState<Walkthrough[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWalkthrough, setSelectedWalkthrough] = useState<Walkthrough | null>(null);
  const supabase = createClientComponentClient();
  const router = useRouter();

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      walkthroughService.cleanup();
    };
  }, []);
  const [isRenaming, setIsRenaming] = useState(false);
  const [walkthoughToRename, setWalkthroughToRename] = useState<Walkthrough | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  useEffect(() => {
    async function checkAuthAndFetchWalkthroughs() {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/auth');
        return;
      }

      try {
        const walkthroughsData = await walkthroughService.fetchWalkthroughs(session.user.id);
        setWalkthroughs(walkthroughsData);
        
        // Start polling for processing walkthroughs
        walkthroughsData.forEach(walkthrough => {
          if (walkthrough.status === 'processing') {
            walkthroughService.startPolling(walkthrough, (updated) => {
              setWalkthroughs(current => 
                current.map(w => w.id === updated.id ? updated : w)
              );
            });
          }
        });
      } catch (error) {
        console.error('Error fetching walkthroughs:', error);
      } finally {
        setLoading(false);
      }
    }

    checkAuthAndFetchWalkthroughs();
  }, []);

  const handleDelete = async (walkthrough: Walkthrough) => {
    try {
      await walkthroughService.deleteWalkthrough(walkthrough.id);
      setWalkthroughs(walkthroughs.filter(w => w.id !== walkthrough.id));
      if (selectedWalkthrough?.id === walkthrough.id) {
        setSelectedWalkthrough(null);
      }
    } catch (error) {
      console.error('Error deleting walkthrough:', error);
    }
  };

  const handleDownload = (walkthrough: Walkthrough) => {
    if (!walkthrough.markdown_content) return;

    const blob = new Blob([walkthrough.markdown_content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${walkthrough.title || 'walkthrough'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Update the walkthrough item rendering to show processing state
  const renderWalkthroughItem = (walkthrough: Walkthrough) => (
    <HomeListItem
      key={walkthrough.id}
      icon={walkthrough.status === 'processing' ? 'FeatherLoader' : 'FeatherFileText'}
      title={walkthrough.title}
      subtitle={
        walkthrough.status === 'processing' 
          ? 'Processing walkthrough...' 
          : `Last edited ${new Date(walkthrough.created_at).toLocaleDateString()}`
      }
      metadata={walkthrough.markdown_content ? `${walkthrough.markdown_content.length} characters` : ''}
      onClick={() => setSelectedWalkthrough(walkthrough)}
    >
      <SubframeCore.DropdownMenu.Root>
        <SubframeCore.DropdownMenu.Trigger asChild={true}>
          <IconButton
            icon="FeatherMoreHorizontal"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                icon="FeatherDownload"
                onClick={(e) => {
                  e.stopPropagation();
                  handleDownload(walkthrough);
                }}
              >
                Download
              </DropdownMenu.DropdownItem>
              <DropdownMenu.DropdownItem icon="FeatherTrash" onClick={(e) => {
                e.stopPropagation();
                handleDelete(walkthrough);
              }}>
                Delete
              </DropdownMenu.DropdownItem>
            </DropdownMenu>
          </SubframeCore.DropdownMenu.Content>
        </SubframeCore.DropdownMenu.Portal>
      </SubframeCore.DropdownMenu.Root>
    </HomeListItem>
  );

  const handleRename = async (walkthrough: Walkthrough) => {
    try {
      await walkthroughService.renameWalkthrough(walkthrough.id, newTitle);
      setWalkthroughs(walkthroughs.map(w => 
        w.id === walkthrough.id ? { ...w, title: newTitle } : w
      ));
      if (selectedWalkthrough?.id === walkthrough.id) {
        setSelectedWalkthrough({ ...selectedWalkthrough, title: newTitle });
      }
      setIsRenaming(false);
      setWalkthroughToRename(null);
      setNewTitle('');
    } catch (error) {
      console.error('Error renaming walkthrough:', error);
    }
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await walkthroughService.renameWalkthrough(id, editingTitle);
      setWalkthroughs(walkthroughs.map(w => 
        w.id === id ? { ...w, title: editingTitle } : w
      ));
      setEditingId(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Error renaming walkthrough:', error);
    }
  };

  if (loading) {
    return (
      <DefaultPageLayout>
        <div className="flex h-full items-center justify-center">
          Loading...
        </div>
      </DefaultPageLayout>
    );
  }

  return (
    <DefaultPageLayout>
      {/* Full-width header */}
      <div className="flex w-full items-center justify-between p-6 pt-8 border-b border-border-color">
        <h1 className="text-heading-2 font-heading-2 text-default-font">
          Guides
        </h1>
        <Button onClick={() => router.push('/auth')}>
          Create Guide
        </Button>
      </div>

      {/* Main content area */}
      <div className="flex h-[calc(100vh-6rem)] w-full gap-16 p-6 pt-8">
        {/* Left sidebar - fixed */}
        <div className="w-1/3 flex-shrink-0 overflow-hidden">
          <div className="flex w-full flex-col items-start gap-4">
            {walkthroughs.length === 0 ? (
              <HomeCard
                title="Create new guide"
                subtitle="Start writing a new documentation guide"
                icon="FeatherFileText"
              />
            ) : (
              walkthroughs.map((walkthrough) => (
                <HomeListItem
                  key={walkthrough.id}
                  icon="FeatherFileText"
                  title={walkthrough.id === editingId ? (
                    <input
                      type="text"
                      value={editingTitle}
                      onChange={(e) => setEditingTitle(e.target.value)}
                      onBlur={() => handleSaveEdit(walkthrough.id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveEdit(walkthrough.id);
                        if (e.key === 'Escape') {
                          setEditingId(null);
                          setEditingTitle('');
                        }
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2"
                      autoFocus
                    />
                  ) : (
                    walkthrough.title
                  )}
                  subtitle={`Last edited ${new Date(walkthrough.created_at).toLocaleDateString()}`}
                  metadata={
                    <div className="min-w-[100px] text-center">
                      {walkthrough.step_count ? `${walkthrough.step_count} steps` : 'No steps'}
                    </div>
                  }
                  onClick={() => setSelectedWalkthrough(walkthrough)}
                >
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        icon="FeatherMoreHorizontal"
                        onClick={(e: React.MouseEvent) => e.stopPropagation()}
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
                            icon="FeatherEdit"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(walkthrough.id);
                              setEditingTitle(walkthrough.title);
                            }}
                          >
                            Rename
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem 
                            icon="FeatherDownload"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownload(walkthrough);
                            }}
                          >
                            Download
                          </DropdownMenu.DropdownItem>
                          <DropdownMenu.DropdownItem 
                            icon="FeatherTrash" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(walkthrough);
                            }}
                          >
                            Delete
                          </DropdownMenu.DropdownItem>
                        </DropdownMenu>
                      </SubframeCore.DropdownMenu.Content>
                    </SubframeCore.DropdownMenu.Portal>
                  </SubframeCore.DropdownMenu.Root>
                </HomeListItem>
              ))
            )}
          </div>
        </div>

        {/* Right preview - scrollable */}
        {selectedWalkthrough ? (
          <div className="w-2/3 h-full overflow-y-auto">
            <div className="container max-w-none flex w-full flex-col items-start gap-8">
              <div className="flex w-full items-center justify-between sticky top-0 bg-default-background py-4">
                <div className="flex flex-col gap-2">
                  <span className="text-body font-body text-subtext-color">
                    Preview
                  </span>
                  <span className="text-heading-1 font-heading-1 text-default-font">
                    {selectedWalkthrough.title}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <IconButton
                    size="small"
                    icon="FeatherCopy"
                    onClick={() => {
                      if (selectedWalkthrough) {
                        walkthroughService.copyMarkdown(selectedWalkthrough, (copied) => {
                          setIsCopied(copied);
                        });
                      }
                    }}
                  />
                  <span className="text-body font-body text-subtext-color">
                    {isCopied ? "Markdown Copied" : "Copy Markdown"}
                  </span>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-8">
                <ReactMarkdown
                  components={{
                    h1: () => null,
                    p: ({ children }) => {
                      if (typeof children[0] === 'string' && children[0].startsWith('Created:')) {
                        return null;
                      }
                      return (
                        <span className="text-body font-body text-default-font">
                          {children}
                        </span>
                      );
                    },
                    h2: ({ children }) => {
                      const stepText = Array.isArray(children) 
                        ? children.join(' ') 
                        : String(children);
                      
                      const stepMatch = stepText.match(/Step (\d+)/);
                      const stepNumber = stepMatch ? stepMatch[1] : '';
                      
                      return (
                        <div className="flex w-full items-center gap-6">
                          <div className="group/c5d68c0e flex items-center justify-center rounded-full bg-brand-100 h-8 w-8">
                            <span className="text-brand-800 text-body font-body">
                              <IconWithBackground size="medium" icon="FeatherCheckCircle" />
                            </span>
                          </div>
                          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-4">
                            <div className="flex w-full flex-col items-start gap-2">
                              <span className="text-heading-3 font-heading-3 text-default-font">
                                Step {stepNumber}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    },
                    img: ({ src, alt }) => (
                      <img
                        src={src}
                        alt={alt}
                        className="h-80 w-full flex-none rounded-md object-cover"
                      />
                    ),
                    li: ({ children }) => (
                      <span className="text-body font-body text-default-font">
                        {children}
                      </span>
                    )
                  }}
                >
                  {selectedWalkthrough.markdown_content || 'Loading markdown content...'}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-2/3 flex items-center justify-center text-subtext-color">
            Select a guide to view its content
          </div>
        )}
      </div>
    </DefaultPageLayout>
  );
}