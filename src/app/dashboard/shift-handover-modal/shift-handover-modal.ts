import { Component, ElementRef, HostListener, afterNextRender, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { ShiftService } from '../../core/services/shift.service';
import { Handover } from '../../core/models/shift.model';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Backend caps handover note content at 4000 characters (422 otherwise). */
const MAX_NOTES = 4000;

/**
 * Handover ("novedades del turno") modal shown when the Chief of Guard closes a
 * shift. Captures an optional handover note, POSTs it to the shift's handover
 * endpoint (only when non-empty — the backend rejects empty notes), then closes
 * the shift. Emits {@link closed} once the shift is CLOSED.
 */
@Component({
  selector: 'app-shift-handover-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './shift-handover-modal.html',
  styleUrl: './shift-handover-modal.css',
  host: { class: 'block' },
})
export class ShiftHandoverModal {
  private readonly formBuilder = inject(FormBuilder);
  private readonly shiftService = inject(ShiftService);
  private readonly el = inject(ElementRef<HTMLElement>);

  private readonly previousFocus = document.activeElement as HTMLElement | null;

  readonly shiftId = input.required<string>();

  readonly cancel = output<void>();
  readonly closed = output<void>();

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly maxNotes = MAX_NOTES;

  readonly form = this.formBuilder.group({
    notesContent: this.formBuilder.control<string>('', {
      nonNullable: true,
      validators: [Validators.maxLength(MAX_NOTES)],
    }),
  });

  /** Characters remaining before the backend limit; drives the counter. */
  readonly remaining = signal(MAX_NOTES);

  constructor() {
    this.form.controls.notesContent.valueChanges.subscribe((value) =>
      this.remaining.set(MAX_NOTES - (value?.length ?? 0)),
    );
    afterNextRender(() => {
      const first = this.el.nativeElement.querySelector(FOCUSABLE_SELECTOR) as HTMLElement | null;
      first?.focus();
    });
  }

  readonly notesError = computed(() =>
    this.remaining() < 0 ? `La nota supera el máximo de ${MAX_NOTES} caracteres.` : null,
  );

  canSubmit(): boolean {
    return this.form.valid && !this.isSubmitting();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.handleCancel();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const nodes = this.el.nativeElement.querySelectorAll(FOCUSABLE_SELECTOR);
    const focusable = Array.from(nodes) as HTMLElement[];
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  handleCancel(): void {
    if (this.isSubmitting()) return;
    this.previousFocus?.focus();
    this.cancel.emit();
  }

  /** Records the handover note (when present) and then closes the shift. */
  submit(): void {
    this.form.markAllAsTouched();
    this.submitError.set(null);
    if (!this.canSubmit()) return;

    const shiftId = this.shiftId();
    const notes = this.form.controls.notesContent.value.trim();

    this.isSubmitting.set(true);
    const handover$: Observable<Handover | null> = notes
      ? this.shiftService.createHandover(shiftId, notes)
      : of(null);

    handover$
      .pipe(switchMap(() => this.shiftService.closeShift(shiftId)))
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.previousFocus?.focus();
          this.closed.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.submitError.set(this.extractMessage(err, 'No se pudo cerrar el turno.'));
        },
      });
  }

  private extractMessage(err: HttpErrorResponse, fallback: string): string {
    const body = err.error;
    if (body && typeof body === 'object' && typeof body.message === 'string' && body.message) {
      return body.message;
    }
    return fallback;
  }
}
