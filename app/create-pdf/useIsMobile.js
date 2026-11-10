'use client';

import { useSyncExternalStore } from 'react';

export const MOBILE_QUERY = '(max-width: 899px)';

export function useIsMobile() {
  return useSyncExternalStore(
    (notify) => {
      const mq = window.matchMedia(MOBILE_QUERY);
      mq.addEventListener('change', notify);
      return () => mq.removeEventListener('change', notify);
    },
    () => window.matchMedia(MOBILE_QUERY).matches,
    () => false
  );
}
