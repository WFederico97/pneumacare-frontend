import { Component, OnInit, inject, signal } from '@angular/core';
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

  ngOnInit(): void {
    this.applyBrandRules(this.form.controls.brand.value);

    this.form.controls.brand.valueChanges.subscribe(brand => {
      this.selectedBrand.set(brand);
      this.applyBrandRules(brand);
    });
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
}
