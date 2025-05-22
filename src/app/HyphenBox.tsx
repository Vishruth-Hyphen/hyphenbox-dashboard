import React, { useEffect, useRef } from 'react';

// Declare global type for Hyphenbox on the window object
declare global {
  interface Window {
    Hyphenbox: {
      initialize: (config: {
        apiKey: string;
        userId: string; // Must be provided
        userName?: string; // Optional
        debug?: boolean;
        useDefaultLauncher?: boolean; 
      }) => any;
    };
    hyphenSDKInstance?: any; 
  }
}

interface HyphenBoxProps {
  apiKey: string;
  userId: string; // Required - must be a valid string
  userName?: string; // Optional
  useDefaultLauncher?: boolean; 
}

export default function HyphenBox({ apiKey, userId, userName, useDefaultLauncher = false }: HyphenBoxProps) {
  const initializedRef = useRef(false);

  useEffect(() => {
    // If userId is not provided, log an error and do nothing.
    if (!userId) {
      console.error('HyphenBox useEffect: userId is missing. SDK will not be initialized.');
      return; // Exit useEffect early if no userId
    }

    if (initializedRef.current) {
      return;
    }

    const script = document.createElement('script');
    // Load from the public folder directly
    script.src = 'https://hyphenbox-clientsdk.pages.dev/flow.js'; 
    script.async = true;
    script.onload = () => {
      // Ensure window.Hyphenbox is available
      if (window.Hyphenbox && typeof window.Hyphenbox.initialize === 'function') {
        window.hyphenSDKInstance = window.Hyphenbox.initialize({
          apiKey,
          userId, // REQUIRED: User ID from your authentication system
          userName, // OPTIONAL: User's display name
          debug: true, // Consider making this configurable or tied to an environment variable
          useDefaultLauncher: useDefaultLauncher 
        });
        initializedRef.current = true; 
        console.log('HyphenBox SDK Initialized. Default launcher:', useDefaultLauncher);
      } else {
        console.error('HyphenBox SDK not loaded or initialize function not found.');
      }
    };
    script.onerror = () => {
      console.error('Failed to load the HyphenBox SDK script from /flow.js');
    };
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [apiKey, userId, userName, useDefaultLauncher]); // Dependencies array ensures effect runs when these change

  // If userId is not provided, this component effectively renders nothing
  // and logs an error. The useEffect above also guards against this.
  if (!userId) {
    console.error('HyphenBox render: userId is missing. The component will render null.');
    return null;
  }
  
  // This component does not render any visible UI itself.
  // Its purpose is to inject the Hyphenbox script.
  return null;
}