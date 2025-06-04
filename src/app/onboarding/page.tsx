"use client";

import React, { useState } from "react";
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
  const [extensionInstalled, setExtensionInstalled] = useState(false);
  
  const companyName = getOrganizationName() || "your company";

  const checkExtensionInstalled = () => {
    // Try to send a message to the extension to check if it's installed
    if (typeof window !== 'undefined' && window.chrome?.runtime?.sendMessage) {
      const EXTENSION_ID = 'heolaamdcaoadoacmihafnhegjijopgh';
      window.chrome.runtime.sendMessage(EXTENSION_ID, { type: 'PING' }, (response: any) => {
        if (window.chrome?.runtime?.lastError) {
          setExtensionInstalled(false);
        } else {
          setExtensionInstalled(true);
        }
      });
    }
  };

  const handleInstallExtension = () => {
    window.open('https://chromewebstore.google.com/detail/heolaamdcaoadoacmihafnhegjijopgh?utm_source=item-share-cb', '_blank');
    // Check again after a few seconds
    setTimeout(checkExtensionInstalled, 3000);
  };

  const handleContinueToDashboard = () => {
    router.push('/dashboard');
  };

  React.useEffect(() => {
    checkExtensionInstalled();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="mb-4">
            <img
              className="h-12 mx-auto"
              src="https://res.cloudinary.com/subframe/image/upload/v1742091466/uploads/5582/svy6lyqqwqice1toqymg.png"
              alt="Hyphenbox Logo"
            />
          </div>
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
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold ${extensionInstalled ? 'bg-green-500' : 'bg-brand-600'}`}>
                  {extensionInstalled ? '✓' : '1'}
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
                {extensionInstalled ? (
                  <div className="flex items-center text-green-600">
                    <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    Extension installed and ready!
                  </div>
                ) : (
                  <Button onClick={handleInstallExtension} className="bg-brand-600 hover:bg-brand-700">
                    Install Chrome Extension
                  </Button>
                )}
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
                    <span>Add our script tag to your website</span>
                  </div>
                  <div className="flex items-start space-x-3">
                    <span className="text-brand-600 font-semibold">Guide:</span>
                    <span>Your users see interactive tooltips that guide them through tasks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Next Steps */}
          <div className="border rounded-lg p-6">
            <div className="flex items-start space-x-4">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 rounded-full bg-brand-600 flex items-center justify-center text-white font-semibold">
                  3
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Ready to Create Your First Flow?
                </h3>
                <p className="text-gray-600 mb-4">
                  Head to your dashboard to start creating onboarding flows. You can always come back to this guide later.
                </p>
                <div className="flex space-x-3">
                  <Button 
                    onClick={handleContinueToDashboard}
                    className="bg-brand-600 hover:bg-brand-700"
                  >
                    Go to Dashboard
                  </Button>
                  <Button 
                    variant="neutral-secondary"
                    onClick={() => window.open('https://docs.hyphenbox.com', '_blank')}
                  >
                    View Documentation
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
          <p>
            Need help? Email us at{" "}
            <a href="mailto:support@hyphenbox.com" className="text-brand-600 hover:underline">
              support@hyphenbox.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
} 