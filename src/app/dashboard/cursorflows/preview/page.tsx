"use client";

import React from "react";
import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { Badge } from "@/ui/components/Badge";
import { Button } from "@/ui/components/Button";
import { IconButton } from "@/ui/components/IconButton";
import { Alert } from "@/ui/components/Alert";
import { TextField } from "@/ui/components/TextField";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import * as SubframeCore from "@subframe/core";

function CursorFlowEditor() {
  return (
    <InviteTeamMembers>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-6 bg-default-background py-12">
        <div className="flex w-full flex-wrap items-center justify-between">
          <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
            <Breadcrumbs>
              <Breadcrumbs.Item>Guide</Breadcrumbs.Item>
              <Breadcrumbs.Divider />
              <Breadcrumbs.Item>Cursor Flows</Breadcrumbs.Item>
              <Breadcrumbs.Divider />
              <Breadcrumbs.Item active={true}>
                Create a leave policy
              </Breadcrumbs.Item>
            </Breadcrumbs>
            <div className="flex w-full items-center gap-2">
              <span className="text-heading-2 font-heading-2 text-default-font">
                Create a leave policy
              </span>
              <Badge variant="warning">Draft</Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="neutral-secondary"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Preview
            </Button>
            <Button
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Publish
            </Button>
          </div>
        </div>
        <Alert
          title="This flow is in draft mode"
          description="Publish your changes to make them visible to users."
          actions={
            <IconButton
              icon="FeatherX"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            />
          }
        />
        <div className="flex w-full grow shrink-0 basis-0 flex-wrap items-start gap-6">
          <div className="flex min-w-[576px] grow shrink-0 basis-0 flex-col items-start gap-6">
            <div className="flex w-full flex-col items-start rounded-md border border-solid border-neutral-border bg-default-background">
              <div className="flex w-full items-center justify-between border-b border-solid border-neutral-border px-4 py-3">
                <span className="text-body-bold font-body-bold text-default-font">
                  Step 1
                </span>
                <Button
                  variant="destructive-secondary"
                  icon="FeatherTrash"
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                >
                  Remove
                </Button>
              </div>
              <div className="flex w-full flex-col items-start gap-4 px-4 py-4">
                <img
                  className="w-full grow shrink-0 basis-0 rounded-md object-cover"
                  src="https://res.cloudinary.com/subframe/image/upload/v1742270633/uploads/5582/qq8dn0indiizjqgkkeho.png"
                />
                <TextField
                  label="Cursor Text"
                  helpText=""
                  icon="FeatherMousePointer2"
                >
                  <TextField.Input
                    placeholder="Select the leaves tab"
                    value=""
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => {}}
                  />
                </TextField>
              </div>
            </div>
            <div className="flex w-full flex-col items-start rounded-md border border-solid border-neutral-border bg-default-background">
              <div className="flex w-full items-center justify-between border-b border-solid border-neutral-border px-4 py-3">
                <span className="text-body-bold font-body-bold text-default-font">
                  Step 2
                </span>
                <div className="flex items-center gap-2">
                  <SubframeCore.DropdownMenu.Root>
                    <SubframeCore.DropdownMenu.Trigger asChild={true}>
                      <IconButton
                        icon="FeatherMoreHorizontal"
                        onClick={(
                          event: React.MouseEvent<HTMLButtonElement>
                        ) => {}}
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
                          <DropdownMenu.DropdownItem icon="FeatherTrash">
                            Remove step
                          </DropdownMenu.DropdownItem>
                        </DropdownMenu>
                      </SubframeCore.DropdownMenu.Content>
                    </SubframeCore.DropdownMenu.Portal>
                  </SubframeCore.DropdownMenu.Root>
                </div>
              </div>
              <div className="flex w-full flex-col items-start gap-4 px-4 py-4">
                <img
                  className="h-64 w-full flex-none rounded-md object-cover"
                  src="https://images.unsplash.com/photo-1498050108023-c5249f4df085"
                />
                <TextField
                  label="Cursor Text"
                  helpText=""
                  icon="FeatherMousePointer2"
                >
                  <TextField.Input
                    placeholder="Select the leaves tab"
                    value=""
                    onChange={(
                      event: React.ChangeEvent<HTMLInputElement>
                    ) => {}}
                  />
                </TextField>
              </div>
            </div>
          </div>
          <div className="flex w-80 flex-none flex-col items-start gap-6 rounded-md border border-solid border-neutral-border bg-default-background px-6 py-6 self-start">
            <span className="text-heading-3 font-heading-3 text-default-font">
              Removed Steps
            </span>
            <div className="flex w-full flex-col items-start gap-4">
              <div className="flex w-full items-center gap-4 rounded-md border border-solid border-neutral-border bg-neutral-50 px-4 py-4">
                <img
                  className="h-16 w-16 flex-none rounded-sm object-cover"
                  src="https://images.unsplash.com/photo-1531403009284-440f080d1e12"
                />
                <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
                  <span className="text-body-bold font-body-bold text-default-font">
                    Step 3
                  </span>
                  <Button
                    variant="neutral-secondary"
                    size="small"
                    onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                  >
                    Restore
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InviteTeamMembers>
  );
}

export default CursorFlowEditor;