import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AppShell } from '../dashboard/app-shell/app-shell';
import { BedsDashboard } from '../dashboard/beds-dashboard/beds-dashboard';
import { DetailPanel } from '../dashboard/detail-panel/detail-panel';
import { IcuBed } from '../core/models/icu-bed.model';
import { AdmissionModal } from '../dashboard/admission-modal/admission-modal';
import { KpiCard } from '../features/analytics/widgets/kpi-card/kpi-card';
import { BreakdownBar, BreakdownSegment } from '../features/analytics/widgets/breakdown-bar/breakdown-bar';
import { AnalyticsService } from '../core/services/analytics.service';
import { AnalyticsSummary } from '../core/models/analytics.model';

@Component({
  selector: 'app-home',
  imports: [RouterLink, AppShell, BedsDashboard, DetailPanel, AdmissionModal, KpiCard, BreakdownBar],
  templateUrl: './home.html',
  styleUrl: './home.css',
  host: { class: 'block' }
})
export class Home implements OnInit {
  private readonly analyticsService = inject(AnalyticsService);

  readonly selectedBed = signal<IcuBed | null>(null);
  readonly isAdmissionModalOpen = signal(false);
  readonly admittedBed = signal<{ bedId: string; patientId: string } | null>(null);
  readonly toastMessage = signal<string | null>(null);
  readonly analytics = signal<AnalyticsSummary | null>(null);

  ngOnInit(): void {
    this.analyticsService.getSummary().subscribe({
      next: (r) => this.analytics.set(r.data),
      error: () => {},
    });
  }

  occupancyPct(): string {
    const rate = this.analytics()?.clinical?.occupancy?.occupancyRate ?? 0;
    return Math.round(rate * 100) + '%';
  }

  occupancySegments(): BreakdownSegment[] {
    const o = this.analytics()?.clinical?.occupancy;
    if (!o) {
      return [];
    }
    return [
      { label: 'Ocupadas', value: o.occupied, colorClass: 'bg-red-800' },
      { label: 'Disponibles', value: o.available, colorClass: 'bg-green-800' },
    ];
  }

  handleBedSelected(bed: IcuBed): void {
    this.selectedBed.set(bed);
    if (bed.status === 'AVAILABLE') {
      this.isAdmissionModalOpen.set(true);
    }
  }

  clearSelectedBed(): void {
    this.selectedBed.set(null);
  }

  closeAdmissionModal(): void {
    this.isAdmissionModalOpen.set(false);
    this.selectedBed.set(null);
  }

  handlePatientAdmitted(admission: { bedId: string; patientId: string }): void {
    this.admittedBed.set(admission);
    this.selectedBed.set(null);
    this.isAdmissionModalOpen.set(false);
    this.toastMessage.set('Paciente admitido correctamente.');
    setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
