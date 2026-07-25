import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AppShell } from '../../dashboard/app-shell/app-shell';
import { ShiftService } from '../../core/services/shift.service';
import { Handover, ShiftSummary } from '../../core/models/shift.model';

/**
 * Shift history for the caller's ICU: every shift with its duration and the
 * clinical activity recorded during it, plus the handover notes of whichever
 * shift is selected.
 *
 * <p>The list answers "what happened on each watch"; the detail panel answers
 * "what was handed over". Handovers are fetched lazily per selection rather than
 * eagerly for every shift — the list already carries the count, so a shift with
 * no notes needs no request at all.
 */
@Component({
  selector: 'app-shifts',
  imports: [AppShell, DatePipe],
  templateUrl: './shifts.html',
  host: { class: 'block' },
})
export class Shifts implements OnInit {
  private readonly shiftService = inject(ShiftService);

  readonly shifts = signal<ShiftSummary[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);

  readonly selectedId = signal<string | null>(null);
  readonly handovers = signal<Handover[]>([]);
  readonly handoversLoading = signal(false);
  readonly handoversError = signal<string | null>(null);

  readonly selected = computed(() => this.shifts().find((s) => s.id === this.selectedId()) ?? null);

  readonly openShift = computed(() => this.shifts().find((s) => s.status === 'OPEN') ?? null);
  readonly closedCount = computed(() => this.shifts().filter((s) => s.status === 'CLOSED').length);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.shiftService.getHistory().subscribe({
      next: (shifts) => {
        this.shifts.set(shifts);
        this.isLoading.set(false);
        // Open the newest shift by default so the page is never an empty shell.
        if (shifts.length > 0 && !this.selectedId()) {
          this.select(shifts[0].id);
        }
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('No pudimos cargar el historial de turnos. Reintentá.');
      },
    });
  }

  select(shiftId: string): void {
    this.selectedId.set(shiftId);
    this.handovers.set([]);
    this.handoversError.set(null);

    const shift = this.shifts().find((s) => s.id === shiftId);
    if (!shift || shift.handoverCount === 0) {
      return;
    }

    this.handoversLoading.set(true);
    this.shiftService.getHandovers(shiftId).subscribe({
      next: (notes) => {
        this.handovers.set(notes);
        this.handoversLoading.set(false);
      },
      error: () => {
        this.handoversLoading.set(false);
        this.handoversError.set('No pudimos cargar las novedades de este turno.');
      },
    });
  }

  /** "8 h 25 min" — minutes alone are unreadable for a 12-hour watch. */
  formatDuration(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (hours === 0) return `${minutes} min`;
    return `${hours} h ${minutes} min`;
  }

  totalActivity(shift: ShiftSummary): number {
    return shift.evaluationCount + shift.airwayEventCount + shift.sbtCount;
  }
}
