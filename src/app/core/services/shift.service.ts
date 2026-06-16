import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  ActiveShiftApiResponse,
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

  /**
   * Fetches GET /api/v1/shifts/active into the store. Tolerates both the
   * envelope-with-null-data shape (our backend) and an empty 204 body.
   */
  refresh(): void {
    this.isLoading.set(true);
    this.hasError.set(false);

    this.http
      .get<ActiveShiftApiResponse | null>('/api/v1/shifts/active')
      .subscribe({
        next: (response) => {
          this.activeShift.set(response?.data ?? null);
          this.isLoading.set(false);
        },
        error: () => {
          this.activeShift.set(null);
          this.hasError.set(true);
          this.isLoading.set(false);
        },
      });
  }

  /** POST /api/v1/shifts — opens a shift for the given ICU. */
  openShift(icuId: string): Observable<Shift> {
    return this.http
      .post<ShiftApiResponse>('/api/v1/shifts', { icuId })
      .pipe(map((response) => response.data));
  }

  /** PATCH /api/v1/shifts/{id}/close — closes the given shift. */
  closeShift(shiftId: string): Observable<Shift> {
    return this.http
      .patch<ShiftApiResponse>(`/api/v1/shifts/${shiftId}/close`, {})
      .pipe(map((response) => response.data));
  }
}
