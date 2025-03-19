"use client";

import React from "react";
import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import * as SubframeCore from "@subframe/core";
import { TextField } from "@/ui/components/TextField";
import { Button } from "@/ui/components/Button";
import { Table } from "@/ui/components/Table";
import { Badge } from "@/ui/components/Badge";
import { Avatar } from "@/ui/components/Avatar";
import { IconButton } from "@/ui/components/IconButton";

function Team() {
  return (
    <InviteTeamMembers>
      <div className="container max-w-none flex h-full w-full flex-col items-start gap-4 bg-default-background py-12">
        <div className="flex w-full flex-wrap items-center gap-2 mobile:flex-row mobile:flex-wrap mobile:gap-4">
          <div className="flex grow shrink-0 basis-0 items-center gap-2">
            <SubframeCore.Icon
              className="text-heading-2 font-heading-2 text-brand-600"
              name="FeatherUserPlus"
            />
            <span className="text-heading-2 font-heading-2 text-default-font">
              Invite Team Members
            </span>
          </div>
        </div>
        <div className="flex w-full flex-col items-start gap-6">
          <div className="flex w-full items-end gap-4">
            <TextField className="flex-1" label="Email address" helpText="">
              <TextField.Input
                placeholder="Enter team member's email"
                value=""
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {}}
              />
            </TextField>
            <Button
              icon="FeatherUserPlus"
              onClick={(event: React.MouseEvent<HTMLButtonElement>) => {}}
            >
              Send Invite
            </Button>
          </div>
          <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-2 border-t border-solid border-neutral-border pt-0.5">
            <Table
              header={
                <Table.HeaderRow>
                  <Table.HeaderCell>Email</Table.HeaderCell>
                  <Table.HeaderCell>Status</Table.HeaderCell>
                  <Table.HeaderCell>Invited by</Table.HeaderCell>
                  <Table.HeaderCell>Date</Table.HeaderCell>
                  <Table.HeaderCell />
                </Table.HeaderRow>
              }
            >
              <Table.Row>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    sarah.smith@example.com
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="warning">Pending</Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Avatar
                      size="small"
                      image="https://res.cloudinary.com/subframe/image/upload/v1711417513/shared/kwut7rhuyivweg8tmyzl.jpg"
                    >
                      IT
                    </Avatar>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      Irvin Thompson
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    7/4/2024
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex grow shrink-0 basis-0 items-center justify-end">
                    <IconButton
                      variant="destructive-tertiary"
                      icon="FeatherTrash"
                      onClick={(
                        event: React.MouseEvent<HTMLButtonElement>
                      ) => {}}
                    />
                  </div>
                </Table.Cell>
              </Table.Row>
              <Table.Row>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                    james.wilson@example.com
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <Badge variant="success">Accepted</Badge>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex items-center gap-2">
                    <Avatar
                      size="small"
                      image="https://res.cloudinary.com/subframe/image/upload/v1711417513/shared/kwut7rhuyivweg8tmyzl.jpg"
                    >
                      IT
                    </Avatar>
                    <span className="whitespace-nowrap text-body font-body text-neutral-500">
                      Irvin Thompson
                    </span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <span className="whitespace-nowrap text-body font-body text-neutral-500">
                    7/4/2024
                  </span>
                </Table.Cell>
                <Table.Cell>
                  <div className="flex grow shrink-0 basis-0 items-center justify-end">
                    <IconButton
                      variant="destructive-tertiary"
                      icon="FeatherTrash"
                      onClick={(
                        event: React.MouseEvent<HTMLButtonElement>
                      ) => {}}
                    />
                  </div>
                </Table.Cell>
              </Table.Row>
            </Table>
          </div>
        </div>
      </div>
    </InviteTeamMembers>
  );
}

export default Team;