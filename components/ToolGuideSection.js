'use client';

import { useState } from 'react';
import { ToolIcon } from './Icons';

export default function ToolGuideSection({ title, seoData }) {
  const [openFaq, setOpenFaq] = useState(null);

  const steps = seoData?.steps || [];
  const benefits = seoData?.benefits || [];
  const useCases = seoData?.useCases || [];
  const faqs = seoData?.faqs || [];

  const toggleFaq = (idx) => {
    setOpenFaq(openFaq === idx ? null : idx);
  };

  return (
    <section className="tool-guide-section" aria-label={`Guide and FAQs for ${title}`}>
      {/* Header */}
      <div className="tool-guide-header">
        <span className="eyebrow" style={{ color: 'var(--primary)', fontWeight: 700, letterSpacing: '0.08em' }}>
          USER GUIDE & BENEFITS
        </span>
        <h2 className="tool-guide-title">
          How to Use {title.split('—')[0]}
        </h2>
        <p className="tool-guide-subtitle">
          Everything you need to know about processing your PDF files quickly, privately, and 100% locally in your browser.
        </p>
      </div>

      {/* 3-Step How-To Grid */}
      {steps.length > 0 && (
        <div className="tool-guide-block">
          <h3 className="tool-guide-block-title">
            <ToolIcon name="sparkles" size={20} />
            <span>3 Simple Steps</span>
          </h3>
          <div className="tool-steps-grid">
            {steps.map((stepText, idx) => (
              <div key={idx} className="tool-step-card">
                <div className="tool-step-number">{idx + 1}</div>
                <div className="tool-step-content">
                  <h4>Step {idx + 1}</h4>
                  <p>{stepText}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Two Column Grid: Benefits & Use Cases */}
      <div className="tool-guide-two-col">
        {/* Key Benefits */}
        {benefits.length > 0 && (
          <div className="tool-guide-card">
            <h3 className="tool-guide-card-title">
              <ToolIcon name="lock" size={20} />
              <span>Why Use PDF Section?</span>
            </h3>
            <ul className="tool-benefits-list">
              {benefits.map((bText, idx) => (
                <li key={idx}>
                  <span className="benefit-check-icon">✓</span>
                  <span>{bText}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Popular Use Cases */}
        {useCases.length > 0 && (
          <div className="tool-guide-card">
            <h3 className="tool-guide-card-title">
              <ToolIcon name="pdf" size={20} />
              <span>Popular Use Cases</span>
            </h3>
            <ul className="tool-usecases-list">
              {useCases.map((uText, idx) => (
                <li key={idx}>
                  <span className="usecase-bullet">•</span>
                  <span>{uText}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* FAQs Section */}
      {faqs.length > 0 && (
        <div className="tool-guide-block">
          <h3 className="tool-guide-block-title">
            <ToolIcon name="help" size={20} />
            <span>Frequently Asked Questions</span>
          </h3>
          <div className="tool-faqs-grid">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className={`tool-faq-card ${openFaq === idx ? 'is-open' : ''}`}
                onClick={() => toggleFaq(idx)}
              >
                <div className="tool-faq-question">
                  <h4>{faq.q || faq.question}</h4>
                  <span className="faq-toggle-icon">{openFaq === idx ? '−' : '+'}</span>
                </div>
                {openFaq === idx && (
                  <div className="tool-faq-answer">
                    <p>{faq.a || faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
