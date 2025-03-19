"use client";

import React, { useState } from "react";
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

function CursorFlows() {
  // State to control the open/closed state of the upload dialog
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

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
              8 flows
            </span>
          </div>
          <div className="flex w-full flex-col items-start gap-2">
            <div className="flex w-full items-center border-b border-solid border-neutral-border py-2 text-body font-body text-subtext-color">
              <span className="text-body font-body text-default-font w-5/12">
                Name
              </span>
              <span className="text-body font-body text-default-font text-right w-2/12">
                Audience
              </span>
              <span className="text-body font-body text-default-font text-right w-4/12">
                Status
              </span>
            </div>
            <HomeListItem
              icon="FeatherMousePointer"
              title="User Onboarding Flow"
              subtitle="Active"
              metadata=""
              // Redirect to preview page 
href={`/dashboard/cursorflows/preview?flowId=user-onboarding&name=${encodeURIComponent("User Onboarding Flow")}`}
              className="cursor-pointer"
            >
              <Badge variant="success">Live</Badge>
              <SubframeCore.DropdownMenu.Root>
                <SubframeCore.DropdownMenu.Trigger asChild={true}>
                  <IconButton
                    icon="FeatherMoreHorizontal"
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
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
                        Preview
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
            </HomeListItem>
            <HomeListItem
              icon="FeatherMousePointer"
              title="Checkout Process"
              subtitle="Active"
              metadata=""
            >
              <Badge variant="success">Live</Badge>
              <IconButton
                icon="FeatherMoreHorizontal"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              />
            </HomeListItem>
            <HomeListItem
              icon="FeatherMousePointer"
              title="Account Settings"
              subtitle="Paused"
              metadata=""
            >
              <Badge variant="neutral">Paused</Badge>
              <IconButton
                icon="FeatherMoreHorizontal"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              />
            </HomeListItem>
            <HomeListItem
              icon="FeatherMousePointer"
              title="Product Search Flow"
              subtitle="Active"
              metadata=""
            >
              <Badge variant="success">Live</Badge>
              <IconButton
                icon="FeatherMoreHorizontal"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              />
            </HomeListItem>
            <HomeListItem
              icon="FeatherMousePointer"
              title="Payment Method Update"
              subtitle="Draft"
              metadata=""
            >
              <Badge variant="neutral">Draft</Badge>
              <IconButton
                icon="FeatherMoreHorizontal"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              />
            </HomeListItem>
            <HomeListItem
              icon="FeatherMousePointer"
              title="Profile Creation"
              subtitle="Active"
              metadata=""
            >
              <Badge variant="success">Live</Badge>
              <IconButton
                icon="FeatherMoreHorizontal"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              />
            </HomeListItem>
            <HomeListItem
              icon="FeatherMousePointer"
              title="Feature Tour"
              subtitle="Archived"
              metadata=""
            >
              <Badge variant="neutral">Archived</Badge>
              <IconButton
                icon="FeatherMoreHorizontal"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              />
            </HomeListItem>
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
          <div className="flex w-full flex-col items-center justify-center gap-4 rounded-md bg-neutral-50 px-12 py-12">
            <div className="flex flex-col items-center justify-center gap-4 px-4 py-4">
              <IconWithBackground size="large" icon="FeatherUpload" />
              <span className="text-body font-body text-subtext-color text-center">
                Drag file here or
              </span>
            </div>
            <Button
              variant="brand-tertiary"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Select JSON file
            </Button>
          </div>
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              variant="neutral-tertiary"
              onClick={() => setIsUploadDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}>
              Upload File
            </Button>
          </div>
        </div>
      </DialogLayout>
    </InviteTeamMembers>
  );
}

export default CursorFlows;