"use client";

import React, { useState } from "react";
import { LinkButton } from "@/subframe/components/LinkButton";
import { OAuthSocialButton } from "@/subframe/components/OAuthSocialButton";
import { TextField } from "@/subframe/components/TextField";
import { Button } from "@/subframe/components/Button";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useRouter } from 'next/navigation'

export default function AuthPageNew() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const [extensionId, setExtensionId] = useState('')

  const getURL = () => {
    let url =
      process?.env?.NEXT_PUBLIC_SITE_URL ??
      process?.env?.NEXT_PUBLIC_VERCEL_URL ??
      'http://localhost:3000'
    
    url = url.includes('localhost') ? url : url.startsWith('http') ? url : `https://${url}`
    url = url.endsWith('/') ? url.slice(0, -1) : url
    
    return url
  }

  const handleGoogleSignIn = async () => {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${getURL()}/callback?extensionId=${extensionId}`
      }
    })

    if (error) {
      console.error('Error:', error.message)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left Section */}
      <div className="flex w-1/2 flex-col items-center justify-center bg-neutral-800 p-12">
        <div className="flex w-full max-w-[448px] flex-col gap-12">
          <img
            className="h-12 w-40 flex-none object-cover invert"
            src="https://res.cloudinary.com/subframe/image/upload/v1739650070/uploads/6406/wmwmx6eg0id6tluw0lzk.png"
          />
          <div className="flex items-center gap-2">
            <span className="text-body font-body text-white">
              Trusted by Companies Backed by
            </span>
            <img
              className="w-36 flex-none"
              src="https://res.cloudinary.com/subframe/image/upload/v1740016904/uploads/6406/yhm18tmvuvwgcfm02vz3.svg"
            />
          </div>
        </div>
      </div>

      {/* Right Section */}
      <div className="flex w-1/2 flex-col items-center justify-center bg-white p-12">
        <div className="flex w-full max-w-[448px] flex-col items-start justify-center gap-8">
          <div className="flex w-full flex-col items-center justify-center gap-8">
            <div className="flex w-full flex-col items-start justify-center gap-2">
              <span className="text-heading-2 font-heading-2 text-default-font">
                Authenticate Yourself
              </span>
              <div className="flex flex-wrap items-start gap-1">
                <span className="text-body font-body text-subtext-color">
                  By continuing you agree to the
                </span>
                <LinkButton variant="brand" onClick={() => {}}>
                  Terms of Service
                </LinkButton>
                <span className="text-body font-body text-subtext-color">and</span>
                <LinkButton variant="brand" onClick={() => {}}>
                  Privacy Policy
                </LinkButton>
              </div>
            </div>

            <div className="flex w-full items-center gap-2">
              <div className="flex h-px grow shrink-0 basis-0 flex-col items-center gap-2 bg-neutral-border" />
              <span className="text-body font-body text-subtext-color">
                Enter your extension ID
              </span>
              <div className="flex h-px grow shrink-0 basis-0 flex-col items-center gap-2 bg-neutral-border" />
            </div>

            <div className="flex w-full flex-col items-start justify-center gap-6">
              <TextField className="h-auto w-full flex-none" label="" helpText="">
                <TextField.Input
                  placeholder="Extension ID"
                  value={extensionId}
                  onChange={(e) => setExtensionId(e.target.value)}
                />
              </TextField>
            </div>

            {extensionId && (
              <div className="flex w-full flex-col items-start justify-center gap-2">
                <OAuthSocialButton
                  className="h-10 w-full flex-none"
                  logo="https://res.cloudinary.com/subframe/image/upload/v1711417516/shared/z0i3zyjjqkobzuaecgno.svg"
                  onClick={handleGoogleSignIn}
                >
                  Continue with Google
                </OAuthSocialButton>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}