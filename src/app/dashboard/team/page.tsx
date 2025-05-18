"use client";

import React, { useState, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import * as SubframeCore from "@subframe/core";
import { TextField } from "@/ui/components/TextField";
import { Button } from "@/ui/components/Button";
import { Table } from "@/ui/components/Table";
import { Badge } from "@/ui/components/Badge";
import { Avatar } from "@/ui/components/Avatar";
import { IconButton } from "@/ui/components/IconButton";
import { useAuth } from "@/hooks/useAuth";
import { useOrganization } from '@/hooks/useAuth';
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { Breadcrumbs } from "@/ui/components/Breadcrumbs";
import { DialogLayout } from "@/ui/layouts/DialogLayout";

type Invitation = {
  id: string;
  email: string;
  name?: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  inviter: {
    email: string;
    name?: string;
  } | null;
};

// Component that uses searchParams 
function TeamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  const { currentOrgId, currentOrgName } = useOrganization();
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Function to load team invitations
  const loadInvitations = useCallback(async () => {
    if (!currentOrgId) return;
    
    setLoading(true);
    try {
      // Fetch invitations from TeamInvitations table
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          id, 
          email,
          name, 
          status, 
          created_at,
          created_by
        `)
        .eq('organization_id', currentOrgId);
      
      if (error) throw error;
      
      // Get inviter details
      const invitationsWithInviters = await Promise.all(
        (data || []).map(async (invitation) => {
          if (!invitation.created_by) {
            return {
              ...invitation,
              inviter: null
            };
          }
          
          // Fetch inviter info
          const { data: userData, error: userError } = await supabase
            .from('user_profiles')
            .select('email, name')
            .eq('id', invitation.created_by)
            .single();
          
          return {
            ...invitation,
            inviter: userError ? null : userData
          };
        })
      );
      
      setInvitations(invitationsWithInviters);
      
    } catch (err) {
      console.error('Error loading invitations:', err);
      setError('Failed to load team invitations');
    } finally {
      setLoading(false);
    }
  }, [currentOrgId]);

  // Load invitations when organizationId is available
  useEffect(() => {
    if (currentOrgId) {
      loadInvitations();
    }
  }, [currentOrgId, loadInvitations]);

  // Function to send invitation
  const sendInvite = async () => {
    if (!inviteEmail.trim() || !currentOrgId || !session?.user?.id) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Use the server API endpoint instead of directly using Supabase
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/dashboard/team/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          name: inviteName.trim(),
          organizationId: currentOrgId,
          userId: session.user.id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }
      
      // Reset and reload
      setInviteEmail('');
      setInviteName('');
      setIsModalOpen(false);
      await loadInvitations();
      
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form when modal opens/closes
  const handleModalOpenChange = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setInviteEmail('');
      setInviteName('');
      setError(null);
    }
  };

  // Function to cancel/delete an invitation
  const cancelInvitation = async (invitationId: string) => {
    try {
      const { error } = await supabase
        .from('team_invitations')
        .delete()
        .eq('id', invitationId);
      
      if (error) throw error;
      
      // Reload invitations
      await loadInvitations();
      
    } catch (err) {
      console.error('Error canceling invitation:', err);
      setError('Failed to cancel invitation');
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
      <div className="container mx-auto flex h-full w-full flex-col items-start gap-8 px-4 py-12 md:px-6 lg:px-8">
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
          
          {/* Show org name for super admins */}
          {session?.user?.is_super_admin && currentOrgName && (
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
          )}
        </div>
        
        <div className="flex w-full flex-col items-start gap-6">
          {error && (
            <div className="w-full p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}
          
          <div className="flex w-full items-end justify-end gap-4">
            <Button
              icon="FeatherUserPlus"
              onClick={() => setIsModalOpen(true)}
            >
              Invite Team Member
            </Button>
          </div>
          
          <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-2 border-t border-solid border-neutral-border pt-0.5">
            {loading ? (
              <div className="py-4 text-center w-full">Loading invitations...</div>
            ) : (
              <Table
                header={
                  <Table.HeaderRow>
                    <Table.HeaderCell>Name</Table.HeaderCell>
                    <Table.HeaderCell>Status</Table.HeaderCell>
                    <Table.HeaderCell>Email</Table.HeaderCell>
                    <Table.HeaderCell>Date</Table.HeaderCell>
                    <Table.HeaderCell />
                  </Table.HeaderRow>
                }
              >
                {invitations.length === 0 ? (
                  <Table.Row>
                    <Table.Cell colSpan={5} className="text-center py-8">
                      No invitations found. Invite your first team member!
                    </Table.Cell>
                  </Table.Row>
                ) : (
                  invitations.map((invitation) => (
                    <Table.Row key={invitation.id}>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-body-bold font-body-bold text-neutral-700">
                          {invitation.name || 'No name provided'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <Badge 
                          variant={
                            invitation.status === 'accepted' ? 'success' : 
                            invitation.status === 'expired' ? 'error' : 'warning'
                          }
                        >
                          {invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}
                        </Badge>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-body font-body text-neutral-500">
                          {invitation.email}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="whitespace-nowrap text-body font-body text-neutral-500">
                          {invitation.created_at ? format(new Date(invitation.created_at), 'MM/dd/yyyy') : '-'}
                        </span>
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex grow shrink-0 basis-0 items-center justify-end">
                          {invitation.status === 'pending' && (
                            <IconButton
                              variant="destructive-tertiary"
                              icon="FeatherTrash"
                              onClick={() => cancelInvitation(invitation.id)}
                            />
                          )}
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  ))
                )}
              </Table>
            )}
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <DialogLayout open={isModalOpen} onOpenChange={handleModalOpenChange}>
        <div className="flex h-full w-full flex-col items-start gap-6 px-6 py-6">
          <div className="flex w-full items-start justify-between">
            <div className="flex grow shrink-0 basis-0 flex-col items-start gap-1">
              <span className="text-heading-3 font-heading-3 text-default-font">
                Invite Team Member
              </span>
              <span className="text-body font-body text-subtext-color">
                Send an invitation to join your team workspace
              </span>
            </div>
            <SubframeCore.Icon
              className="text-body font-body text-neutral-500 cursor-pointer"
              name="FeatherX"
              onClick={() => setIsModalOpen(false)}
            />
          </div>
          {error && (
            <div className="w-full p-3 bg-red-50 text-red-600 rounded-md">
              {error}
            </div>
          )}
          <div className="flex w-full flex-col items-start gap-6">
            <TextField className="h-auto w-full flex-none" label="Name" helpText="">
              <TextField.Input
                placeholder="e.g. John Doe"
                value={inviteName}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setInviteName(event.target.value)}
              />
            </TextField>
            <TextField
              className="h-auto w-full flex-none"
              label="Email address"
              helpText=""
            >
              <TextField.Input
                placeholder="e.g. teammate@company.com"
                value={inviteEmail}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(event.target.value)}
              />
            </TextField>
          </div>
          <div className="flex w-full items-center justify-end gap-2">
            <Button
              variant="neutral-tertiary"
              onClick={() => setIsModalOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={sendInvite}
              disabled={isSubmitting || !inviteEmail.trim()}
            >
              {isSubmitting ? 'Sending...' : 'Send Invitation'}
            </Button>
          </div>
        </div>
      </DialogLayout>
    </>
  );
}

// Main component with Suspense boundary
export default function Team() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Loading team page...</div>}>
      <TeamContent />
    </Suspense>
  );
}