import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../dashboard/app-shell/app-shell';
import { AlertsService } from '../../core/services/alerts.service';
import { ActiveAlert } from '../../core/models/alert.model';

/**
 * Alertas view: lists the ICU's currently-active clinical alerts (patients whose
 * latest evaluation tripped a threshold), with the triggering metrics and a link
 * to each patient's history. Available to all clinical roles.
 */
@Component({
  selector: 'app-alerts',
  imports: [AppShell, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './alerts.html',
  styleUrl: './alerts.css',
  host: { class: 'block' },
})
export class Alerts implements OnInit {
  private readonly service = inject(AlertsService);

  readonly alerts = signal<ActiveAlert[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.service.list().subscribe({
      next: (data) => {
        this.alerts.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('No pudimos cargar las alertas. Reintentá.');
      },
    });
  }

  rsbiLabel(v: string | null): string {
    if (v === 'FAVORABLE') return 'Favorable';
    if (v === 'BORDERLINE') return 'Limítrofe';
    if (v === 'UNFAVORABLE') return 'Desfavorable';
    return '—';
  }

  pafiLabel(v: string | null): string {
    if (v === 'NORMAL') return 'Normal';
    if (v === 'AT_RISK') return 'En riesgo';
    if (v === 'MILD_ARDS') return 'SDRA leve';
    if (v === 'MODERATE_ARDS') return 'SDRA moderado';
    if (v === 'SEVERE_ARDS') return 'SDRA severo';
    return '—';
  }

  cstatLabel(v: string | null): string {
    if (v === 'HIGH') return 'Alta';
    if (v === 'NORMAL') return 'Normal';
    if (v === 'LOW') return 'Baja';
    return '—';
  }

  /** Amber/red badge classes for a metric interpretation; red = the breaching bands. */
  severityClass(kind: 'rsbi' | 'pafi' | 'cstat', v: string | null): string {
    const danger =
      (kind === 'rsbi' && v === 'UNFAVORABLE') ||
      (kind === 'pafi' && (v === 'MODERATE_ARDS' || v === 'SEVERE_ARDS')) ||
      (kind === 'cstat' && v === 'LOW');
    const warn =
      (kind === 'rsbi' && v === 'BORDERLINE') ||
      (kind === 'pafi' && (v === 'AT_RISK' || v === 'MILD_ARDS'));
    if (danger) return 'border-red-500/40 bg-red-950/40 text-red-200';
    if (warn) return 'border-amber-500/40 bg-amber-950/30 text-amber-200';
    return 'border-slate-600/50 bg-slate-800/40 text-slate-300';
  }
}
