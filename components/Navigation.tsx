'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Today', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="5" /></svg>
  )},
  { href: '/history', label: 'History', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="14" y2="17"/></svg>
  )},
  { href: '/correlations', label: 'Insights', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22,6 13.5,14.5 8.5,9.5 2,16"/></svg>
  )},
  { href: '/settings', label: 'Settings', icon: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
  )},
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#080c14]/90 backdrop-blur-xl border-t border-white/[0.06]">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2.5">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.href} href={item.href}
              className={`flex flex-col items-center gap-1.5 px-4 py-1 transition-colors ${active ? 'text-amber-400' : 'text-white/20 hover:text-white/40'}`}>
              {item.icon}
              <span className="text-[8px] uppercase tracking-[0.2em] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
