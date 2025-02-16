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
    async function handleCallback() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error;
        
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

            // Wait for confirmation from extension before closing
            port.onMessage.addListener((response: any) => {
              if (response.success) {
                window.close()
              } else {
                setStatus('Failed to authenticate with extension.')
              }
            })
          } catch (error) {
            setStatus('Failed to connect to extension. Please ensure it is installed.')
            console.error('Extension connection error:', error)
          }
        } else {
          setStatus('Authentication failed. Please try again.')
        }
      } catch (error) {
        setStatus('Authentication error. Please try again.')
        console.error('Auth error:', error)
      }
    }

    handleCallback()
  }, [extensionId, supabase.auth])

  return (
    <div className="text-center">
      <p className="text-lg">{status}</p>
    </div>
  )
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