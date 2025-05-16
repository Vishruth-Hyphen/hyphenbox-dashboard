"use client";

import React, { useState, useEffect, useCallback } from "react";
// import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import { IconWithBackground } from "@/ui/components/IconWithBackground";
// import { CodeBlock, CopyButton } from "@/ui/components/CodeBlock";
import { useOrganization } from "@/hooks/useAuth"; // Import the hook
import { copyToClipboard as copyUtil } from "@/utils/clipboardUtils"; // Import the new utility
import * as SubframeCore from "@subframe/core"; // Import for Icon

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {

  console.error("CRITICAL: NEXT_PUBLIC_API_URL is not defined. API calls will fail.");
}

// Simple Button component for demonstration
interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'tab' | 'tab-active'; // Added tab variants
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, children, disabled = false, variant = 'primary', type = 'button', className }) => {
  const baseStyle = "px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out";
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800 focus:ring-gray-400",
    tab: "bg-transparent hover:bg-gray-100 text-gray-600 focus:ring-blue-500 border border-transparent",
    "tab-active": "bg-blue-50 hover:bg-blue-100 text-blue-700 focus:ring-blue-500 border-b-2 border-blue-600 rounded-b-none",
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`${baseStyle} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className || ''}`}>
      {children}
    </button>
  );
};

interface CopyButtonState {
  [key: string]: { text: string; isCopied: boolean };
}

// Define a type for the button keys
type CopyButtonKey = "apiKey" | "snippet" | "webhookUrl" | "webhookSecret" | "snippetReactComponent" | "snippetReactUsage";
type SnippetFramework = "vanillajs" | "nextjs" | "react";

