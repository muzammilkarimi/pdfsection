// Indian Independence Day & Festive Celebration Configuration
// Automatically activates every year from August 14 to August 21 (1 full week)
// Also provides an easy manual toggle for testing or forcing on/off.

export const FESTIVE_CONFIG = {
  // MASTER TOGGLE:
  // 'auto'      -> Automatically shows from August 14 to August 21 every year
  // 'force_on'  -> Always show (useful for previewing at any time)
  // 'force_off' -> Master switch to disable
  MODE: 'auto',

  // Independence Day window dates (August 14 to August 21 inclusive)
  START_MONTH: 7, // 0-indexed: 7 represents August
  START_DAY: 14,  // 14th August
  END_DAY: 21,    // 21st August (1 week celebration window)

  // Theme text & labels
  THEME_NAME: 'Independence Day',
  DATE_TEXT: '15th August',
  BANNER_MESSAGE: 'Happy Independence Day! Celebrate digital freedom with private PDF tools that run in your browser.',
  HERO_BADGE_TEXT: 'Happy Independence Day',
  CTA_LABEL: 'Celebrate 🇮🇳',
};

/**
 * Determines whether the Independence Day festive theme should be active.
 * Evaluates both the MODE toggle and current date window.
 */
export function isIndependenceDayActive(now = new Date()) {
  // Check env override first if set
  if (process.env.NEXT_PUBLIC_ENABLE_INDEPENDENCE_DAY === 'false') return false;
  if (process.env.NEXT_PUBLIC_ENABLE_INDEPENDENCE_DAY === 'true') return true;

  if (FESTIVE_CONFIG.MODE === 'force_on') return true;
  if (FESTIVE_CONFIG.MODE === 'force_off') return false;

  // Auto mode: check if today is between August 14 and August 21 of any year
  const month = now.getMonth(); // 7 for August
  const day = now.getDate();

  return month === FESTIVE_CONFIG.START_MONTH && day >= FESTIVE_CONFIG.START_DAY && day <= FESTIVE_CONFIG.END_DAY;
}

/**
 * Returns a storage key tagged with the current year so dismissals reset automatically next year.
 */
export function getFestiveDismissStorageKey(now = new Date()) {
  return `pdfsection_id_banner_dismissed_${now.getFullYear()}`;
}
