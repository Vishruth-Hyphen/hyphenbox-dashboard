'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
declare const chrome: any;
export default function CallbackPage() {
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  const extensionId = searchParams.get('extensionId')
  const [status, setStatus] = useState('Completing authentication...')

  useEffect(() => {
    async function handleCallback() {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (session && extensionId) {
        try {
          // Connect to the extension
          const port = chrome.runtime.connect(extensionId)
          
          // Send auth data to extension
          port.postMessage({ 
            type: 'SIGN_IN_SUCCESS',
            userData: {
              userId: session.user.id,
              email: session.user.email,
              accessToken: session.access_token
            }
          })

          // Close this tab after a brief delay
          setTimeout(() => {
            window.close()
          }, 1000)

          setStatus('Authentication successful! This window will close automatically...')
        } catch (error) {
          setStatus('Failed to connect to extension. Please ensure it is installed.')
        }
      } else {
        setStatus('Authentication failed. Please try again.')
      }
    }

    handleCallback()
  }, [extensionId])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="text-center">
        <p className="text-lg">{status}</p>
      </div>
    </div>
  )
}