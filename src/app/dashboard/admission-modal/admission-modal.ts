import { Component, ElementRef, HostListener, OnInit, afterNextRender, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IcuBed } from '../../core/models/icu-bed.model';
import { IdentifierType } from '../../core/models/identifier-type.model';
import { IdentifierTypeService } from '../../core/services/identifier-type.service';
import { PatientService } from '../../core/services/patient.service';
import { IcuBedsService } from '../../core/services/icu-beds.service';

const DEV_DEFAULT_ICU_ID = 'cccccccc-0000-0000-0000-000000000001';
const DNI_PATTERN = /^[0-9]{7,8}$/;

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

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
  private readonly icuBedsService = inject(IcuBedsService);
  private readonly el = inject(ElementRef<HTMLElement>);

  /** Element that had focus before the modal opened — restored on close. */
  private readonly previousFocus = document.activeElement as HTMLElement | null;

  readonly selectedBed = input<IcuBed | null>(null);
  readonly close = output<void>();
  readonly admitted = output<{ bedId: string; patientId: string }>();

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly nameError = signal<string | null>(null);
  readonly identifierTypes = signal<IdentifierType[]>([]);
  readonly identifierTypesLoading = signal(true);
  /** Available beds for the standalone (no preselected bed) flow. */
  readonly availableBeds = signal<IcuBed[]>([]);
  readonly pickedBedId = signal<string | null>(null);

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
    this.form.controls.identifierTypeId.valueChanges.subscribe(typeId => {
      this.updateIdentifierValidators(typeId);
    });

    /* WCAG 2.4.3 — autofocus first field after render */
    afterNextRender(() => {
      const first = this.el.nativeElement.querySelector(FOCUSABLE_SELECTOR) as HTMLElement | null;
      first?.focus();
    });
  }

  ngOnInit(): void {
    this.identifierTypeService.getIdentifierTypes().subscribe({
      next: response => {
        this.identifierTypes.set(response.data);
        if (response.data.length > 0) {
          this.form.controls.identifierTypeId.setValue(response.data[0].id);
        }
        this.identifierTypesLoading.set(false);
      },
      error: () => {
        this.identifierTypesLoading.set(false);
      },
    });

    // Standalone flow (quick-entry): load the available beds to pick from.
    if (!this.selectedBed()) {
      this.icuBedsService.getBeds().subscribe({
        next: beds => this.availableBeds.set(beds.filter(b => b.status === 'AVAILABLE')),
        error: () => {},
      });
    }
  }

  /** The bed the patient is admitted to — preselected input, or the picked one. */
  resolvedBedId(): string | null {
    return this.selectedBed()?.bedId ?? this.pickedBedId();
  }

  /* WCAG 2.1.1 — close on Escape */
  @HostListener('document:keydown.escape')
  onEsc(): void {
    this.handleClose();
  }

  /* WCAG 2.1.1 / 2.4.3 — trap Tab focus inside modal */
  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;

    const nodes = this.el.nativeElement.querySelectorAll(FOCUSABLE_SELECTOR);
    const focusable = (Array.from(nodes) as HTMLElement[]).filter(
      (node) => !node.closest('[aria-hidden="true"]'),
    );

    if (focusable.length === 0) return;

    const first: HTMLElement = focusable[0];
    const last: HTMLElement = focusable[focusable.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
  }

  handleClose(): void {
    if (this.isSubmitting()) return;
    /* WCAG 2.4.3 — restore focus to the trigger element */
    this.previousFocus?.focus();
    this.close.emit();
  }

  submit(): void {
    this.form.markAllAsTouched();
    this.nameError.set(null);
    this.submitError.set(null);

    const bedId = this.resolvedBedId();
    if (!bedId || this.form.invalid || this.isSubmitting()) return;

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
        bedId,
      })
      .subscribe({
        next: response => {
          this.admitted.emit({ bedId, patientId: response.data.patientId });
          this.isSubmitting.set(false);
          this.previousFocus?.focus();
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
    return this.form.valid && this.resolvedBedId() !== null && !this.isSubmitting();
  }

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
    if (parts.length < 2) return null;
    return {
      firstName: parts[0],
      lastName: parts.slice(1).join(' '),
    };
  }

  /**
   * Resolves the ICU the patient is admitted to.
   *
   * <p>Auth is now cookie-based (PNMC-113): the JWT lives in an HttpOnly cookie
   * the SPA cannot read, so the ICU can no longer be derived client-side. The
   * server owns the authenticated actor and should bind admissions to its ICU;
   * until that lands this falls back to the seeded dev ICU.
   */
  private resolveIcuId(): string | null {
    return DEV_DEFAULT_ICU_ID;
  }
}
