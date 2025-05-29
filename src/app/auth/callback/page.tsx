// @ts-nocheck
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
        
        // Explicitly refresh the session to ensure tokens are saved to storage/cookies
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("[AUTH] Error refreshing session:", refreshError.message);
        }

        // ADDED: Check for pending invitations
        let membershipCreated = false;
        
        if (currentSession?.user?.email) {
          const userEmail = currentSession.user.email.toLowerCase().trim();
          
          // Find pending invitations for this email - use case-insensitive comparison
          const { data: invitations, error: invitationError } = await supabase
            .from('team_invitations')
            .select('id, organization_id')
            .ilike('email', userEmail) // Use ilike for case-insensitive matching
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString());
          
          if (invitationError) {
            console.error("[AUTH] Error fetching invitations:", invitationError.message);
          } else if (invitations && invitations.length > 0) {
            
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
                  membershipCreated = true;
                }
              } else {
                membershipCreated = true;
                
                // Update invitation status
                await supabase
                  .from('team_invitations')
                  .update({ status: 'accepted' })
                  .eq('id', invite.id);
              }
            }
          }
          
          // If no invitations were found, check if user already has memberships
          if (!invitations || invitations.length === 0) {
            
            const { data: existingMemberships } = await supabase
              .from('organization_members')
              .select('organization_id')
              .eq('user_id', currentSession.user.id);
              
            if (existingMemberships && existingMemberships.length > 0) {
              membershipCreated = true;
            }
          }
        }
        
        // After membership creation
        if (membershipCreated) {
          await supabase.auth.refreshSession();
          const { data: { session: refreshedSessionAgain } } = await supabase.auth.getSession();

          if (refreshedSessionAgain?.access_token) {
            try {
              const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_URL}/api/auth/exchange-supabase-token`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ supabase_access_token: refreshedSessionAgain.access_token }),
              });

              if (!response.ok) {
                const errorData = await response.json();
                console.error("[AUTH_CALLBACK] Error exchanging Supabase token for hyphenbox_api_token:", errorData.error || response.statusText);
                // Decide how to handle this error - e.g., redirect to login with an error, or proceed without extension token
              } else {
                const { hyphenbox_api_token } = await response.json();
                if (hyphenbox_api_token) {
                  console.log("[AUTH_CALLBACK] Received hyphenbox_api_token.");
                  // Send to Chrome Extension
                  if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
                    const EXTENSION_ID = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID || 'lpnoadkciihfokjnmijpjhbffbpkgjol'; // Use provided ID
                    chrome.runtime.sendMessage(EXTENSION_ID, { type: 'SET_AUTH_TOKEN', token: hyphenbox_api_token }, (crxResponse) => {
                      if (chrome.runtime.lastError) {
                        console.warn("[AUTH_CALLBACK] Error sending token to extension:", chrome.runtime.lastError.message, "Is the extension installed and active? Extension ID used:", EXTENSION_ID);
                        // Potentially inform the user or log this for analytics
                      } else if (crxResponse && crxResponse.success) {
                        console.log("[AUTH_CALLBACK] Token successfully sent to extension.");
                      } else {
                        console.warn("[AUTH_CALLBACK] Extension acknowledged receipt, but did not report success (or no response handler):", crxResponse);
                      }
                    });
                  } else {
                    console.warn("[AUTH_CALLBACK] chrome.runtime.sendMessage not available. Cannot send token to extension. Running outside of an environment with extension communication capabilities or extension not installed.");
                  }
                } else {
                  console.warn("[AUTH_CALLBACK] hyphenbox_api_token not found in backend response.");
                }
              }
            } catch (exchangeError) {
              console.error("[AUTH_CALLBACK] Network or other error during token exchange:", exchangeError);
              // Handle this error appropriately
            }
          }

          await new Promise(resolve => setTimeout(resolve, 1000));
          router.push('/dashboard');
        } else {
          // Special case for super admins
          const isSuperAdmin = ['kushal@hyphenbox.com', 'mail2vishruth@gmail.com'].includes(currentSession?.user?.email || '');
          
          if (isSuperAdmin) {
            router.push('/dashboard/organizations');
          } else {
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