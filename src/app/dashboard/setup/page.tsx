"use client";

import React, { useState, useEffect, useCallback } from "react";
import { IconWithBackground } from "@/ui/components/IconWithBackground";
import { useOrganization } from "@/hooks/useAuth";
import { copyToClipboard as copyUtil } from "@/utils/clipboardUtils";
import * as SubframeCore from "@subframe/core";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
  console.error("CRITICAL: NEXT_PUBLIC_API_URL is not defined. API calls will fail.");
}

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, children, disabled = false, variant = 'primary', type = 'button', className }) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}>
      {children}
    </button>
  );
};

function Setup() {
  const { currentOrgId } = useOrganization();
  const [sdkApiKey, setSdkApiKey] = useState<string | null>(null);
  const [isLoadingSdkKey, setIsLoadingSdkKey] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [promptText, setPromptText] = useState<string>('');

  // Fetch the prompt text from public/prompt.txt
  useEffect(() => {
    const fetchPrompt = async () => {
      try {
        const response = await fetch('/prompt.txt');
        if (response.ok) {
          const text = await response.text();
          // Replace placeholder API key with actual API key
          const updatedText = text.replace('YOUR_API_KEY_HERE', sdkApiKey || 'YOUR_API_KEY_HERE');
          setPromptText(updatedText);
        }
      } catch (error) {
        console.error('Failed to fetch prompt:', error);
        setPromptText('Failed to load prompt text.');
      }
    };
    
    fetchPrompt();
  }, [sdkApiKey]);

  const handleCopyToClipboard = async (text: string, key: string) => {
    if (!text) return;
    try {
      await copyUtil(text);
      setCopiedStates(prev => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (err) {
      console.error(`Could not copy: `, err);
      setError('Failed to copy. Please try manually.');
    }
  };

  const fetchSdkApiKey = useCallback(async () => {
    if (!currentOrgId || !API_BASE_URL) return;
    setIsLoadingSdkKey(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/organizations/${currentOrgId}/sdk-key`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch SDK key (${response.status})`);
      }
      const data = await response.json();
      setSdkApiKey(data.public_api_key);
    } catch (err: any) {
      console.error("Error fetching SDK key:", err);
      setError(err.message || 'An unknown error occurred while fetching SDK key.');
      setSdkApiKey(null);
    } finally {
      setIsLoadingSdkKey(false);
    }
  }, [currentOrgId]);

  const handleGenerateSdkApiKey = async () => {
    if (!currentOrgId || !API_BASE_URL) return;
    setIsLoadingSdkKey(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/dashboard/organizations/${currentOrgId}/sdk-key`, { method: "POST" });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to generate SDK key (${response.status})`);
      }
      const data = await response.json();
      setSdkApiKey(data.public_api_key);
    } catch (err: any) {
      console.error("Error generating SDK key:", err);
      setError(err.message || 'An unknown error occurred while generating SDK key.');
    } finally {
      setIsLoadingSdkKey(false);
    }
  };

  useEffect(() => {
    if (currentOrgId && API_BASE_URL) {
      fetchSdkApiKey();
    }
  }, [currentOrgId, fetchSdkApiKey]);

  if (!API_BASE_URL) {
    return (
      <div className="container max-w-none flex h-full w-full flex-col items-center justify-center gap-8 bg-default-background py-12 px-4 md:px-8">
        <div className="w-full max-w-xl p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Configuration Error</h2>
          <p>The application is not configured correctly. Please contact support.</p>
        </div>
      </div>
    );
  }

  const getReactComponentCode = () => {
    return `import React, { useEffect } from 'react';

export default function HyphenBox({ apiKey, userId, userName }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://hyphenbox-clientsdk.pages.dev/flow.js';
    script.async = true;
    script.onload = () => {
      window.hyphenSDKInstance = window.Hyphenbox.initialize({
        apiKey,
        userId,
        userName,
        useDefaultLauncher: true // Shows floating help button
      });
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, [apiKey, userId, userName]);
  
  return null;
}`;
  };

  const getAppUsageCode = () => {
    return `import HyphenBox from './components/HyphenBox'; // Adjust path as needed

function App() {
  return (
    <div>
      {/* Load HyphenBox once - it works across your entire app */}
      <HyphenBox 
        apiKey="${sdkApiKey || 'YOUR_API_KEY'}" 
        userId="user123" 
        userName="John Doe" 
      />
      
      {/* Your app content */}
      <main>
        <YourComponents />
      </main>
    </div>
  );
}`;
  };

  const getManualTriggerCode = () => {
    return `// Use these functions in ANY component (Navbar, Sidebar, Dashboard, etc.)

// In your Navbar.tsx, Sidebar.tsx, or any component:
import React from 'react';

export default function YourComponent() {
  const startOnboarding = () => {
    window.hyphenSDKInstance?.onboarding?.show();
  };
  
  const showAllGuides = () => {
    window.hyphenSDKInstance?.guides?.show();
  };

  return (
    <div>
      {/* Your existing component content */}
      
      <button onClick={startOnboarding}>
        🚀 Start Onboarding
      </button>
      
      <button onClick={showAllGuides}>
        📚 Help & Guides
      </button>
    </div>
  );
}`;
  };

  return (
    <div className="container max-w-none flex h-full w-full flex-col items-center gap-8 bg-default-background py-12 px-4 md:px-8">
      <div className="flex w-full max-w-4xl flex-col items-start gap-12">
        {/* Header */}
        <div className="flex w-full flex-col items-start">
          <span className="text-heading-2 font-heading-2 text-default-font">
            Add Onboarding to Your App
          </span>
          <span className="text-body font-body text-subtext-color">
            Get your users started with interactive onboarding in just 3 steps.
          </span>
        </div>

        {error && (
          <div className="w-full p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
            {error}
          </div>
        )}

        {/* Step 1: Get API Key */}
        <div className="flex w-full flex-col items-start gap-6 p-6 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">1</div>
            <h2 className="text-heading-3 font-heading-3 text-default-font">Get Your API Key</h2>
          </div>
          
          <div className="w-full space-y-3">
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={sdkApiKey || (isLoadingSdkKey ? "Generating..." : "Click Generate")} 
                className="flex-grow p-3 border border-gray-300 rounded-md bg-gray-50 font-mono text-sm"
              />
              {sdkApiKey && (
                <button 
                  onClick={() => handleCopyToClipboard(sdkApiKey, 'apiKey')}
                  className="p-3 rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <SubframeCore.Icon 
                    name={copiedStates['apiKey'] ? "FeatherCheck" : "FeatherClipboard"} 
                    className={`h-4 w-4 ${copiedStates['apiKey'] ? 'text-green-600' : 'text-gray-600'}`}
                  />
                </button>
              )}
            </div>
            <Button onClick={handleGenerateSdkApiKey} disabled={isLoadingSdkKey || !currentOrgId}>
              {isLoadingSdkKey ? "Generating..." : (sdkApiKey ? "Regenerate" : "Generate API Key")}
            </Button>
          </div>
        </div>

        {/* Step 2: Copy for AI Assistant */}
        {sdkApiKey && (
          <div className="flex w-full flex-col items-start gap-6 p-6 border border-neutral-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">2</div>
              <h2 className="text-heading-3 font-heading-3 text-default-font">llm.txt</h2>
            </div>

            <div className="w-full p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-purple-900 mb-1">✨ Using Cursor, Claude, or another AI assistant?</h4>
                  <p className="text-sm text-purple-800">Copy this complete implementation prompt with context and code</p>
                </div>
                <Button
                  onClick={() => handleCopyToClipboard(promptText, 'cursorPrompt')}
                  variant="primary"
                  className="bg-purple-600 hover:bg-purple-700 focus:ring-purple-500"
                >
                  {copiedStates['cursorPrompt'] ? (
                    <div className="flex items-center gap-2">
                      <SubframeCore.Icon name="FeatherCheck" className="h-4 w-4" />
                      Copied!
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <SubframeCore.Icon name="FeatherClipboard" className="h-4 w-4" />
                      Copy Prompt
                    </div>
                  )}
                </Button>
              </div>
            </div>

            <p className="text-sm text-gray-600">
              This prompt explains everything your AI assistant needs to know about HyphenBox and how to implement it properly in your app.
            </p>
          </div>
        )}

        {/* Step 3: Manual Implementation */}
        {sdkApiKey && (
          <div className="flex w-full flex-col items-start gap-6 p-6 border border-neutral-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">3</div>
              <h2 className="text-heading-3 font-heading-3 text-default-font">Manual Implementation</h2>
            </div>

            <p className="text-sm text-gray-600">
              Prefer to implement manually? Here are the code snippets you need:
            </p>

            <div className="w-full space-y-6">
              {/* React Component */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">a. HyphenBox Component</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Create this component and save it as <code className="bg-gray-100 px-1 rounded">hyphenbox.tsx</code> in your components folder:
                </p>
                <div className="relative bg-gray-900 text-white p-4 rounded-md text-sm">
                  <pre className="overflow-x-auto"><code>{getReactComponentCode()}</code></pre>
                  <button
                    onClick={() => handleCopyToClipboard(getReactComponentCode(), 'reactComponent')}
                    className="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600"
                  >
                    <SubframeCore.Icon
                      name={copiedStates['reactComponent'] ? "FeatherCheck" : "FeatherClipboard"}
                      className={`h-4 w-4 ${copiedStates['reactComponent'] ? 'text-green-400' : 'text-gray-300'}`}
                    />
                  </button>
                </div>
              </div>

              {/* Usage */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">b. Load Globally</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Import and use this in your main App component, layout, or wherever it loads on every page:
                </p>
                <div className="relative bg-gray-900 text-white p-4 rounded-md text-sm">
                  <pre className="overflow-x-auto"><code>{getAppUsageCode()}</code></pre>
                  <button
                    onClick={() => handleCopyToClipboard(getAppUsageCode(), 'usage')}
                    className="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600"
                  >
                    <SubframeCore.Icon
                      name={copiedStates['usage'] ? "FeatherCheck" : "FeatherClipboard"}
                      className={`h-4 w-4 ${copiedStates['usage'] ? 'text-green-400' : 'text-gray-300'}`}
                    />
                  </button>
                </div>
                
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>⚠️ Important:</strong> Replace &quot;user123&quot; and &quot;John Doe&quot; with real user data from your authentication system. Without real user IDs, onboarding tracking won&apos;t work.
                  </p>
                </div>
              </div>

              {/* Manual Triggers */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">c. Custom Triggers (Optional)</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Add these functions to trigger onboarding from your own buttons anywhere in your app:
                </p>
                <div className="relative bg-gray-900 text-white p-4 rounded-md text-sm">
                  <pre className="overflow-x-auto"><code>{getManualTriggerCode()}</code></pre>
                  <button
                    onClick={() => handleCopyToClipboard(getManualTriggerCode(), 'manualTrigger')}
                    className="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600"
                  >
                    <SubframeCore.Icon
                      name={copiedStates['manualTrigger'] ? "FeatherCheck" : "FeatherClipboard"}
                      className={`h-4 w-4 ${copiedStates['manualTrigger'] ? 'text-green-400' : 'text-gray-300'}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Test */}
        <div className="flex w-full flex-col items-start gap-6 p-6 border border-neutral-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            <IconWithBackground icon="FeatherZap" className="bg-yellow-100 text-yellow-600" />
            <h2 className="text-heading-3 font-heading-3 text-default-font">What to Expect</h2>
          </div>
          
          <div className="text-sm text-gray-600 space-y-2">
            <p>• A floating &quot;Help &amp; Guides&quot; button will appear on all pages</p>
            <p>• Users can click it to access onboarding flows and help content</p>
            <p>• You can trigger specific onboarding flows from your own buttons</p>
            <p>• User progress is tracked automatically with the provided user ID</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setup;
