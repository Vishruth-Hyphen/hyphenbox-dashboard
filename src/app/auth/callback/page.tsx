// @ts-nocheck
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.error("CRITICAL: NEXT_PUBLIC_API_URL is not defined. API calls will fail.");
}

// Helper function to exchange Supabase token for hyphenbox_api_token and send to extension
async function exchangeAndSendTokenToExtension(accessToken, flowType = "NormalFlow") {
  if (!accessToken) {
    console.warn(`[AUTH_CALLBACK] ${flowType}: No access token provided for exchange.`);
    return false;
  }
  try {
    if (!API_BASE_URL) {
      console.error(`[AUTH_CALLBACK] ${flowType}: API base URL not configured`);
      return false;
    }
    
    console.log(`[AUTH_CALLBACK] ${flowType}: Starting token exchange with API URL: ${API_BASE_URL}`);
    const response = await fetch(`${API_BASE_URL}/api/auth/exchange-supabase-token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ supabase_access_token: accessToken }),
    });

    console.log(`[AUTH_CALLBACK] ${flowType}: Token exchange response status: ${response.status}`);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error(`[AUTH_CALLBACK] ${flowType}: Error exchanging token:`, errorData.error || response.statusText);
      return false;
    }

    const { hyphenbox_api_token } = await response.json();
    if (hyphenbox_api_token) {
      console.log(`[AUTH_CALLBACK] ${flowType}: Received hyphenbox_api_token, attempting to send to extension...`);
      if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
        const EXTENSION_ID = process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID; // Use environment variable for extension ID
        console.log(`[AUTH_CALLBACK] ${flowType}: Sending token to extension ID: ${EXTENSION_ID}`);
        // Return a promise that resolves based on sendMessage callback
        return new Promise((resolve) => {
          chrome.runtime.sendMessage(EXTENSION_ID, { type: 'SET_AUTH_TOKEN', token: hyphenbox_api_token }, (crxResponse) => {
            if (chrome.runtime.lastError) {
              console.error(`[AUTH_CALLBACK] ${flowType}: Error sending token to extension:`, chrome.runtime.lastError.message);
              resolve(false);
            } else if (crxResponse && crxResponse.success) {
              console.log(`[AUTH_CALLBACK] ${flowType}: Token successfully sent to extension.`);
              resolve(true);
            } else {
              console.warn(`[AUTH_CALLBACK] ${flowType}: Extension acknowledged but no success or no response handler:`, crxResponse);
              resolve(false); // Or true if ack is enough, depending on desired behavior
            }
          });
        });
      } else {
        console.warn(`[AUTH_CALLBACK] ${flowType}: chrome.runtime.sendMessage not available. Cannot send token.`);
        return false;
      }
    } else {
      console.warn(`[AUTH_CALLBACK] ${flowType}: hyphenbox_api_token not found in backend response.`);
      return false;
    }
  } catch (exchangeError) {
    console.error(`[AUTH_CALLBACK] ${flowType}: Network or other error during token exchange:`, exchangeError);
    return false;
  }
}



// Minimal Callback Component
function CallbackContent() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const source = urlParams.get('source');

        const { data: { session: initialSession }, error: initialSessionError } = await supabase.auth.getSession();

        if (initialSessionError) {
          console.error("[AUTH_CALLBACK] Error getting initial session:", initialSessionError.message);
          router.push('/auth/login?error=session_error_initial');
          return;
        }
        
        let currentSession = initialSession;

        // Fast path for extension login if user is already logged into the dashboard
        if (source === 'extension_login' && currentSession?.access_token) {
          console.log("[AUTH_CALLBACK] Extension login detected with existing dashboard session.");
          await exchangeAndSendTokenToExtension(currentSession.access_token, "ExtensionFastPath");
          // Regardless of token sending success, close the tab for this specific flow.
          // The user initiated this from the extension expecting a quick, non-interactive process.
          console.log("[AUTH_CALLBACK] ExtensionFastPath: Attempting to close tab.");
          window.close();
          return; // Stop further processing.
        }

        // --- Standard callback flow (e.g., after magic link, or if not an extension fast-path) ---
        if (!currentSession) {
          // Attempt to refresh or get session again, especially if coming from magic link
          const { data: { session: refreshedSessionData }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError && !refreshedSessionData) {
            const { data: { session: finalSessionCheck }, error: finalError } = await supabase.auth.getSession();
            if (finalError || !finalSessionCheck) {
              console.error("[AUTH_CALLBACK] StandardFlow: Session not established after all attempts.");
              router.push('/auth/login?error=no_session_final');
              return;
            }
            currentSession = finalSessionCheck;
          } else if (refreshedSessionData) {
            currentSession = refreshedSessionData;
          } else {
            console.error("[AUTH_CALLBACK] StandardFlow: Session not established (no data from refresh).");
            router.push('/auth/login?error=no_session_fallback');
            return;
          }
        }

        if (!currentSession?.access_token) {
          console.error("[AUTH_CALLBACK] StandardFlow: Critical - No session access_token.");
          router.push('/auth/login?error=session_token_missing');
          return;
        }

        // Handle new signup flow - check URL params and database for organization
        const orgIdFromUrl = urlParams.get('org_id');
        const isSignupFromUrl = urlParams.get('signup') === 'true';
        
        let isNewSignup = false;
        let membershipCreated = false;

        // Check if this is a signup flow with organization ID in URL
        if (isSignupFromUrl && orgIdFromUrl) {
          try {
            console.log('[AUTH_CALLBACK] Processing new signup with org_id:', orgIdFromUrl);
            
            // Verify the organization exists and belongs to this user's email
            const { data: organization, error: orgError } = await supabase
              .from('organizations')
              .select('id, name, billing_email')
              .eq('id', orgIdFromUrl)
              .eq('billing_email', currentSession.user.email)
              .single();

            if (orgError || !organization) {
              console.error('[AUTH_CALLBACK] Organization not found or email mismatch:', orgError);
              router.push('/auth/login?error=invalid_organization');
              return;
            }

            // Create organization membership for the user
            const { error: membershipError } = await supabase
              .from('organization_members')
              .insert({
                organization_id: organization.id,
                user_id: currentSession.user.id,
                role: 'admin' // Signup user becomes admin
              });

            if (membershipError && membershipError.code !== '23505') { // Ignore duplicate key error
              console.error('[AUTH_CALLBACK] Error creating membership:', membershipError);
              throw membershipError;
            }

            // Keep billing_email for reference - no need to clear it

            // Set the new organization as selected
            localStorage.setItem('selectedOrganizationId', organization.id);
            localStorage.setItem('selectedOrganizationName', organization.name);
            
            membershipCreated = true;
            isNewSignup = true;
            
            console.log(`[AUTH_CALLBACK] Successfully linked user to organization: ${organization.name}`);
            
          } catch (error) {
            console.error('[AUTH_CALLBACK] Error processing signup:', error);
            router.push('/auth/login?error=signup_processing_failed');
            return;
          }
        } else {
          // Fallback: Check for organization by billing_email (in case URL params are lost)
          if (currentSession?.user?.email) {
            const { data: pendingOrg, error: pendingOrgError } = await supabase
              .from('organizations')
              .select('id, name, billing_email')
              .eq('billing_email', currentSession.user.email)
              .maybeSingle();

            if (pendingOrg && !pendingOrgError) {
              console.log('[AUTH_CALLBACK] Found pending organization for user email, linking...');
              
              // Create organization membership
              const { error: membershipError } = await supabase
                .from('organization_members')
                .insert({
                  organization_id: pendingOrg.id,
                  user_id: currentSession.user.id,
                  role: 'admin'
                });

              if (membershipError && membershipError.code !== '23505') { // Ignore duplicate key error
                console.error('[AUTH_CALLBACK] Error creating membership:', membershipError);
              } else {
                // Keep billing_email for reference - no need to clear it

                // Set the organization as selected
                localStorage.setItem('selectedOrganizationId', pendingOrg.id);
                localStorage.setItem('selectedOrganizationName', pendingOrg.name);
                
                membershipCreated = true;
                isNewSignup = true;
                
                console.log(`[AUTH_CALLBACK] Successfully linked user to pending organization: ${pendingOrg.name}`);
              }
            }
          }
        }

        // Process existing invitation flow (for non-signup users)
        if (!membershipCreated && currentSession?.user?.email) {
          const userEmail = currentSession.user.email.toLowerCase().trim();
          const { data: invitations, error: invitationError } = await supabase
            .from('team_invitations')
            .select('id, organization_id')
            .ilike('email', userEmail)
            .eq('status', 'pending')
            .gt('expires_at', new Date().toISOString());

          if (invitationError) {
            console.error("[AUTH_CALLBACK] StandardFlow: Error fetching invitations:", invitationError.message);
          } else if (invitations && invitations.length > 0) {
            for (const invite of invitations) {
              const { error: membershipError } = await supabase
                .from('organization_members')
                .insert({
                  organization_id: invite.organization_id,
                  user_id: currentSession.user.id,
                  role: 'member'
                });
              if (membershipError) {
                console.error("[AUTH_CALLBACK] StandardFlow: Error creating membership:", membershipError.message);
                if (membershipError.code === '23505') membershipCreated = true; // Already a member
              } else {
                membershipCreated = true;
                await supabase.from('team_invitations').update({ status: 'accepted' }).eq('id', invite.id);
              }
            }
          }
          if (!membershipCreated) {
            const { data: existingMemberships } = await supabase
              .from('organization_members')
              .select('organization_id')
              .eq('user_id', currentSession.user.id);
            if (existingMemberships && existingMemberships.length > 0) {
              membershipCreated = true;
            }
          }
        }
        
        // Exchange token and redirect based on user type
        if (membershipCreated) {
          // Refresh session again to ensure all claims/data are up-to-date after potential membership changes
          const { data: { session: finalRefreshedSession }, error: finalRefreshError } = await supabase.auth.refreshSession();
          let sessionForTokenExchange = finalRefreshedSession || currentSession; // Use latest good session

          if (finalRefreshError && !finalRefreshedSession) {
            console.warn("[AUTH_CALLBACK] StandardFlow: Error on final refresh, using previous session for token exchange.", finalRefreshError.message);
          }
          
          if (sessionForTokenExchange?.access_token) {
            await exchangeAndSendTokenToExtension(sessionForTokenExchange.access_token, isNewSignup ? "NewSignup" : "StandardFlow_Membership");
          }
          
          await new Promise(resolve => setTimeout(resolve, 300)); // Short delay
          
          // Redirect based on whether this is a new signup
          if (isNewSignup) {
            router.push('/onboarding');
          } else {
            router.push('/dashboard');
          }
        } else {
          const isSuperAdmin = ['kushal@hyphenbox.com', 'mail2vishruth@gmail.com'].includes(currentSession?.user?.email || '');
          if (isSuperAdmin) {
            // Super admins might not have an org from invitations but should still get token for extension
            if (currentSession?.access_token) {
                 await exchangeAndSendTokenToExtension(currentSession.access_token, "StandardFlow_SuperAdmin");
            }
            router.push('/dashboard/organizations');
          } else {
            console.warn("[AUTH_CALLBACK] StandardFlow: User has no organization access and is not super admin.");
            router.push('/auth/login?error=no_organization_access');
          }
        }
      } catch (err) {
        console.error("[AUTH_CALLBACK] Unexpected error in main callback handler:", err);
        router.push('/auth/login?error=unexpected_error_main');
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