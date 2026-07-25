import {
  Component,
  ElementRef,
  HostListener,
  afterNextRender,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { PatientService } from '../../core/services/patient.service';
import {
  DISPOSITION_OPTIONS,
  Disposition,
} from '../../core/models/patient.model';
import { RespiratoryStatus } from '../../core/models/timeline.model';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Dispositions the server rejects while an artificial airway is in place. */
const AIRWAY_BLOCKED: readonly Disposition[] = ['HOME', 'WARD'];

/**
 * Confirms an ICU discharge: disposition plus an optional effective date.
 *
 * <p>Closing an episode is irreversible — there is no re-open endpoint — so the
 * modal states the consequences (bed freed, ventilator released) and requires an
 * explicit disposition rather than defaulting one.
 *
 * <p>Dispositions that the server's airway guard would reject (home / ward while
 * intubated or tracheostomised) are disabled here with the reason shown, so the
 * clinician sees why before submitting rather than after a 409.
 */
@Component({
  selector: 'app-discharge-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './discharge-modal.html',
  host: { class: 'block' },
})
export class DischargeModal {
  private readonly formBuilder = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly el = inject(ElementRef<HTMLElement>);

  private readonly previousFocus = document.activeElement as HTMLElement | null;

  readonly patientId = input.required<string>();
  readonly patientName = input<string>('');
  readonly respiratoryStatus = input<RespiratoryStatus>('SPONTANEOUS');

  readonly close = output<void>();
  readonly discharged = output<Disposition>();

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly options = DISPOSITION_OPTIONS;

  /** True while the patient still has an artificial airway. */
  readonly hasArtificialAirway = computed(
    () => this.respiratoryStatus() === 'INTUBATED' || this.respiratoryStatus() === 'TRACHEOSTOMY',
  );

  readonly form = this.formBuilder.group({
    disposition: this.formBuilder.control<Disposition | null>(null, {
      validators: [Validators.required],
    }),
    dischargeDate: this.formBuilder.control<string>('', { nonNullable: true }),
  });

  constructor() {
    afterNextRender(() => {
      const first = this.el.nativeElement.querySelector(FOCUSABLE_SELECTOR) as HTMLElement | null;
      first?.focus();
    });
  }

  isDispositionAllowed(disposition: Disposition): boolean {
    return !this.hasArtificialAirway() || !AIRWAY_BLOCKED.includes(disposition);
  }

  canSubmit(): boolean {
    const disposition = this.form.controls.disposition.value;
    return (
      this.form.valid && !this.isSubmitting() && !!disposition && this.isDispositionAllowed(disposition)
    );
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.handleClose();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(
      this.el.nativeElement.querySelectorAll(FOCUSABLE_SELECTOR),
    ) as HTMLElement[];
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

    const disposition = this.form.controls.disposition.value;
    if (!disposition) return;

    const dateValue = this.form.controls.dischargeDate.value;
    this.isSubmitting.set(true);
    this.patientService
      .discharge(this.patientId(), {
        disposition,
        // Omitted entirely when blank so the server stamps "now" itself.
        ...(dateValue ? { dischargeDate: new Date(dateValue).toISOString() } : {}),
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.discharged.emit(disposition);
          this.previousFocus?.focus();
          this.close.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.submitError.set(this.extractMessage(err, 'No se pudo egresar al paciente.'));
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
