"use client";

import React, { useState } from "react";
import { TextField } from "@/ui/components/TextField";
import { Button } from "@/ui/components/Button";
import { LinkButton } from "@/ui/components/LinkButton";
import { supabase } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    
    setLoading(true);
    try {
      // Check if user exists in the user_profiles table
      const { data: existingUser, error: userError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .maybeSingle();
        
      // Check for pending invitation
      const { data: pendingInvite, error: inviteError } = await supabase
        .from('team_invitations')
        .select('id')
        .eq('email', email)
        .eq('status', 'pending')
        .maybeSingle();
      
      if (existingUser || pendingInvite) {
        // Valid user or has invitation, send magic link
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        
        if (error) throw error;
        setMessage("Check your email for the magic link!");
      } else {
        // Not authorized
        setMessage("This email is not authorized for login. Please contact your administrator.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      setMessage(error instanceof Error ? error.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full w-full flex-wrap items-start bg-default-background mobile:flex-col mobile:flex-wrap mobile:gap-0">
      <div className="flex max-w-[576px] grow shrink-0 basis-0 flex-col items-center gap-12 self-stretch bg-brand-600 px-12 py-12 mobile:h-auto mobile:w-full mobile:flex-none">
        <div className="flex w-full max-w-[448px] grow shrink-0 basis-0 flex-col items-start justify-center gap-12 mobile:h-auto mobile:w-full mobile:max-w-[448px] mobile:flex-none">
          <img
            className="h-12 flex-none object-cover"
            src="https://res.cloudinary.com/subframe/image/upload/v1742091466/uploads/5582/svy6lyqqwqice1toqymg.png"
          />
        </div>
      </div>
      <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-6 self-stretch border-l border-solid border-neutral-border px-12 py-12">
        <div className="flex w-full max-w-[448px] flex-col items-start justify-center gap-8">
          <div className="flex w-full flex-col items-center justify-center gap-1">
            <span className="w-full text-heading-2 font-heading-2 text-default-font text-center">
              Sign In
            </span>
          </div>
          <form onSubmit={handleLogin} className="w-full">
            <div className="flex w-full flex-col items-start justify-center gap-4">
              <div className="flex w-full items-center gap-2">
                <TextField
                  className="h-auto grow shrink-0 basis-0"
                  label=""
                  helpText=""
                  icon="FeatherMail"
                >
                  <TextField.Input
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    required
                  />
                </TextField>
                <Button 
                  type="submit"
                  disabled={loading}
                >
                  {loading ? "Sending..." : "Login"}
                </Button>
              </div>
              {message && (
                <div className="text-sm font-medium text-green-600 w-full text-center">
                  {message}
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <span className="text-body font-body text-subtext-color">
            Don&#39;t have an account?
          </span>
          <LinkButton
            variant="brand"
            iconRight="FeatherChevronRight"
            onClick={() => window.open('https://hyphenbox.com', '_blank')}
          >
            Try Hyphenbox today
          </LinkButton>
        </div>
      </div>
    </div>
  );
} 