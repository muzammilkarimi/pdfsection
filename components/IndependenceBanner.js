'use client';

import { useState, useEffect, useRef } from 'react';
import { FESTIVE_CONFIG, isIndependenceDayActive, getFestiveDismissStorageKey } from '@/lib/festiveConfig';
import { IndianFlagIcon, triggerIndependenceConfetti } from './IndependenceConfetti';

export default function IndependenceBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const bannerRef = useRef(null);

  useEffect(() => {
    setMounted(true);
    const active = isIndependenceDayActive();
    if (!active) {
      document.documentElement.style.setProperty('--banner-height', '0px');
      return;
    }

    try {
      const storageKey = getFestiveDismissStorageKey();
      const isDismissed = localStorage.getItem(storageKey);
      if (!isDismissed) {
        setIsVisible(true);
      } else {
        document.documentElement.style.setProperty('--banner-height', '0px');
      }
    } catch {
      setIsVisible(true);
    }
  }, []);

  // Dynamically measure the exact banner height and sync --banner-height variable
  useEffect(() => {
    if (!isVisible) {
      document.documentElement.style.setProperty('--banner-height', '0px');
      return;
    }

    const updateHeight = () => {
      if (bannerRef.current) {
        const height = bannerRef.current.offsetHeight;
        document.documentElement.style.setProperty('--banner-height', `${height}px`);
      }
    };

    updateHeight();
    const ro = new ResizeObserver(updateHeight);
    if (bannerRef.current) {
      ro.observe(bannerRef.current);
    }
    window.addEventListener('resize', updateHeight);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [isVisible]);

  const handleDismiss = () => {
    setIsVisible(false);
    document.documentElement.style.setProperty('--banner-height', '0px');
    try {
      const storageKey = getFestiveDismissStorageKey();
      localStorage.setItem(storageKey, 'true');
    } catch {
      // Ignore localStorage errors
    }
  };

  const handleCelebrate = (e) => {
    e.preventDefault();
    triggerIndependenceConfetti();
  };

  if (!mounted || !isVisible) {
    return null;
  }

  return (
    <aside
      ref={bannerRef}
      className="independence-banner"
      role="region"
      aria-label="Independence Day Celebration Announcement"
    >
      <div className="independence-banner-inner">
        {/* Tricolor badge & greeting */}
        <div className="independence-banner-content">
          <div className="independence-tag" title="15th August • Indian Independence Day">
            <IndianFlagIcon width={17} height={11.5} />
            <span className="independence-tag-text">{FESTIVE_CONFIG.DATE_TEXT}</span>
          </div>

          <span className="independence-banner-msg">
            <strong className="independence-banner-strong">Happy Independence Day!</strong>
            <span className="independence-banner-msg-sub"> Celebrate digital freedom with private PDF tools that run in your browser.</span>
          </span>
        </div>

        {/* Action buttons */}
        <div className="independence-banner-actions">
          <button
            type="button"
            onClick={handleCelebrate}
            className="independence-celebrate-btn"
            title="Celebrate with tricolor confetti shower!"
          >
            <span className="independence-celebrate-text">Celebrate</span>
            <span className="sparkle-icon" aria-hidden="true">✨</span>
          </button>

          <button
            type="button"
            onClick={handleDismiss}
            className="independence-close-btn"
            aria-label="Dismiss Independence Day banner"
            title="Dismiss banner"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
