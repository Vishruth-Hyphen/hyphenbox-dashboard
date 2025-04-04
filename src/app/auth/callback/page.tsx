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
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("[AUTH] Error processing callback:", error.message);
          return;
        }
        
        if (!session) {
          // The hash hasn't been processed yet, let's wait a moment
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // Check again
          const { data: { session: refreshedSession } } = await supabase.auth.getSession();
          if (!refreshedSession) {
            console.error("[AUTH] Session not established after callback");
            router.push('/auth/login');
            return;
          }
        }
        
        // Explicitly refresh the session to ensure tokens are saved to storage/cookies
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("[AUTH] Error refreshing session:", refreshError.message);
        }

        // Redirect to dashboard after ensuring session is saved
        router.push('/dashboard');
      } catch (err) {
        console.error("[AUTH] Unexpected error in callback:", err);
        router.push('/auth/login');
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