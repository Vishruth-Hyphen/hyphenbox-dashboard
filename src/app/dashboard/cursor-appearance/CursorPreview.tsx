import React from 'react';

interface CursorPreviewProps {
  brandColor: string;
  cursorName: string;
}

// Basic SVG Arrow (Placeholder - replace with actual cursor.svg path data if available)
// Adjusted viewBox and path for a typical cursor arrow shape.
const CursorSvg = ({ color }: { color: string }) => (
  <svg
    width="24" // Set a fixed size for consistency
    height="24"
    viewBox="0 0 24 24" // Use viewBox from arrowhead.svg
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    style={{ transform: 'rotate(0deg)' }} // Keep default orientation
  >
    {/* Use path data from arrowhead.svg */}
    <path
      d="M5.5 3.21V20.8c0 .45.54.67.85.35l4.86-4.86a.5.5 0 0 1 .35-.15h6.87a.5.5 0 0 0 .35-.85L6.35 2.85a.5.5 0 0 0-.85.35Z"
      fill={color} // Apply the brand color here
      stroke="#FFFFFF" // Keep white stroke for preview visibility
      strokeWidth="1" // Use stroke-width from arrowhead.svg
      // strokeLinecap="round"
      // strokeLinejoin="round"
    />
  </svg>
);


const CursorPreview: React.FC<CursorPreviewProps> = ({ brandColor, cursorName }) => {
  // Validate hex color format basic check
  const isValidColor = /^#[A-Fa-f0-9]{6}$/.test(brandColor);
  const displayColor = isValidColor ? brandColor : '#CCCCCC'; // Use gray if invalid
  const displayLabel = cursorName.trim() || "Your Company"; // Default text if empty

  return (
    <div
      className="hyphen-cursor-container"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        transformOrigin: 'top left',
        // Add some basic positioning if needed, otherwise relies on flex parent
      }}
    >
      {/* Cursor SVG */}
      <div
        className="hyphen-cursor"
        style={{
          position: 'relative', // Needed for label positioning potentially
          display: 'flex',
          alignItems: 'center',
          // transform: 'translate(-1px, -1px)', // Minor adjustments like in original code
        }}
      >
        <CursorSvg color={displayColor} />
      </div>

      {/* Company Label */}
      <div
        className="hyphen-company-label"
        style={{
          backgroundColor: displayColor, // Use the validated/default color
          color: 'white', // Assuming white text contrasts well enough
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '12px',
          fontWeight: 500,
          marginLeft: '4px', // Adjust spacing between cursor and label
          whiteSpace: 'nowrap',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          // transform: 'translateY(2px)', // Minor vertical adjustment
          transition: 'background-color 0.2s ease', // Smooth color change
        }}
      >
        {displayLabel}
      </div>
    </div>
  );
};

export default CursorPreview; 