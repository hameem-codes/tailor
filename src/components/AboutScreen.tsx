import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { saveLocalFeedback } from '../lib/storage';

interface AboutScreenProps {
  brandContext?: string;
  sizeContext?: string;
}

interface FAQItem {
  id: string;
  title: string;
  content: string;
}

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
    <div className="relative min-h-[100dvh] w-full max-w-[640px] mx-auto flex flex-col justify-between px-4 sm:px-6 py-6 pb-0 page-transition">
      {/* Dark Scrim overlay ensuring 20-25% background opacity and strict WCAG AA contrast */}
      <div
        className="fixed inset-0 pointer-events-none -z-10 bg-gradient-to-b from-[#0a0a0b]/80 via-[#0a0a0b]/92 to-[#0a0a0b]/98 backdrop-blur-md"
        aria-hidden="true"
      />

      {/* Main Content Container with exactly 24px vertical section gap */}
      <div className="flex flex-col gap-6">
        {/* Header: 44px back button + "About Tailor" in Barlow Condensed */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleGoBack}
            className="circle-btn btn-press !w-[44px] !h-[44px] !min-w-[44px] !min-h-[44px] !bg-white/10 hover:!bg-white/20 text-white rounded-full flex items-center justify-center text-lg font-bold transition-colors focus-visible:ring-2 focus-visible:ring-accent"
            aria-label="Go back"
          >
            ←
          </button>
          <h1 className="font-barlow text-3xl sm:text-4xl font-bold text-white tracking-wide leading-none">
            About Tailor
          </h1>
        </div>

        {/* Hero Section: Short headline, 16-17px intro, 3 small chips */}
        <section aria-labelledby="about-hero-title" className="flex flex-col gap-3">
          <h2
            id="about-hero-title"
            className="font-barlow text-2xl sm:text-3xl font-semibold text-white tracking-wide leading-tight"
          >
            One size language for every brand
          </h2>
          <p className="text-[16px] sm:text-[17px] leading-relaxed text-[#E4E4E8]">
            Tailor matches your body measurements to real brand size charts, so a Medium means the same thing everywhere.
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] text-white border border-white/15">
              <span className="text-[#4ADE80]">●</span> 10+ brands
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] text-white border border-white/15">
              <span className="text-[#4ADE80]">🛡️</span> Stays on your device
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/[0.08] text-white border border-white/15">
              <span className="text-[#4ADE80]">✓</span> Free
            </span>
          </div>
        </section>

        {/* "How it works" 3-step visual (numbered icons: Enter measurements, Compare charts, Get your size) */}
        <section aria-labelledby="how-it-works-title" className="flex flex-col gap-3">
          <h3
            id="how-it-works-title"
            className="font-barlow text-xl sm:text-2xl font-bold uppercase tracking-wider text-white"
          >
            How it works
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Step 1 */}
            <div className="glass-card !bg-white/[0.04] p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1DA84A]/25 text-[#4ADE80] font-bold text-sm flex items-center justify-center flex-none">
                1
              </div>
              <h4 className="font-semibold text-[15px] sm:text-base text-white">Enter measurements</h4>
              <p className="text-xs sm:text-[13px] text-secText leading-relaxed">
                Provide height, weight, and key body dimensions in cm or inches.
              </p>
            </div>

            {/* Step 2 */}
            <div className="glass-card !bg-white/[0.04] p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1DA84A]/25 text-[#4ADE80] font-bold text-sm flex items-center justify-center flex-none">
                2
              </div>
              <h4 className="font-semibold text-[15px] sm:text-base text-white">Compare charts</h4>
              <p className="text-xs sm:text-[13px] text-secText leading-relaxed">
                We calibrate your numbers against official dimension charts across 10+ brands.
              </p>
            </div>

            {/* Step 3 */}
            <div className="glass-card !bg-white/[0.04] p-4 rounded-2xl border border-white/10 flex flex-col gap-2">
              <div className="w-8 h-8 rounded-full bg-[#1DA84A]/25 text-[#4ADE80] font-bold text-sm flex items-center justify-center flex-none">
                3
              </div>
              <h4 className="font-semibold text-[15px] sm:text-base text-white">Get your size</h4>
              <p className="text-xs sm:text-[13px] text-secText leading-relaxed">
                Review your recommended size, match level, and visual ruler range per brand.
              </p>
            </div>
          </div>
        </section>

        {/* Accordions: One glass container, rows >= 56px, label left, rotating chevron right, only 1 open at a time */}
        <section aria-labelledby="faq-title" className="flex flex-col gap-3">
          <div className="glass-card !bg-white/[0.04] p-0 rounded-2xl border border-white/12 divide-y divide-white/10 overflow-hidden shadow-lg">
            {FAQ_ITEMS.map((item) => {
              const isOpen = openAccordion === item.id;
              return (
                <div key={item.id} className="transition-colors">
                  <button
                    type="button"
                    id={`accordion-btn-${item.id}`}
                    aria-expanded={isOpen}
                    aria-controls={`accordion-panel-${item.id}`}
                    onClick={() => toggleAccordion(item.id)}
                    className="w-full min-h-[56px] px-5 py-4 flex items-center justify-between text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-accent transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="font-semibold text-[15px] sm:text-base text-white pr-4 leading-snug">
                      {item.title}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`text-secText font-bold text-sm transition-transform duration-200 flex-none ${
                        isOpen ? 'rotate-180 text-white' : ''
                      }`}
                    >
                      ▼
                    </span>
                  </button>
                  <div
                    id={`accordion-panel-${item.id}`}
                    role="region"
                    aria-labelledby={`accordion-btn-${item.id}`}
                    className={`overflow-hidden transition-all duration-300 ease-out px-5 ${
                      isOpen ? 'max-h-60 pb-5 opacity-100' : 'max-h-0 pb-0 opacity-0 pointer-events-none'
                    }`}
                  >
                    <p className="text-[16px] sm:text-[17px] leading-relaxed text-[#D6D6DC]">
                      {item.content}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* "Sample data" notice card with info icon */}
        <div className="glass-card !bg-white/[0.03] p-4 sm:p-5 rounded-2xl border border-white/10 flex items-start gap-3">
          <span className="text-[#4ADE80] text-lg flex-none mt-0.5" aria-hidden="true">
            ℹ️
          </span>
          <p className="text-xs sm:text-sm text-secText leading-relaxed">
            <strong className="text-white">Sample data:</strong> Brand sizes are sample data for portfolio demonstration, not official charts.
          </p>
        </div>

        {/* "Did this size fit you?" Feedback Chips (44px tall, equal width, selected state + toast message) */}
        <section aria-labelledby="feedback-title" className="glass-card !bg-white/[0.04] p-5 rounded-2xl border border-white/12 flex flex-col gap-3">
          <h4 id="feedback-title" className="font-semibold text-[15px] sm:text-base text-white">
            Did this size fit you?
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleFeedback('well')}
              className={`h-[44px] min-h-[44px] rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center border focus-visible:ring-2 focus-visible:ring-accent ${
                feedbackGiven === 'well'
                  ? 'bg-[#1DA84A] border-[#4ADE80] text-white shadow-md'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/15'
              }`}
            >
              Fit well
            </button>
            <button
              type="button"
              onClick={() => handleFeedback('tight')}
              className={`h-[44px] min-h-[44px] rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center border focus-visible:ring-2 focus-visible:ring-accent ${
                feedbackGiven === 'tight'
                  ? 'bg-[#FBBF24] border-[#FDE68A] text-black shadow-md'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/15'
              }`}
            >
              Too tight
            </button>
            <button
              type="button"
              onClick={() => handleFeedback('loose')}
              className={`h-[44px] min-h-[44px] rounded-xl font-semibold text-xs sm:text-sm transition-all flex items-center justify-center border focus-visible:ring-2 focus-visible:ring-accent ${
                feedbackGiven === 'loose'
                  ? 'bg-[#F87171] border-[#FECACA] text-white shadow-md'
                  : 'bg-white/[0.06] hover:bg-white/[0.12] text-white border-white/15'
              }`}
            >
              Too loose
            </button>
          </div>
          {feedbackGiven && (
            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#4ADE80] font-medium animate-fade-in pt-1">
              <span>✓</span>
              <span>Thanks for the feedback! Saved locally on your device.</span>
            </div>
          )}
        </section>
      </div>

      {/* Sticky Bottom "Back to results" button (solid green, 56px, safe-area inset) */}
      <div className="sticky bottom-0 left-0 right-0 pt-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/95 to-transparent z-20 mt-6">
        <button
          type="button"
          onClick={handleGoBack}
          className="primary-btn btn-press w-full h-[56px] min-h-[56px] text-base font-bold shadow-[0_4px_20px_rgba(29,168,74,0.35)] focus-visible:ring-2 focus-visible:ring-accent"
        >
          Back to results
        </button>
      </div>
    </div>
  );
};
