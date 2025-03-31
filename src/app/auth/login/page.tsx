"use client";

import React, { useState } from "react";
import { TextField } from "@/ui/components/TextField";
import { Button } from "@/ui/components/Button";
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
      
      // For development purposes, allow your specific email
      // You can uncomment this to bypass the checks during development
      const isDevMode = process.env.NODE_ENV === 'development';
      const isYourEmail = email === 'kushalsokke@gmail.com';
      const bypassChecks = isDevMode && isYourEmail;
        
      if (existingUser || pendingInvite || bypassChecks) {
        // Valid user or has invitation or bypassing checks, send magic link
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
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-8 shadow-md">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold">Sign In to HyphenBox</h1>
          <p className="text-gray-600">Enter your email to receive a magic link</p>
        </div>
        
        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="mb-2 block text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 p-2"
              placeholder="your@email.com"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full rounded-lg bg-blue-600 px-4 py-2 text-white"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Magic Link"}
          </button>
        </form>
        
        {message && (
          <div className="mt-4 text-center text-sm font-medium text-green-600">
            {message}
          </div>
        )}
      </div>
    </div>
  );
} 