'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AuthPage() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [extensionId, setExtensionId] = useState('')

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
      process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
      'http://localhost:3000'
    
    // Make sure to include `https://` when not localhost.
    url = url.includes('localhost') ? url : url.startsWith('http') ? url : `https://${url}`
    // Make sure to NOT include a trailing `/` for the callback
    url = url.endsWith('/') ? url.slice(0, -1) : url
    
    return url
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-4">
        <div className="rounded-lg border border-gray-700 bg-gray-800 p-4">
          <label className="block text-sm text-gray-300">Extension ID</label>
          <input
            type="text"
            value={extensionId}
            onChange={(e) => setExtensionId(e.target.value)}
            placeholder="Enter your extension ID"
            className="mt-1 w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 text-white placeholder-gray-400"
          />
        </div>
        
        {extensionId && (
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={['google']}
            redirectTo={`${getURL()}/callback?extensionId=${extensionId}`}
            theme="dark"
            showLinks={false}
            view="sign_in"
            onlyThirdPartyProviders
          />
        )}
      </div>
    </div>
  )
}