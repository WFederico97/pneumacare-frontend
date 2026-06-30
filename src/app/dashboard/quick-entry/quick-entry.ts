import { Component, HostListener, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AdmissionModal } from '../admission-modal/admission-modal';
import { VentilatorForm } from '../ventilator-form/ventilator-form';
import { IcuBedsService } from '../../core/services/icu-beds.service';
import { IcuBed } from '../../core/models/icu-bed.model';

type QuickModal = 'bed' | 'patient' | 'calc' | null;

/**
 * Operational quick-entry panel: three actions, each opening a focused modal
 * with the context picker it needs.
 *
 * <ul>
 *   <li><b>Cama</b> — inline bed-number form ({@link IcuBedsService#createBed}).</li>
 *   <li><b>Paciente</b> — the {@link AdmissionModal} in standalone mode (its own
 *       available-bed picker).</li>
 *   <li><b>Cálculo</b> — an occupied-bed/patient picker, then the existing
 *       {@link VentilatorForm} bound to that patient.</li>
 * </ul>
 */
@Component({
  selector: 'app-quick-entry',
  imports: [ReactiveFormsModule, AdmissionModal, VentilatorForm],
  templateUrl: './quick-entry.html',
  styleUrl: './quick-entry.css',
  host: { class: 'block' },
})
export class QuickEntry {
  private readonly formBuilder = inject(FormBuilder);
  private readonly icuBedsService = inject(IcuBedsService);

  readonly active = signal<QuickModal>(null);
  readonly occupiedBeds = signal<IcuBed[]>([]);
  readonly pickedPatientId = signal<string | null>(null);
  readonly pickedBedNumber = signal<string | null>(null);

  readonly isCreatingBed = signal(false);
  readonly bedError = signal<string | null>(null);
  readonly bedCreated = signal<string | null>(null);

  readonly bedForm = this.formBuilder.group({
    bedNumber: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
  });

  open(which: QuickModal): void {
    this.active.set(which);
    this.bedError.set(null);
    this.bedCreated.set(null);
    this.pickedPatientId.set(null);
    this.pickedBedNumber.set(null);
    if (which === 'bed') {
      this.bedForm.reset({ bedNumber: '' });
    }
    if (which === 'calc') {
      this.icuBedsService.getBeds().subscribe({
        next: (beds) => this.occupiedBeds.set(beds.filter((b) => b.status === 'OCCUPIED' && b.patientId)),
        error: () => this.occupiedBeds.set([]),
      });
    }
  }

  @HostListener('document:keydown.escape')
  close(): void {
    this.active.set(null);
  }

  pickPatient(bedId: string): void {
    const bed = this.occupiedBeds().find((b) => b.bedId === bedId);
    this.pickedPatientId.set(bed?.patientId ?? null);
    this.pickedBedNumber.set(bed?.bedNumber ?? null);
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
