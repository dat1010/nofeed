import React from 'react';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  animated?: boolean;
}

const Logo: React.FC<LogoProps> = ({ size = 32, showText = false, className = '', animated = false }) => {
  const logoClasses = `logo-container ${animated ? 'landing-logo' : 'navbar-logo'} ${className}`;
  
  return (
    <div className={logoClasses} style={{ display: 'flex', alignItems: 'center', gap: showText ? '12px' : '0' }}>
      <svg 
        width={size} 
        height={size} 
        viewBox="0 0 512 512" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Background circle */}
        <circle cx="256" cy="256" r="240" fill="#1a1a1a" stroke="#4ecdc4" strokeWidth="4"/>
        
        {/* Main icon - represents breaking away from feed */}
        <g transform="translate(256, 256)">
          {/* Feed lines (representing traditional social media feed) */}
          <rect x="-120" y="-80" width="240" height="8" rx="4" fill="#666" opacity="0.3"/>
          <rect x="-120" y="-60" width="200" height="8" rx="4" fill="#666" opacity="0.3"/>
          <rect x="-120" y="-40" width="220" height="8" rx="4" fill="#666" opacity="0.3"/>
          <rect x="-120" y="-20" width="180" height="8" rx="4" fill="#666" opacity="0.3"/>
          <rect x="-120" y="0" width="240" height="8" rx="4" fill="#666" opacity="0.3"/>
          <rect x="-120" y="20" width="200" height="8" rx="4" fill="#666" opacity="0.3"/>
          <rect x="-120" y="40" width="220" height="8" rx="4" fill="#666" opacity="0.3"/>
          <rect x="-120" y="60" width="180" height="8" rx="4" fill="#666" opacity="0.3"/>
          
          {/* Break/cross symbol */}
          <line x1="-40" y1="-40" x2="40" y2="40" stroke="#ff6b6b" strokeWidth="12" strokeLinecap="round"/>
          <line x1="40" y1="-40" x2="-40" y2="40" stroke="#ff6b6b" strokeWidth="12" strokeLinecap="round"/>
          
          {/* Alternative representation - person breaking free */}
          <circle cx="0" cy="-100" r="15" fill="#4ecdc4"/>
          <path d="M-15 -85 Q-25 -75 -15 -65 Q-5 -75 -15 -85" fill="#4ecdc4"/>
          <path d="M15 -85 Q25 -75 15 -65 Q5 -75 15 -85" fill="#4ecdc4"/>
        </g>
        
        {/* Text "NF" for NoFeed */}
        <text x="256" y="380" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="48" fontWeight="bold" fill="#ffffff">NF</text>
      </svg>
      {showText && (
        <span className="logo-text has-text-weight-bold is-size-4">NoFeed</span>
      )}
    </div>
  );
};

export default Logo; 