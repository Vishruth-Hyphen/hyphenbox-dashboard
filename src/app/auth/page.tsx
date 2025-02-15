'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useEffect, useState } from 'react'

export default function AuthPage() {
  const supabase = createClientComponentClient()
  const [extensionId, setExtensionId] = useState('')

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
            redirectTo={`${window.location.origin}/callback?extensionId=${extensionId}`}
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