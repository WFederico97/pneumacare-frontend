import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/auth/auth.service';
import { SelfRegisterRole } from '../../core/auth/auth.model';

interface RoleOption {
  value: SelfRegisterRole;
  label: string;
}

/**
 * Account self-registration (PNMC-113 follow-up).
 *
 * <p>Posts to {@code /api/v1/auth/register}; the backend creates the user
 * (BCrypt hash), issues the HttpOnly session cookie, and returns the profile,
 * so a successful sign-up lands the user authenticated and redirects to the
 * dashboard. The role is restricted to the clinical roles a user may
 * self-assign; privileged roles are admin-provisioned.
 */
@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  host: { class: 'block' },
})
export class Register implements AfterViewInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  private readonly displayNameInput =
    viewChild<ElementRef<HTMLInputElement>>('displayNameInput');
  private readonly errorRegion =
    viewChild<ElementRef<HTMLElement>>('errorRegion');

  readonly roleOptions: readonly RoleOption[] = [
    { value: 'ROLE_THERAPIST', label: 'Terapista' },
    { value: 'ROLE_CHIEF_OF_GUARD', label: 'Jefe de guardia' },
  ];

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    displayName: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    username: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    password: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(100)],
    }),
    role: this.formBuilder.control<SelfRegisterRole>('ROLE_THERAPIST', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngAfterViewInit(): void {
    this.displayNameInput()?.nativeElement.focus();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    const { displayName, username, password, role } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.auth
      .register({
        displayName: displayName.trim(),
        username: username.trim(),
        password,
        role,
      })
      .subscribe({
        next: () => {
          this.isSubmitting.set(false);
          void this.router.navigateByUrl('/');
        },
        error: (error: unknown) => {
          this.isSubmitting.set(false);
          this.errorMessage.set(this.resolveError(error));
          queueMicrotask(() => this.errorRegion()?.nativeElement.focus());
        },
      });
  }

  /** A taken username comes back as 409; everything else is a generic message. */
  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 409) {
      return 'Ese nombre de usuario ya está en uso. Probá con otro.';
    }
    return 'No pudimos crear la cuenta. Revisá los datos e intentá de nuevo.';
  }
}
