"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

// Minimal Callback Component
function CallbackContent() {
  const router = useRouter();

  useEffect(() => {
    // Explicitly handle the session from the URL
    const handleAuthCallback = async () => {
      try {
        // First, confirm we have a session
        let currentSession = null;
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AUTH] Error processing callback:", error.message);
          router.push('/auth/login?error=session_error');
          return;
        }
        
        if (!session) {
          // The hash hasn't been processed yet, let's wait a moment
          console.log("[AUTH] No session yet, waiting...");
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Check again
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          if (!refreshedSession) {
            console.error("[AUTH] Session not established after callback");
            router.push('/auth/login?error=no_session');
            return;
          }
          
          // Use the refreshed session
          currentSession = refreshedSession;
        } else {
          // Use the original session
          currentSession = session;
        }
        
        // Add explicit session stabilization delay
        console.log("[AUTH] Session found, stabilizing...");
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Explicitly refresh the session to ensure tokens are saved to storage/cookies
        console.log("[AUTH] Refreshing session tokens...");
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("[AUTH] Error refreshing session:", refreshError.message);
        }

        // Add a delay to ensure auth is fully established
        console.log("[AUTH] Waiting for auth to fully establish...");
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // ADDED: Check for pending invitations
        let membershipCreated = false;
        
        if (currentSession?.user?.email) {
          const userEmail = currentSession.user.email.toLowerCase().trim();
          console.log("[AUTH] Checking for pending invitations for:", userEmail);
          
          // Find pending invitations for this email - use case-insensitive comparison
          const { data: invitations, error: invitationError } = await supabase
            .from('team_invitations')
            .select('id, organization_id')
            .ilike('email', userEmail) // Use ilike for case-insensitive matching
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString());
          
          console.log("[AUTH-DEBUG] Invitation search result:", {
            email: userEmail,
            found: invitations ? invitations.length : 0,
            error: invitationError ? invitationError.message : null
          });
          
          if (invitationError) {
            console.error("[AUTH] Error fetching invitations:", invitationError.message);
          } else if (invitations && invitations.length > 0) {
            console.log("[AUTH] Found pending invitations:", invitations.length);
            
            // Process each invitation
            for (const invite of invitations) {
              // Create organization membership
              const { error: membershipError } = await supabase
                .from('organization_members')
                .insert({
                  organization_id: invite.organization_id,
                  user_id: currentSession.user.id,
                  role: 'member' // Default role
                });
              
              if (membershipError) {
                console.error("[AUTH] Error creating membership:", membershipError.message);
                
                // Check if error is due to duplicate - still count as success
                if (membershipError.code === '23505') { // Postgres unique violation
                  console.log("[AUTH] User already has membership for this organization");
                  membershipCreated = true;
                }
              } else {
                membershipCreated = true;
                
                // Update invitation status
                await supabase
                  .from('team_invitations')
                  .update({ status: 'accepted' })
                  .eq('id', invite.id);
                  
                console.log("[AUTH] Successfully processed invitation:", invite.id);
              }
            }
          }
          
          // If no invitations were found, check if user already has memberships
          if (!invitations || invitations.length === 0) {
            console.log("[AUTH] No pending invitations, checking existing memberships");
            
            const { data: existingMemberships } = await supabase
              .from('organization_members')
              .select('organization_id')
              .eq('user_id', currentSession.user.id);
              
            if (existingMemberships && existingMemberships.length > 0) {
              console.log("[AUTH] User already has organization memberships");
              membershipCreated = true;
            }
          }
        }
        
        // CRITICAL: Only redirect to dashboard if we confirmed membership exists
        if (membershipCreated) {
          console.log("[AUTH] Organization membership confirmed, redirecting to dashboard");
          router.push('/dashboard');
        } else {
          // Special case for super admins
          const isSuperAdmin = ['kushal@hyphenbox.com', 'mail2vishruth@gmail.com'].includes(currentSession?.user?.email || '');
          
          if (isSuperAdmin) {
            console.log("[AUTH] Super admin detected, redirecting to organizations");
            router.push('/dashboard/organizations');
          } else {
            console.log("[AUTH] No organization access, redirecting to login");
            router.push('/auth/login?error=no_organization_access');
          }
        }
      } catch (err) {
        console.error("[AUTH] Unexpected error in callback:", err);
        router.push('/auth/login?error=unexpected_error');
      }
    };

    handleAuthCallback();
  }, [router]);

  // Basic loading state
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
       <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="mb-6 text-2xl font-bold text-gray-800">Authentication</h2>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-gray-200">
             <div className="h-full animate-pulse rounded-full bg-brand-600"></div>
           </div>
          <p className="mb-2 text-lg font-medium text-gray-700">Finalizing login...</p>
           <p className="text-sm text-gray-500">
             Please wait, redirecting shortly...
          </p>
         </div>
       </div>
     </div>
  );
}

// Main component with Suspense boundary
export default function Callback() {
  // Return Suspense wrapper with CallbackContent
  return (
     React.createElement(React.Suspense, { fallback: 
       React.createElement("div", { className: "flex min-h-screen items-center justify-center" }, 
         React.createElement("div", { className: "text-center" }, 
           React.createElement("p", { className: "text-xl" }, "Loading authentication...")
         )
       )
     }, 
       React.createElement(CallbackContent, null)
     )
  );
}