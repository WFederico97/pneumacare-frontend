import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ActiveShiftApiResponse,
  Handover,
  HandoverApiResponse,
  Shift,
  ShiftApiResponse,
} from '../models/shift.model';

/**
 * Shared front-end store for the active medical shift (PNMC-93).
 *
 * <p>Singleton (`providedIn: 'root'`) so every screen reads the same signals.
 * The header refreshes on load and after any open/close action; evaluation forms
 * read {@link isShiftOpen} to lock themselves when no shift is OPEN.
 *
 * <p>Fail-safe: on a request error the store reports no open shift
 * ({@link hasError} true, {@link isShiftOpen} false) so clinical forms stay locked
 * rather than silently allowing input against an unknown shift state (AC5).
 */
@Injectable({ providedIn: 'root' })
export class ShiftService {
  private readonly http = inject(HttpClient);

  readonly activeShift = signal<Shift | null>(null);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  /** True only when a shift is confirmed OPEN. Any error keeps this false. */
  readonly isShiftOpen = computed(() => !this.hasError() && this.activeShift() !== null);

  /** Coalescing window: skip a network refresh if one resolved this recently. */
  private static readonly TTL_MS = 10_000;
  private lastFetch = 0;
  private inFlight = false;

  /**
   * Fetches GET /api/v1/shifts/active into the store. Tolerates both the
   * envelope-with-null-data shape (our backend) and an empty 204 body.
   *
   * <p>The active shift is read by the header on every page and by clinical
   * forms, so calls are coalesced: a refresh is skipped when one is in flight or
   * resolved within {@link TTL_MS}. Pass {@code force} after an open/close to
   * bypass the cache and reflect the change immediately.
   */
  refresh(force = false): void {
    const now = Date.now();
    if (!force && (this.inFlight || now - this.lastFetch < ShiftService.TTL_MS)) {
      return;
    }
    this.inFlight = true;
    this.isLoading.set(true);
    this.hasError.set(false);

    this.http
      .get<ActiveShiftApiResponse | null>('/api/v1/shifts/active')
      .subscribe({
        next: (response) => {
          this.activeShift.set(response?.data ?? null);
          this.isLoading.set(false);
          this.inFlight = false;
          this.lastFetch = Date.now();
        },
        error: () => {
          this.activeShift.set(null);
          this.hasError.set(true);
          this.isLoading.set(false);
          this.inFlight = false;
          this.lastFetch = Date.now();
        },
      });
  }

  /** POST /api/v1/shifts — opens a shift for the caller's ICU (derived server-side from the session). */
  openShift(): Observable<Shift> {
    return this.http
      .post<ShiftApiResponse>('/api/v1/shifts', {})
      .pipe(map((response) => response.data));
  }

  /** PATCH /api/v1/shifts/{id}/close — closes the given shift. */
  closeShift(shiftId: string): Observable<Shift> {
    return this.http
      .patch<ShiftApiResponse>(`/api/v1/shifts/${shiftId}/close`, {})
      .pipe(map((response) => response.data));
  }

  /** POST /api/v1/shifts/{id}/handovers — records a handover note (must be an OPEN shift). */
  createHandover(shiftId: string, notesContent: string): Observable<Handover> {
    return this.http
      .post<HandoverApiResponse>(`/api/v1/shifts/${shiftId}/handovers`, { notesContent })
      .pipe(map((response) => response.data));
  }
}
