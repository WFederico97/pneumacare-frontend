import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PatientService } from '../core/services/patient.service';
import { TimelineService } from '../core/services/timeline.service';
import { PatientApiItem } from '../core/models/patient.model';
import { TimelineEntry } from '../core/models/timeline.model';
import { TimelineEventCard } from './timeline-event-card/timeline-event-card';

/**
 * Patient detail view (PNMC-96): route /patients/:id. Fetches the patient header
 * and the unified clinical timeline (GET /api/v1/patients/{id}/timeline), rendering
 * loading / error / not-found / empty / loaded states. The timeline arrives
 * pre-merged and ordered newest-first from the backend (PNMC-133).
 */
@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink, TimelineEventCard],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.css',
  host: { class: 'block min-h-screen bg-slate-950' },
})
export class PatientDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientService = inject(PatientService);
  private readonly timelineService = inject(TimelineService);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly notFound = signal(false);
  readonly patient = signal<PatientApiItem | null>(null);
  readonly entries = signal<TimelineEntry[]>([]);

  readonly isEmpty = computed(
    () => !this.isLoading() && !this.hasError() && !this.notFound() && this.entries().length === 0,
  );

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.isLoading.set(false);
      this.notFound.set(true);
      return;
    }
    this.load(id);
  }

  private load(id: string): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.notFound.set(false);

    this.patientService.getPatient(id).subscribe({
      next: (response) => {
        this.patient.set(response.data);
        this.loadTimeline(id);
      },
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  private loadTimeline(id: string): void {
    this.timelineService.getTimeline(id).subscribe({
      next: (response) => {
        this.entries.set(response.data ?? []);
        this.isLoading.set(false);
      },
      error: (err: HttpErrorResponse) => this.handleError(err),
    });
  }

  private handleError(err: HttpErrorResponse): void {
    this.isLoading.set(false);
    if (err.status === 404) {
      this.notFound.set(true);
    } else {
      this.hasError.set(true);
    }
  }

  retry(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.load(id);
    }
  }

  patientName(): string {
    const p = this.patient();
    return p ? `${p.firstName} ${p.lastName}` : '';
  }
}
