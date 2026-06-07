import { Component, OnInit, effect, inject, input, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

type VentilatorBrand = 'TECME' | 'NEUMOVENT';

@Component({
  selector: 'app-ventilator-form',
  imports: [ReactiveFormsModule],
  templateUrl: './ventilator-form.html',
  styleUrl: './ventilator-form.css',
  host: { class: 'block' },
})
export class VentilatorForm implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  readonly selectedBedId = input<string | null>(null);
  readonly selectedBedNumber = input<string | null>(null);

  private lastBedId: string | null = null;

  readonly brandOptions: readonly VentilatorBrand[] = ['TECME', 'NEUMOVENT'];
  readonly selectedBrand = signal<VentilatorBrand>('TECME');

  readonly form = this.formBuilder.group({
    brand: this.formBuilder.control<VentilatorBrand>('TECME', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    f: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(60)],
    }),
    vt: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(100), Validators.max(1000)],
    }),
    fio2: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0.21), Validators.max(1.0)],
    }),
    peep: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0)],
    }),
    triggerFlow: this.formBuilder.control<number | null>(null),
    inspTime: this.formBuilder.control<number | null>(null),
  });

  constructor() {
    effect(() => {
      const currentBedId = this.selectedBedId();

      if (!currentBedId) {
        this.form.disable({ emitEvent: false });
        this.resetClinicalFields();
        this.lastBedId = null;
        return;
      }

      this.form.enable({ emitEvent: false });

      if (this.lastBedId !== currentBedId) {
        this.resetClinicalFields();
        this.lastBedId = currentBedId;
      }
    });
  }

  ngOnInit(): void {
    this.applyBrandRules(this.form.controls.brand.value);

    this.form.controls.brand.valueChanges.subscribe(brand => {
      this.selectedBrand.set(brand);
      this.applyBrandRules(brand);
      this.resetClinicalFields();
    });
  }

  hasSelectedBed(): boolean {
    return this.selectedBedId() !== null;
  }

  isInvalid(controlName: 'f' | 'vt' | 'fio2' | 'peep' | 'triggerFlow' | 'inspTime'): boolean {
    const control = this.form.controls[controlName];
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  errorMessage(controlName: 'f' | 'vt' | 'fio2' | 'peep' | 'triggerFlow' | 'inspTime'): string {
    const control = this.form.controls[controlName];
    if (!control || !control.errors) {
      return '';
    }

    if (control.errors['required']) {
      return 'Campo obligatorio';
    }

    if (control.errors['min']) {
      return this.minMessage(controlName);
    }

    if (control.errors['max']) {
      return this.maxMessage(controlName);
    }

    return 'Valor inválido';
  }

  onNumericInput(controlName: 'f' | 'vt' | 'fio2' | 'peep' | 'triggerFlow' | 'inspTime', event: Event): void {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    const raw = target.value.trim();
    const numericValue = raw === '' ? null : Number(raw);
    const control = this.form.controls[controlName] as AbstractControl<number | null, number | null>;

    control.setValue(Number.isNaN(numericValue) ? null : numericValue, { emitEvent: false });
    control.markAsDirty();
    control.updateValueAndValidity({ emitEvent: false });
  }

  replaceCommaWithDot(event: KeyboardEvent): void {
    if (event.key !== ',') {
      return;
    }

    const target = event.target;
    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    event.preventDefault();

    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    target.setRangeText('.', start, end, 'end');
    target.dispatchEvent(new Event('input', { bubbles: true }));
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      return;
    }
  }

  private applyBrandRules(brand: VentilatorBrand): void {
    const triggerFlowControl = this.form.controls.triggerFlow;
    const inspTimeControl = this.form.controls.inspTime;

    triggerFlowControl.clearValidators();
    inspTimeControl.clearValidators();

    if (brand === 'TECME') {
      triggerFlowControl.setValidators([Validators.required, Validators.min(1), Validators.max(30)]);
      inspTimeControl.setValue(null);
    } else {
      inspTimeControl.setValidators([Validators.required, Validators.min(0.1), Validators.max(5)]);
      triggerFlowControl.setValue(null);
    }

    triggerFlowControl.updateValueAndValidity();
    inspTimeControl.updateValueAndValidity();
  }

  private resetClinicalFields(): void {
    this.form.patchValue(
      {
        f: null,
        vt: null,
        fio2: null,
        peep: null,
        triggerFlow: null,
        inspTime: null,
      },
      { emitEvent: false }
    );

    this.form.controls.f.markAsPristine();
    this.form.controls.vt.markAsPristine();
    this.form.controls.fio2.markAsPristine();
    this.form.controls.peep.markAsPristine();
    this.form.controls.triggerFlow.markAsPristine();
    this.form.controls.inspTime.markAsPristine();

    this.form.controls.f.markAsUntouched();
    this.form.controls.vt.markAsUntouched();
    this.form.controls.fio2.markAsUntouched();
    this.form.controls.peep.markAsUntouched();
    this.form.controls.triggerFlow.markAsUntouched();
    this.form.controls.inspTime.markAsUntouched();
  }

  private minMessage(controlName: 'f' | 'vt' | 'fio2' | 'peep' | 'triggerFlow' | 'inspTime'): string {
    if (controlName === 'f') {
      return 'La frecuencia debe ser mayor o igual a 0';
    }
    if (controlName === 'vt') {
      return 'El volumen corriente debe ser de 100 a 1000 mL';
    }
    if (controlName === 'fio2') {
      return 'La FiO2 debe estar entre 0.21 y 1.0';
    }
    if (controlName === 'peep') {
      return 'El PEEP no puede ser negativo';
    }
    if (controlName === 'triggerFlow') {
      return 'El trigger por flujo debe ser mayor o igual a 1';
    }
    return 'El tiempo inspiratorio debe ser mayor o igual a 0.1';
  }

  private maxMessage(controlName: 'f' | 'vt' | 'fio2' | 'peep' | 'triggerFlow' | 'inspTime'): string {
    if (controlName === 'f') {
      return 'La frecuencia no puede superar 60';
    }
    if (controlName === 'vt') {
      return 'El volumen corriente debe ser de 100 a 1000 mL';
    }
    if (controlName === 'fio2') {
      return 'La FiO2 debe estar entre 0.21 y 1.0';
    }
    if (controlName === 'triggerFlow') {
      return 'El trigger por flujo no puede superar 30';
    }
    return 'El tiempo inspiratorio no puede superar 5 segundos';
  }
}
