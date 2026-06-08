import { Component, HostListener, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IcuBed } from '../../core/models/icu-bed.model';
import { IdentifierType } from '../../core/models/identifier-type.model';
import { IdentifierTypeService } from '../../core/services/identifier-type.service';
import { PatientService } from '../../core/services/patient.service';

const DEV_DEFAULT_ICU_ID = 'cccccccc-0000-0000-0000-000000000001';
const DNI_PATTERN = /^[0-9]{7,8}$/;

@Component({
  selector: 'app-admission-modal',
  imports: [ReactiveFormsModule],
  templateUrl: './admission-modal.html',
  styleUrl: './admission-modal.css',
  host: { class: 'block' },
})
export class AdmissionModal implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly patientService = inject(PatientService);
  private readonly identifierTypeService = inject(IdentifierTypeService);

  readonly selectedBed = input<IcuBed | null>(null);
  readonly close = output<void>();
  readonly admitted = output<{ bedId: string; patientId: string }>();

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly nameError = signal<string | null>(null);
  readonly identifierTypes = signal<IdentifierType[]>([]);
  readonly identifierTypesLoading = signal(true);

  readonly form = this.formBuilder.group({
    fullName: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    identifierTypeId: this.formBuilder.control<number>(0, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1)],
    }),
    identifier: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    birthDate: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  constructor() {
    // Swap identifier validators whenever the selected type changes.
    this.form.controls.identifierTypeId.valueChanges.subscribe(typeId => {
      this.updateIdentifierValidators(typeId);
    });
  }

  ngOnInit(): void {
    this.identifierTypeService.getIdentifierTypes().subscribe({
      next: response => {
        this.identifierTypes.set(response.data);
        if (response.data.length > 0) {
          // Setting the value here triggers valueChanges → updateIdentifierValidators,
          // which now finds the first type in the populated signal.
          this.form.controls.identifierTypeId.setValue(response.data[0].id);
        }
        this.identifierTypesLoading.set(false);
      },
      error: () => {
        this.identifierTypesLoading.set(false);
      },
    });
  }

  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.handleClose();
  }

  handleClose(): void {
    if (this.isSubmitting()) {
      return;
    }
    this.close.emit();
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.nameError.set(null);
    this.submitError.set(null);

    const bed = this.selectedBed();
    if (!bed || this.form.invalid || this.isSubmitting()) {
      return;
    }

    const splitName = this.splitName(this.form.controls.fullName.value);
    if (!splitName) {
      this.nameError.set('Ingresa nombre y apellido (mínimo dos palabras).');
      return;
    }

    const icuId = this.resolveIcuId();
    if (!icuId) {
      this.submitError.set('No se pudo resolver la UCI del usuario autenticado.');
      return;
    }

    this.isSubmitting.set(true);

    this.patientService
      .createPatient({
        firstName: splitName.firstName,
        lastName: splitName.lastName,
        birthDate: this.form.controls.birthDate.value,
        identifier: {
          identifierTypeId: this.form.controls.identifierTypeId.value,
          value: this.form.controls.identifier.value.trim(),
        },
        icuId,
        bedId: bed.bedId,
      })
      .subscribe({
        next: response => {
          this.admitted.emit({ bedId: bed.bedId, patientId: response.data.patientId });
          this.isSubmitting.set(false);
          this.close.emit();
        },
        error: () => {
          this.submitError.set('No se pudo registrar el paciente. Verifica los datos e intenta nuevamente.');
          this.isSubmitting.set(false);
        },
      });
  }

  isInvalid(controlName: 'fullName' | 'identifier' | 'birthDate'): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  canSubmit(): boolean {
    return this.form.valid && !this.isSubmitting();
  }

  /** Returns true when the currently selected identifier type is DNI. */
  isDniSelected(): boolean {
    const selectedId = this.form.controls.identifierTypeId.value;
    return this.identifierTypes().some(
      t => t.id === selectedId && t.name.toUpperCase() === 'DNI',
    );
  }

  private updateIdentifierValidators(typeId: number): void {
    const identifierControl = this.form.controls.identifier;
    const selectedType = this.identifierTypes().find(t => t.id === typeId);
    if (selectedType?.name.toUpperCase() === 'DNI') {
      identifierControl.setValidators([Validators.required, Validators.pattern(DNI_PATTERN)]);
    } else {
      identifierControl.setValidators([Validators.required, Validators.maxLength(50)]);
    }
    identifierControl.updateValueAndValidity();
  }

  private splitName(rawName: string): { firstName: string; lastName: string } | null {
    const normalized = rawName.trim().replace(/\s+/g, ' ');
    const parts = normalized.split(' ');
    if (parts.length < 2) {
      return null;
    }
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  private resolveIcuId(): string | null {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return DEV_DEFAULT_ICU_ID;
    }

    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) {
        return DEV_DEFAULT_ICU_ID;
      }
      const normalized = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const payloadText = atob(padded);
      const payload = JSON.parse(payloadText) as { icu_id?: unknown };

      if (typeof payload.icu_id === 'string' && payload.icu_id.length > 0) {
        return payload.icu_id;
      }
      return DEV_DEFAULT_ICU_ID;
    } catch {
      return DEV_DEFAULT_ICU_ID;
    }
  }
}
