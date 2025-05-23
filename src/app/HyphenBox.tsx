import React, { useEffect } from 'react';

// Global type declaration for Hyphenbox
declare global {
  interface Window {
    Hyphenbox: {
      initialize: (config: {
        apiKey: string;
        userId: string;
        userName?: string;
        debug?: boolean;
        useDefaultLauncher?: boolean; // When true, shows "Help & Guides" button automatically
      }) => {
        onboarding: {
          show: () => void;
        };
        copilot: {
          show: () => void;
        };
        viewAllGuides: {
          show: () => void;
        };
      };
    };
    hyphenSDKInstance?: {
      onboarding: {
        show: () => void;
      };
      copilot: {
        show: () => void;
      };
      viewAllGuides: {
        show: () => void;
      };
    };
  }
}

interface HyphenBoxProps {
  apiKey: string;
  userId: string;
  userName?: string;
  debug?: boolean;
  useDefaultLauncher?: boolean; // When true (default), shows the "Help & Guides" button automatically
}

/**
 * Hyphenbox Integration Component
 * 
 * This is the only component you need to add Hyphenbox to your app.
 * 
 * @param apiKey - Your Hyphenbox API key
 * @param userId - Unique identifier for the user (required)
 * @param userName - Display name for the user (optional)
 * @param debug - Enable debug mode (optional, default: false)
 * @param useDefaultLauncher - Show default "Help & Guides" button (optional, default: true)
 * 
 * Usage:
 * ```jsx
 * // Option 1: With default launcher (shows "Help & Guides" button automatically)
 * <HyphenBox apiKey="your-key" userId="user123" userName="John" />
 * 
 * // Option 2: Manual control (no default button, you trigger manually)
 * <HyphenBox apiKey="your-key" userId="user123" useDefaultLauncher={false} />
 * 
 * // Then trigger onboarding anywhere:
 * const handleStartOnboarding = () => {
 *   window.hyphenSDKInstance?.onboarding?.show();
 * };
 * ```
 */
export default function HyphenBox({ 
  apiKey, 
  userId, 
  userName, 
  debug = false, 
  useDefaultLauncher = true 
}: HyphenBoxProps) {
  useEffect(() => {
    if (!userId || !apiKey) {
      console.warn('HyphenBox: apiKey and userId are required');
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://hyphenbox-clientsdk.pages.dev/flow.js';
    script.async = true;
    script.onload = () => {
      if (window.Hyphenbox?.initialize) {
        // Initialize the SDK and store instance globally for manual access
        const sdkInstance = window.Hyphenbox.initialize({
          apiKey,
          userId,
          userName,
          debug,
          useDefaultLauncher // This controls whether the default "Help & Guides" button appears
        });
        
        // Make SDK available globally for manual triggering
        window.hyphenSDKInstance = sdkInstance;
        
        if (debug) {
          console.log('HyphenBox initialized successfully', {
            useDefaultLauncher,
            userId,
            userName
          });
        }
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load HyphenBox SDK');
    };
    
    document.body.appendChild(script);
    
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, [apiKey, userId, userName, debug, useDefaultLauncher]);

  return null;
}