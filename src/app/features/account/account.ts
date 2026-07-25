import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AppShell } from '../../dashboard/app-shell/app-shell';
import { AuthService } from '../../core/auth/auth.service';
import { initialsFrom, roleLabel } from '../../core/auth/auth.model';

/**
 * Account & profile page (PNMC-113 follow-up).
 *
 * <p>Surfaces the signed-in identity held by {@link AuthService} (display name +
 * roles — the token is never exposed) and the session controls. Anchored
 * sections {@code #perfil} and {@code #cuenta} back the user-menu shortcuts.
 */
@Component({
  selector: 'app-account',
  imports: [AppShell, ReactiveFormsModule],
  templateUrl: './account.html',
  styleUrl: './account.css',
  host: { class: 'block' },
})
export class Account {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly formBuilder = inject(FormBuilder);

  readonly isLoggingOut = signal(false);

  /* ── Password change ── */
  readonly isChangingPassword = signal(false);
  readonly passwordError = signal<string | null>(null);
  readonly passwordSuccess = signal(false);

  readonly passwordForm = this.formBuilder.group({
    currentPassword: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
    newPassword: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8)],
    }),
    confirmPassword: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  submitPasswordChange(): void {
    this.passwordForm.markAllAsTouched();
    this.passwordError.set(null);
    this.passwordSuccess.set(false);

    const { currentPassword, newPassword, confirmPassword } = this.passwordForm.getRawValue();

    if (this.passwordForm.invalid || this.isChangingPassword()) {
      return;
    }
    if (newPassword !== confirmPassword) {
      this.passwordError.set('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    this.isChangingPassword.set(true);
    this.auth.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.isChangingPassword.set(false);
        this.passwordSuccess.set(true);
        this.passwordForm.reset();
      },
      error: (err: HttpErrorResponse) => {
        this.isChangingPassword.set(false);
        const body = err.error;
        this.passwordError.set(
          body && typeof body === 'object' && typeof body.message === 'string' && body.message
            ? body.message
            : 'No se pudo cambiar la contraseña.',
        );
      },
    });
  }

  readonly displayName = computed(() => this.auth.displayName() ?? 'Usuario');
  readonly initials = computed(() => initialsFrom(this.auth.displayName()));
  readonly roles = computed(() => this.auth.currentUserRoles().map(roleLabel));

  logout(): void {
    if (this.isLoggingOut()) {
      return;
    }
    this.isLoggingOut.set(true);
    this.auth.logout().subscribe({
      next: () => this.afterLogout(),
      error: () => this.afterLogout(),
    });
  }

  private afterLogout(): void {
    this.isLoggingOut.set(false);
    void this.router.navigate(['/login']);
  }
}
