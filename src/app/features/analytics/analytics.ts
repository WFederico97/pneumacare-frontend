import { Component, OnInit, inject, signal } from '@angular/core';
import { AppShell } from '../../dashboard/app-shell/app-shell';
import { KpiCard } from './widgets/kpi-card/kpi-card';
import { BreakdownBar, BreakdownSegment } from './widgets/breakdown-bar/breakdown-bar';
import { TrendBars } from './widgets/trend-bars/trend-bars';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AnalyticsSummary } from '../../core/models/analytics.model';
import { roleLabel } from '../../core/auth/auth.model';

/**
 * Role-aware analytics page. Renders whatever sections the backend returns
 * (clinical → ward → iam); the role-awareness is entirely server-driven.
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

  readonly summary = signal<AnalyticsSummary | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.analyticsService.getSummary().subscribe({
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
      { label: 'Mantenim.', value: o.maintenance, colorClass: 'bg-yellow-700' },
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

  pct(rate: number): string {
    return Math.round(rate * 100) + '%';
  }

  roleEntries(iam: NonNullable<AnalyticsSummary['iam']>): { label: string; count: number }[] {
    return Object.entries(iam.byRole).map(([role, count]) => ({ label: roleLabel(role), count }));
  }
}
