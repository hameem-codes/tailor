import React, { useState, useEffect } from 'react';

interface BrandConfig {
  src: string;
  alt: string;
  height: number;
  invertOnDark: boolean;
  style?: React.CSSProperties;
  textSuffix?: string;
}

const BRAND_CONFIGS: Record<string, BrandConfig> = {
  'h&m': {
    src: '/logos/hm.svg',
    alt: 'H&M',
    height: 26,
    invertOnDark: false,
  },
  'zara': {
    src: '/logos/zara.svg',
    alt: 'ZARA',
    height: 24,
    invertOnDark: true,
  },
  'uniqlo': {
    src: '/logos/uniqlo.svg',
    alt: 'UNIQLO',
    height: 28,
    invertOnDark: false,
    textSuffix: 'UNIQLO',
    style: { borderRadius: '4px' },
  },
  'uniqlo u': {
    src: '/logos/uniqlou.svg',
    alt: 'UNIQLO U',
    height: 30,
    invertOnDark: false,
  },
  'gap': {
    src: '/logos/gap.svg',
    alt: 'GAP',
    height: 28,
    invertOnDark: false,
    textSuffix: 'GAP',
    style: { borderRadius: '3px' },
  },
  'nike': {
    src: '/logos/nike.svg',
    alt: 'Nike',
    height: 22,
    invertOnDark: true,
  },
  'cos': {
    src: '/logos/cos.svg',
    alt: 'COS',
    height: 22,
    invertOnDark: false,
  },
  "levi's": {
    src: '/logos/levis.svg',
    alt: "Levi's",
    height: 24,
    invertOnDark: false,
  },
  'levis': {
    src: '/logos/levis.svg',
    alt: "Levi's",
    height: 24,
    invertOnDark: false,
  },
  'asos': {
    src: '/logos/asos.svg',
    alt: 'ASOS',
    height: 22,
    invertOnDark: true,
  },
  'asos design': {
    src: '/logos/asos.svg',
    alt: 'ASOS Design',
    height: 22,
    invertOnDark: true,
  },
  'ralph lauren': {
    src: '/logos/ralph-lauren.svg',
    alt: 'Ralph Lauren',
    height: 18,
    invertOnDark: true,
  },
  'mango': {
    src: '/logos/mango.svg',
    alt: 'Mango',
    height: 18,
    invertOnDark: true,
  },
  'muji': {
    src: '/logos/muji.svg',
    alt: 'MUJI',
    height: 26,
    invertOnDark: false,
  },
};

export interface BrandLogoProps {
  brand: string;
  className?: string;
  maxHeight?: number;
  maxWidth?: number;
  fallbackClassName?: string;
  hideTextSuffix?: boolean;
}

const getLogoSrc = (src: string) => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  return `${base}${src.startsWith('/') ? src : `/${src}`}`;
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  brand,
  className = '',
  maxHeight,
  maxWidth,
  fallbackClassName = 'font-barlow text-2xl sm:text-[28px] font-semibold text-white tracking-wide truncate max-w-full',
  hideTextSuffix = false,
}) => {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setHasError(false);
  }, [brand]);

  const normalized = brand.trim().toLowerCase();
  const config = BRAND_CONFIGS[normalized];

  if (!config || hasError) {
    return (
      <span className={`inline-block tracking-wide select-none ${fallbackClassName}`}>
        {brand}
      </span>
    );
  }

  const renderHeight = maxHeight ?? config.height;

  return (
    <div className="inline-flex items-center gap-2.5 select-none" title={brand}>
      <img
        src={getLogoSrc(config.src)}
        alt={config.alt}
        loading="lazy"
        decoding="async"
        className={`object-contain transition-opacity duration-200 ${
          maxWidth ? '' : 'max-w-[130px] sm:max-w-[160px]'
        } ${
          config.invertOnDark ? 'brightness-0 invert' : ''
        } ${className}`}
        style={{
          height: `${renderHeight}px`,
          maxHeight: `${renderHeight}px`,
          ...(maxWidth ? { maxWidth: `${maxWidth}px` } : {}),
          ...config.style,
        }}
        onError={() => setHasError(true)}
      />
      {config.textSuffix && !hideTextSuffix && (
        <span
          className={`font-barlow font-bold tracking-wider text-white ${
            renderHeight >= 40 ? 'text-3xl sm:text-4xl' : 'text-2xl'
          }`}
        >
          {config.textSuffix}
        </span>
      )}
    </div>
  );
};
