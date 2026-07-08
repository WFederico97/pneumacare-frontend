import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { AppShell } from '../../dashboard/app-shell/app-shell';
import { AnalyticsService } from '../../core/services/analytics.service';
import { ExecutiveDashboard } from '../../core/models/analytics.model';

/** One accessible KPI tile: display label, formatted value, screen-reader label, icon key. */
interface ExecutiveKpi {
  readonly label: string;
  readonly value: string;
  readonly ariaLabel: string;
  readonly icon: 'bed' | 'bell' | 'wrench';
}

/**
 * Executive dashboard for the Hospital Director. Loads the aggregated ICU KPIs
 * on activation and renders them as accessible cards. Route-guarded to
 * ROLE_DIRECTOR / ROLE_ADMIN; the backend endpoint enforces the same server-side.
 */
@Component({
  selector: 'app-executive',
  imports: [AppShell],
  templateUrl: './executive.html',
  styleUrl: './executive.css',
  host: { class: 'block' },
})
export class Executive implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  readonly data = signal<ExecutiveDashboard | null>(null);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

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
        label: 'Equipos en mantenimiento',
        value: `${d.equipmentInMaintenanceCount}`,
        ariaLabel: `Equipos en mantenimiento: ${d.equipmentInMaintenanceCount}`,
        icon: 'wrench',
      },
    ];
  });

  ngOnInit(): void {
    this.load();
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
