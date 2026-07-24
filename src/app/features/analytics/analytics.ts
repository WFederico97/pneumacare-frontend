import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AppShell } from '../../dashboard/app-shell/app-shell';
import { KpiCard } from './widgets/kpi-card/kpi-card';
import { BreakdownBar, BreakdownSegment } from './widgets/breakdown-bar/breakdown-bar';
import { TrendBars } from './widgets/trend-bars/trend-bars';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AnalyticsSummary } from '../../core/models/analytics.model';
import { AuthService } from '../../core/auth/auth.service';
import { roleLabel } from '../../core/auth/auth.model';

type MetricFocus = 'all' | 'clinical' | 'ward' | 'iam';

interface WindowOption {
  readonly days: number;
  readonly label: string;
}

interface FocusOption {
  readonly key: MetricFocus;
  readonly label: string;
}

/**
 * Role-aware analytics page. The backend includes sections additively by role
 * (clinical → ward → iam); the focus filter mirrors those same rules so users
 * only see filter options for sections they actually receive.
 */
@Component({
  selector: 'app-analytics',
  imports: [AppShell, KpiCard, BreakdownBar, TrendBars],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
  host: { class: 'block' },
})
export class Analytics implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly auth = inject(AuthService);

  readonly summary = signal<AnalyticsSummary | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  /** Date-range filter (days). Drives the server query. */
  readonly windowDays = signal(14);
  /** Client-side drill-down: isolate a single metric section, or show all. */
  readonly metricFocus = signal<MetricFocus>('all');

  readonly windowOptions: readonly WindowOption[] = [
    { days: 7, label: '7 días' },
    { days: 14, label: '14 días' },
    { days: 30, label: '30 días' },
    { days: 90, label: '90 días' },
  ];

  /**
   * Focus options limited to the sections the caller's role receives — mirrors
   * the server rules in AnalyticsService (ward → chief/admin, iam → admin).
   * "Todo" only appears when there is more than one section to switch between.
   */
  readonly focusOptions = computed<readonly FocusOption[]>(() => {
    const options: FocusOption[] = [{ key: 'clinical', label: 'Clínico' }];
    if (this.auth.hasAnyRole('ROLE_CHIEF_OF_GUARD', 'ROLE_ADMIN')) {
      options.push({ key: 'ward', label: 'Guardia' });
    }
    if (this.auth.hasAnyRole('ROLE_ADMIN')) {
      options.push({ key: 'iam', label: 'Usuarios' });
    }
    return options.length > 1 ? [{ key: 'all', label: 'Todo' }, ...options] : options;
  });

  /** Short window label reused across section headings (e.g. "14d"). */
  readonly windowLabel = computed(() => `${this.windowDays()}d`);

  ngOnInit(): void {
    this.load();
  }

  setWindow(days: number): void {
    if (days === this.windowDays()) return;
    this.windowDays.set(days);
    this.load();
  }

  setFocus(focus: MetricFocus): void {
    this.metricFocus.set(focus);
  }

  /** A section is shown when focus is "all" or matches the section key. */
  showsSection(section: Exclude<MetricFocus, 'all'>): boolean {
    const f = this.metricFocus();
    return f === 'all' || f === section;
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.analyticsService.getSummaryForWindow(this.windowDays()).subscribe({
      next: (r) => {
        this.summary.set(r.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('No pudimos cargar la analítica. Intentá de nuevo.');
      },
    });
  }

  evaluationCount(s: AnalyticsSummary): number {
    return s.clinical!.evaluationTrend.reduce((acc, p) => acc + p.count, 0);
  }

  sbtTotal(s: AnalyticsSummary): number {
    const w = s.clinical!.weaning;
    return w.sbtSuccess + w.sbtFailure;
  }

  occupancySegments(s: AnalyticsSummary): BreakdownSegment[] {
    const o = s.clinical!.occupancy;
    return [
      { label: 'Ocupadas', value: o.occupied, colorClass: 'bg-red-800' },
      { label: 'Disponibles', value: o.available, colorClass: 'bg-green-800' },
    ];
  }

  rsbiSegments(s: AnalyticsSummary): BreakdownSegment[] {
    const w = s.clinical!.weaning;
    return [
      { label: 'Favorable', value: w.rsbiFavorable, colorClass: 'bg-cyan-700' },
      { label: 'Límite', value: w.rsbiBorderline, colorClass: 'bg-amber-700' },
      { label: 'Desfavorable', value: w.rsbiUnfavorable, colorClass: 'bg-rose-800' },
    ];
  }

  sbtSegments(s: AnalyticsSummary): BreakdownSegment[] {
    const w = s.clinical!.weaning;
    return [
      { label: 'Éxito', value: w.sbtSuccess, colorClass: 'bg-green-800' },
      { label: 'Fallo', value: w.sbtFailure, colorClass: 'bg-red-800' },
    ];
  }

  windSegments(s: AnalyticsSummary): BreakdownSegment[] {
    const w = s.clinical!.weaningClassification;
    return [
      { label: 'Simple', value: w.simple, colorClass: 'bg-emerald-700' },
      { label: 'Difícil', value: w.difficult, colorClass: 'bg-amber-700' },
      { label: 'Prolongado', value: w.prolonged, colorClass: 'bg-rose-800' },
      { label: 'Sin intento', value: w.noAttempt, colorClass: 'bg-slate-600' },
    ];
  }

  pct(rate: number): string {
    return Math.round(rate * 100) + '%';
  }

  roleEntries(iam: NonNullable<AnalyticsSummary['iam']>): { label: string; count: number }[] {
    return Object.entries(iam.byRole).map(([role, count]) => ({ label: roleLabel(role), count }));
  }
}
