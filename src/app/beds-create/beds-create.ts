import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Navbar } from '../dashboard/navbar/navbar';
import { Sidebar } from '../dashboard/sidebar/sidebar';
import { IcuBed } from '../core/models/icu-bed.model';
import { IcuBedsService } from '../core/services/icu-beds.service';

@Component({
  selector: 'app-beds-create',
  imports: [ReactiveFormsModule, RouterLink, Navbar, Sidebar],
  templateUrl: './beds-create.html',
  styleUrl: './beds-create.css',
  host: { class: 'block' },
})
export class BedsCreate {
  private readonly formBuilder = inject(FormBuilder);
  private readonly icuBedsService = inject(IcuBedsService);

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly createdBed = signal<IcuBed | null>(null);

  readonly form = this.formBuilder.group({
    bedNumber: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
  });

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    const bedNumber = this.form.controls.bedNumber.value.trim();
    if (!bedNumber) {
      this.form.controls.bedNumber.setErrors({ required: true });
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.createdBed.set(null);

    this.icuBedsService.createBed(bedNumber).subscribe({
      next: bed => {
        this.createdBed.set(bed);
        this.form.reset({ bedNumber: '' });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.isSubmitting.set(false);
      },
      error: () => {
        this.submitError.set('No se pudo registrar la cama. Intenta nuevamente.');
        this.isSubmitting.set(false);
      },
    });
  }

  isInvalidBedNumber(): boolean {
    const control = this.form.controls.bedNumber;
    return control.invalid && (control.dirty || control.touched);
  }
}
