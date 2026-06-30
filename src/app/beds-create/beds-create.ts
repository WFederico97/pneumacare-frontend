import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AppShell } from '../dashboard/app-shell/app-shell';
import { IcuBed } from '../core/models/icu-bed.model';
import { IcuBedsService } from '../core/services/icu-beds.service';
import { isDuplicateBedNumber, normalizeBedNumber, suggestNextBedNumber } from '../core/util/bed-number';

@Component({
  selector: 'app-beds-create',
  imports: [ReactiveFormsModule, RouterLink, AppShell],
  templateUrl: './beds-create.html',
  styleUrl: './beds-create.css',
  host: { class: 'block' },
})
export class BedsCreate implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly icuBedsService = inject(IcuBedsService);

  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly createdBed = signal<IcuBed | null>(null);
  /** Suggested next number, shown as the input placeholder. */
  readonly suggestion = signal('BED-001');

  private existingNumbers: string[] = [];

  readonly form = this.formBuilder.group({
    bedNumber: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
  });

  ngOnInit(): void {
    this.loadExisting();
  }

  private loadExisting(): void {
    this.icuBedsService.getBeds().subscribe({
      next: (beds) => {
        this.existingNumbers = beds.map((b) => b.bedNumber);
        this.suggestion.set(suggestNextBedNumber(this.existingNumbers));
      },
      error: () => {},
    });
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    const bedNumber = normalizeBedNumber(this.form.controls.bedNumber.value);
    if (!bedNumber) {
      this.form.controls.bedNumber.setErrors({ required: true });
      return;
    }
    if (isDuplicateBedNumber(bedNumber, this.existingNumbers)) {
      this.form.controls.bedNumber.setErrors({ duplicate: true });
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);
    this.createdBed.set(null);

    this.icuBedsService.createBed(bedNumber).subscribe({
      next: (bed) => {
        this.createdBed.set(bed);
        this.existingNumbers = [...this.existingNumbers, bed.bedNumber];
        this.suggestion.set(suggestNextBedNumber(this.existingNumbers));
        this.form.reset({ bedNumber: '' });
        this.form.markAsPristine();
        this.form.markAsUntouched();
        this.isSubmitting.set(false);
      },
      error: (error: unknown) => {
        this.submitError.set(
          error instanceof HttpErrorResponse && error.status === 409
            ? 'Ya existe una cama con ese número.'
            : 'No se pudo registrar la cama. Intenta nuevamente.',
        );
        this.isSubmitting.set(false);
      },
    });
  }

  isInvalidBedNumber(): boolean {
    const control = this.form.controls.bedNumber;
    return control.invalid && (control.dirty || control.touched);
  }
}
