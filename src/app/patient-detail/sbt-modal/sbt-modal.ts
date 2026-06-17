import { Component, ElementRef, HostListener, afterNextRender, inject, input, output, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProcedureService } from '../../core/services/procedure.service';
import { SbtPayload, ToleranceResult } from '../../core/models/timeline.model';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Validates that a control holds a whole number (no fractional part). */
function integerValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (value === null || value === undefined || value === '') return null;
  return Number.isInteger(Number(value)) ? null : { integer: true };
}

/**
 * Modal with a reactive form to record an SBT result (PNMC-97). Mirrors the API
 * contract: a positive-integer duration and a required tolerance outcome.
 */
@Component({
  selector: 'app-sbt-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './sbt-modal.html',
  styleUrl: './sbt-modal.css',
  host: { class: 'block' },
})
export class SbtModal {
  private readonly formBuilder = inject(FormBuilder);
  private readonly procedureService = inject(ProcedureService);
  private readonly el = inject(ElementRef<HTMLElement>);

  private readonly previousFocus = document.activeElement as HTMLElement | null;

  readonly patientId = input.required<string>();

  readonly close = output<void>();
  readonly created = output<SbtPayload>();

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly outcomes: readonly ToleranceResult[] = ['SUCCESS', 'FAILURE'];

  readonly form = this.formBuilder.group({
    durationMinutes: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(1), integerValidator],
    }),
    toleranceResult: this.formBuilder.control<ToleranceResult | null>(null, {
      validators: [Validators.required],
    }),
  });

  constructor() {
    afterNextRender(() => {
      const first = this.el.nativeElement.querySelector(FOCUSABLE_SELECTOR) as HTMLElement | null;
      first?.focus();
    });
  }

  outcomeLabel(outcome: ToleranceResult): string {
    return outcome === 'SUCCESS' ? 'Tolerada' : 'No tolerada';
  }

  durationError(): string | null {
    const control = this.form.controls.durationMinutes;
    if (!control.invalid || !(control.dirty || control.touched)) return null;
    if (control.errors?.['required']) return 'La duración es obligatoria.';
    if (control.errors?.['min']) return 'La duración debe ser un entero positivo (mayor a 0).';
    if (control.errors?.['integer']) return 'La duración debe ser un número entero.';
    return 'Valor inválido.';
  }

  isInvalid(controlName: 'durationMinutes' | 'toleranceResult'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  canSubmit(): boolean {
    return this.form.valid && !this.isSubmitting();
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.handleClose();
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

  handleClose(): void {
    if (this.isSubmitting()) return;
    this.previousFocus?.focus();
    this.close.emit();
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.submitError.set(null);
    if (!this.canSubmit()) return;

    const durationMinutes = this.form.controls.durationMinutes.value;
    const toleranceResult = this.form.controls.toleranceResult.value;
    if (durationMinutes === null || toleranceResult === null) return;

    this.isSubmitting.set(true);
    this.procedureService
      .createSbt({ patientId: this.patientId(), durationMinutes, toleranceResult })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.created.emit(response.data);
          this.previousFocus?.focus();
          this.close.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.submitError.set(this.extractMessage(err, 'No se pudo registrar la SBT.'));
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
