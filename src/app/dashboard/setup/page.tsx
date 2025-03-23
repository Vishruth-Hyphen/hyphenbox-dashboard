"use client";

import React from "react";
import { InviteTeamMembers } from "@/ui/layouts/InviteTeamMembers";
import { IconWithBackground } from "@/ui/components/IconWithBackground";

export default function SetupPage() {
  return (
    <InviteTeamMembers>
      <div className="container max-w-none flex h-full w-full flex-col items-center gap-4 bg-default-background py-12">
        <div className="flex w-full max-w-[768px] flex-col items-start gap-12">
          <div className="flex w-full flex-col items-start">
            <span className="text-heading-2 font-heading-2 text-default-font">
              Set up Hyphenbox
            </span>
            <span className="text-body font-body text-subtext-color">
              Follow these simple steps to integrate Hyphenbox with your application
            </span>
          </div>
          <div className="flex w-full flex-col items-start">
            <div className="flex w-full items-start gap-4">
              <div className="flex flex-col items-center self-stretch">
                <IconWithBackground size="small" icon="FeatherCode" />
                <div className="flex w-0.5 grow shrink-0 basis-0 flex-col items-center gap-2 bg-neutral-200" />
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2 pb-6">
                <div className="flex w-full flex-col items-start">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Create HyphenBox.tsx
                  </span>
                  <span className="text-body font-body text-default-font">
                    Create a new file called HyphenBox.tsx with the following code
                  </span>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <div className="flex w-full justify-between items-center rounded-t-md bg-gray-800 px-4 py-2 text-white">
                    <span>HyphenBox.tsx</span>
                    <button className="px-2 py-1 bg-blue-600 rounded text-sm" onClick={() => {
                      navigator.clipboard.writeText(hyphenBoxCode);
                    }}>
                      Copy Code
                    </button>
                  </div>
                  <pre className="w-full overflow-x-auto rounded-b-md bg-gray-900 p-4 text-white text-sm font-mono">{hyphenBoxCode}</pre>
                </div>
              </div>
            </div>
            <div className="flex w-full items-start gap-4">
              <div className="flex flex-col items-center self-stretch">
                <IconWithBackground size="small" icon="FeatherCode2" />
              </div>
              <div className="flex grow shrink-0 basis-0 flex-col items-start gap-2">
                <div className="flex w-full flex-col items-start">
                  <span className="text-heading-3 font-heading-3 text-default-font">
                    Import in your main component
                  </span>
                  <span className="text-body font-body text-default-font">
                    Add the HyphenBox component to your main App component
                  </span>
                </div>
                <div className="flex w-full flex-col gap-2">
                  <div className="flex w-full justify-between items-center rounded-t-md bg-gray-800 px-4 py-2 text-white">
                    <span>App.tsx (or your main component)</span>
                    <button className="px-2 py-1 bg-blue-600 rounded text-sm" onClick={() => {
                      navigator.clipboard.writeText(appCode);
                    }}>
                      Copy Code
                    </button>
                  </div>
                  <pre className="w-full overflow-x-auto rounded-b-md bg-gray-900 p-4 text-white text-sm font-mono">{appCode}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </InviteTeamMembers>
  );
}

// Code snippets to be displayed - defined outside the component for cleaner JSX
const hyphenBoxCode = `import { useEffect } from 'react';

export default function HyphenBox() {
  useEffect(() => {
    // Load the script
    const script = document.createElement('script');
    script.src = 'https://hyphenbox-clientsdk.pages.dev/flow.js';
    script.async = true;
    
    // Initialize CursorFlow when script loads
    script.onload = () => {
      const cf = new (window as any).CursorFlow({
        apiUrl: 'https://hyphenbox-backend.vercel.app',
        organizationId: '8ac3aebe-5120-44c5-9317-78525c64ebb6'
      });
      cf.init();
    };
    
    document.body.appendChild(script);
    
    // Cleanup
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);
  
  return null; // This component doesn't render anything
}`;

const appCode = `import HyphenBox from './path/to/HyphenBox';

function App() {
  return (
    <>
      <HyphenBox />
      {/* Rest of your application */}
    </>
  );
}`;