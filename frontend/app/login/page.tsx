'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { LanguageSwitcher } from '../components/language-switcher';
import { IconArrowRight, IconEye, IconEyeOff, IconLock, IconPhone } from '../components/icons';
import { useTranslation } from '../lib/i18n';
import { login } from '../lib/api';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [mobile, setMobile] = useState('0812345678');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(mobile, password);
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-[var(--light)] p-4 text-[var(--dark)] sm:p-6 lg:p-10">
      <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
        <LanguageSwitcher />
      </div>
      <div className="mx-auto flex w-full max-w-6xl flex-col overflow-hidden rounded-[2rem] bg-white shadow-2xl lg:flex-row">
        <div className="flex flex-1 flex-col justify-center bg-[var(--primary)] p-8 text-white sm:p-12">
          <p className="mb-4 text-sm uppercase tracking-[0.35em] text-white/70">PRC Rental</p>
          <h1 className="text-3xl font-semibold sm:text-4xl">{t('login.heroTitle')}</h1>
          <p className="mt-4 max-w-md text-base leading-7 text-white/80">{t('login.heroSubtitle')}</p>
        </div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-8 lg:p-12">
          <form onSubmit={handleSubmit} className="w-full max-w-md rounded-[1.5rem] border border-[var(--primary)]/10 bg-[var(--light)] p-6 shadow-sm">
            <h2 className="text-2xl font-semibold text-[var(--dark)]">{t('login.welcomeBack')}</h2>
            <p className="mt-2 text-sm text-[var(--dark)]/70">{t('login.signInSubtitle')}</p>
            <div className="mt-6 space-y-4">
              <label className="block text-sm font-medium">
                {t('login.mobileNumber')}
                <div className="relative mt-2">
                  <IconPhone className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--primary)]/50" />
                  <input
                    className="w-full rounded-2xl border border-[var(--primary)]/20 bg-white py-3 pl-11 pr-4 outline-none ring-0 focus:border-[var(--primary)]/50"
                    value={mobile}
                    onChange={(event) => setMobile(event.target.value)}
                    placeholder="0812345678"
                  />
                </div>
              </label>
              <label className="block text-sm font-medium">
                {t('login.password')}
                <div className="relative mt-2">
                  <IconLock className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--primary)]/50" />
                  <input
                    className="w-full rounded-2xl border border-[var(--primary)]/20 bg-white py-3 pl-11 pr-11 outline-none ring-0 focus:border-[var(--primary)]/50"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="password123"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((value) => !value)}
                    aria-label={showPassword ? t('aria.hidePassword') : t('aria.showPassword')}
                    aria-pressed={showPassword}
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-[var(--primary)]/60 transition hover:bg-[var(--primary)]/10 hover:text-[var(--primary)]"
                  >
                    {showPassword ? <IconEyeOff className="h-5 w-5" /> : <IconEye className="h-5 w-5" />}
                  </button>
                </div>
              </label>
            </div>
            {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
            <button
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--secondary)] disabled:opacity-70"
            >
              {loading ? t('login.signingIn') : t('login.login')}
              {!loading && <IconArrowRight className="h-5 w-5 animate-arrow-nudge" />}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
