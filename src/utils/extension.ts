/**
 * Utility functions for interacting with the Chrome extension from the website
 */

// Get the extension ID from environment variable
const getExtensionId = (): string | null => {
  return process.env.NEXT_PUBLIC_CHROME_EXTENSION_ID || null;
};

/**
 * Check if Chrome extension API is available
 */
const isChromeExtensionAPIAvailable = (): boolean => {
  return typeof window !== 'undefined' && 
         // @ts-ignore
         typeof window.chrome !== 'undefined' && 
         // @ts-ignore
         typeof window.chrome.runtime !== 'undefined' &&
         // @ts-ignore
         typeof window.chrome.runtime.sendMessage !== 'undefined';
};

/**
 * Check if the Chrome extension is installed and available
 * @returns Promise<boolean> - true if extension is available
 */
export const isExtensionAvailable = async (): Promise<boolean> => {
  const extensionId = getExtensionId();
  if (!extensionId) {
    console.warn('[Extension] No extension ID configured');
    return false;
  }

  if (!isChromeExtensionAPIAvailable()) {
    console.log('[Extension] Chrome extension API not available');
    return false;
  }

  try {
    // Try to send a ping message to check if extension is available
    const response = await new Promise<any>((resolve, reject) => {
      // @ts-ignore
      window.chrome.runtime.sendMessage(extensionId, { type: 'PING' }, (response: any) => {
        // @ts-ignore
        if (window.chrome?.runtime?.lastError) {
          // @ts-ignore
          reject(window.chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
    
    return !!response?.success;
  } catch (error) {
    console.log('[Extension] Extension not available:', error);
    return false;
  }
};

/**
 * Open the Chrome extension sidepanel
 * @returns Promise<boolean> - true if sidepanel was opened successfully
 */
export const openExtensionSidepanel = async (): Promise<boolean> => {
  const extensionId = getExtensionId();
  if (!extensionId) {
    console.error('[Extension] No extension ID configured');
    return false;
  }

  if (!isChromeExtensionAPIAvailable()) {
    console.error('[Extension] Chrome extension API not available');
    return false;
  }

  try {
    const response = await new Promise<any>((resolve, reject) => {
      // @ts-ignore
      window.chrome.runtime.sendMessage(extensionId, { type: 'OPEN_SIDEPANEL' }, (response: any) => {
        // @ts-ignore
        if (window.chrome?.runtime?.lastError) {
          // @ts-ignore
          reject(window.chrome.runtime.lastError);
        } else {
          resolve(response);
        }
      });
    });
    
    return !!response?.success;
  } catch (error) {
    console.error('[Extension] Failed to open sidepanel:', error);
    return false;
  }
};

/**
 * Open extension sidepanel with fallback to upload dialog
 * This function first tries to open the extension sidepanel, and if that fails,
 * falls back to opening the upload dialog
 * @param fallbackAction - Function to call if extension is not available
 * @param onExtensionNotFound - Optional callback when extension is not found
 */
export const openSidepanelOrFallback = async (
  fallbackAction: () => void, 
  onExtensionNotFound?: () => void
): Promise<void> => {
  const extensionAvailable = await isExtensionAvailable();
  
  if (extensionAvailable) {
    const sidepanelOpened = await openExtensionSidepanel();
    if (sidepanelOpened) {
      console.log('[Extension] Sidepanel opened successfully');
      return;
    }
  } else if (onExtensionNotFound) {
    onExtensionNotFound();
  }
  
  // Fallback to the original upload dialog
  console.log('[Extension] Using fallback action (upload dialog)');
  fallbackAction();
}; 