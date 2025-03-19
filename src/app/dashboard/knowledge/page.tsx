"use client";

import React from "react";
import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { IconWithBackground } from "@/ui/components/IconWithBackground";
import { Button } from "@/ui/components/Button";
import { TextField } from "@/ui/components/TextField";
import { DropdownMenu } from "@/ui/components/DropdownMenu";
import * as SubframeCore from "@subframe/core";
import { IconButton } from "@/ui/components/IconButton";
import { ListRow } from "@/ui/components/ListRow";

function Knowledge() {
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
            <div className="flex w-full items-start gap-4">
              <div className="flex items-center justify-center gap-3">
                <IconWithBackground size="large" icon="FeatherBookOpen" />
                <span className="text-heading-1 font-heading-1 text-default-font">
                  Knowledge
                </span>
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-4 rounded-lg border-2 border-dashed border-neutral-200 px-8 py-12">
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
                <Button
                  icon="FeatherUpload"
                  onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
                >
                  Upload Files
                </Button>
              </div>
            </div>
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
                  value=""
                  onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
                />
              </TextField>
              <Button
                variant="neutral-secondary"
                onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
              >
                Add URL
              </Button>
            </div>
            <div className="flex w-full flex-col items-start gap-4">
              <span className="text-body-bold font-body-bold text-default-font">
                Uploaded Documents
              </span>
              <div className="flex w-full flex-col items-start gap-2">
                <ListRow
                  image="https://res.cloudinary.com/subframe/image/upload/v1723780779/uploads/302/rpnpvey9vgpe15ktp8j6.png"
                  title="product_requirements.pdf"
                  subtitle="Added just now"
                  actions={
                    <SubframeCore.DropdownMenu.Root>
                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                        <IconButton
                          size="small"
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
                            <DropdownMenu.DropdownItem icon="FeatherDownloadCloud">
                              Download
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem icon="FeatherEdit2">
                              Rename
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem icon="FeatherTrash">
                              Delete
                            </DropdownMenu.DropdownItem>
                          </DropdownMenu>
                        </SubframeCore.DropdownMenu.Content>
                      </SubframeCore.DropdownMenu.Portal>
                    </SubframeCore.DropdownMenu.Root>
                  }
                />
                <ListRow
                  image="https://res.cloudinary.com/subframe/image/upload/v1723780741/uploads/302/iocrneldnziecxz0a86f.png"
                  title="api_documentation.md"
                  subtitle="Added 2 hours ago"
                  actions={
                    <SubframeCore.DropdownMenu.Root>
                      <SubframeCore.DropdownMenu.Trigger asChild={true}>
                        <IconButton
                          size="small"
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
                            <DropdownMenu.DropdownItem icon="FeatherDownloadCloud">
                              Download
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem icon="FeatherEdit2">
                              Rename
                            </DropdownMenu.DropdownItem>
                            <DropdownMenu.DropdownItem icon="FeatherTrash">
                              Delete
                            </DropdownMenu.DropdownItem>
                          </DropdownMenu>
                        </SubframeCore.DropdownMenu.Content>
                      </SubframeCore.DropdownMenu.Portal>
                    </SubframeCore.DropdownMenu.Root>
                  }
                />
              </div>
            </div>
            <div className="flex w-full flex-col items-start gap-4">
              <span className="text-body-bold font-body-bold text-default-font">
                Submitted Links
              </span>
              <div className="flex w-full flex-col items-start gap-2">
                <div className="flex w-full flex-col items-start gap-2">
                  <div className="flex w-full items-center gap-4 rounded-md bg-neutral-50 px-4 py-4">
                    <img
                      className="h-10 w-10 flex-none rounded-md object-cover"
                      src="https://images.unsplash.com/photo-1633356122102-3fe601e05bd2?q=80&w=200&auto=format&fit=crop"
                    />
                    <div className="flex items-start justify-between grow">
                      <div className="flex flex-col items-start">
                        <span className="text-body-bold font-body-bold text-default-font">
                          React Documentation
                        </span>
                        <span className="text-caption font-caption text-subtext-color">
                          react.dev
                        </span>
                      </div>
                      <SubframeCore.DropdownMenu.Root>
                        <SubframeCore.DropdownMenu.Trigger asChild={true}>
                          <IconButton
                            size="small"
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
                              <DropdownMenu.DropdownItem icon="FeatherExternalLink">
                                Open Link
                              </DropdownMenu.DropdownItem>
                              <DropdownMenu.DropdownItem icon="FeatherCopy">
                                Copy Link
                              </DropdownMenu.DropdownItem>
                              <DropdownMenu.DropdownItem icon="FeatherTrash">
                                Remove
                              </DropdownMenu.DropdownItem>
                            </DropdownMenu>
                          </SubframeCore.DropdownMenu.Content>
                        </SubframeCore.DropdownMenu.Portal>
                      </SubframeCore.DropdownMenu.Root>
                    </div>
                  </div>
                  <div className="flex w-full items-center gap-4 rounded-md bg-neutral-50 px-4 py-4">
                    <img
                      className="h-10 w-10 flex-none rounded-md object-cover"
                      src="https://images.unsplash.com/photo-1617042375876-47dfcludge?q=80&w=200&auto=format&fit=crop"
                    />
                    <div className="flex items-start justify-between grow">
                      <div className="flex flex-col items-start">
                        <span className="text-body-bold font-body-bold text-default-font">
                          MDN Web Docs
                        </span>
                        <span className="text-caption font-caption text-subtext-color">
                          developer.mozilla.org
                        </span>
                      </div>
                      <SubframeCore.DropdownMenu.Root>
                        <SubframeCore.DropdownMenu.Trigger asChild={true}>
                          <IconButton
                            size="small"
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
                              <DropdownMenu.DropdownItem icon="FeatherExternalLink">
                                Open Link
                              </DropdownMenu.DropdownItem>
                              <DropdownMenu.DropdownItem icon="FeatherCopy">
                                Copy Link
                              </DropdownMenu.DropdownItem>
                              <DropdownMenu.DropdownItem icon="FeatherTrash">
                                Remove
                              </DropdownMenu.DropdownItem>
                            </DropdownMenu>
                          </SubframeCore.DropdownMenu.Content>
                        </SubframeCore.DropdownMenu.Portal>
                      </SubframeCore.DropdownMenu.Root>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InviteTeamMembers>
  );
}

export default Knowledge;