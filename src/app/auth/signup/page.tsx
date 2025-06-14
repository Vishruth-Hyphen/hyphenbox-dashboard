"use client";

import React, { useState } from "react";
import { TextField } from "@/ui/components/TextField";
import { Button } from "@/ui/components/Button";
import { LinkButton } from "@/ui/components/LinkButton";
import { supabase } from '@/lib/supabase';

export default function SignupPage() {
  const [formData, setFormData] = useState({
    email: "",
    companyName: "",
    companyWebsite: ""
  });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.companyName) return;

    setLoading(true);
    setMessage("");
    
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', formData.email)
        .maybeSingle();

      if (existingUser) {
        // Automatically redirect existing users to login page
        setMessage("Redirecting you to login...");
        setTimeout(() => {
          window.location.href = `/auth/login?email=${encodeURIComponent(formData.email)}&message=${encodeURIComponent('Account found! Please sign in.')}`;
        }, 1500);
        setLoading(false);
        return;
      }

      // Create organization immediately
      const { data: organization, error: orgError } = await supabase
        .from('organizations')
        .insert([
          {
            name: formData.companyName,
            billing_email: formData.email,
          }
        ])
        .select('id')
        .single();

      if (orgError) {
        console.error('Error creating organization:', orgError);
        throw new Error('Failed to create organization. Please try again.');
      }

      console.log('Created organization:', organization);

      // Send magic link with organization reference
      const { error } = await supabase.auth.signInWithOtp({
        email: formData.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?org_id=${organization.id}&signup=true`,
        },
      });

      if (error) {
        // If magic link fails, clean up the organization
        await supabase
          .from('organizations')
          .delete()
          .eq('id', organization.id);
        throw error;
      }

      setMessage("Check your email for the magic link to complete your signup!");
      
    } catch (error) {
      console.error("Error during signup:", error);
      setMessage(error instanceof Error ? error.message : "An error occurred during signup");
    } finally {
      setLoading(false);
    }
  };

  // Debug: Check if button should be enabled
  const isFormValid = formData.email.trim() !== "" && formData.companyName.trim() !== "";
  const isButtonDisabled = loading || !isFormValid;

  console.log("Form state:", formData);
  console.log("Is form valid:", isFormValid);
  console.log("Is button disabled:", isButtonDisabled);

  return (
    <div className="flex h-full w-full flex-wrap items-start bg-default-background mobile:flex-col mobile:flex-wrap mobile:gap-0">
      <div className="flex max-w-[576px] grow shrink-0 basis-0 flex-col items-center gap-12 self-stretch bg-brand-600 px-12 py-12 mobile:h-auto mobile:w-full mobile:flex-none">
        <div className="flex w-full max-w-[448px] grow shrink-0 basis-0 flex-col items-start justify-center gap-12 mobile:h-auto mobile:w-full mobile:max-w-[448px] mobile:flex-none">
          <img
            className="h-12 flex-none object-cover"
            src="https://res.cloudinary.com/subframe/image/upload/v1742091466/uploads/5582/svy6lyqqwqice1toqymg.png"
            alt="Hyphenbox Logo"
          />
          <div className="flex flex-col gap-4 text-white">
            <h2 className="text-2xl font-bold">Start building better user experiences</h2>
            <p className="text-lg opacity-90">Create onboarding flows and feature tours that actually help your users succeed.</p>
          </div>
        </div>
      </div>
      <div className="flex grow shrink-0 basis-0 flex-col items-center justify-center gap-6 self-stretch border-l border-solid border-neutral-border px-12 py-12">
        <div className="flex w-full max-w-[448px] flex-col items-start justify-center gap-8">
          <div className="flex w-full flex-col items-center justify-center gap-1">
            <span className="w-full text-heading-2 font-heading-2 text-default-font text-center">
              Create Your Account
            </span>
            <span className="text-subtext-color text-center">
              Join thousands of teams improving their user onboarding
            </span>
          </div>
          <form onSubmit={handleSignup} className="w-full">
            <div className="flex w-full flex-col items-start justify-center gap-4">
              <TextField
                className="w-full"
                label="Email Address"
                helpText=""
                icon="FeatherMail"
              >
                <TextField.Input
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  type="email"
                  required
                />
              </TextField>
              
              <TextField
                className="w-full"
                label="Company Name"
                helpText=""
                icon="FeatherHome"
              >
                <TextField.Input
                  placeholder="Acme Inc"
                  value={formData.companyName}
                  onChange={(e) => handleInputChange('companyName', e.target.value)}
                  type="text"
                  required
                />
              </TextField>
              
              <TextField
                className="w-full"
                label="Company Website (Optional)"
                helpText=""
                icon="FeatherLink"
              >
                <TextField.Input
                  placeholder="https://acme.com"
                  value={formData.companyWebsite}
                  onChange={(e) => handleInputChange('companyWebsite', e.target.value)}
                  type="url"
                />
              </TextField>

              <Button 
                type="submit"
                disabled={isButtonDisabled}
                className="w-full"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </Button>
              
              {message && (
                <div className={`text-sm font-medium w-full text-center ${message.includes('Error') || message.includes('already exists') || message.includes('already in progress') ? 'text-red-600' : 'text-green-600'}`}>
                  {message}
                </div>
              )}
            </div>
          </form>
        </div>
        <div className="flex flex-wrap items-start gap-2">
          <span className="text-body font-body text-subtext-color">
            Already have an account?
          </span>
          <LinkButton
            variant="brand"
            iconRight="FeatherChevronRight"
            onClick={() => window.location.href = '/auth/login'}
          >
            Sign in here
          </LinkButton>
        </div>
      </div>
    </div>
  );
} 