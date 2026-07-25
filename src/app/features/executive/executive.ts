import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AppShell } from '../../dashboard/app-shell/app-shell';
import { BreakdownBar } from '../analytics/widgets/breakdown-bar/breakdown-bar';
import { AnalyticsService } from '../../core/services/analytics.service';
import { AuthService } from '../../core/auth/auth.service';
import { ExecutiveDashboard, HierarchyLevel, HierarchyRow } from '../../core/models/analytics.model';

interface LevelTab {
  readonly level: HierarchyLevel;
  readonly label: string;
}

/** One accessible KPI tile: display label, formatted value, screen-reader label, icon key. */
interface ExecutiveKpi {
  readonly label: string;
  readonly value: string;
  readonly ariaLabel: string;
  readonly icon: 'bed' | 'bell' | 'wrench' | 'chart' | 'pulse';
}

/**
 * Executive dashboard. Directors and admins get the aggregated ICU KPI cards
 * plus all three rollup levels; chiefs of guard only get the patient-level
 * rollup — mirroring the server rules (the KPI endpoint and the org-level
 * aggregations are Director/Admin only, patient level is open to chiefs).
 */
@Component({
  selector: 'app-executive',
  imports: [AppShell, BreakdownBar],
  templateUrl: './executive.html',
  styleUrl: './executive.css',
  host: { class: 'block' },
})
export class Executive implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);
  private readonly auth = inject(AuthService);

  /** Director/Admin see the KPI cards and org-level rollups; chiefs do not. */
  readonly isOrgViewer = this.auth.hasAnyRole('ROLE_DIRECTOR', 'ROLE_ADMIN');

  readonly data = signal<ExecutiveDashboard | null>(null);
  readonly isLoading = signal(this.isOrgViewer);
  readonly loadError = signal<string | null>(null);

  /* ── Multi-level rollup (province / institution / patient) ── */
  readonly levelTabs: readonly LevelTab[] = this.isOrgViewer
    ? [
        { level: 'PROVINCE', label: 'Provincia' },
        { level: 'INSTITUTION', label: 'Institución' },
        { level: 'PATIENT', label: 'Paciente' },
      ]
    : [{ level: 'PATIENT', label: 'Paciente' }];
  readonly activeLevel = signal<HierarchyLevel>(this.isOrgViewer ? 'PROVINCE' : 'PATIENT');
  readonly hierarchyRows = signal<HierarchyRow[]>([]);
  readonly hierarchyLoading = signal(true);
  readonly hierarchyError = signal<string | null>(null);

  readonly kpis = computed<ExecutiveKpi[]>(() => {
    const d = this.data();
    if (!d) {
      return [];
    }
    return [
      {
        label: 'Ocupación de camas',
        value: `${d.occupancyRatePercent}%`,
        ariaLabel: `Ocupación de camas: ${d.occupancyRatePercent} por ciento`,
        icon: 'bed',
      },
      {
        label: 'Alertas (7 días)',
        value: `${d.alertFrequencyLast7Days}`,
        ariaLabel: `Alertas en los últimos 7 días: ${d.alertFrequencyLast7Days}`,
        icon: 'bell',
      },
      {
        label: 'Utilización ventiladores',
        value: `${d.assetUtilization.utilizationPercent}%`,
        ariaLabel: `Utilización de ventiladores: ${d.assetUtilization.utilizationPercent} por ciento`,
        icon: 'wrench',
      },
      {
        // True ALOS — episodes CLOSED in the window, not the current census.
        label: 'Estancia media (egresos)',
        value: `${d.averageStayDays} d`,
        ariaLabel: `Estancia media de egresos: ${d.averageStayDays} días sobre ${d.mortality.closedEpisodes} episodios cerrados`,
        icon: 'bed',
      },
      {
        label: 'Estancia media (internados)',
        value: `${d.currentCensusMeanStayDays} d`,
        ariaLabel: `Estancia media de pacientes internados: ${d.currentCensusMeanStayDays} días`,
        icon: 'bed',
      },
      {
        label: 'Rotación de camas',
        value: `${d.bedTurnover}`,
        ariaLabel: `Rotación de camas: ${d.bedTurnover} egresos por cama en 30 días`,
        icon: 'chart',
      },
      {
        label: 'Mortalidad UCI',
        value: `${d.mortality.icuMortalityPercent}%`,
        ariaLabel: `Mortalidad en UCI: ${d.mortality.icuMortalityPercent} por ciento, ${d.mortality.deceased} fallecidos y ${d.mortality.withdrawalOfCare} por adecuación del esfuerzo terapéutico sobre ${d.mortality.closedEpisodes} episodios cerrados`,
        icon: 'pulse',
      },
      {
        // Fraction, not a percentage: the cohort denominator is typically small.
        label: 'Mortalidad fallo weaning',
        value: `${d.mortality.weaningFailureDeceased}/${d.mortality.weaningFailureCohort}`,
        ariaLabel: `Mortalidad asociada a fallo de weaning: ${d.mortality.weaningFailureDeceased} de ${d.mortality.weaningFailureCohort} episodios con fallo de destete`,
        icon: 'pulse',
      },
      {
        label: 'Reingresos (7 días)',
        value: `${d.readmissions.readmissions7d}`,
        ariaLabel: `Reingresos dentro de 7 días: ${d.readmissions.readmissions7d}, tasa ${d.readmissions.rate7dPercent} por ciento. Dentro de 48 horas: ${d.readmissions.readmissions48h}`,
        icon: 'chart',
      },
      {
        label: 'Equipos en mantenimiento',
        value: `${d.equipmentInMaintenanceCount}`,
        ariaLabel: `Equipos en mantenimiento: ${d.equipmentInMaintenanceCount}`,
        icon: 'wrench',
      },
    ];
  });

  /** Ventilator fleet status matrix segments for the asset-utilization bar. */
  readonly assetSegments = computed(() => {
    const a = this.data()?.assetUtilization;
    if (!a) {
      return [];
    }
    return [
      { label: 'En uso', value: a.inUse, colorClass: 'bg-red-800' },
      { label: 'Disponibles', value: a.available, colorClass: 'bg-green-800' },
      { label: 'Mantenimiento', value: a.maintenance, colorClass: 'bg-amber-700' },
    ];
  });

  ngOnInit(): void {
    // The KPI endpoint is Director/Admin only — skip it for chiefs (403 otherwise).
    if (this.isOrgViewer) {
      this.load();
    }
    this.loadHierarchy();
  }

  setLevel(level: HierarchyLevel): void {
    if (level === this.activeLevel()) return;
    this.activeLevel.set(level);
    this.loadHierarchy();
  }

  loadHierarchy(): void {
    this.hierarchyLoading.set(true);
    this.hierarchyError.set(null);
    this.analyticsService.getHierarchy(this.activeLevel()).subscribe({
      next: (r) => {
        this.hierarchyRows.set(r.data.rows);
        this.hierarchyLoading.set(false);
      },
      error: () => {
        this.hierarchyLoading.set(false);
        this.hierarchyRows.set([]);
        this.hierarchyError.set('No pudimos cargar la agregación. Reintentá.');
      },
    });
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.analyticsService.getExecutiveDashboard().subscribe({
      next: (r) => {
        this.data.set(r.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('No pudimos cargar el panel. Reintentá.');
      },
    });
  }
}
