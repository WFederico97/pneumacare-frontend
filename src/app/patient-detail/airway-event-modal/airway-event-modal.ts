import { Component, ElementRef, HostListener, afterNextRender, computed, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ProcedureService } from '../../core/services/procedure.service';
import { AirwayEventPayload, AirwayEventType, RespiratoryStatus } from '../../core/models/timeline.model';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Legal next airway events per current respiratory status (mirrors backend state machine). */
const ALLOWED_BY_STATUS: Record<RespiratoryStatus, readonly AirwayEventType[]> = {
  SPONTANEOUS: ['INTUBATION'],
  INTUBATED: ['EXTUBATION', 'TRACHEOSTOMY'],
  TRACHEOSTOMY: [],
};

const TYPE_LABELS: Record<AirwayEventType, string> = {
  INTUBATION: 'Intubación',
  EXTUBATION: 'Extubación',
  TRACHEOSTOMY: 'Traqueostomía',
};

const STATUS_LABELS: Record<RespiratoryStatus, string> = {
  SPONTANEOUS: 'Ventilación espontánea',
  INTUBATED: 'Intubado',
  TRACHEOSTOMY: 'Traqueostomía',
};

/**
 * Modal with a reactive form to register an airway event (PNMC-97). Event types
 * that are illegal transitions from the patient's current respiratory status are
 * disabled client-side; the server still enforces the rule and a 409 is surfaced.
 */
@Component({
  selector: 'app-airway-event-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './airway-event-modal.html',
  styleUrl: './airway-event-modal.css',
  host: { class: 'block' },
})
export class AirwayEventModal {
  private readonly formBuilder = inject(FormBuilder);
  private readonly procedureService = inject(ProcedureService);
  private readonly el = inject(ElementRef<HTMLElement>);

  private readonly previousFocus = document.activeElement as HTMLElement | null;

  readonly patientId = input.required<string>();
  readonly currentStatus = input<RespiratoryStatus>('SPONTANEOUS');

  readonly close = output<void>();
  readonly created = output<AirwayEventPayload>();

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly allTypes: readonly AirwayEventType[] = ['INTUBATION', 'EXTUBATION', 'TRACHEOSTOMY'];
  readonly allowedTypes = computed(() => ALLOWED_BY_STATUS[this.currentStatus()]);
  readonly hasAllowedType = computed(() => this.allowedTypes().length > 0);
  readonly statusLabel = computed(() => STATUS_LABELS[this.currentStatus()]);

  readonly form = this.formBuilder.group({
    eventType: this.formBuilder.control<AirwayEventType | null>(null, {
      validators: [Validators.required],
    }),
    eventTimestamp: this.formBuilder.control(this.nowLocal(), {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    afterNextRender(() => {
      const first = this.el.nativeElement.querySelector(FOCUSABLE_SELECTOR) as HTMLElement | null;
      first?.focus();
    });
  }

  typeLabel(type: AirwayEventType): string {
    return TYPE_LABELS[type];
  }

  isTypeAllowed(type: AirwayEventType): boolean {
    return this.allowedTypes().includes(type);
  }

  isInvalid(controlName: 'eventType' | 'eventTimestamp'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  canSubmit(): boolean {
    return this.form.valid && !this.isSubmitting() && this.hasAllowedType();
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

    const eventType = this.form.controls.eventType.value;
    if (!eventType) return;

    this.isSubmitting.set(true);
    this.procedureService
      .createAirwayEvent({
        patientId: this.patientId(),
        eventType,
        eventTimestamp: new Date(this.form.controls.eventTimestamp.value).toISOString(),
      })
      .subscribe({
        next: (response) => {
          this.isSubmitting.set(false);
          this.created.emit(response.data);
          this.previousFocus?.focus();
          this.close.emit();
        },
        error: (err: HttpErrorResponse) => {
          this.isSubmitting.set(false);
          this.submitError.set(this.extractMessage(err, 'No se pudo registrar el evento de vía aérea.'));
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

  private nowLocal(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}
