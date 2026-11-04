'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToolIcon } from './Icons';

const TABS = [
  {
    href: '/',
    label: 'Home',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z" />
      </svg>
    ),
  },
  {
    href: '/tools',
    label: 'Tools',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </svg>
    ),
  },
  { href: '/files', label: 'Files', icon: <ToolIcon name="folder" size={22} /> },
  { href: '/settings', label: 'Settings', icon: <ToolIcon name="settings" size={22} /> },
];

/** Phone-only bottom navigation. Styles hide it on desktop and on work screens (see mobile.css). */
export default function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav className="mobile-tabs" aria-label="Main">
      {TABS.map((tab) => (
        <Link key={tab.href} href={tab.href} aria-current={pathname === tab.href ? 'page' : undefined}>
          {tab.icon}
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
