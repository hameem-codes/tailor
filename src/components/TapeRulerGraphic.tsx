import React from 'react';

export const TapeRulerGraphic: React.FC<{ className?: string }> = ({ className = '' }) => {
  // Generate 35 tick marks of varying heights, highlighting key ticks in accent green
  const ticks = Array.from({ length: 35 }, (_, i) => {
    const isMajor = i % 5 === 0;
    const isGreen = i === 15 || i === 25; // Highlighted green marks matching design
    const height = isMajor ? 30 : (i % 5 === 2 || i % 5 === 3) ? 16 : 22;
    return {
      x: 8 + i * 10,
      height,
      color: isGreen ? '#4ADE80' : isMajor ? 'rgba(255, 255, 255, 0.45)' : 'rgba(255, 255, 255, 0.22)',
      strokeWidth: isGreen ? 2.5 : 1.5,
    };
  });

  return (
    <svg
      viewBox="0 0 360 42"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`w-full max-w-[360px] h-11 ${className}`}
      aria-hidden="true"
    >
      {ticks.map((t, idx) => (
        <line
          key={idx}
          x1={t.x}
          y1={42 - t.height}
          x2={t.x}
          y2={42}
          stroke={t.color}
          strokeWidth={t.strokeWidth}
          strokeLinecap="round"
        />
      ))}
    </svg>
  );
};

