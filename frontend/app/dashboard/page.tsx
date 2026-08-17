'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AppShell } from '../components/app-shell';
import {
  IconBuilding,
  IconCheckCircle,
  IconChevronDown,
  IconDoorOpen,
  IconGauge,
  IconGrid,
  IconRefresh,
  IconUsers,
} from '../components/icons';
import { useTranslation } from '../lib/i18n';
import { fetchDashboardFloors, fetchDashboardSummary, fetchDashboardVacant, fetchTopTenants } from '../lib/api';

const AUTO_REFRESH_MS = 30000;

function occupancyStatusColor(pct: number) {
  if (pct >= 85) return 'var(--status-good)';
  if (pct >= 50) return 'var(--status-warning)';
  return 'var(--status-critical)';
}

function OccupancyMeter({ value }: { value: number }) {
  const pct = Math.max(0, Math.min(100, value));
  const color = occupancyStatusColor(pct);
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 w-28 overflow-hidden rounded-full bg-[var(--primary)]/10">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm font-semibold tabular-nums" style={{ color }}>{pct}%</span>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  accent?: string;
}) {
  return (
    <div className="rounded-[2rem] bg-[var(--primary)] p-5 text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md" style={accent ? { background: accent } : undefined}>
      <div className="flex items-center justify-between">
        <p className="text-sm uppercase tracking-[0.2em] text-white/70">{label}</p>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<any>(null);
  const [floors, setFloors] = useState<any[]>([]);
  const [vacant, setVacant] = useState<any[]>([]);
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [vacantFilter, setVacantFilter] = useState('');
  const isFirstLoad = useRef(true);

  const load = useCallback(async () => {
    if (isFirstLoad.current) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const [summaryData, floorsData, vacantData, tenantsData] = await Promise.all([
        fetchDashboardSummary(),
        fetchDashboardFloors(),
        fetchDashboardVacant(),
        fetchTopTenants(),
      ]);
      setSummary(summaryData);
      setFloors(floorsData);
      setVacant(vacantData);
      setTenants(tenantsData);
      setLastUpdated(new Date());
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFirstLoad.current = false;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!autoRefresh) return;
    const timer = window.setInterval(load, AUTO_REFRESH_MS);
    return () => window.clearInterval(timer);
  }, [autoRefresh, load]);

  if (loading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <div className="h-24 animate-pulse rounded-[2rem] bg-white/70" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[2rem] bg-white/70" />
            ))}
          </div>
          <div className="h-64 animate-pulse rounded-[2rem] bg-white/70" />
        </div>
      </AppShell>
    );
  }

  const vacantBuildings = vacant.map((item) => item.building);
  const filteredVacant = vacantFilter ? vacant.filter((item) => item.building === vacantFilter) : vacant;
  const maxTenantRooms = Math.max(1, ...tenants.map((tenant) => tenant.roomsOccupied));

  return (
    <AppShell>
      <div className="space-y-6">
        <section className="flex flex-col gap-3 rounded-[2rem] bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className={`relative flex h-2.5 w-2.5 ${autoRefresh ? '' : 'opacity-40'}`}>
              {autoRefresh && <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--status-good)] opacity-75" />}
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full" style={{ background: 'var(--status-good)' }} />
            </span>
            <p className="text-sm font-medium text-[var(--dark)]/70">
              {autoRefresh ? t('dashboard.live') : t('dashboard.paused')} · {t('dashboard.lastUpdated', { time: lastUpdated ? lastUpdated.toLocaleTimeString() : '—' })}
              {refreshing && <span className="ml-2 text-[var(--secondary)]">{t('dashboard.refreshing')}</span>}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-sm text-[var(--dark)]/70">{t('dashboard.autoRefresh')}</span>
              <button
                type="button"
                onClick={() => setAutoRefresh((value) => !value)}
                className={`inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors duration-300 ${autoRefresh ? 'border-transparent' : 'border-[var(--dark)]/10 bg-[var(--dark)]/15'}`}
                style={autoRefresh ? { background: 'var(--status-good)' } : undefined}
                role="switch"
                aria-checked={autoRefresh}
                aria-label={t('aria.toggleAutoRefresh')}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-1 ring-black/5 transition-transform duration-300 ${autoRefresh ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
            <button
              type="button"
              onClick={() => load()}
              disabled={refreshing}
              className="flex items-center gap-2 rounded-2xl border border-[var(--primary)]/20 px-4 py-2 text-sm font-medium text-[var(--primary)] transition hover:bg-[var(--light)] disabled:opacity-50"
            >
              <IconRefresh className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {t('dashboard.refresh')}
            </button>
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-[var(--secondary)]">{t('dashboard.sectionA')}</p>
              <h2 className="text-2xl font-semibold text-[var(--dark)]">{t('dashboard.buildingOccupancySummary')}</h2>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[var(--light)] text-left text-[var(--dark)]/80">
                  <th className="px-3 py-3">{t('dashboard.building')}</th>
                  <th className="px-3 py-3">{t('dashboard.totalRooms')}</th>
                  <th className="px-3 py-3">{t('dashboard.occupiedRooms')}</th>
                  <th className="px-3 py-3">{t('dashboard.vacantRooms')}</th>
                  <th className="px-3 py-3">{t('dashboard.occupancy')}</th>
                </tr>
              </thead>
              <tbody>
                {summary?.buildings.map((item: any) => (
                  <tr key={item.building} className="border-t border-[var(--primary)]/10 transition hover:bg-[var(--light)]/60">
                    <td className="px-3 py-3 font-medium">{item.building}</td>
                    <td className="px-3 py-3 tabular-nums">{item.totalRooms}</td>
                    <td className="px-3 py-3 tabular-nums">{item.occupiedRooms}</td>
                    <td className="px-3 py-3 tabular-nums">{item.vacantRooms}</td>
                    <td className="px-3 py-3"><OccupancyMeter value={item.occupancyRate} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <StatCard icon={IconBuilding} label={t('dashboard.totalRooms')} value={summary?.metrics.totalRooms} />
          <StatCard icon={IconCheckCircle} label={t('dashboard.occupiedRooms')} value={summary?.metrics.occupiedRooms} />
          <StatCard icon={IconDoorOpen} label={t('dashboard.vacantRooms')} value={summary?.metrics.vacantRooms} />
          <StatCard icon={IconGauge} label={t('dashboard.occupancyPercent')} value={`${summary?.metrics.occupancyRate}%`} />
          <StatCard icon={IconGrid} label={t('dashboard.zones')} value={summary?.metrics.zones} />
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-[var(--secondary)]">{t('dashboard.sectionC')}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--dark)]">{t('dashboard.floorStructure')}</h2>
          <div className="mt-4 space-y-3">
            {floors.map((building, index) => (
              <details
                key={building.building}
                open={index === 0}
                className="group overflow-hidden rounded-2xl border border-[var(--primary)]/10"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-semibold text-[var(--dark)] transition hover:bg-[var(--light)]/60">
                  <span>
                    {t('dashboard.buildingLabel', { building: building.building })}
                    <span className="ml-2 text-xs font-normal text-[var(--dark)]/60">{t('dashboard.floorsCount', { count: building.floors.length })}</span>
                  </span>
                  <IconChevronDown className="h-4 w-4 text-[var(--primary)] transition-transform duration-200 group-open:rotate-180" />
                </summary>
                <div className="overflow-x-auto px-4 pb-4">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-left text-[var(--dark)]/60">
                        <th className="px-3 py-2">{t('dashboard.floor')}</th>
                        <th className="px-3 py-2">{t('dashboard.roomRange')}</th>
                        <th className="px-3 py-2">{t('dashboard.total')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {building.floors.map((floor: any) => (
                        <tr key={`${building.building}-${floor.floor}`} className="border-t border-[var(--primary)]/10">
                          <td className="px-3 py-2">{floor.floor}</td>
                          <td className="px-3 py-2">{floor.roomRange}</td>
                          <td className="px-3 py-2 tabular-nums">{floor.totalRooms}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.3em] text-[var(--secondary)]">{t('dashboard.sectionD')}</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--dark)]">{t('dashboard.vacantRoomDetail')}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setVacantFilter('')}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${vacantFilter === '' ? 'bg-[var(--primary)] text-white' : 'bg-[var(--light)] text-[var(--dark)]/70 hover:bg-[var(--primary)]/10'}`}
              >
                {t('dashboard.all')}
              </button>
              {vacantBuildings.map((building) => (
                <button
                  key={building}
                  type="button"
                  onClick={() => setVacantFilter(building)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${vacantFilter === building ? 'bg-[var(--primary)] text-white' : 'bg-[var(--light)] text-[var(--dark)]/70 hover:bg-[var(--primary)]/10'}`}
                >
                  {building}
                </button>
              ))}
            </div>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {filteredVacant.length === 0 && (
              <p className="text-sm text-[var(--dark)]/60">{t('dashboard.noVacantFiltered')}</p>
            )}
            {filteredVacant.map((item) => (
              <div key={item.building} className="rounded-[1.5rem] border border-[var(--primary)]/10 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[var(--primary)]">{item.building}</h3>
                  <span className="rounded-full bg-[var(--light)] px-2.5 py-1 text-xs font-semibold text-[var(--dark)]/70">
                    {t('dashboard.vacantCount', { count: item.vacantRooms.length })}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.vacantRooms.map((room: string) => (
                    <span key={room} className="rounded-full bg-[var(--light)] px-3 py-1 text-sm text-[var(--dark)]">{room}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-[var(--secondary)]">{t('dashboard.sectionE')}</p>
          <h2 className="mt-2 text-2xl font-semibold text-[var(--dark)]">{t('dashboard.topTenants')}</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-[var(--light)] text-left text-[var(--dark)]/80">
                  <th className="px-3 py-3">#</th>
                  <th className="px-3 py-3">{t('dashboard.tenant')}</th>
                  <th className="px-3 py-3">{t('dashboard.roomsOccupied')}</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((tenant, index) => (
                  <tr key={tenant.company} className="border-t border-[var(--primary)]/10">
                    <td className="px-3 py-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]/10 text-xs font-semibold text-[var(--primary)]">
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-3 py-3 font-medium">
                      <div className="flex items-center gap-2">
                        <IconUsers className="h-4 w-4 shrink-0 text-[var(--secondary)]" />
                        {tenant.company}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-2 w-32 overflow-hidden rounded-full bg-[var(--primary)]/10">
                          <div
                            className="h-full rounded-full bg-[var(--secondary)] transition-all duration-500"
                            style={{ width: `${(tenant.roomsOccupied / maxTenantRooms) * 100}%` }}
                          />
                        </div>
                        <span className="tabular-nums font-semibold text-[var(--dark)]">{tenant.roomsOccupied}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
