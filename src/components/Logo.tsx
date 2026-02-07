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
      <img
        src="/logo.svg"
        alt="NoFeed logo"
        width={size}
        height={size}
        style={{ display: 'block' }}
      />
      {showText && (
        <span className="logo-text has-text-weight-bold is-size-4">NoFeed</span>
      )}
    </div>
  );
};

export default Logo; 
