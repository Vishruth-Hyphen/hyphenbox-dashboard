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