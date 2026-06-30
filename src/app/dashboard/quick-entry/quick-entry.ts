import { Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IcuBedsService } from '../../core/services/icu-beds.service';

/**
 * Dashboard quick action: create a new ICU bed without leaving the dashboard.
 *
 * <p>Admitting a patient and recording an evaluation are handled by clicking a
 * bed in the grid (available → admit, occupied → evaluate); bed creation has no
 * grid equivalent, so it lives here as the one quick action.
 */
@Component({
  selector: 'app-quick-entry',
  imports: [ReactiveFormsModule],
  templateUrl: './quick-entry.html',
  styleUrl: './quick-entry.css',
  host: { class: 'block' },
})
export class QuickEntry {
  private readonly formBuilder = inject(FormBuilder);
  private readonly icuBedsService = inject(IcuBedsService);

  readonly isOpen = signal(false);
  readonly isCreatingBed = signal(false);
  readonly bedError = signal<string | null>(null);
  readonly bedCreated = signal<string | null>(null);

  readonly bedForm = this.formBuilder.group({
    bedNumber: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
  });

  open(): void {
    this.bedError.set(null);
    this.bedCreated.set(null);
    this.bedForm.reset({ bedNumber: '' });
    this.isOpen.set(true);
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.isOpen.set(false);
  }

  createBed(): void {
    this.bedForm.markAllAsTouched();
    if (this.bedForm.invalid || this.isCreatingBed()) {
      return;
    }
    this.isCreatingBed.set(true);
    this.bedError.set(null);
    const bedNumber = this.bedForm.controls.bedNumber.value.trim();
    this.icuBedsService.createBed(bedNumber).subscribe({
      next: (bed) => {
        this.isCreatingBed.set(false);
        this.bedCreated.set(bed.bedNumber);
        this.bedForm.reset({ bedNumber: '' });
      },
      error: () => {
        this.isCreatingBed.set(false);
        this.bedError.set('No se pudo crear la cama. Intentá de nuevo.');
      },
    });
  }
}
