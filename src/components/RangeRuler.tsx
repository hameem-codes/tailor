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
  // Clamp dot position safely within track bounds (0 to 100)
  const clampedPercent = Number.isFinite(userDotPercent)
    ? Math.max(0, Math.min(100, userDotPercent))
    : 50;

  return (
    <div
      className={`ruler-track ${className}`}
      role="img"
      aria-label={accessibleDescription || `Size range ruler: ${userValueText}`}
    >
      {/* Primary Size Range Bar */}
      <div
        aria-hidden="true"
        className="ruler-fill"
        style={{
          left: `${primaryBarLeftPercent}%`,
          width: `${primaryBarWidthPercent}%`,
          backgroundColor: primaryBarColor,
        }}
      />

      {/* Secondary Size Range Bar (for Between Sizes) */}
      {secondaryBarLeftPercent !== undefined && secondaryBarWidthPercent !== undefined && (
        <div
          aria-hidden="true"
          className="ruler-fill"
          style={{
            left: `${secondaryBarLeftPercent}%`,
            width: `${secondaryBarWidthPercent}%`,
            backgroundColor: secondaryBarColor || primaryBarColor,
          }}
        />
      )}

      {/* User Dot Indicator with Label:
          - Dynamic translateX(-${clampedPercent}%) prevents the label from ever spilling outside the card box.
          - At 0% (left end), translateX(0%) anchors text to the right into the track.
          - At 100% (right end), translateX(-100%) anchors text to the left into the track.
          - At 50%, text is centered directly over the dot. */}
      <div
        aria-hidden="true"
        className="ruler-dot"
        style={{
          left: `${clampedPercent}%`,
        }}
      >
        <span
          className="ruler-dot-label"
          style={{
            transform: `translateX(-${clampedPercent}%)`,
          }}
        >
          {userValueText}
        </span>
      </div>
    </div>
  );
};

