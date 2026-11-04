import React, { useRef, useState, useLayoutEffect, useEffect, useCallback } from 'react';

export interface SlidingTabOption<T extends string> {
  id: T;
  label: React.ReactNode;
  ariaLabel?: string;
}

interface SlidingTabsProps<T extends string> {
  options: SlidingTabOption<T>[];
  value: T;
  onChange: (val: T) => void;
  ariaLabel?: string;
  className?: string;
  buttonClassName?: string;
  activePillClassName?: string;
}

export function SlidingTabs<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className = '',
  buttonClassName = '',
  activePillClassName = '',
}: SlidingTabsProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [pillRect, setPillRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [isReady, setIsReady] = useState(false);

  const activeIndex = Math.max(0, options.findIndex((opt) => opt.id === value));

  const updatePill = useCallback(() => {
    const container = containerRef.current;
    const activeButton = buttonRefs.current[activeIndex];
    if (!container || !activeButton) return;

    const left = activeButton.offsetLeft;
    const top = activeButton.offsetTop;
    const width = activeButton.offsetWidth;
    const height = activeButton.offsetHeight;

    setPillRect({ left, top, width, height });
  }, [activeIndex]);

  // Recalculate on value change or options length change
  useLayoutEffect(() => {
    updatePill();
  }, [updatePill, value, options.length]);

  // Handle mount transition suppression and window resizing
  useEffect(() => {
    updatePill();
    const frameId = requestAnimationFrame(() => {
      updatePill();
      setIsReady(true);
    });

    const handleResize = () => {
      updatePill();
    };

    window.addEventListener('resize', handleResize);

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      observer = new ResizeObserver(() => {
        updatePill();
      });
      observer.observe(containerRef.current);
    }

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (observer) observer.disconnect();
    };
  }, [updatePill]);

  return (
    <div
      ref={containerRef}
      role="radiogroup"
      aria-label={ariaLabel}
      className={`relative ${className}`}
    >
      {/* Animated Sliding Active White Pill */}
      {pillRect && (
        <div
          aria-hidden="true"
          className={`absolute rounded-[22px] bg-white pointer-events-none shadow-[0_2px_10px_rgba(0,0,0,0.35)] z-0 ${
            isReady ? 'transition-all duration-280 ease-[cubic-bezier(0.16,1,0.3,1)]' : 'transition-none'
          } ${activePillClassName}`}
          style={{
            transform: `translate3d(${pillRect.left}px, ${pillRect.top}px, 0)`,
            width: `${pillRect.width}px`,
            height: `${pillRect.height}px`,
          }}
        />
      )}

      {/* Tab Options */}
      {options.map((opt, idx) => {
        const isSelected = opt.id === value;
        return (
          <button
            key={opt.id}
            ref={(el) => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            role="radio"
            aria-checked={isSelected}
            aria-label={opt.ariaLabel}
            onClick={() => onChange(opt.id)}
            className={`pill-btn btn-press relative z-10 select-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#4ADE80] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0b] ${buttonClassName} ${
              isSelected
                ? pillRect
                  ? '!border-transparent !bg-transparent text-neutral-950 font-bold'
                  : '!bg-white !border-white text-neutral-950 font-bold'
                : '!bg-white/[0.06] border border-white/20 text-white/90 hover:text-white hover:border-white/40 font-medium'
            }`}
          >
            <span className="relative z-10 pointer-events-none">
              {opt.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
