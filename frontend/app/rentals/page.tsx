'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '../components/app-shell';
import { useTranslation } from '../lib/i18n';
import { deleteRental, exportRentals, fetchRentals } from '../lib/api';

export default function RentalsPage() {
  const { t } = useTranslation();
  const [records, setRecords] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [building, setBuilding] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function loadRecords() {
    setLoading(true);
    try {
      const data = await fetchRentals({ page, pageSize, building, status, q: query });
      setRecords(data.records);
      setTotal(data.total);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRecords();
  }, [page, building, status, query]);

  async function handleDelete(id: number, roomNumber: string) {
    if (!window.confirm(t('rentals.deleteConfirm', { room: roomNumber }))) return;
    setDeletingId(id);
    try {
      await deleteRental(id);
      await loadRecords();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : t('rentals.deleteError'));
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <AppShell>
      <div className="rounded-[2rem] bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.3em] text-[var(--secondary)]">{t('rentals.records')}</p>
            <h2 className="text-2xl font-semibold text-[var(--dark)]">{t('rentals.rentalRecords')}</h2>
          </div>
          <button onClick={() => exportRentals()} className="rounded-2xl bg-[var(--primary)] px-4 py-3 font-semibold text-white transition hover:bg-[var(--secondary)]">
            {t('rentals.exportToExcel')}
          </button>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <select value={building} onChange={(event) => { setBuilding(event.target.value); setPage(1); }} className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3">
            <option value="">{t('rentals.allBuildings')}</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="G">G</option>
            <option value="H">H</option>
            <option value="Z">Z</option>
          </select>
          <select value={status} onChange={(event) => { setStatus(event.target.value); setPage(1); }} className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3">
            <option value="">{t('rentals.allStatus')}</option>
            <option value="occupied">{t('rentals.occupied')}</option>
            <option value="vacant">{t('rentals.vacant')}</option>
          </select>
          <input value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="rounded-2xl border border-[var(--primary)]/20 bg-[var(--light)] px-3 py-3" placeholder={t('rentals.searchPlaceholder')} />
        </div>

        <div className="mt-6 overflow-x-auto">
          {loading ? <p className="text-sm text-[var(--dark)]/70">{t('rentals.loadingRecords')}</p> : (
            <table className="min-w-[700px] w-full text-sm">
              <thead>
                <tr className="bg-[var(--light)] text-left text-[var(--dark)]/80">
                  <th className="px-3 py-3">{t('rentals.sequence')}</th>
                  <th className="px-3 py-3">{t('rentals.room')}</th>
                  <th className="px-3 py-3">{t('rentals.building')}</th>
                  <th className="px-3 py-3">{t('rentals.floor')}</th>
                  <th className="px-3 py-3">{t('rentals.company')}</th>
                  <th className="px-3 py-3">{t('rentals.note')}</th>
                  <th className="px-3 py-3">{t('rentals.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id || record.room_number} className="border-t border-[var(--primary)]/10">
                    <td className="px-3 py-3">{record.sequence}</td>
                    <td className="px-3 py-3 font-medium">{record.room_number}</td>
                    <td className="px-3 py-3">{record.building}</td>
                    <td className="px-3 py-3">{record.floor}</td>
                    <td className="px-3 py-3">{record.company || t('rentals.vacant')}</td>
                    <td className="px-3 py-3">{record.note || ''}</td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        <Link
                          href={`/rentals/edit/${record.id}`}
                          className="rounded-xl border border-[var(--primary)]/20 px-3 py-1.5 text-xs font-semibold text-[var(--primary)] transition hover:bg-[var(--light)]"
                        >
                          {t('rentals.edit')}
                        </Link>
                        <button
                          onClick={() => handleDelete(record.id, record.room_number)}
                          disabled={deletingId === record.id}
                          className="rounded-xl border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingId === record.id ? t('rentals.deleting') : t('rentals.delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-[var(--dark)]/70">{t('rentals.showing', { shown: records.length, total })}</p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage((current) => current - 1)} className="rounded-2xl border border-[var(--primary)]/20 px-3 py-2 text-sm disabled:opacity-50">{t('rentals.prev')}</button>
            <button disabled={page * pageSize >= total} onClick={() => setPage((current) => current + 1)} className="rounded-2xl border border-[var(--primary)]/20 px-3 py-2 text-sm disabled:opacity-50">{t('rentals.next')}</button>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
