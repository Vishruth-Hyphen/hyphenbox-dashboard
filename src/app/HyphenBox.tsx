import { useEffect } from 'react';

export default function HyphenBox() {
  useEffect(() => {
    // Load the script
    const script = document.createElement('script');
    script.src = 'https://hyphenbox-clientsdk.pages.dev/flow.js';
    script.async = true;
    
    // Initialize CursorFlow when script loads
    script.onload = () => {
      const cf = new (window as any).CursorFlow({
        organizationId: '7f296453-3705-46c6-8c7b-5901b3e76cae',
        debug: true // Enable debug logging
      });
      cf.init();
    };
    
    document.body.appendChild(script);  
    
    // Simple cleanup - just remove the script
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []); // Remove userContext dependency
  
  return null;
}