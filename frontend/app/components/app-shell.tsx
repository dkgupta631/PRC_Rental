'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LanguageSwitcher } from './language-switcher';
import { logout } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { IconChevronLeft, IconClose, IconDashboard, IconLogout, IconMenu, IconPlus, IconRecords } from './icons';

const navItems = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: IconDashboard },
  { href: '/rentals/add', labelKey: 'nav.addRental', icon: IconPlus },
  { href: '/rentals', labelKey: 'nav.records', icon: IconRecords },
];

const SIDEBAR_COLLAPSE_KEY = 'prc-sidebar-collapsed';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useTranslation();
  const [mobileOpen, setMobileOpen] = useState(false);
  // Start expanded on both server and the first client render so hydration
  // matches; the stored preference (browser-only) is applied right after
  // mount instead of during the initial render.
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync from a browser-only store (localStorage) that isn't available during SSR; doing this in render would desync from the server-rendered markup.
    setCollapsed(window.localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === '1');
  }, []);

  function toggleCollapsed() {
    setCollapsed((current) => {
      const next = !current;
      window.localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? '1' : '0');
      return next;
    });
  }

  async function handleLogout() {
    try {
      await logout();
    } catch {
      // ignore and redirect
    }
    router.push('/login');
  }

  // Several nav items can share a path prefix (e.g. /rentals and /rentals/add) —
  // pick the single longest-matching href so only one item lights up at a time.
  const activeHref = navItems
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--light)] text-[var(--dark)]">
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-[var(--primary)] text-white shadow-2xl transition-transform duration-300 ease-in-out
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:static lg:z-auto lg:translate-x-0 lg:shadow-none lg:transition-[width] lg:duration-300
          ${collapsed ? 'lg:w-20' : 'lg:w-72'}`}
      >
        <div className="flex items-center justify-between gap-2 border-b border-white/10 p-5">
          <div className={collapsed ? 'lg:hidden' : ''}>
            <p className="text-xs uppercase tracking-[0.3em] text-white/60">{t('common.operations')}</p>
            <h2 className="text-xl font-semibold">PRC Rental</h2>
          </div>
          <div className={`hidden h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-xs font-bold ${collapsed ? 'lg:flex' : 'lg:hidden'}`}>
            PRC
          </div>
          <button
            type="button"
            onClick={toggleCollapsed}
            title={collapsed ? t('aria.expandMenu') : t('aria.collapseMenu')}
            aria-label={collapsed ? t('aria.expandMenu') : t('aria.collapseMenu')}
            className="hidden h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10 hover:text-white lg:flex"
          >
            <IconChevronLeft className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label={t('aria.closeMenu')}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-white/20 text-white/80 transition hover:bg-white/10 hover:text-white lg:hidden"
          >
            <IconClose className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {navItems.map((item) => {
            const active = item.href === activeHref;
            const Icon = item.icon;
            const label = t(item.labelKey);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                title={collapsed ? label : undefined}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${collapsed ? 'lg:justify-center lg:px-0' : ''} ${active ? 'bg-white/20 shadow-sm' : 'hover:bg-white/10'}`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className={collapsed ? 'lg:hidden' : ''}>{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            type="button"
            onClick={handleLogout}
            title={collapsed ? t('common.logout') : undefined}
            className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/90 transition hover:bg-red-500/20 hover:text-white ${collapsed ? 'lg:justify-center lg:px-0' : ''}`}
          >
            <IconLogout className="h-5 w-5 shrink-0" />
            <span className={collapsed ? 'lg:hidden' : ''}>{t('common.logout')}</span>
          </button>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="z-10 shrink-0 border-b border-[var(--primary)]/10 bg-white/80 px-4 py-4 backdrop-blur lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMobileOpen(true)}
                aria-label={t('aria.openMenu')}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-[var(--primary)]/20 text-[var(--primary)] transition hover:bg-[var(--light)] lg:hidden"
              >
                <IconMenu className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <p className="hidden text-sm font-medium text-[var(--secondary)] sm:block">{t('header.occupancyManagement')}</p>
                <h1 className="truncate text-lg font-semibold text-[var(--dark)] sm:text-xl">PRC Rental</h1>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <LanguageSwitcher />
              <div className="flex items-center gap-3 rounded-full bg-[var(--light)] py-1.5 pl-1.5 pr-1.5 sm:pr-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-sm font-semibold text-white">
                  A
                </div>
                <span className="hidden text-sm font-medium text-[var(--primary)] sm:inline">{t('common.adminUser')}</span>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
