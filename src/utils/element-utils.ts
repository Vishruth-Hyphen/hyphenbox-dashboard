/**
 * Determines if a cursor flow step has a valid screenshot
 * @param step The cursor flow step to check
 * @returns Boolean indicating if the step has a valid screenshot to display
 */
export const hasValidScreenshot = (step: any): boolean => {
  // Check if the step has a non-empty screenshot_url
  return Boolean(step?.screenshot_url);
};

/**
 * Gets the step type from step data
 * @param step The cursor flow step to analyze
 * @returns The step type ('click' or 'navigation')
 */
export const getStepType = (step: any): 'click' | 'navigation' => {
  if (!step || !step.step_data) return 'click'; // Default to click if no data
  
  // Check the 'type' field in step_data
  const type = step.step_data.type?.toLowerCase();
  return type === 'navigation' ? 'navigation' : 'click';
};

/**
 * Gets the navigation URL from a step if it's a navigation step
 * @param step The cursor flow step to extract URL from
 * @returns The navigation URL or null if not available
 */
export const getNavigationUrl = (step: any): string | null => {
  if (getStepType(step) !== 'navigation') return null;
  
  // Extract URL from pageInfo for navigation steps
  return step?.step_data?.pageInfo?.url || null;
};

/**
 * Gets a formatted display URL for a navigation step
 * @param step The cursor flow step
 * @returns Formatted URL string or "Unknown URL" if not available
 */
export const getDisplayUrl = (step: any): string => {
  const url = getNavigationUrl(step);
  if (!url) return "Unknown URL";
  
  try {
    // Try to create a cleaner URL display
    const urlObj = new URL(url);
    return urlObj.hostname + urlObj.pathname;
  } catch (e) {
    // If URL parsing fails, return the original
    return url;
  }
};

/**
 * Truncates a URL by removing the query string (everything after '?')
 * @param url The URL to truncate
 * @returns Truncated URL without query parameters
 */
export const truncateUrl = (url: string | null): string => {
  if (!url) return 'Unknown URL';
  
  // Split the URL at the first question mark and keep only the first part
  const truncatedUrl = url.split('?')[0];
  return truncatedUrl;
};

/**
 * Extracts the cursor position from step data
 * @param step The cursor flow step
 * @returns An object with x and y coordinates, or null if not available
 */
export const getCursorPosition = (step: any): { x: number, y: number } | null => {
  if (!step?.step_data?.position) return null;
  
  return {
    x: step.step_data.position.x,
    y: step.step_data.position.y
  };
};

/**
 * Gets the element text content from step data
 * @param step The cursor flow step
 * @returns The clicked element's text content or null if not available
 */
export const getClickedText = (step: any): string | null => {
  return step?.step_data?.element?.textContent || null;
};

/**
 * Gets the element type that was clicked
 * @param step The cursor flow step
 * @returns The tag name of the clicked element (e.g., "BUTTON", "DIV")
 */
export const getElementTagName = (step: any): string | null => {
  return step?.step_data?.element?.tagName || null;
};

/**
 * Calculates the cursor position as percentage values relative to the image size
 * This is necessary to position the cursor overlay correctly regardless of image size
 * @param step The cursor flow step
 * @returns Position as percentage values of the container
 */
export const getCursorPositionPercentage = (step: any) => {
  if (!step || !step.step_data || !step.step_data.position) return null;
  
  // Get cursor position from step data
  const cursorPosition = {
    x: step.step_data.position.x,
    y: step.step_data.position.y
  };
  
  // Get viewport data from step data
  const viewport = step.step_data.element?.viewport || {
    width: 1920, // fallback values if viewport data isn't available
    height: 1080,
    scrollX: 0,
    scrollY: 0,
    devicePixelRatio: 1
  };
  
  // Calculate absolute position (accounting for scroll)
  const absoluteX = cursorPosition.x + (viewport.scrollX || 0);
  const absoluteY = cursorPosition.y + (viewport.scrollY || 0);
  
  // Calculate percentages based on viewport dimensions
  const xPercent = (absoluteX / viewport.width) * 100;
  const yPercent = (absoluteY / viewport.height) * 100;
  
  return {
    xPercent,
    yPercent
  };
}; 