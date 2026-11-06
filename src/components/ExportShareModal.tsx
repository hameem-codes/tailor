import React, { useState, useRef } from 'react';
import { BrandMatchResult, UserMeasurements } from '../types';
import { encodeShareData } from '../lib/storage';
import { useModalBehavior } from './shared/useModalBehavior';
import { CheckIcon, ShareIcon } from './Icons';

interface ExportShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  measurements: UserMeasurements;
  results: BrandMatchResult[];
}

export const ExportShareModal: React.FC<ExportShareModalProps> = ({
  isOpen,
  onClose,
  measurements,
  results,
}) => {
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSummary, setCopiedSummary] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Escape to close, focus trapped, background scroll locked, focus restored.
  useModalBehavior(isOpen, onClose, panelRef);

  if (!isOpen) return null;

  // Generate shareable URL with encoded measurements
  const encoded = encodeShareData(measurements);
  const shareUrl = `${window.location.origin}${window.location.pathname.replace(/\/results.*$/, '')}?m=${encoded}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch (e) {
      // fallback
      const input = document.createElement('input');
      input.value = shareUrl;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const generateSummaryText = () => {
    const isPants = measurements.category === 'pants';
    const topMatches = results.slice(0, 8);
    const lines = [
      `🧵 My Tailor Size Profile`,
      `Profile: ${measurements.gender.toUpperCase()} · ${measurements.category.toUpperCase()} (${measurements.fitPreference} fit)`,
      `Measurements: Height ${Math.round(measurements.height)} cm · Weight ${Math.round(measurements.weight)} kg${
        isPants
          ? measurements.waist ? ` · Waist ${measurements.waist} cm` : ''
          : measurements.chest ? ` · Chest ${measurements.chest} cm` : ''
      }`,
      ``,
      `Top Brand Sizes:`,
      ...topMatches.map((m) => `• ${m.brandChart.brand}: Size ${m.recommendedSize} (${m.matchStatus === 'great' ? 'Great match' : m.matchStatus === 'between' ? 'Between sizes' : 'Closest fit'})`),
      ``,
      `Calculated with Tailor · Check your sizes: ${shareUrl}`,
    ];
    return lines.join('\n');
  };

  const handleCopySummary = async () => {
    try {
      await navigator.clipboard.writeText(generateSummaryText());
      setCopiedSummary(true);
      setTimeout(() => setCopiedSummary(false), 2500);
    } catch (e) {
      // Clipboard may be unavailable (insecure context, denied permission).
      // The summary stays on screen for manual copy, so swallow the error
      // rather than logging a console warning.
      void e;
    }
  };

  const handleDownloadJson = () => {
    const payload = {
      app: 'Tailor',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      userMeasurements: measurements,
      recommendedSizes: results.map((r) => ({
        brand: r.brandChart.brand,
        size: r.recommendedSize,
        matchStatus: r.matchStatus,
        range: r.chestRangeText,
        confidence: r.confidence,
        tip: r.tip,
      })),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tailor-${measurements.gender}-${measurements.category}-sizes.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke on the next tick so the download has actually started.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="export-modal-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-lg glass-card !bg-[#12141a]/92 backdrop-blur-3xl border border-white/12 rounded-t-[28px] sm:rounded-[28px] p-5 sm:p-7 shadow-[0_25px_70px_rgba(0,0,0,0.85)] flex flex-col gap-4 sm:gap-5 max-h-[90dvh] overflow-y-auto animate-modal-pop"
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-[#1DA84A]/20 border border-[#4ADE80]/40 flex items-center justify-center text-[#4ADE80]">
              <ShareIcon size={18} />
            </div>
            <div>
              <h2 id="export-modal-title" className="font-barlow text-2xl font-bold text-white tracking-wide">
                Share & Export Sizes
              </h2>
              <p className="text-xs sm:text-sm text-secText mt-0.5">
                Share your custom fit link or download your complete size breakdown
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="circle-btn btn-press text-base flex-none"
            aria-label="Close export dialog"
          >
            ×
          </button>
        </div>

        {/* Option 1: Shareable Link */}
        <div className="flex flex-col gap-2 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
          <label className="text-xs sm:text-sm font-semibold text-white flex items-center justify-between">
            <span>Shareable URL with your measurements</span>
            {copiedLink && (
              <span className="text-xs text-[#4ADE80] font-bold flex items-center gap-1 animate-fade-in">
                <CheckIcon size={12} /> Copied to clipboard!
              </span>
            )}
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              aria-label="Shareable URL with your measurements"
              className="flex-1 bg-black/40 border border-white/15 rounded-xl px-3 py-2 text-xs text-white/90 font-mono truncate outline-none select-all focus-visible:ring-2 focus-visible:ring-accent"
            />
            <button
              onClick={handleCopyLink}
              className={`pill-btn btn-press !px-3.5 text-xs font-semibold whitespace-nowrap flex-none ${
                copiedLink ? '!bg-[#15803D] text-white' : ''
              }`}
            >
              {copiedLink ? 'Copied' : 'Copy link'}
            </button>
          </div>
          <p className="text-[11px] text-secText leading-snug">
            Anyone opening this URL will instantly load your size matches across all brands.
          </p>
        </div>

        {/* Option 2: Copy Text Summary */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
          <div>
            <div className="text-xs sm:text-sm font-semibold text-white">
              Copy Text Summary
            </div>
            <div className="text-[11px] text-secText leading-snug mt-0.5 max-w-[280px]">
              Formatted list of your top brand sizes for texting, notes, or messaging
            </div>
          </div>
          <button
            onClick={handleCopySummary}
            className={`pill-btn btn-press !px-3.5 text-xs font-semibold whitespace-nowrap flex-none ${
              copiedSummary ? '!bg-[#15803D] text-white' : ''
            }`}
          >
            {copiedSummary ? '✓ Copied' : 'Copy summary'}
          </button>
        </div>

        {/* Option 3: Download JSON */}
        <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white/[0.04] border border-white/10">
          <div>
            <div className="text-xs sm:text-sm font-semibold text-white">
              Download JSON Data
            </div>
            <div className="text-[11px] text-secText leading-snug mt-0.5 max-w-[280px]">
              Complete machine-readable profile with all brand ranges and confidence scores
            </div>
          </div>
          <button
            onClick={handleDownloadJson}
            className="pill-btn btn-press !px-3.5 text-xs font-semibold whitespace-nowrap flex-none hover:border-[#4ADE80]"
          >
            Download .json
          </button>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-white/10">
          <button
            onClick={onClose}
            className="pill-btn btn-press !px-5 text-xs font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

