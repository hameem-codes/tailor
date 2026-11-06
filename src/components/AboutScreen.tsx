import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveLocalFeedback } from '../lib/storage';
import { HangerIcon } from './Icons';

interface AboutScreenProps {
  brandContext?: string;
  sizeContext?: string;
}

interface FAQItem {
  id: string;
  title: string;
  content: string;
}

interface FeedbackButtonConfig {
  key: 'well' | 'tight' | 'loose';
  emoji: string;
  label: string;
  active: string;
}

const FEEDBACK_BUTTONS: FeedbackButtonConfig[] = [
  {
    key: 'well',
    emoji: '✅',
    label: 'Fit well',
    active: 'bg-gradient-to-br from-[#1DA84A] to-[#15803d] border-[#4ADE80] text-white shadow-[0_4px_16px_rgba(29,168,74,0.35)]',
  },
  {
    key: 'tight',
    emoji: '😬',
    label: 'Too tight',
    active: 'bg-gradient-to-br from-[#FBBF24] to-[#D97706] border-[#FDE68A] text-black shadow-[0_4px_16px_rgba(251,191,36,0.3)]',
  },
  {
    key: 'loose',
    emoji: '👕',
    label: 'Too loose',
    active: 'bg-gradient-to-br from-[#F87171] to-[#DC2626] border-[#FECACA] text-white shadow-[0_4px_16px_rgba(248,113,113,0.3)]',
  },
];

const FAQ_ITEMS: FAQItem[] = [
  {
    id: 'privacy',
    title: 'Data and privacy',
    content:
      'Sizes come from official brand guides, cleaned and standardized. Your measurements stay on your device in local storage and are never stored, tracked, or sent to an external server.',
  },
  {
    id: 'differ',
    title: 'Why does my size differ across brands?',
    content:
      "Brands use different fit models and grading scales, meaning a Medium at ZARA is cut completely differently from a Medium at UNIQLO. Tailor checks your actual body measurements directly against each brand's true dimension ranges.",
  },
  {
    id: 'accuracy',
    title: 'How accurate is this?',
    content:
      'Accuracy is highest when chest, waist, and fit preference are provided. Tailor uses calibrated multi-dimensional bounds to calculate confidence. Results are designed as an expert buying guide.',
  },
];

const steps = [
  {
    num: 1,
    icon: '📏',
    title: 'Enter measurements',
    desc: 'Provide height, weight, and key body dimensions in cm or inches.',
    color: 'from-[#1DA84A]/20 to-[#1DA84A]/5',
    border: 'border-[#4ADE80]/20',
    glow: 'shadow-[0_0_30px_rgba(29,168,74,0.15)]',
  },
  {
    num: 2,
    icon: '⚖️',
    title: 'Compare charts',
    desc: 'We calibrate your numbers against official dimension charts across 10+ brands.',
    color: 'from-[#3B82F6]/20 to-[#3B82F6]/5',
    border: 'border-[#60A5FA]/20',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.12)]',
  },
  {
    num: 3,
    icon: '✅',
    title: 'Get your size',
    desc: 'Review your recommended size, match level, and visual ruler range per brand.',
    color: 'from-[#8B5CF6]/20 to-[#8B5CF6]/5',
    border: 'border-[#A78BFA]/20',
    glow: 'shadow-[0_0_30px_rgba(139,92,246,0.12)]',
  },
];

