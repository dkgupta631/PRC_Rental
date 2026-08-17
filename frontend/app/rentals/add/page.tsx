'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '../../components/app-shell';
import { useTranslation } from '../../lib/i18n';
import { createRental, fetchAvailableRooms } from '../../lib/api';

const buildings = ['A', 'B', 'C', 'D', 'E', 'G', 'H', 'Z'];
const floorsByBuilding: Record<string, number[]> = {
  A: [1, 2, 3],
  B: [1, 2, 3],
  C: [1, 2, 3],
  D: [1, 2, 3],
  E: [1, 2],
  G: [1, 2],
  H: [1, 2, 3],
  Z: [1, 2, 3, 4, 5],
};

export default function AddRentalPage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [building, setBuilding] = useState('A');
  const [floor, setFloor] = useState('1');
  const [roomNumber, setRoomNumber] = useState('');
  const [company, setCompany] = useState('');
  const [note, setNote] = useState('');
  const [moveInDate, setMoveInDate] = useState('');
  const [availableRooms, setAvailableRooms] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadRooms() {
      try {
        const rooms = await fetchAvailableRooms(building, floor);
        setAvailableRooms(rooms);
        setRoomNumber('');
      } catch {
        setAvailableRooms([]);
      }
    }
    loadRooms();
  }, [building, floor]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (!roomNumber.trim()) {
      setError(t('addRental.errorRoomNumber'));
      return;
    }

    setLoading(true);
    try {
      await createRental({ building, floor: Number(floor), room_number: roomNumber, company, note, move_in_date: moveInDate || null });
      setSuccess(t('addRental.success'));
      setRoomNumber('');
      setCompany('');
      setNote('');
      setMoveInDate('');
      setTimeout(() => router.push('/rentals'), 800);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('addRental.errorGeneric'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <p className="text-sm font-medium uppercase tracking-[0.3em] text-[var(--secondary)]">{t('addRental.eyebrow')}</p>
        <h2 className="mt-2 text-2xl font-semibold text-[var(--dark)]">{t('addRental.heading')}</h2>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <label className="text-sm font-medium text-[var(--dark)]">
            {t('addRental.building')}
            <select value={building} onChange={(event) => { setBuilding(event.target.value); setFloor(String(floorsByBuilding[event.target.value][0])); }} className="mt-2 w-full rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3">
              {buildings.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </select>
          </label>

          <label className="text-sm font-medium text-[var(--dark)]">
            {t('addRental.floor')}
            <select value={floor} onChange={(event) => setFloor(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3">
              {floorsByBuilding[building].map((entry) => <option key={entry} value={entry}>{entry}</option>)}
            </select>
          </label>

          <label className="text-sm font-medium text-[var(--dark)] md:col-span-2">
            {t('addRental.roomNumber')}
            <input list="room-options" value={roomNumber} onChange={(event) => setRoomNumber(event.target.value.toUpperCase())} className="mt-2 w-full rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3" placeholder={t('addRental.roomNumberPlaceholder')} />
            <datalist id="room-options">
              {availableRooms.map((room) => <option key={room} value={room} />)}
            </datalist>
            <p className="mt-1 text-xs text-[var(--dark)]/60">
              {availableRooms.length ? t('addRental.roomHintVacant') : t('addRental.roomHintNone')}
            </p>
          </label>

          <label className="text-sm font-medium text-[var(--dark)]">
            {t('addRental.companyTenant')}
            <input value={company} onChange={(event) => setCompany(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3" placeholder={t('addRental.companyPlaceholder')} />
          </label>

          <label className="text-sm font-medium text-[var(--dark)]">
            {t('addRental.noteMoveIn')}
            <input value={note} onChange={(event) => setNote(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3" placeholder={t('addRental.notePlaceholder')} />
          </label>

          <label className="text-sm font-medium text-[var(--dark)]">
            {t('addRental.moveInDate')}
            <input type="date" value={moveInDate} onChange={(event) => setMoveInDate(event.target.value)} className="mt-2 w-full rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3" />
          </label>

          <div className="md:col-span-2">
            {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}
            {success ? <p className="mb-4 text-sm text-emerald-600">{success}</p> : null}
            <button disabled={loading} className="rounded-2xl bg-[var(--primary)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--secondary)] disabled:opacity-70">
              {loading ? t('addRental.saving') : t('addRental.saveRental')}
            </button>
          </div>
        </form>
      </div>
    </AppShell>
  );
}
