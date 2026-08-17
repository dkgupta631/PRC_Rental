'use client';

import { useEffect, useRef, useState } from 'react';
import { LANGUAGES, useTranslation } from '../lib/i18n';
import { IconChevronDown } from './icons';

export function LanguageSwitcher({ className }: { className?: string }) {
  const { locale, setLocale, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const current = LANGUAGES.find((entry) => entry.code === locale) ?? LANGUAGES[0];

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('aria.selectLanguage')}
        className="flex items-center gap-2 rounded-full border border-[var(--primary)]/20 bg-white px-3 py-2 text-sm font-medium text-[var(--primary)] transition hover:bg-[var(--light)]"
      >
        <current.Flag className="h-3.5 w-5 shrink-0 rounded-sm ring-1 ring-black/10" />
        <span className="hidden sm:inline">{current.label}</span>
        <IconChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={t('aria.selectLanguage')}
          className="absolute right-0 z-30 mt-2 w-40 overflow-hidden rounded-2xl border border-[var(--primary)]/10 bg-white py-1.5 shadow-xl"
        >
          {LANGUAGES.map((entry) => (
            <button
              key={entry.code}
              type="button"
              role="option"
              aria-selected={entry.code === locale}
              onClick={() => {
                setLocale(entry.code);
                setOpen(false);
              }}
              className={`flex w-full items-center gap-3 px-4 py-2 text-left text-sm transition ${
                entry.code === locale ? 'bg-[var(--light)] font-semibold text-[var(--primary)]' : 'text-[var(--dark)] hover:bg-[var(--light)]/70'
              }`}
            >
              <entry.Flag className="h-3.5 w-5 shrink-0 rounded-sm ring-1 ring-black/10" />
              {entry.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
