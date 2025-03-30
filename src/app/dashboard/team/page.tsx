"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import * as SubframeCore from "@subframe/core";
import { TextField } from "@/ui/components/TextField";
import { Button } from "@/ui/components/Button";
import { Table } from "@/ui/components/Table";
import { Badge } from "@/ui/components/Badge";
import { Avatar } from "@/ui/components/Avatar";
import { IconButton } from "@/ui/components/IconButton";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { format } from "date-fns";

type Invitation = {
  id: string;
  email: string;
  status: 'pending' | 'accepted' | 'expired';
  created_at: string;
  inviter: {
    email: string;
    name?: string;
  } | null;
};

function Team() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { session } = useAuth();
  
  const [inviteEmail, setInviteEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get organization ID using the same approach as in cursorflows page
  const getOrganizationId = () => {
    // Check URL params first (used when super admin selects an org)
    const orgFromUrl = searchParams.get('org');
    if (orgFromUrl) return orgFromUrl;
    
    // For regular users, use their selected organization from session
    if (session?.selectedOrganizationId) return session.selectedOrganizationId;
    
    // Check localStorage for selectedOrganizationId
    try {
      const savedOrgId = localStorage.getItem('selectedOrganizationId');
      if (savedOrgId) return savedOrgId;
    } catch (e) {
      console.error('Error reading selectedOrganizationId from localStorage:', e);
    }
    
    // For super admin, check localStorage for previously selected org
    if (session?.user?.is_super_admin) {
      try {
        const savedOrg = localStorage.getItem('selectedOrganization');
        if (savedOrg) {
          const parsedOrg = JSON.parse(savedOrg);
          return parsedOrg.id;
        }
      } catch (e) {
        console.error('Error reading selected organization from localStorage:', e);
      }
    }
    
    // If all else fails, redirect to org selection for super admin
    if (session?.user?.is_super_admin) {
      router.push('/dashboard/organizations');
      return null;
    }
    
    return null;
  };
  
  const [organizationId, setOrganizationId] = useState<string | null>(null);
  const [organizationName, setOrganizationName] = useState<string | null>(null);

  // Set up organization ID on component mount and when session changes
  useEffect(() => {
    const orgId = getOrganizationId();
    setOrganizationId(orgId);
    
    // Try to get org name for super admin
    if (session?.user?.is_super_admin) {
      try {
        const savedOrg = localStorage.getItem('selectedOrganization');
        if (savedOrg) {
          const parsedOrg = JSON.parse(savedOrg);
          setOrganizationName(parsedOrg.name);
        }
      } catch (e) {
        console.error('Error reading organization name:', e);
      }
    }
  }, [session, searchParams]);

  // Load invitations when organizationId is available
  useEffect(() => {
    if (organizationId) {
      loadInvitations();
    }
  }, [organizationId]);

  // Function to load team invitations
  const loadInvitations = async () => {
    if (!organizationId) return;
    
    setLoading(true);
    try {
      // Fetch invitations from TeamInvitations table
      const { data, error } = await supabase
        .from('team_invitations')
        .select(`
          id, 
          email, 
          status, 
          created_at,
          created_by
        `)
        .eq('organization_id', organizationId);
      
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
  };

  // Function to send invitation
  const sendInvite = async () => {
    if (!inviteEmail.trim() || !organizationId || !session?.user?.id) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // Use the server API endpoint instead of directly using Supabase
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/team/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: inviteEmail.trim(),
          organizationId,
          userId: session.user.id
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send invitation');
      }
      
      // Reset and reload
      setInviteEmail('');
      await loadInvitations();
      
    } catch (err) {
      console.error('Error sending invitation:', err);
      setError(err instanceof Error ? err.message : 'Failed to send invitation. Please try again.');
    } finally {
      setIsSubmitting(false);
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
  if (!organizationId) {
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
          
          {/* Show org name for super admins */}
          {session?.user?.is_super_admin && organizationName && (
            <div className="flex items-center">
              <Badge variant="neutral">Organization: {organizationName}</Badge>
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
          
          <div className="flex w-full items-end gap-4">
            <TextField className="flex-1" label="Email address" helpText="">
              <TextField.Input
                placeholder="Enter team member's email"
                value={inviteEmail}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => 
                  setInviteEmail(event.target.value)
                }
              />
            </TextField>
            <Button
              icon="FeatherUserPlus"
              onClick={sendInvite}
              disabled={isSubmitting || !inviteEmail.trim()}
            >
              {isSubmitting ? 'Sending...' : 'Send Invite'}
            </Button>
          </div>
          
          <div className="flex w-full grow shrink-0 basis-0 flex-col items-start gap-2 border-t border-solid border-neutral-border pt-0.5">
            {loading ? (
              <div className="py-4 text-center w-full">Loading invitations...</div>
            ) : (
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
                          {invitation.email}
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
                        <div className="flex items-center gap-2">
                          <Avatar size="small">
                            {invitation.inviter?.name?.charAt(0) || invitation.inviter?.email?.charAt(0) || '?'}
                          </Avatar>
                          <span className="whitespace-nowrap text-body font-body text-neutral-500">
                            {invitation.inviter?.name || invitation.inviter?.email || 'Unknown'}
                          </span>
                        </div>
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
    </InviteTeamMembers>
  );
}

export default Team;