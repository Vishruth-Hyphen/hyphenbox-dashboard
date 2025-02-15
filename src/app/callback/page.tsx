'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect, useState } from 'react'

const EXTENSION_ID = 'ekfinbcodknildblemddmhgmbkdgdmok'
declare const chrome: any;

export default function AuthPage() {
  const supabase = createClientComponentClient()
  const [origin, setOrigin] = useState('')
  const [extensionStatus, setExtensionStatus] = useState<string | null>(null)

  useEffect(() => {
    async function handleAuth() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session) {
        // Only try to connect to extension after successful auth
        if (chrome?.runtime?.connect) {
          try {
            const port = chrome.runtime.connect(EXTENSION_ID);
            let messageSent = false;  // Flag to ensure we only send once
            
            port.onMessage.addListener((response: any) => {
              if (response.success && !messageSent) {
                messageSent = true;
                // Send session data along with SIGN_IN_SUCCESS
                port.postMessage({ 
                  type: 'SIGN_IN_SUCCESS',
                  userData: {
                    userId: session.user.id,
                    email: session.user.email,
                    accessToken: session.access_token
                  }
                });
                
                // Close the window after successful message send
                setTimeout(() => {
                  window.close();
                }, 1000); // Small delay to ensure message is sent
              }
            });

            port.postMessage({ type: 'PING' });

            port.onDisconnect.addListener(() => {
              setExtensionStatus('Extension not found. Please install it first.');
            });
          } catch (error) {
            setExtensionStatus('Extension not found. Please install it first.');
          }
        } else {
          setExtensionStatus('Please use Chrome browser with our extension installed');
        }
      }
    }

    handleAuth();
    setOrigin(window.location.origin)
  }, [])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      {extensionStatus && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {extensionStatus}
        </div>
      )}
      <div className="w-full max-w-sm">
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google']}
          redirectTo={origin ? `${origin}/callback` : undefined}
          theme="dark"
          showLinks={false}
          view="sign_in"
        />
      </div>
    </div>
  )
}