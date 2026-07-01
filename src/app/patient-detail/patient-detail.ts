import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { PatientService } from '../core/services/patient.service';
import { TimelineService } from '../core/services/timeline.service';
import { ShiftService } from '../core/services/shift.service';
import { PatientApiItem } from '../core/models/patient.model';
import {
  AirwayEventPayload,
  RespiratoryStatus,
  SbtPayload,
  TimelineEntry,
} from '../core/models/timeline.model';
import { TimelineEventCard } from './timeline-event-card/timeline-event-card';
import { AirwayEventModal } from './airway-event-modal/airway-event-modal';
import { SbtModal } from './sbt-modal/sbt-modal';
import { AppShell } from '../dashboard/app-shell/app-shell';

type ProcedureModal = 'airway' | 'sbt' | null;

/**
 * Patient detail view (PNMC-96): route /patients/:id. Fetches the patient header
 * and the unified clinical timeline (GET /api/v1/patients/{id}/timeline), rendering
 * loading / error / not-found / empty / loaded states. The timeline arrives
 * pre-merged and ordered newest-first from the backend (PNMC-133).
 *
 * <p>Also hosts the clinical-procedure modals (PNMC-97): an "Add Event" control —
 * gated by an OPEN shift (PNMC-93) — opens the SBT or airway-event form; on a
 * successful 201 the new event is prepended to the timeline without a reload.
 */
@Component({
  selector: 'app-patient-detail',
  imports: [RouterLink, TimelineEventCard, AirwayEventModal, SbtModal, AppShell],
  templateUrl: './patient-detail.html',
  styleUrl: './patient-detail.css',
  host: { class: 'block' },
})
export class PatientDetail implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly patientService = inject(PatientService);
  private readonly timelineService = inject(TimelineService);
  private readonly shiftService = inject(ShiftService);

  readonly isLoading = signal(true);
  readonly hasError = signal(false);
  readonly notFound = signal(false);
  readonly patient = signal<PatientApiItem | null>(null);
  readonly entries = signal<TimelineEntry[]>([]);
  readonly patientId = signal<string | null>(null);

  /** "Add Event" is only enabled while a shift is OPEN (consistent with PNMC-93). */
  readonly isShiftOpen = this.shiftService.isShiftOpen;
  readonly isMenuOpen = signal(false);
  readonly activeModal = signal<ProcedureModal>(null);

  readonly isEmpty = computed(
    () => !this.isLoading() && !this.hasError() && !this.notFound() && this.entries().length === 0,
  );

  /** Current respiratory status, derived from the latest AIRWAY event (default SPONTANEOUS). */
  readonly currentRespiratoryStatus = computed<RespiratoryStatus>(() => {
    const latestAirway = this.entries().find((entry) => entry.type === 'AIRWAY');
    return latestAirway
      ? (latestAirway.payload as AirwayEventPayload).resultingStatus
      : 'SPONTANEOUS';
  });

  ngOnInit(): void {
    this.shiftService.refresh();

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.isLoading.set(false);
      this.notFound.set(true);
      return;
    }
    this.patientId.set(id);
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
    const id = this.patientId();
    if (id) {
      this.load(id);
    }
  }

  patientName(): string {
    const p = this.patient();
    return p ? `${p.firstName} ${p.lastName}` : '';
  }

  toggleMenu(): void {
    this.isMenuOpen.update((open) => !open);
  }

  openModal(modal: Exclude<ProcedureModal, null>): void {
    this.isMenuOpen.set(false);
    this.activeModal.set(modal);
  }

  closeModal(): void {
    this.activeModal.set(null);
  }

  onAirwayCreated(payload: AirwayEventPayload): void {
    this.prepend({ type: 'AIRWAY', occurredAt: payload.eventTimestamp, payload });
  }

  onSbtCreated(payload: SbtPayload): void {
    this.prepend({ type: 'SBT', occurredAt: payload.recordedAt, payload });
  }

  private prepend(entry: TimelineEntry): void {
    this.entries.update((list) => [entry, ...list]);
    this.closeModal();
  }
}