function Setup() {
  const { currentOrgId, getOrganizationId } = useOrganization(); // Use the hook
  // Use currentOrgId directly if available and initialized by the hook, 
  // or ensure getOrganizationId() is called if currentOrgId might be initially null from the hook's perspective.
  // For simplicity here, assuming currentOrgId will be populated by the hook once ready.
  const organizationId = currentOrgId; 

  const [sdkApiKey, setSdkApiKey] = useState<string | null>(null);
  const [segmentWebhookUrl, setSegmentWebhookUrl] = useState<string>("");
  const [segmentWebhookSecret, setSegmentWebhookSecret] = useState<string | null>(null);
  const [showSegmentSecret, setShowSegmentSecret] = useState<boolean>(false);

  const [isLoadingPage, setIsLoadingPage] = useState<boolean>(true); // For initial org ID check
  const [isLoadingSdkKey, setIsLoadingSdkKey] = useState<boolean>(false);
  const [isLoadingSegmentSecret, setIsLoadingSegmentSecret] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedFramework, setSelectedFramework] = useState<SnippetFramework>("vanillajs");
  const [codeSnippet, setCodeSnippet] = useState<string>("");
  const [reactComponentSnippet, setReactComponentSnippet] = useState<string>("");
  const [reactUsageSnippet, setReactUsageSnippet] = useState<string>("");

  const initialCopyButtonTexts: Record<CopyButtonKey, string> = {
    apiKey: "Copy Key",
    snippet: "Copy Snippet",
    webhookUrl: "Copy URL",
    webhookSecret: "Copy Secret",
    snippetReactComponent: "Copy Component",
    snippetReactUsage: "Copy Usage",
  };

  const [copyButtonStates, setCopyButtonStates] = useState<Record<CopyButtonKey, { text: string; isCopied: boolean }>>(() => {
    const initialStates = {} as Record<CopyButtonKey, { text: string; isCopied: boolean }>;
    (Object.keys(initialCopyButtonTexts) as CopyButtonKey[]).forEach(key => {
      initialStates[key] = { text: initialCopyButtonTexts[key], isCopied: false };
    });
    return initialStates;
  });

  const handleCopyToClipboard = async (text: string, type: string, buttonKey: CopyButtonKey) => {
    if (!text || !API_BASE_URL) return;
    try {
      await copyUtil(text);
      setCopyButtonStates(prev => ({
        ...prev,
        [buttonKey]: { text: initialCopyButtonTexts[buttonKey], isCopied: true }, 
      }));
      setTimeout(() => {
        setCopyButtonStates(prev => ({
          ...prev,
          [buttonKey]: { text: initialCopyButtonTexts[buttonKey], isCopied: false },
        }));
      }, 2000); // Reset after 2 seconds
    } catch (err) {
      console.error(`Could not copy ${type}: `, err);
      setError(`Failed to copy ${type}. Please try manually.`); // Update error state
      setCopyButtonStates(prev => ({
        ...prev,
        [buttonKey]: { text: initialCopyButtonTexts[buttonKey], isCopied: false },
      }));
    }
  };

  const generateCodeSnippet = useCallback((apiKey: string | null, framework: SnippetFramework) => {
    const key = apiKey || "YOUR_HYPHENBOX_API_KEY";
    let vanillaSnippet = "";
    let nextJsSnippet = "";
    let reactComp = "";
    let reactUse = "";

    // Clear all snippets first
    setCodeSnippet("");
    setReactComponentSnippet("");
    setReactUsageSnippet("");

    switch (framework) {
      case "nextjs":
        nextJsSnippet = `
// Ensure you have: import Script from 'next/script';
<Script
  src="https://hyphenbox-clientsdk.pages.dev/flow.js"
  strategy="afterInteractive"
  onLoad={() => {
    const cf = new window.CursorFlow({
      apiKey: '${key}'
    });
    cf.init();
  }}
/>`;
        setCodeSnippet(nextJsSnippet.trimStart());
        break;
      case "react":
        reactComp = `
// 1. Define this component in your React app:
function HyphenboxLoader({ apiKey }) {
  React.useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://hyphenbox-clientsdk.pages.dev/flow.js';
    script.async = true;
    script.onload = () => {
      const cf = new window.CursorFlow({
        apiKey: apiKey
      });
      cf.init();
    };
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [apiKey]);
  return null;
}`;
        reactUse = `
// 2. Use it in your app like this:
<HyphenboxLoader apiKey="${key}" />`;
        setReactComponentSnippet(reactComp.trimStart());
        setReactUsageSnippet(reactUse.trimStart());
        break;
      case "vanillajs":
      default:
        vanillaSnippet = `
<script src="https://hyphenbox-clientsdk.pages.dev/flow.js"></script>
<script>
  document.addEventListener('DOMContentLoaded', function() {
    const cf = new window.CursorFlow({
      apiKey: '${key}'
    });
    cf.init();
  });
</script>`;
        setCodeSnippet(vanillaSnippet.trimStart());
        break;
    }
  }, []);

  const fetchSdkApiKey = useCallback(async () => {
    if (!organizationId || !API_BASE_URL) return;
    setIsLoadingSdkKey(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/organizations/${organizationId}/sdk-key`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch SDK key (${response.status})`);
      }
      const data = await response.json();
      setSdkApiKey(data.public_api_key);
      // Snippet generation is handled by useEffect below
    } catch (err: any) {
      console.error("Error fetching SDK key:", err);
      setError(err.message || 'An unknown error occurred while fetching SDK key.');
      setSdkApiKey(null); 
    } finally {
      setIsLoadingSdkKey(false);
    }
  }, [organizationId, API_BASE_URL]); // Added API_BASE_URL to dependencies

  const handleGenerateSdkApiKey = async () => {
    if (!organizationId || !API_BASE_URL) return;
    setIsLoadingSdkKey(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/organizations/${organizationId}/sdk-key`, { method: "POST" });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to generate SDK key (${response.status})`);
      }
      const data = await response.json();
      setSdkApiKey(data.public_api_key);
      // Snippet generation is handled by useEffect below
    } catch (err: any) {
      console.error("Error generating SDK key:", err);
      setError(err.message || 'An unknown error occurred while generating SDK key.');
    } finally {
      setIsLoadingSdkKey(false);
    }
  };

  const fetchSegmentWebhookSecret = useCallback(async () => {
    if (!organizationId || !API_BASE_URL) return;
    setIsLoadingSegmentSecret(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/organizations/${organizationId}/segment-webhook-secret`);
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to fetch Segment secret (${response.status})`);
      }
      const data = await response.json();
      setSegmentWebhookSecret(data.segment_webhook_shared_secret);
    } catch (err: any) {
      console.error("Error fetching Segment secret:", err);
      setError(err.message || 'An unknown error occurred while fetching Segment secret.');
      setSegmentWebhookSecret(null);
    } finally {
      setIsLoadingSegmentSecret(false);
    }
  }, [organizationId, API_BASE_URL]); // Added API_BASE_URL to dependencies

  const handleGenerateSegmentSecret = async () => {
    if (!organizationId || !API_BASE_URL) return;
    setIsLoadingSegmentSecret(true);
    setError(null);
    setShowSegmentSecret(false);
    try {
      const response = await fetch(`${API_BASE_URL}/api/organizations/${organizationId}/segment-webhook-secret`, { method: "POST" });
      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || `Failed to generate Segment secret (${response.status})`);
      }
      fetchSegmentWebhookSecret(); 
      setShowSegmentSecret(true);
    } catch (err: any) {
      console.error("Error generating Segment secret:", err);
      setError(err.message || 'An unknown error occurred while generating Segment secret.');
    } finally {
      setIsLoadingSegmentSecret(false);
    }
  };
  
  useEffect(() => {
    if (organizationId && API_BASE_URL) {
      setIsLoadingPage(false);
      fetchSdkApiKey();
      fetchSegmentWebhookSecret();
      setSegmentWebhookUrl(`${API_BASE_URL}/v1/segment/${organizationId}/event`);
    } else if (!API_BASE_URL) {
        setError("API URL is not configured. Please contact support.");
        setIsLoadingPage(false);
    } else {
      setIsLoadingPage(true); 
    }
  }, [organizationId, fetchSdkApiKey, fetchSegmentWebhookSecret, API_BASE_URL]); // Added API_BASE_URL

  useEffect(() => {
    // Generate snippet whenever apiKey or selectedFramework changes
    generateCodeSnippet(sdkApiKey, selectedFramework);
  }, [sdkApiKey, selectedFramework, generateCodeSnippet]); // API_BASE_URL not needed here as generateCodeSnippet doesn't use it directly

  if (isLoadingPage && !organizationId) {
    return (
      <div className="container max-w-none flex h-full w-full flex-col items-center justify-center gap-8 bg-default-background py-12 px-4 md:px-8">
        <p>Loading organization details...</p>
        {/* You might want a spinner or a more sophisticated loading state here from your UI library */}
      </div>
    );
  }
  
  if (!API_BASE_URL) {
    return (
        <div className="container max-w-none flex h-full w-full flex-col items-center justify-center gap-8 bg-default-background py-12 px-4 md:px-8">
            <div className="w-full max-w-xl p-6 bg-red-100 border border-red-400 text-red-700 rounded-lg text-center">
                <h2 className="text-xl font-semibold mb-2">Configuration Error</h2>
                <p>The application is not configured correctly (API URL is missing). Please contact support.</p>
            </div>
        </div>
    );
  }

  if (!organizationId && !isLoadingPage) { // Should ideally be handled by useOrganization hook redirecting
    return (
        <div className="container max-w-none flex h-full w-full flex-col items-center justify-center gap-8 bg-default-background py-12 px-4 md:px-8">
            <p>Organization not identified. You might be redirected shortly.</p>
        </div>
    );
  }

  return (
    // <InviteTeamMembers>
    <div className="container max-w-none flex h-full w-full flex-col items-center gap-8 bg-default-background py-12 px-4 md:px-8">
      <div className="flex w-full max-w-3xl flex-col items-start gap-12">
        <div className="flex w-full flex-col items-start">
          <span className="text-heading-2 font-heading-2 text-default-font">
            Set up Hyphenbox
          </span>
          <span className="text-body font-body text-subtext-color">
            Follow these steps to integrate Hyphenbox with your application.
          </span>
        </div>

        {error && !API_BASE_URL && (
             <div className="w-full p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                {error} {/* This will show the API_BASE_URL missing error if set by useEffect */}
            </div>
        )}
        {error && API_BASE_URL && (
            <div className="w-full p-4 my-4 text-sm text-red-700 bg-red-100 rounded-lg" role="alert">
                API Error: {error}
            </div>
        )}

        {/* SDK Setup Section */}
        <div className="flex w-full flex-col items-start gap-6 p-6 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3">
            <IconWithBackground size="medium" icon="FeatherPackage" />
            <h2 className="text-heading-3 font-heading-3 text-default-font">Hyphenbox SDK Setup</h2>
          </div>
          
          <div className="w-full space-y-2">
            <label className="block text-sm font-medium text-gray-700">Your Public API Key:</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={sdkApiKey || (isLoadingSdkKey ? "Loading..." : (organizationId ? "Click Generate" : "Loading org..."))} 
                className="flex-grow p-2 border border-gray-300 rounded-md bg-gray-50 min-w-0" 
              />
              {sdkApiKey && (
                <div className="relative ml-1">
                  <button 
                    onClick={() => handleCopyToClipboard(sdkApiKey, 'API Key', 'apiKey')}
                    title={initialCopyButtonTexts.apiKey}
                    className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150"
                  >
                    <SubframeCore.Icon 
                        name={copyButtonStates['apiKey']?.isCopied ? "FeatherCheck" : "FeatherClipboard"} 
                        className={`h-4 w-4 ${copyButtonStates['apiKey']?.isCopied ? 'text-green-600' : 'text-gray-600'}`}
                    />
                  </button>
                  {copyButtonStates['apiKey']?.isCopied && (
                    <span className="absolute left-1/2 -bottom-8 transform -translate-x-1/2 text-xs text-green-600 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100 whitespace-nowrap">
                        Copied!
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
          <Button onClick={handleGenerateSdkApiKey} disabled={isLoadingSdkKey || !organizationId || !API_BASE_URL}>
            {isLoadingSdkKey ? "Generating..." : (sdkApiKey ? "Regenerate API Key" : "Generate API Key")}
          </Button>
          
          <div className="w-full space-y-2 mt-4">
            <label className="block text-sm font-medium text-gray-700">Installation Snippet:</label>
            <p className="text-sm text-gray-600">Copy and paste this snippet into your application, following the instructions for your chosen framework.</p>
            
            {/* Framework Selection Tabs */}
            <div className="flex border-b border-gray-300 mb-2">
              {(["vanillajs", "nextjs", "react"] as SnippetFramework[]).map((framework) => (
                <Button
                  key={framework}
                  variant={selectedFramework === framework ? "tab-active" : "tab"}
                  onClick={() => setSelectedFramework(framework)}
                  className="mr-1 !rounded-b-none" 
                >
                  {framework === "vanillajs" && "Vanilla JS / HTML"}
                  {framework === "nextjs" && "Next.js"}
                  {framework === "react" && "React (CRA, Vite)"}
                </Button>
              ))}
            </div>

            {selectedFramework === "react" ? (
              <>
                {/* React Component Snippet */}
                <div className="relative bg-gray-900 text-white p-4 rounded-md text-sm mb-3">
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all"><code>{reactComponentSnippet}</code></pre>
                  <div className="absolute top-2 right-2">
                    <div className="relative">
                      <button
                        onClick={() => handleCopyToClipboard(reactComponentSnippet, 'React Component', 'snippetReactComponent')}
                        title={initialCopyButtonTexts.snippetReactComponent}
                        disabled={!reactComponentSnippet || !API_BASE_URL}
                        className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-50 flex items-center justify-center"
                      >
                        <SubframeCore.Icon
                          name={copyButtonStates['snippetReactComponent']?.isCopied ? "FeatherCheck" : "FeatherClipboard"}
                          className={`h-4 w-4 ${copyButtonStates['snippetReactComponent']?.isCopied ? 'text-green-400' : 'text-gray-300'}`}
                        />
                      </button>
                      {copyButtonStates['snippetReactComponent']?.isCopied && (
                        <span className="absolute left-1/2 -bottom-7 transform -translate-x-1/2 text-xs text-green-600 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100 whitespace-nowrap">
                          Copied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {/* React Usage Snippet */}
                <div className="relative bg-gray-900 text-white p-4 rounded-md text-sm">
                  <pre className="overflow-x-auto whitespace-pre-wrap break-all"><code>{reactUsageSnippet}</code></pre>
                  <div className="absolute top-2 right-2">
                    <div className="relative">
                      <button
                        onClick={() => handleCopyToClipboard(reactUsageSnippet, 'React Usage', 'snippetReactUsage')}
                        title={initialCopyButtonTexts.snippetReactUsage}
                        disabled={!reactUsageSnippet || !API_BASE_URL}
                        className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-50 flex items-center justify-center"
                      >
                        <SubframeCore.Icon
                          name={copyButtonStates['snippetReactUsage']?.isCopied ? "FeatherCheck" : "FeatherClipboard"}
                          className={`h-4 w-4 ${copyButtonStates['snippetReactUsage']?.isCopied ? 'text-green-400' : 'text-gray-300'}`}
                        />
                      </button>
                      {copyButtonStates['snippetReactUsage']?.isCopied && (
                        <span className="absolute left-1/2 -bottom-7 transform -translate-x-1/2 text-xs text-green-600 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100 whitespace-nowrap">
                          Copied!
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="relative bg-gray-900 text-white p-4 rounded-md text-sm">
                <pre className="overflow-x-auto whitespace-pre-wrap break-all"><code>{codeSnippet}</code></pre>
                <div className="absolute top-2 right-2">
                  <div className="relative"> 
                      <button 
                          onClick={() => handleCopyToClipboard(codeSnippet, 'Snippet', 'snippet')}
                          title={initialCopyButtonTexts.snippet}
                          disabled={!codeSnippet || !API_BASE_URL}
                          className="p-1.5 rounded-md bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-50 flex items-center justify-center"
                      >
                          <SubframeCore.Icon 
                              name={copyButtonStates['snippet']?.isCopied ? "FeatherCheck" : "FeatherClipboard"} 
                              className={`h-4 w-4 ${copyButtonStates['snippet']?.isCopied ? 'text-green-400' : 'text-gray-300'}`}
                          />
                      </button>
                      {copyButtonStates['snippet']?.isCopied && (
                          <span className="absolute left-1/2 -bottom-7 transform -translate-x-1/2 text-xs text-green-600 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100 whitespace-nowrap">
                              Copied!
                          </span>
                      )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Segment Integration Section */}
        <div className="flex w-full flex-col items-start gap-6 p-6 border border-neutral-200 rounded-lg">
          <div className="flex items-center gap-3">
             <IconWithBackground size="medium" icon="FeatherShare2" /> 
            <h2 className="text-heading-3 font-heading-3 text-default-font">Segment.com Integration (Optional)</h2>
          </div>

          <p className="text-sm text-gray-600">
            If you use Segment.com, you can configure a webhook destination to send event data to Hyphenbox.
          </p>

          <div className="w-full space-y-2">
            <label className="block text-sm font-medium text-gray-700">Your Segment Webhook URL:</label>
            <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={segmentWebhookUrl || (organizationId && API_BASE_URL ? "Loading..." : (API_BASE_URL ? "Loading org..." : "API URL missing"))} 
                className="flex-grow p-2 border border-gray-300 rounded-md bg-gray-50 min-w-0"
              />
              {segmentWebhookUrl && (
                <div className="relative ml-1">
                    <button 
                        onClick={() => handleCopyToClipboard(segmentWebhookUrl, 'Webhook URL', 'webhookUrl')}
                        title={initialCopyButtonTexts.webhookUrl}
                        disabled={!API_BASE_URL}
                        className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-50"
                    >
                        <SubframeCore.Icon 
                            name={copyButtonStates['webhookUrl']?.isCopied ? "FeatherCheck" : "FeatherClipboard"} 
                            className={`h-4 w-4 ${copyButtonStates['webhookUrl']?.isCopied ? 'text-green-600' : 'text-gray-600'}`}
                        />
                    </button>
                    {copyButtonStates['webhookUrl']?.isCopied && (
                        <span className="absolute left-1/2 -bottom-8 transform -translate-x-1/2 text-xs text-green-600 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100 whitespace-nowrap">
                            Copied!
                        </span>
                    )}
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">Provide this URL to Segment as a webhook destination.</p>
          </div>

          <div className="w-full space-y-2">
            <label className="block text-sm font-medium text-gray-700">Your Segment Webhook Shared Secret:</label>
             <div className="flex items-center gap-2">
              <input 
                type="text" 
                readOnly 
                value={showSegmentSecret && segmentWebhookSecret ? segmentWebhookSecret : (isLoadingSegmentSecret ? "Loading..." : (segmentWebhookSecret ? "••••••••••••••••••••" : (organizationId ? "Click Generate" : "Loading org...")))}
                className="flex-grow p-2 border border-gray-300 rounded-md bg-gray-50 min-w-0"
              />
              {segmentWebhookSecret && (
                <>
                  <Button onClick={() => setShowSegmentSecret(!showSegmentSecret)} variant="secondary" className="whitespace-nowrap" disabled={!API_BASE_URL}>
                    {showSegmentSecret ? "Hide" : "View"} Secret
                  </Button>
                  <div className="relative ml-1">
                    <button 
                        onClick={() => handleCopyToClipboard(segmentWebhookSecret, 'Webhook Secret', 'webhookSecret')}
                        title={initialCopyButtonTexts.webhookSecret}
                        disabled={!API_BASE_URL}
                        className="p-1.5 rounded-md border border-gray-300 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-150 disabled:opacity-50"
                    >
                        <SubframeCore.Icon 
                            name={copyButtonStates['webhookSecret']?.isCopied ? "FeatherCheck" : "FeatherClipboard"} 
                            className={`h-4 w-4 ${copyButtonStates['webhookSecret']?.isCopied ? 'text-green-600' : 'text-gray-600'}`}
                        />
                    </button>
                    {copyButtonStates['webhookSecret']?.isCopied && (
                        <span className="absolute left-1/2 -bottom-8 transform -translate-x-1/2 text-xs text-green-600 bg-white px-2 py-1 rounded-md shadow-sm border border-gray-100 whitespace-nowrap">
                            Copied!
                        </span>
                    )}
                  </div>
                </>
              )}
            </div>
            <p className="text-xs text-gray-500">Use this secret when configuring HMAC SHA256 signature verification in Segment.</p>
          </div>
           <Button onClick={handleGenerateSegmentSecret} disabled={isLoadingSegmentSecret || !organizationId || !API_BASE_URL}>
            {isLoadingSegmentSecret ? "Generating..." : (segmentWebhookSecret ? "Regenerate Secret" : "Generate Secret")}
          </Button>
        </div>

      </div>
    </div>
  );
}
export default Setup;
