import React from 'react';

// Default/Fallback SVG Icon (CrazeHq)
const DefaultIcon = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 120 120"
    preserveAspectRatio="xMidYMid meet"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path fillRule="evenodd" clipRule="evenodd" d="M45.8279 17.974C51.7499 10.2867 62.482 6.7467 73.2959 9.56003C87.6159 13.2867 96.8479 26.8801 95.5919 41.2867C94.6679 52.0801 87.9479 61.3867 78.7199 65.8667L102.672 94.454C105.104 97.334 104.744 101.6 101.864 104.034C98.9839 106.4667 94.7119 106.1067 92.2799 103.2267L68.3279 74.64C63.0959 75.7067 57.6479 75.5601 52.4159 74.2134L28.4639 103.2267C26.0319 106.1067 21.7599 106.4667 18.8799 104.034C15.9999 101.6 15.6399 97.334 18.0719 94.454L42.0239 65.8667C33.1919 61.0934 26.6879 51.7067 25.5479 41.2867C23.8559 26.7067 32.7279 13.2667 45.8279 17.974ZM73.2959 63.5601C81.4159 63.5601 88.0719 56.9067 88.0719 48.7867C88.0719 40.6667 81.4159 34.0134 73.2959 34.0134C65.1759 34.0134 58.5199 40.6667 58.5199 48.7867C58.5199 56.9067 65.1759 63.5601 73.2959 63.5601Z" fill="#FF6B00"/>
    <path d="M45.8279 17.974C32.7279 13.2667 23.8559 26.7067 25.5479 41.2867C26.6879 51.7067 33.1919 61.0934 42.0239 65.8667M45.8279 17.974C51.7499 10.2867 62.482 6.7467 73.2959 9.56003C87.6159 13.2867 96.8479 26.8801 95.5919 41.2867C94.6679 52.0801 87.9479 61.3867 78.7199 65.8667M42.0239 65.8667L18.0719 94.454C15.6399 97.334 15.9999 101.6 18.8799 104.034C21.7599 106.4667 26.0319 106.1067 28.4639 103.2267L52.4159 74.2134M42.0239 65.8667C46.9159 68.0534 52.4159 69.0134 57.8799 68.8401M78.7199 65.8667L102.672 94.454C105.104 97.334 104.744 101.6 101.864 104.034C98.9839 106.4667 94.7119 106.1067 92.2799 103.2267L68.3279 74.64C63.0959 75.7067 57.6479 75.5601 52.4159 74.2134M78.7199 65.8667C76.9919 67.0801 75.1759 68.2134 73.2959 69.0134M52.4159 74.2134C54.3479 71.7467 56.1919 69.3867 57.8799 68.8401M57.8799 68.8401C62.9519 67.3067 68.0879 66.0134 73.2959 69.0134M73.2959 69.0134C77.0559 70.3067 80.6159 71.9467 83.8879 73.9467" stroke="#FF6B00" strokeWidth="8"/>
  </svg>
);

interface CoPilotButtonPreviewProps {
  logoUrl: string | null;
}

const CoPilotButtonPreview: React.FC<CoPilotButtonPreviewProps> = ({ logoUrl }) => {
  const buttonText = "Co-pilot"; // Default text from cursorFlow.ts

  return (
    <button
      className='hyphen-start-button-preview'
      style={{
        // Styles copied & adapted from createStartButton in uiComponents.ts
        padding: '10px 16px',
        backgroundColor: '#ffffff',
        color: '#1a1a1a',
        border: 'none',
        borderRadius: '12px',
        fontSize: '14px',
        fontWeight: 500,
        cursor: 'default', // Not clickable in preview
        boxShadow: '0 2px 12px rgba(0,0,0,0.1)',
        zIndex: 1, // Lower z-index for preview context
        display: 'inline-flex', // Use inline-flex for inline behavior
        alignItems: 'center',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        minHeight: '40px',
        transition: 'box-shadow 0.2s ease', // Basic transition
        position: 'relative', // Needed if using absolute positioning internally (like drag indicator in original)
      }}
      // Add hover effect simulation (optional, can be done with CSS pseudo-classes too)
      onMouseOver={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.12)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.1)';
      }}
    >
      <div
        className="hyphen-button-content"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}
      >
        <div
          className="hyphen-icon"
          style={{ display: 'flex', alignItems: 'center', width: '24px', height: '24px' }} // Ensure container has size
        >
          {logoUrl ? (
            <img 
              src={logoUrl}
              alt="Company Logo Preview"
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <DefaultIcon /> // Render default icon if no logoUrl
          )}
        </div>
        <span className="hyphen-text" style={{ whiteSpace: 'nowrap' }}>
          {buttonText}
        </span>
      </div>
    </button>
  );
};

export default CoPilotButtonPreview; 