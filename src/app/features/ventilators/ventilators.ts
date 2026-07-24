import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppShell } from '../../dashboard/app-shell/app-shell';
import { VentilatorService } from '../../core/services/ventilator.service';
import { Ventilator, VentilatorBrand, VentilatorStatus } from '../../core/models/asset.model';

/**
 * Auth is cookie-based: the JWT lives in an HttpOnly cookie the SPA cannot
 * read, so the ICU cannot be derived client-side. Until the server binds
 * registrations to the actor's ICU, this falls back to the seeded dev ICU
 * (same convention as the admission modal).
 */

const BRANDS: readonly VentilatorBrand[] = ['TECME', 'NEUMOVENT'];

interface StatusPresentation {
  readonly label: string;
  /** Distinct shape so status never relies on color alone. */
  readonly shape: string;
  readonly classes: string;
}

const STATUS_PRESENTATION: Record<VentilatorStatus, StatusPresentation> = {
  AVAILABLE: { label: 'Disponible', shape: '●', classes: 'border-emerald-500/40 bg-emerald-950/50 text-emerald-200' },
  IN_USE: { label: 'En uso', shape: '■', classes: 'border-red-500/40 bg-red-950/50 text-red-200' },
  MAINTENANCE: { label: 'Mantenimiento', shape: '◆', classes: 'border-amber-500/40 bg-amber-950/50 text-amber-200' },
};

/**
 * Physical ventilator inventory management (chief of guard + admin).
 *
 * <p>Lists the inventory and lets the operator register a ventilator, move it
 * between AVAILABLE and MAINTENANCE, and delete it. IN_USE machines are locked
 * here: that status is owned by the patient asset-assignment flow, so both the
 * status change and the delete are disabled until the equipment is released.
 */
@Component({
  selector: 'app-ventilators',
  imports: [AppShell, ReactiveFormsModule, DatePipe],
  templateUrl: './ventilators.html',
  styleUrl: './ventilators.css',
  host: { class: 'block' },
})
export class Ventilators implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly ventilatorService = inject(VentilatorService);

  readonly brands = BRANDS;

  readonly ventilators = signal<Ventilator[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly isPanelOpen = signal(false);
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly confirmingId = signal<string | null>(null);
  /** Id of the row with a PATCH/DELETE in flight; disables its action buttons. */
  readonly busyId = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    serialNumber: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    brand: this.formBuilder.control<VentilatorBrand>('TECME', { nonNullable: true }),
    modelName: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.ventilatorService.list().subscribe({
      next: (ventilators) => {
        this.ventilators.set(ventilators);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('No pudimos cargar el inventario. Intentá de nuevo.');
      },
    });
  }

  status(ventilator: Ventilator): StatusPresentation {
    return STATUS_PRESENTATION[ventilator.status];
  }

  /** IN_USE is owned by the assignment flow; releasing it happens on the patient page. */
  canManage(ventilator: Ventilator): boolean {
    return ventilator.status !== 'IN_USE';
  }

  openPanel(): void {
    this.submitError.set(null);
    this.form.reset({ serialNumber: '', brand: 'TECME', modelName: '' });
    this.isPanelOpen.set(true);
  }

  closePanel(): void {
    this.isPanelOpen.set(false);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }
    const { serialNumber, brand, modelName } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.ventilatorService
      .create({
        serialNumber: serialNumber.trim(),
        brand,
        modelName: modelName.trim(),
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          this.closePanel();
          this.load();
        },
        error: (error: unknown) => {
          this.isSubmitting.set(false);
          this.submitError.set(this.resolveError(error, 'Ya existe un ventilador con ese número de serie.'));
        },
      });
  }

  setStatus(ventilator: Ventilator, status: VentilatorStatus): void {
    this.actionError.set(null);
    this.busyId.set(ventilator.id);
    this.ventilatorService.updateStatus(ventilator.id, status).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.actionError.set(this.resolveError(error, 'No pudimos actualizar el estado.'));
      },
    });
  }

  askDelete(ventilator: Ventilator): void {
    this.actionError.set(null);
    this.confirmingId.set(ventilator.id);
  }

  cancelDelete(): void {
    this.confirmingId.set(null);
  }

  confirmDelete(ventilator: Ventilator): void {
    this.confirmingId.set(null);
    this.busyId.set(ventilator.id);
    this.ventilatorService.delete(ventilator.id).subscribe({
      next: () => {
        this.busyId.set(null);
        this.load();
      },
      error: (error: unknown) => {
        this.busyId.set(null);
        this.actionError.set(this.resolveError(error, 'No pudimos eliminar el ventilador.'));
      },
    });
  }

  private resolveError(error: unknown, conflictFallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error?.message === 'string' && error.error.message) {
        return error.error.message;
      }
      if (error.status === 409) {
        return conflictFallback;
      }
      if (error.status === 403) {
        return 'No tenés permisos para esta acción.';
      }
    }
    return 'No pudimos completar la operación. Intentá de nuevo.';
  }
}
