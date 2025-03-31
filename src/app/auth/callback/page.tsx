"use client";

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Same list as in AuthContext - keep these in sync
const SUPER_ADMIN_EMAILS = ['kushal@hyphenbox.com', 'mail2vishruth@gmail.com']; // Add your cofounder's email if needed

// Component that uses searchParams
function CallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log(`[CALLBACK] Auth callback starting, retrieving session`);
        
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        if (!session) {
          // No session, redirect to login
          console.log(`[CALLBACK] No session found, redirecting to login`);
          router.push('/auth/login');
          return;
        }
        
        // Get the email from the session
        const userEmail = session.user.email || '';
        const userId = session.user.id;
        console.log(`[CALLBACK] Auth callback processing for email: ${userEmail}, user ID: ${userId}`);
        
        // 1. First priority: Check if this is a super admin
        if (SUPER_ADMIN_EMAILS.includes(userEmail)) {
          console.log(`[CALLBACK] Super admin detected: ${userEmail}`);
          router.push('/dashboard/organizations');
          return;
        }
        
        // 2. Check for pending invitations for this user's email
        console.log(`[CALLBACK] Checking for pending invitations for email: ${userEmail}`);
        const { data: pendingInvites, error: invitesError } = await supabase
          .from('team_invitations')
          .select('id, organization_id, status, created_at')
          .eq('email', userEmail)
          .eq('status', 'pending');
          
        if (invitesError) {
          console.error(`[CALLBACK] Error fetching invitations: ${invitesError.message}`);
        }
        
        if (pendingInvites && pendingInvites.length > 0) {
          console.log(`[CALLBACK] Found ${pendingInvites.length} pending invitations`);
          
          // Process each invitation by creating organization_members records
          for (const invite of pendingInvites) {
            console.log(`[CALLBACK] Processing invitation for organization: ${invite.organization_id}`);
            
            // Check if membership already exists
            const { data: existingMembership } = await supabase
              .from('organization_members')
              .select('id')
              .eq('user_id', userId)
              .eq('organization_id', invite.organization_id)
              .maybeSingle();
              
            if (!existingMembership) {
              // Create organization membership record
              console.log(`[CALLBACK] Creating organization_members record for user: ${userId}, organization: ${invite.organization_id}`);
              const { error: membershipError } = await supabase
                .from('organization_members')
                .insert({
                  user_id: userId,
                  organization_id: invite.organization_id,
                  role: 'member'
                });
                
              if (membershipError) {
                console.error(`[CALLBACK] Error creating membership: ${membershipError.message}`);
              }
            } else {
              console.log(`[CALLBACK] Membership already exists for this organization`);
            }
            
            // Mark invitation as accepted
            console.log(`[CALLBACK] Marking invitation ${invite.id} as accepted`);
            await supabase
              .from('team_invitations')
              .update({ status: 'accepted' })
              .eq('id', invite.id);
          }
          
          // Get the organization we should redirect to (most recent invitation)
          const mostRecentInvite = pendingInvites.sort((a, b) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )[0];
          
          console.log(`[CALLBACK] Setting selected organization: ${mostRecentInvite.organization_id}`);
          localStorage.setItem('selectedOrganizationId', mostRecentInvite.organization_id);
          
          // Redirect to dashboard
          console.log(`[CALLBACK] Redirecting to dashboard with processed invitations`);
          router.push('/dashboard/cursorflows');
          return;
        }
        
        // 3. Check if user has any organization memberships
        console.log(`[CALLBACK] Checking for existing organization memberships`);
        const { data: memberships } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', userId);
          
        if (memberships && memberships.length > 0) {
          console.log(`[CALLBACK] Found ${memberships.length} organization memberships`);
          
          // If user has just one organization, set it as selected
          if (memberships.length === 1) {
            console.log(`[CALLBACK] Setting single organization as selected: ${memberships[0].organization_id}`);
            localStorage.setItem('selectedOrganizationId', memberships[0].organization_id);
          } 
          // If user has multiple organizations, check if one is already selected
          else if (memberships.length > 1) {
            const selectedOrgId = localStorage.getItem('selectedOrganizationId');
            if (!selectedOrgId || !memberships.some(m => m.organization_id === selectedOrgId)) {
              // Set first org as selected if none is selected or selected org is not in memberships
              console.log(`[CALLBACK] Setting first organization as selected: ${memberships[0].organization_id}`);
              localStorage.setItem('selectedOrganizationId', memberships[0].organization_id);
            }
          }
          
          console.log(`[CALLBACK] Redirecting to dashboard with existing memberships`);
          router.push('/dashboard/cursorflows');
          return;
        }
        
        // 4. No organization association found
        console.log('[CALLBACK] No organization found for user');
        router.push('/auth/login?error=no_organization');
      } catch (error) {
        console.error('Error during auth callback:', error);
        router.push('/auth/login');
      }
    };

    handleCallback();
  }, [router, searchParams]);

  return <div className="flex h-screen items-center justify-center">
    <div className="text-center">
      <h2 className="text-xl font-semibold mb-4">Processing your login...</h2>
      <p className="text-gray-500">Please wait while we set up your workspace.</p>
    </div>
  </div>;
}

// Main component with Suspense boundary
export default function Callback() {
  return (
    <Suspense fallback={<div className="p-12 text-center">Processing authentication...</div>}>
      <CallbackContent />
    </Suspense>
  );
}