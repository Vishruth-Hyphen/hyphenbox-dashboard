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

function Audiences() {
  console.log("Rendering Audiences component");
  
  // State for managing dialog visibility
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // State for form inputs
  const [audienceName, setAudienceName] = useState("");
  const [selectedCursorFlows, setSelectedCursorFlows] = useState<string[]>([]);

  // Debug state values with useEffect
  useEffect(() => {
    console.log("Dialog open state:", isCreateDialogOpen);
    console.log("Audience name:", audienceName);
    console.log("Selected cursor flows:", selectedCursorFlows);
  }, [isCreateDialogOpen, audienceName, selectedCursorFlows]);
  
  // Handle selecting a cursor flow
  const handleSelectCursorFlow = (value: string) => {
    console.log("Selected cursor flow:", value);
    if (value && !selectedCursorFlows.includes(value)) {
      setSelectedCursorFlows([...selectedCursorFlows, value]);
    }
  };

  // Reset form state when closing dialog
  const handleCloseDialog = () => {
    console.log("Closing dialog and resetting form");
    setIsCreateDialogOpen(false);
    setAudienceName("");
    setSelectedCursorFlows([]);
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
            onClick={() => setIsCreateDialogOpen(true)}
          >
            Create Audience
          </Button>
        </div>
        <div className="flex w-full flex-col items-start gap-8 overflow-hidden overflow-x-auto flex-shrink-0">
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
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                  Uncategorized
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  12 flows
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  --
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
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
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                  Super Admins
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  12 flows
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  2 days ago
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
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
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                  HR and Finance
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  8 flows
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  1 week ago
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
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
            <Table.Row>
              <Table.Cell>
                <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                  Employees
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  5 flows
                </span>
              </Table.Cell>
              <Table.Cell>
                <span className="whitespace-nowrap text-body font-body text-neutral-500">
                  2 weeks ago
                </span>
              </Table.Cell>
              <Table.Cell>
                <div className="flex grow shrink-0 basis-0 items-center justify-end">
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
          </Table>
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
            <div className="flex w-full flex-col items-start gap-2">
              <Select
                className="h-auto w-full flex-none"
                label="Cursor Flows"
                placeholder="Select existing cursor flows"
                helpText="Choose one or more cursor flows to be assigned to this audience"
                value={undefined}
                onValueChange={handleSelectCursorFlow}
              >
                <Select.Item value="E-commerce Browsing">
                  E-commerce Browsing
                </Select.Item>
                <Select.Item value="Newsletter Signup">Newsletter Signup</Select.Item>
                <Select.Item value="Product Page Interactions">
                  Product Page Interactions
                </Select.Item>
                <Select.Item value="Checkout Abandonment">
                  Checkout Abandonment
                </Select.Item>
              </Select>
              {selectedCursorFlows.length > 0 && (
                <div className="flex w-full flex-col items-start gap-2 border-t border-solid border-neutral-border pt-2">
                  <div className="flex w-full items-center gap-2">
                    <span className="text-caption font-caption text-default-font">
                      Selected Cursor Flows
                    </span>
                  </div>
                  <div className="flex w-full flex-col items-start gap-2">
                    {selectedCursorFlows.map((flow, index) => (
                      <div key={index} className="flex w-full items-center gap-2">
                        <SubframeCore.Icon
                          className="text-body font-body text-success-500"
                          name="FeatherCheck"
                        />
                        <span className="text-body font-body text-default-font">
                          {flow}
                        </span>
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
            >
              Cancel
            </Button>
            <Button 
              onClick={() => {
                // Here you would add the logic to save the new audience
                console.log("Creating audience:", {
                  name: audienceName,
                  cursorFlows: selectedCursorFlows
                });
                handleCloseDialog();
              }}
              disabled={!audienceName.trim()}
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