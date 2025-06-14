"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/ui/components/Button";
import { useAuth, useOrganization } from "@/hooks/useAuth";
import { useRouter } from "next/navigation";

// Type declaration for Chrome extension API
declare global {
  interface Window {
    chrome?: {
      runtime?: {
        sendMessage: (extensionId: string, message: any, callback?: (response: any) => void) => void;
        lastError?: { message: string };
      };
    };
  }
}

export default function OnboardingPage() {
  const router = useRouter();
  const { session } = useAuth();
  const { getOrganizationName } = useOrganization();
  const [companyName, setCompanyName] = useState("your company"); // Start with default to avoid hydration mismatch
  
  // Update company name after hydration to avoid SSR mismatch
  useEffect(() => {
    const orgName = getOrganizationName();
    if (orgName) {
      setCompanyName(orgName);
    }
  }, [getOrganizationName]);

  const handleInstallExtension = () => {
    // Logic to handle installing the chrome extension
    const EXTENSION_INSTALL_URL = 'https://chromewebstore.google.com/detail/heolaamdcaoadoacmihafnhegjijopgh';
    window.open(EXTENSION_INSTALL_URL, '_blank');
  };

  const handleContinueToDashboard = () => {
    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome to Hyphenbox! 🎉
          </h1>
          <p className="text-lg text-gray-600">
            Let&apos;s get {companyName} set up to create amazing user onboarding experiences.
          </p>
        </div>

        <div className="space-y-6">
          {/* Step 1: Install Extension */}
          <div className="border rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold">
                  1
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Install the Chrome Extension
                </h3>
                <p className="text-gray-600 mb-4">
                  The Hyphenbox Chrome extension lets you record user flows on any website. 
                  You&apos;ll use it to capture the exact steps your users should follow.
                </p>
                <Button onClick={handleInstallExtension} className="bg-brand-600 hover:bg-brand-700">
                  Install Chrome Extension
                </Button>
              </div>
            </div>
          </div>

          {/* Step 2: How it works */}
          <div className="border rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold">
                  2
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  How Hyphenbox Works
                </h3>
                <div className="space-y-3 text-gray-600">
                  <div className="flex items-start space-x-3">
                    <span className="text-brand-600 font-semibold">Record:</span>
                    <span>Use the extension to record flows on your app (clicking, typing, navigating)</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-brand-600 font-semibold">Deploy:</span>
                    <span>Add our script tag to your website and your users see interactive tooltips</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Always visible "Go to Dashboard" button */}
        <div className="mt-10 pt-8 border-t border-gray-200 flex justify-center">
          <Button 
            onClick={handleContinueToDashboard}
            className="bg-brand-600 hover:bg-brand-700 text-white font-bold px-14 py-5 text-2xl rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200 ease-in-out"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
} 