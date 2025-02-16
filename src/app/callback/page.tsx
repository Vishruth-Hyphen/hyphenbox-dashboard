'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
declare const chrome: any;

function CallbackContent() {
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const extensionId = searchParams.get('extensionId')
  const [status, setStatus] = useState('Completing authentication...')

  useEffect(() => {
    let port: any = null;

    async function handleCallback() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error;
        
        if (session && extensionId) {
          try {
            // Connect to the extension
            port = chrome.runtime.connect(extensionId, { name: 'auth-connection' });
            
            // Send auth data to extension
            port.postMessage({ 
              type: 'SIGN_IN_SUCCESS',
              userData: {
                userId: session.user.id,
                email: session.user.email,
                accessToken: session.access_token,
                name: session.user.user_metadata?.full_name,
                avatar: session.user.user_metadata?.avatar_url,
                provider: session.user.app_metadata?.provider
              }
            });

            // Listen for response
            port.onMessage.addListener((response: any) => {
              console.log('Received response from extension:', response);
              if (response.success) {
                setStatus(`
                  Authentication successful! ✅
                  Click the extension icon in your toolbar to open VoxiGuide.
                `);
                // Optional: Don't auto-close, let user read the message
                // setTimeout(() => {
                //   try {
                //     window.close();
                //   } catch (e) {...}
                // }, 1000);
              } else {
                setStatus(`Authentication failed: ${response.error || 'Unknown error'}`);
              }
            });

            // Handle disconnection
            port.onDisconnect.addListener(() => {
              console.log('Port disconnected');
              if (chrome.runtime.lastError) {
                setStatus(`Connection error: ${chrome.runtime.lastError.message}`);
              }
            });

          } catch (error: any) {
            setStatus(`Failed to connect to extension: ${error.message}`);
            console.error('Extension connection error:', error);
          }
        } else {
          setStatus('Authentication failed: No session or extension ID');
        }
      } catch (error: any) {
        setStatus(`Authentication error: ${error.message}`);
        console.error('Auth error:', error);
      }
    }

    handleCallback();

    // Cleanup
    return () => {
      if (port) {
        port.disconnect();
      }
    };
  }, [extensionId, supabase.auth]);

  return (
    <div className="text-center">
      <p className="text-lg">{status}</p>
    </div>
  );
}

export default function CallbackPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Suspense fallback={<div>Loading...</div>}>
        <CallbackContent />
      </Suspense>
    </div>
  )
}