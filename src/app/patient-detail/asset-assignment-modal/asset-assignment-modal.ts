import { Component, ElementRef, HostListener, afterNextRender, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { VentilatorService } from '../../core/services/ventilator.service';
import { AssetService } from '../../core/services/asset.service';
import { Ventilator } from '../../core/models/asset.model';

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Modal to assign an AVAILABLE ventilator to the current patient (PNMC-104).
 * Fetches the AVAILABLE inventory on open and posts the selected ventilator.
 */
@Component({
  selector: 'app-asset-assignment-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './asset-assignment-modal.html',
  styleUrl: './asset-assignment-modal.css',
  host: { class: 'block' },
})
export class AssetAssignmentModal {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ventilatorService = inject(VentilatorService);
  private readonly assetService = inject(AssetService);
  private readonly el = inject(ElementRef<HTMLElement>);

  private readonly previousFocus = document.activeElement as HTMLElement | null;

  readonly patientId = input.required<string>();

  readonly close = output<void>();
  readonly assigned = output<void>();

  readonly options = signal<Ventilator[]>([]);
  readonly isLoadingOptions = signal(true);
  readonly optionsError = signal<string | null>(null);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    ventilatorId: this.formBuilder.control<string | null>(null, {
      validators: [Validators.required],
    }),
  });

  constructor() {
    this.loadOptions();
    afterNextRender(() => {
      const first = this.el.nativeElement.querySelector(FOCUSABLE_SELECTOR) as HTMLElement | null;
      first?.focus();
    });
  }

  loadOptions(): void {
    this.isLoadingOptions.set(true);
    this.optionsError.set(null);
    this.ventilatorService.listAvailable().subscribe({
      next: (list) => {
        this.options.set(list);
        this.isLoadingOptions.set(false);
      },
      error: () => {
        this.isLoadingOptions.set(false);
        this.optionsError.set('No pudimos cargar los ventiladores disponibles.');
      },
    });
  }

  optionLabel(v: Ventilator): string {
    return `${v.serialNumber} — ${v.brand} ${v.modelName}`;
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

    const ventilatorId = this.form.controls.ventilatorId.value;
    if (!ventilatorId) return;

    this.isSubmitting.set(true);
    this.assetService.assign({ patientId: this.patientId(), ventilatorId }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.assigned.emit();
        this.previousFocus?.focus();
        this.close.emit();
      },
      error: (err: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.submitError.set(this.extractMessage(err, 'No se pudo asignar el ventilador.'));
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
