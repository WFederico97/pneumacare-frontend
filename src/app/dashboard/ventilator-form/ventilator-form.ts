import { Component, OnInit, effect, inject, input, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

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

  private lastBedId: string | null = null;

  readonly brandOptions: readonly VentilatorBrand[] = ['TECME', 'NEUMOVENT'];
  readonly selectedBrand = signal<VentilatorBrand>('TECME');

  readonly form = this.formBuilder.group({
    brand: this.formBuilder.control<VentilatorBrand>('TECME', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    f: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(0), Validators.max(80)],
    }),
    vt: this.formBuilder.control<number | null>(null, {
      validators: [Validators.required, Validators.min(1)],
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
        peep: null,
        triggerFlow: null,
        inspTime: null,
      },
      { emitEvent: false }
    );

    this.form.controls.f.markAsPristine();
    this.form.controls.vt.markAsPristine();
    this.form.controls.peep.markAsPristine();
    this.form.controls.triggerFlow.markAsPristine();
    this.form.controls.inspTime.markAsPristine();

    this.form.controls.f.markAsUntouched();
    this.form.controls.vt.markAsUntouched();
    this.form.controls.peep.markAsUntouched();
    this.form.controls.triggerFlow.markAsUntouched();
    this.form.controls.inspTime.markAsUntouched();
  }
}
