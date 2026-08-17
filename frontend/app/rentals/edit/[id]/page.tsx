'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../../components/app-shell';
import { useTranslation } from '../../../lib/i18n';
import { fetchRental, updateRental } from '../../../lib/api';

export default function EditRentalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { t } = useTranslation();

  const [roomNumber, setRoomNumber] = useState('');
  const [building, setBuilding] = useState('');
  const [floor, setFloor] = useState<number | null>(null);
  const [company, setCompany] = useState('');
  const [note, setNote] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    async function loadRecord() {
      try {
        const { record } = await fetchRental(id);
        setRoomNumber(record.room_number);
        setBuilding(record.building);
        setFloor(record.floor);
        setCompany(record.company || '');
        setNote(record.note || '');
        setMoveInDate(record.move_in_date || '');
      } catch (err) {
        setError(err instanceof Error ? err.message : t('editRental.errorLoad'));
      } finally {
        setLoading(false);
      }
    }
    loadRecord();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-fetch when the record id changes, not on every locale switch
  }, [id]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await updateRental(id, { company, note, move_in_date: moveInDate || null });
      setSuccess(t('editRental.success'));
      setTimeout(() => router.push('/rentals'), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('editRental.errorGeneric'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[var(--secondary)]">{t('editRental.eyebrow')}</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--dark)]">
          {loading ? t('editRental.loading') : t('editRental.heading', { room: roomNumber, building, floor: floor ?? '' })}
        </h2>

        {loading ? null : (
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-[var(--dark)]">
              {t('editRental.companyTenant')}
              <input
                value={company}
                onChange={(event) => setCompany(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3"
                placeholder={t('editRental.companyPlaceholder')}
              />
            </label>

            <label className="text-sm font-medium text-[var(--dark)]">
              {t('editRental.note')}
              <input
                value={note}
                onChange={(event) => setNote(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3"
                placeholder={t('editRental.notePlaceholder')}
              />
            </label>

            <label className="text-sm font-medium text-[var(--dark)]">
              {t('editRental.moveInDate')}
              <input
                type="date"
                value={moveInDate}
                onChange={(event) => setMoveInDate(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3"
              />
            </label>

            <div className="md:col-span-2">
              {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
              {success ? <p className="mb-4 text-sm text-emerald-600">{success}</p> : null}
              <div className="flex gap-3">
                <button
                  disabled={saving}
                  className="rounded-2xl bg-[var(--primary)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--secondary)] disabled:opacity-70"
                >
                  {saving ? t('editRental.saving') : t('editRental.saveChanges')}
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/rentals')}
                  className="rounded-2xl border border-[var(--primary)]/20 px-4 py-3 font-semibold text-[var(--dark)] transition hover:bg-[var(--light)]"
                >
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </AppShell>
  );
}
