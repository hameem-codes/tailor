import React from 'react';

interface RangeRulerProps {
  userValueText: string;
  userDotPercent: number;
  primaryBarLeftPercent: number;
  primaryBarWidthPercent: number;
  primaryBarColor: string;
  secondaryBarLeftPercent?: number;
  secondaryBarWidthPercent?: number;
  secondaryBarColor?: string;
  className?: string;
  accessibleDescription?: string;
}

export const RangeRuler: React.FC<RangeRulerProps> = ({
  userValueText,
  userDotPercent,
  primaryBarLeftPercent,
  primaryBarWidthPercent,
  primaryBarColor,
  secondaryBarLeftPercent,
  secondaryBarWidthPercent,
  secondaryBarColor,
  className = '',
  accessibleDescription,
}) => {
  return (
    <div
      className={`ruler-track ${className}`}
      role="img"
      aria-label={accessibleDescription || `Size range ruler: ${userValueText}`}
    >
      {/* Primary Size Range Bar */}
      <i
        className="ruler-fill"
        style={{
          left: `${primaryBarLeftPercent}%`,
          width: `${primaryBarWidthPercent}%`,
          backgroundColor: primaryBarColor,
        }}
      />

      {/* Secondary Size Range Bar (for Between Sizes) */}
      {secondaryBarLeftPercent !== undefined && secondaryBarWidthPercent !== undefined && (
        <i
          className="ruler-fill"
          style={{
            left: `${secondaryBarLeftPercent}%`,
            width: `${secondaryBarWidthPercent}%`,
            backgroundColor: secondaryBarColor || primaryBarColor,
          }}
        />
      )}

      {/* User Dot Indicator with Label */}
      <b
        className="ruler-dot"
        style={{
          left: `${userDotPercent}%`,
        }}
      >
        <u className="ruler-dot-label">{userValueText}</u>
      </b>
    </div>
  );
};
