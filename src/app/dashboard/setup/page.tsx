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

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description: string;
}

const Toggle: React.FC<ToggleProps> = ({ checked, onChange, label, description }) => {
  return (
    <div className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg bg-white">
      <div className="flex items-center h-5">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="w-5 h-5 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
        />
      </div>
      <div className="flex-1">
        <label className="text-sm font-medium text-gray-900 cursor-pointer" onClick={() => onChange(!checked)}>
          {label}
        </label>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>
    </div>
  );
};

function Setup() {
  const { currentOrgId } = useOrganization();
  const [sdkApiKey, setSdkApiKey] = useState<string | null>(null);
  const [isLoadingSdkKey, setIsLoadingSdkKey] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});

  // User preferences
  const [useDefaultButton, setUseDefaultButton] = useState(false);
  const [needManualOnboarding, setNeedManualOnboarding] = useState(true);
  const [needOtherFeatures, setNeedOtherFeatures] = useState(false);

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

  // Generate code snippets based on user preferences
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
        useDefaultLauncher: ${useDefaultButton}
      });
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, [apiKey, userId, userName]);
  
  return null;
}`;
  };

  const getAppUsageCode = () => {
    return `import HyphenBox from './your-component-path/HyphenBox';

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
    if (!needManualOnboarding && !needOtherFeatures) return '';

    let code = `// Use these functions in ANY component (Navbar, Sidebar, Dashboard, etc.)

// In your Navbar.tsx, Sidebar.tsx, or any component:
import React from 'react';

export default function YourComponent() {`;

    if (needManualOnboarding) {
      code += `
  const startOnboarding = () => {
    window.hyphenSDKInstance?.onboarding?.show();
  };`;
    }

    if (needOtherFeatures) {
      code += `
  
  const showAllGuides = () => {
    window.hyphenSDKInstance?.guides?.show();
  };`;
    }

    code += `

  return (
    <div>
      {/* Your existing component content */}`;

    if (needManualOnboarding) {
      code += `
      
      <button onClick={startOnboarding}>
        🚀 Start Onboarding
      </button>`;
    }

    if (needOtherFeatures) {
      code += `
      
      <button onClick={showAllGuides}>
        📚 Help & Guides
      </button>`;
    }

    code += `
    </div>
  );
}`;

    return code;
  };

  const getCursorPrompt = () => {
    let prompt = `I need to add HyphenBox onboarding to my React app. Here's what I want to implement:

## Goal
Add interactive user onboarding to my React application using HyphenBox SDK.

## Setup Requirements
- API Key: ${sdkApiKey || 'YOUR_API_KEY'}
- SDK URL: https://hyphenbox-clientsdk.pages.dev/flow.js`;

    if (useDefaultButton) {
      prompt += `
- Show automatic &quot;Help & Guides&quot; floating button`;
    }
    if (needManualOnboarding) {
      prompt += `
- Add manual onboarding triggers from custom buttons`;
    }
    if (needOtherFeatures) {
      prompt += `
- Add manual access to all guides/help content`;
    }

    prompt += `

## Implementation

### 1. HyphenBox Component
Create this reusable component and place it wherever you keep components in your project:

\`\`\`tsx
${getReactComponentCode()}
\`\`\`

### 2. Load Globally  
Add this to your root App.js, layout, or wherever you want it loaded on all pages:

\`\`\`tsx
${getAppUsageCode()}
\`\`\`

**CRITICAL: Replace &quot;user123&quot; and &quot;John Doe&quot; with real user data from your authentication system. The userId should be unique per user for proper tracking.**`;

    if (needManualOnboarding || needOtherFeatures) {
      prompt += `

### 3. Custom Triggers
Attach these functions to your custom buttons, navigation, or anywhere you want manual control:

\`\`\`tsx
${getManualTriggerCode()}
\`\`\``;
    }

    prompt += `

## Expected Behavior`;
    if (useDefaultButton) {
      prompt += `
- A floating &quot;Help & Guides&quot; button will appear automatically on all pages`;
    }
    if (needManualOnboarding) {
      prompt += `
- Custom buttons can trigger onboarding flows using startOnboarding()`;
    }
    if (needOtherFeatures) {
      prompt += `
- Custom buttons can open the full help center using showAllGuides()`;
    }

    prompt += `

## Notes
- The HyphenBox component loads the SDK once and makes it available globally
- Manual trigger functions work from any component in your app  
- Replace placeholder user data with real values from your auth system
- The SDK will track user progress through onboarding flows

Please help me implement this properly in my React application following my project structure.`;

    return prompt;
  };

  return (
    <div className="container max-w-none flex h-full w-full flex-col items-center gap-8 bg-default-background py-12 px-4 md:px-8">
      <div className="flex w-full max-w-4xl flex-col items-start gap-12">
        {/* Header */}
        <div className="flex w-full flex-col items-start">
          <span className="text-heading-2 font-heading-2 text-default-font">
            Add Onboarding to Your React App
          </span>
          <span className="text-body font-body text-subtext-color">
            Get your users started with interactive onboarding in just 2 steps.
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

        {/* Step 2: Choose Your Setup */}
        <div className="flex w-full flex-col items-start gap-6 p-6 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">2</div>
            <h2 className="text-heading-3 font-heading-3 text-default-font">Choose Your Setup</h2>
          </div>

          <p className="text-sm text-gray-600">Tell us what you need and we&apos;ll generate the perfect code for you:</p>

          <div className="w-full space-y-3">
            <Toggle
              checked={useDefaultButton}
              onChange={setUseDefaultButton}
              label="🎯 Show automatic &apos;Help & Guides&apos; button"
              description="We&apos;ll add a floating button to your app automatically. Users can click it to access onboarding and guides."
            />
            
            <Toggle
              checked={needManualOnboarding}
              onChange={setNeedManualOnboarding}
              label="🚀 I want to trigger onboarding from my own buttons"
              description="You&apos;ll get code to start onboarding from anywhere in your app (like after signup, in your navbar, etc.)"
            />
            
            <Toggle
              checked={needOtherFeatures}
              onChange={setNeedOtherFeatures}
              label="📚 I want to show all guides/help content"
              description="You&apos;ll get code to open the full help center from your own UI elements."
            />
          </div>

          {(useDefaultButton && (needManualOnboarding || needOtherFeatures)) && (
            <div className="w-full p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                💡 <strong>Tip:</strong> You can use both the automatic button AND your own custom buttons. They work great together!
              </p>
            </div>
          )}
        </div>

        {/* Step 3: Your Custom Code */}
        {sdkApiKey && (
          <div className="flex w-full flex-col items-start gap-6 p-6 border border-neutral-200 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">3</div>
              <h2 className="text-heading-3 font-heading-3 text-default-font">Copy Your Custom Code</h2>
            </div>

            {/* Copy for Cursor Button */}
            <div className="w-full p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-purple-900 mb-1">✨ Using Cursor AI?</h4>
                  <p className="text-sm text-purple-800">Copy complete implementation prompt with context + code</p>
                </div>
                <Button
                  onClick={() => handleCopyToClipboard(getCursorPrompt(), 'cursorPrompt')}
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
                      Copy for Cursor
                    </div>
                  )}
                </Button>
              </div>
            </div>

            <div className="w-full space-y-6">
              {/* React Component */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">a. HyphenBox Component</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Create this reusable component and place it wherever you keep components in your project:
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
                  Add this to your root App.js, layout, or wherever you want it loaded on all pages:
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
              {(needManualOnboarding || needOtherFeatures) && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">c. Custom Triggers</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Attach these functions to your custom buttons, navigation, or anywhere you want manual control:
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
              )}
            </div>
          </div>
        )}

        {/* Quick Start */}
        <div className="flex w-full flex-col items-start gap-6 p-6 border border-neutral-200 rounded-lg bg-gray-50">
          <div className="flex items-center gap-3">
            <IconWithBackground icon="FeatherZap" className="bg-yellow-100 text-yellow-600" />
            <h2 className="text-heading-3 font-heading-3 text-default-font">Quick Test</h2>
          </div>
          
          <p className="text-sm text-gray-600">
            Want to test it quickly? Check &quot;Show automatic button&quot; above, copy the 2 snippets, and you&apos;ll see a floating help button.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Setup;