export const AboutScreen: React.FC<AboutScreenProps> = ({
  brandContext = 'General',
  sizeContext = 'M',
}) => {
  const navigate = useNavigate();
  const [feedbackGiven, setFeedbackGiven] = useState<'well' | 'tight' | 'loose' | null>(null);
  const [openAccordion, setOpenAccordion] = useState<string | null>(null);

  const handleFeedback = (sentiment: 'well' | 'tight' | 'loose') => {
    setFeedbackGiven(sentiment);
    saveLocalFeedback({
      brandId: brandContext,
      size: sizeContext,
      sentiment,
      timestamp: new Date().toISOString(),
    });
  };

  const handleGoBack = () => {
    if (window.history.length > 1 && window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/results', { replace: true });
    }
  };

  const toggleAccordion = (id: string) => {
    setOpenAccordion((prev) => (prev === id ? null : id));
  };

  return (
    <div className="relative min-h-[100dvh] w-full flex flex-col page-transition">
      {/* Full-screen dark gradient scrim for readability */}
      <div
        className="fixed inset-0 pointer-events-none z-0 bg-gradient-to-br from-[#0a0a0b]/75 via-[#0d0e10]/85 to-[#0a0a0b]/95"
        aria-hidden="true"
      />

      {/* Scrollable content wrapper */}
      <div className="relative z-10 w-full max-w-[720px] lg:max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 pb-32 flex flex-col gap-8 sm:gap-10">

        {/* ── HEADER ───────────────────────────────── */}
        <div className="flex items-center gap-4 animate-fade-in">
          <button
            onClick={handleGoBack}
            className="circle-btn btn-press !w-[44px] !h-[44px] !min-w-[44px] !min-h-[44px] !bg-white/10 hover:!bg-white/18 border border-white/15 text-white text-lg transition-all focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Go back"
          >
            ←
          </button>
          <div className="flex items-center gap-2.5">
            <HangerIcon size={28} className="text-[#4ADE80]" />
            <h1 className="font-barlow text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-wide leading-none">
              About Tailor
            </h1>
          </div>
        </div>

        {/* ── HERO SECTION ─────────────────────────── */}
        <section
          aria-labelledby="about-hero-title"
          className="glass-card p-6 sm:p-8 flex flex-col gap-5 animate-fade-in"
        >
          {/* Top accent line */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-[#4ADE80]/50 to-transparent" />
            <span className="text-[11px] font-bold uppercase tracking-widest text-[#4ADE80]">
              The Mission
            </span>
            <div className="h-px flex-1 bg-gradient-to-l from-[#4ADE80]/50 to-transparent" />
          </div>

          <div className="flex flex-col gap-3">
            <h2
              id="about-hero-title"
              className="font-barlow text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-wide leading-tight"
            >
              One size language for every brand
            </h2>
            <p className="text-sm sm:text-base lg:text-[17px] leading-relaxed text-[#C8C8D0]">
              Tailor matches your body measurements to real brand size charts, so a{' '}
              <span className="text-white font-semibold">Medium means the same thing everywhere</span>.
              Stop guessing — start buying with confidence.
            </p>
          </div>

          {/* Feature chips */}
          <div className="flex flex-wrap items-center gap-2">
            {[
              { icon: '●', label: '10+ brands', color: 'text-[#4ADE80]' },
              { icon: '🛡️', label: 'Stays on device', color: 'text-[#60A5FA]' },
              { icon: '✓', label: '100% Free', color: 'text-[#A78BFA]' },
              { icon: '📊', label: 'Official size charts', color: 'text-[#FBBF24]' },
            ].map((chip) => (
              <span
                key={chip.label}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.07] text-white border border-white/12 hover:bg-white/[0.12] transition-colors"
              >
                <span className={chip.color}>{chip.icon}</span>
                {chip.label}
              </span>
            ))}
          </div>
        </section>

        {/* ── HOW IT WORKS ─────────────────────────── */}
        <section aria-labelledby="how-it-works-title" className="flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center gap-3 px-1">
            <h3
              id="how-it-works-title"
              className="font-barlow text-xl sm:text-2xl font-bold uppercase tracking-widest text-white"
            >
              How it works
            </h3>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {steps.map((step, i) => (
              <div
                key={step.num}
                className={`relative glass-card bg-gradient-to-br ${step.color} ${step.border} border p-5 sm:p-6 flex flex-col gap-3 ${step.glow} overflow-hidden animate-fade-in`}
                style={{ animationDelay: `${i * 80}ms` }}
              >
                {/* Large background step number */}
                <span
                  className="absolute right-4 top-2 font-barlow font-black text-7xl sm:text-8xl text-white/[0.04] leading-none select-none pointer-events-none"
                  aria-hidden="true"
                >
                  {step.num}
                </span>

                {/* Step badge + icon */}
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#1DA84A]/25 border border-[#4ADE80]/30 text-[#4ADE80] font-bold text-sm flex items-center justify-center flex-none shadow-[0_0_12px_rgba(29,168,74,0.2)]">
                    {step.num}
                  </div>
                  <span className="text-xl" role="img" aria-hidden="true">{step.icon}</span>
                </div>

                <div className="flex flex-col gap-1.5 relative z-10">
                  <h4 className="font-barlow font-bold text-lg sm:text-xl text-white tracking-wide leading-tight">
                    {step.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-[#A0A0AA] leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                {/* Step connector arrow — desktop only */}
                {i < steps.length - 1 && (
                  <div
                    className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 z-20 w-6 h-6 bg-[#1DA84A]/20 border border-[#4ADE80]/30 rounded-full items-center justify-center text-[#4ADE80] text-xs font-bold shadow-sm"
                    aria-hidden="true"
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ACCORDIONS ───────────────────────── */}
        <section aria-labelledby="faq-title" className="flex flex-col gap-4 animate-fade-in">
          <div className="flex items-center gap-3 px-1">
            <h3
              id="faq-title"
              className="font-barlow text-xl sm:text-2xl font-bold uppercase tracking-widest text-white"
            >
              FAQs
            </h3>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <div className="glass-card p-0 overflow-hidden divide-y divide-white/8">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openAccordion === item.id;
              return (
                <div key={item.id} className="group">
                  <button
                    type="button"
                    id={`accordion-btn-${item.id}`}
                    aria-expanded={isOpen}
                    aria-controls={`accordion-panel-${item.id}`}
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full min-h-[60px] px-5 sm:px-6 py-4 flex items-center justify-between gap-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-all hover:bg-white/[0.04]"
                  >
                    {/* Left: index + title */}
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-[11px] font-bold text-[#4ADE80]/60 font-mono flex-none">
                        0{i + 1}
                      </span>
                      <span className="font-semibold text-sm sm:text-base text-white leading-snug truncate">
                        {item.title}
                      </span>
                    </div>

                    {/* Right: animated chevron */}
                    <span
                      aria-hidden="true"
                      className={`w-7 h-7 rounded-full flex items-center justify-center flex-none transition-all duration-250 text-xs font-bold ${
                        isOpen
                          ? 'bg-[#1DA84A]/25 text-[#4ADE80] border border-[#4ADE80]/30 rotate-180'
                          : 'bg-white/[0.06] text-white/50 border border-white/10 group-hover:text-white/80'
                      }`}
                    >
                      ▼
                    </span>
                  </button>

                  {/* Answer panel */}
                  <div
                    id={`accordion-panel-${item.id}`}
                    role="region"
                    aria-labelledby={`accordion-btn-${item.id}`}
                    aria-hidden={!isOpen}
                    className={`overflow-hidden transition-all duration-300 ease-out ${
                      isOpen
                        ? 'max-h-[500px] opacity-100 visible'
                        : 'max-h-0 opacity-0 invisible pointer-events-none'
                    }`}
                  >
                    <div className="px-5 sm:px-6 pb-5 pt-1 border-t border-white/5">
                      <p className="text-sm sm:text-[15px] leading-relaxed text-[#C0C0CA]">
                        {item.content}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── SAMPLE DATA NOTICE ───────────────────── */}
        <div className="glass-card p-4 sm:p-5 flex items-start gap-3 border border-amber-500/20 bg-amber-500/[0.04] animate-fade-in">
          <span className="text-xl flex-none mt-0.5" aria-hidden="true">⚠️</span>
          <p className="text-xs sm:text-sm text-[#A0A0AA] leading-relaxed">
            <strong className="text-amber-300">Sample data:</strong>{' '}
            Brand sizes shown are sample data for portfolio demonstration purposes, not official brand charts.
          </p>
        </div>

        {/* ── DID THIS FIT? FEEDBACK ───────────────── */}
        <section
          aria-labelledby="feedback-title"
          className="glass-card p-5 sm:p-6 flex flex-col gap-4 animate-fade-in"
        >
          <div className="flex flex-col gap-1">
            <h4 id="feedback-title" className="font-barlow text-lg sm:text-xl font-bold text-white tracking-wide">
              Did this size fit you?
            </h4>
            <p className="text-xs text-[#A0A0AA]">
              Your feedback is saved locally and helps improve accuracy.
            </p>
          </div>

          {feedbackGiven ? (
            <div className="flex flex-col items-center gap-3 py-4 animate-fade-in text-center">
              <span className="text-3xl">🎉</span>
              <p className="text-sm text-[#4ADE80] font-semibold">Thanks for the feedback!</p>
              <p className="text-xs text-[#A0A0AA]">Saved locally on your device.</p>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-3">
              {FEEDBACK_BUTTONS.map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => handleFeedback(btn.key)}
                  className={`flex flex-col items-center justify-center gap-1.5 h-[72px] rounded-2xl font-semibold text-xs transition-all border btn-press focus-visible:ring-2 focus-visible:ring-accent ${'bg-white/[0.05] hover:bg-white/[0.10] text-white border-white/12 hover:border-white/25'}`}
                >
                  <span className="text-xl">{btn.emoji}</span>
                  <span>{btn.label}</span>
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── MADE WITH ────────────────────────────── */}
        <div className="flex items-center justify-center gap-2 text-xs text-white/25 animate-fade-in pb-2">
          <HangerIcon size={14} className="opacity-40" />
          <span>Tailor — your personal fit guide</span>
        </div>
      </div>

      {/* ── STICKY BOTTOM CTA ────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-4 sm:px-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-3 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/90 to-transparent pointer-events-none">
        <div className="pointer-events-auto max-w-[720px] lg:max-w-[900px] mx-auto">
          <button
            type="button"
            onClick={handleGoBack}
            className="primary-btn btn-press w-full h-[56px] min-h-[56px] text-base font-bold shadow-[0_8px_32px_rgba(29,168,74,0.4)] focus-visible:ring-2 focus-visible:ring-accent"
          >
            ← Back to results
          </button>
        </div>
      </div>
    </div>
  );
};
