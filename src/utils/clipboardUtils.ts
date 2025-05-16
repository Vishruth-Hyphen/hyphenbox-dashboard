export async function copyToClipboard(text: string): Promise<void> {
  if (!navigator.clipboard) {
    // Clipboard API not available (e.g., insecure context, old browser)
    // Fallback to execCommand (less secure, deprecated, but better than nothing)
    try {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed"; // Prevent scrolling to bottom of page in MS Edge.
      textArea.style.opacity = "0"; // Hide the textarea
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const successful = document.execCommand("copy");
      document.body.removeChild(textArea);
      if (successful) {
        return Promise.resolve();
      }
      return Promise.reject(new Error("Fallback copy command was unsuccessful."));
    } catch (err) {
      return Promise.reject(new Error("Failed to copy text using fallback method."));
    }
  }

  return navigator.clipboard.writeText(text);
} 