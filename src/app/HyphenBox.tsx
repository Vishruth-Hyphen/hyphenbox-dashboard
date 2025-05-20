import React, { useEffect } from 'react';

// Declare global type for Hyphenbox on the window object
declare global {
  interface Window {
    Hyphenbox: {
      initialize: (config: {
        apiKey: string;
        userId: string; // Must be provided
        userName?: string; // Optional
        debug?: boolean;
      }) => void;
    };
  }
}

interface HyphenBoxProps {
  apiKey: string;
  userId: string; // Required - must be a valid string
  userName?: string; // Optional
}

export default function HyphenBox({ apiKey, userId, userName }: HyphenBoxProps) {
  // Validate userId is provided
  if (!userId) {
    console.error('HyphenBox requires a userId to function properly');
    return null;
  }

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://hyphenbox-clientsdk.pages.dev/flow.js';
    script.async = true;
    script.onload = () => {
      window.Hyphenbox.initialize({
        apiKey,
        userId, // REQUIRED: User ID from your authentication system
        userName, // OPTIONAL: User's display name
        debug: true
      });
      // Button will automatically appear in the bottom right
    };
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [apiKey, userId, userName]);
  
  return null;
}