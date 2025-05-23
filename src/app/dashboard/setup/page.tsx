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

  const reactComponentCode = `import React, { useEffect } from 'react';

export default function HyphenBox({ apiKey, userId, userName, useDefaultLauncher = true }) {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://hyphenbox-clientsdk.pages.dev/flow.js';
    script.async = true;
    script.onload = () => {
      window.hyphenSDKInstance = window.Hyphenbox.initialize({
        apiKey, userId, userName, useDefaultLauncher
      });
    };
    document.body.appendChild(script);
    return () => document.body.removeChild(script);
  }, [apiKey, userId, userName, useDefaultLauncher]);
  return null;
}`;

  const usageWithDefaultLauncher = `import HyphenBox from './HyphenBox';

function App() {
  return (
    <div>
      {/* Option 1: Shows "Help & Guides" button automatically */}
      <HyphenBox 
        apiKey="${sdkApiKey || 'YOUR_API_KEY'}" 
        userId="user123" 
        userName="John Doe" 
        useDefaultLauncher={true}
      />
      
      {/* Your app content - button appears automatically! */}
      <main>
        <h1>Welcome! Look for the Help & Guides button.</h1>
      </main>
    </div>
  );
}`;

  const usageWithManualControl = `import HyphenBox from './HyphenBox';

function App() {
  const handleStartOnboarding = () => {
    // Manual control - trigger onboarding anywhere!
    window.hyphenSDKInstance?.onboarding?.show();
  };

  return (
    <div>
      {/* Option 2: No default button, you control when to show */}
      <HyphenBox 
        apiKey="${sdkApiKey || 'YOUR_API_KEY'}" 
        userId="user123" 
        userName="John Doe" 
        useDefaultLauncher={false}
      />
      
      {/* Your custom button wherever you want it */}
      <nav>
        <button onClick={handleStartOnboarding}>
          Get Started with Onboarding
        </button>
      </nav>
    </div>
  );
}`;

  const nextjsCode = `import Script from 'next/script';

export default function Layout({ children }) {
  return (
    <>
      <Script
        src="https://hyphenbox-clientsdk.pages.dev/flow.js"
        onLoad={() => {
          window.hyphenSDKInstance = window.Hyphenbox.initialize({
            apiKey: '${sdkApiKey || 'YOUR_API_KEY'}',
            userId: 'user123',
            userName: 'John Doe',
            useDefaultLauncher: true // Shows "Help & Guides" button automatically
          });
        }}
      />
      {children}
    </>
  );
}`;

  const vanillaCode = `<script src="https://hyphenbox-clientsdk.pages.dev/flow.js"></script>
<script>
  window.hyphenSDKInstance = window.Hyphenbox.initialize({
    apiKey: '${sdkApiKey || 'YOUR_API_KEY'}',
    userId: 'user123',
    userName: 'John Doe',
    useDefaultLauncher: true // Shows "Help & Guides" button automatically
  });
</script>

<!-- For manual control, set useDefaultLauncher: false and use: -->
<button onclick="window.hyphenSDKInstance.onboarding.show()">
  Start Onboarding
</button>`;

  return (
    <div className="container max-w-none flex h-full w-full flex-col items-center gap-8 bg-default-background py-12 px-4 md:px-8">
      <div className="flex w-full max-w-4xl flex-col items-start gap-12">
        {/* Header */}
        <div className="flex w-full flex-col items-start">
          <span className="text-heading-2 font-heading-2 text-default-font">
            React Onboarding Setup
          </span>
          <span className="text-body font-body text-subtext-color">
            Add interactive onboarding to your React app in 2 simple steps.
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

        {/* Step 2: Choose Your Framework */}
        <div className="flex w-full flex-col items-start gap-6 p-6 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-600 rounded-full font-semibold">2</div>
            <h2 className="text-heading-3 font-heading-3 text-default-font">Add to Your React App</h2>
          </div>

          {/* React */}
          <div className="w-full space-y-3">
            <h3 className="text-lg font-semibold text-gray-800">a. Create the HyphenBox Component</h3>
            <p className="text-sm text-gray-600">Create a file named <code className="bg-gray-200 px-1 rounded">HyphenBox.tsx</code> (or <code className="bg-gray-200 px-1 rounded">.js</code>) in your project, typically in a <code className="bg-gray-200 px-1 rounded">components</code> folder, with the following code:</p>
            <div className="relative bg-gray-900 text-white p-4 rounded-md text-sm">
              <pre className="overflow-x-auto"><code>{reactComponentCode}</code></pre>
              <button
                onClick={() => handleCopyToClipboard(reactComponentCode, 'reactComponent')}
                className="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600"
              >
                <SubframeCore.Icon
                  name={copiedStates['reactComponent'] ? "FeatherCheck" : "FeatherClipboard"}
                  className={`h-4 w-4 ${copiedStates['reactComponent'] ? 'text-green-400' : 'text-gray-300'}`}
                />
              </button>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-800 mt-6">b. Use the Component</h3>
            <p className="text-sm text-gray-600 mt-1">Import and use the <code className="bg-gray-200 px-1 rounded">HyphenBox</code> component in your main application file (e.g., <code className="bg-gray-200 px-1 rounded">App.tsx</code> or <code className="bg-gray-200 px-1 rounded">App.js</code>).</p>

            <p className="text-sm text-gray-600 mt-4"><strong>Option 1: Default Launcher</strong> (Recommended for easy setup)</p>
            <p className="text-sm text-gray-600">Set <code className="bg-gray-200 px-1 rounded">useDefaultLauncher={true}</code> (or omit it, as it defaults to true). This will automatically display a "Help & Guides" button in your app, giving users access to onboarding and other guides.</p>
            <div className="relative bg-gray-900 text-white p-4 rounded-md text-sm">
              <pre className="overflow-x-auto"><code>{usageWithDefaultLauncher}</code></pre>
              <button
                onClick={() => handleCopyToClipboard(usageWithDefaultLauncher, 'usageWithDefaultLauncher')}
                className="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600"
              >
                <SubframeCore.Icon
                  name={copiedStates['usageWithDefaultLauncher'] ? "FeatherCheck" : "FeatherClipboard"}
                  className={`h-4 w-4 ${copiedStates['usageWithDefaultLauncher'] ? 'text-green-400' : 'text-gray-300'}`}
                />
              </button>
            </div>

            <p className="text-sm text-gray-600 mt-4"><strong>Option 2: Manual Control</strong> (For custom integration)</p>
            <p className="text-sm text-gray-600">Set <code className="bg-gray-200 px-1 rounded">useDefaultLauncher={false}</code>. This will not show the default button. You can then trigger Hyphenbox features, like onboarding, from your own UI elements (e.g., a custom button).</p>
            <div className="relative bg-gray-900 text-white p-4 rounded-md text-sm">
              <pre className="overflow-x-auto"><code>{usageWithManualControl}</code></pre>
              <button
                onClick={() => handleCopyToClipboard(usageWithManualControl, 'usageWithManualControl')}
                className="absolute top-2 right-2 p-2 rounded-md bg-gray-700 hover:bg-gray-600"
              >
                <SubframeCore.Icon
                  name={copiedStates['usageWithManualControl'] ? "FeatherCheck" : "FeatherClipboard"}
                  className={`h-4 w-4 ${copiedStates['usageWithManualControl'] ? 'text-green-400' : 'text-gray-300'}`}
                />
              </button>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              To trigger onboarding manually (when <code className="bg-gray-200 px-1 rounded">useDefaultLauncher</code> is <code className="bg-gray-200 px-1 rounded">false</code>), call: <code className="bg-gray-200 px-1 rounded text-black">window.hyphenSDKInstance?.onboarding?.show()</code>.
              You can similarly access other SDK functions if needed.
            </p>
          </div>
        </div>
        
        {/* Step 3: That's it! -> Simplified to integrate into Step 2's explanation */}
        <div className="flex w-full flex-col items-start gap-6 p-6 border border-neutral-200 rounded-lg bg-green-50">
          <div className="flex items-center gap-3">
            <IconWithBackground icon="FeatherPartyPopper" className="bg-green-100 text-green-600" />
            <h2 className="text-heading-3 font-heading-3 text-default-font">You're All Set!</h2>
          </div>
          
          <div className="space-y-4">
            <p className="text-body font-body text-default-font">
              Your Hyphenbox onboarding is now integrated into your React application.
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
              <li>If you chose <strong>Option 1 (Default Launcher)</strong>, the "Help & Guides" button will appear automatically.</li>
              <li>If you chose <strong>Option 2 (Manual Control)</strong>, you can now trigger onboarding from any part of your application using your custom UI and the <code className="bg-gray-200 px-1 rounded text-black">window.hyphenSDKInstance.onboarding.show()</code> call.</li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-yellow-800">
                <strong>💡 Pro tip:</strong> Start with <strong>Option 1 (Default Launcher)</strong> to quickly verify your setup. You can then switch to <strong>Option 2 (Manual Control)</strong> if you need a more tailored user experience.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Setup;
