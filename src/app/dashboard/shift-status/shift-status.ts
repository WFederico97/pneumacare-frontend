import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ShiftService } from '../../core/services/shift.service';
import { UserContext } from '../../core/services/user-context.service';
import { ShiftHandoverModal } from '../shift-handover-modal/shift-handover-modal';

/**
 * Persistent active-shift indicator for the header (PNMC-93).
 *
 * <p>Reads the shared {@link ShiftService} store: shows a green "Turno Abierto"
 * badge (ICU + start time) when a shift is OPEN, a red "Sin Turno Activo" badge
 * when none, a loading state while fetching, and a neutral "Estado no disponible"
 * state on error (forms stay locked — fail-safe). The open/close control renders
 * only for the Chief of Guard.
 */
@Component({
  selector: 'app-shift-status',
  imports: [ShiftHandoverModal],
  templateUrl: './shift-status.html',
  styleUrl: './shift-status.css',
  host: { class: 'block' },
})
export class ShiftStatus implements OnInit {
  private readonly shiftService = inject(ShiftService);
  private readonly userContext = inject(UserContext);

  readonly activeShift = this.shiftService.activeShift;
  readonly isLoading = this.shiftService.isLoading;
  readonly hasError = this.shiftService.hasError;
  readonly isShiftOpen = this.shiftService.isShiftOpen;
  readonly isChief = this.userContext.isChief;

  readonly isActionInFlight = signal(false);
  readonly actionError = signal<string | null>(null);

  /** Shift id whose close-handover modal is open, or null when the modal is hidden. */
  readonly closingShiftId = signal<string | null>(null);

  /** Localized opening time for the badge. */
  readonly startedAtLabel = computed(() => {
    const shift = this.activeShift();
    if (!shift) {
      return '';
    }
    const date = new Date(shift.startedAt);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleString('es-AR', {
          day: '2-digit',
          month: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        });
  });

  /** Short ICU label for the badge (no ICU name is exposed by the API yet). */
  readonly icuLabel = computed(() => {
    const shift = this.activeShift();
    return shift ? shift.icuId.slice(0, 8) : '';
  });

  ngOnInit(): void {
    this.shiftService.refresh();
  }

  openShift(): void {
    if (this.isActionInFlight()) {
      return;
    }
    this.isActionInFlight.set(true);
    this.actionError.set(null);

    this.shiftService.openShift().subscribe({
      next: () => {
        this.isActionInFlight.set(false);
        this.shiftService.refresh(true);
      },
      error: (err: HttpErrorResponse) => {
        this.isActionInFlight.set(false);
        this.setActionError(this.extractMessage(err, 'No se pudo abrir el turno.'));
      },
    });
  }

  /** Opens the handover modal for the active shift; the modal records notes and closes it. */
  requestClose(): void {
    const shift = this.activeShift();
    if (!shift || this.isActionInFlight()) {
      return;
    }
    this.actionError.set(null);
    this.closingShiftId.set(shift.id);
  }

  onHandoverClosed(): void {
    this.closingShiftId.set(null);
    this.shiftService.refresh(true);
  }

  onHandoverCancel(): void {
    this.closingShiftId.set(null);
  }

  private setActionError(message: string): void {
    this.actionError.set(message);
    setTimeout(() => this.actionError.set(null), 5000);
  }

  private extractMessage(err: HttpErrorResponse, fallback: string): string {
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.message === 'string' && body.message) {
      return body.message;
    }
    return fallback;
  }
}
