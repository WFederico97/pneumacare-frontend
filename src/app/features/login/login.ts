import {
  AfterViewInit,
  Component,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Login screen for unauthenticated users (PNMC-113, AC1).
 *
 * <p>On valid submit it calls {@link AuthService.login}, which posts to
 * {@code /api/v1/auth/login}; the backend sets the HttpOnly JWT and XSRF
 * cookies and returns the profile. On success the user is sent to the
 * originally requested URL ({@code returnUrl}) or the dashboard ({@code /}).
 * A generic message is shown on {@code 401} — credentials are never echoed.
 */
@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css',
  host: { class: 'block' },
})
export class Login implements AfterViewInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  private readonly usernameInput =
    viewChild<ElementRef<HTMLInputElement>>('usernameInput');
  private readonly errorRegion =
    viewChild<ElementRef<HTMLElement>>('errorRegion');

  readonly isSubmitting = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.formBuilder.group({
    username: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    password: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  ngAfterViewInit(): void {
    this.usernameInput()?.nativeElement.focus();
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    const { username, password } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    this.auth.login(username.trim(), password).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        void this.router.navigateByUrl(this.resolveReturnUrl());
      },
      error: () => {
        this.isSubmitting.set(false);
        this.errorMessage.set(
          'Usuario o contraseña incorrectos. Verificá tus datos e intentá de nuevo.',
        );
        queueMicrotask(() => this.errorRegion()?.nativeElement.focus());
      },
    });
  }

  /** Restricts redirects to in-app paths so {@code returnUrl} cannot be abused. */
  private resolveReturnUrl(): string {
    const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
    if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
      return returnUrl;
    }
    return '/';
  }
}
