import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { AppShell } from '../../dashboard/app-shell/app-shell';
import { AuthService } from '../../core/auth/auth.service';
import { roleLabel } from '../../core/auth/auth.model';
import { UserAdminService } from '../../core/services/user-admin.service';
import { UserItem } from '../../core/models/user.model';

type PanelMode = 'closed' | 'create' | 'edit';

const ALL_ROLES = ['ROLE_ADMIN', 'ROLE_CHIEF_OF_GUARD', 'ROLE_THERAPIST', 'ROLE_COMPLIANCE'] as const;

/**
 * Administrative user management (IAM CRUD).
 *
 * <p>Lists users and lets chiefs/admins create, edit (profile + roles +
 * enabled) and soft-disable accounts. The {@code ROLE_ADMIN} role can only be
 * assigned by an admin, and an admin account can only be edited/disabled by an
 * admin — both mirrored from the server guards so the UI doesn't offer actions
 * that would 403.
 */
@Component({
  selector: 'app-users',
  imports: [AppShell, ReactiveFormsModule],
  templateUrl: './users.html',
  styleUrl: './users.css',
  host: { class: 'block' },
})
export class Users implements OnInit {
  private readonly formBuilder = inject(FormBuilder);
  private readonly userAdminService = inject(UserAdminService);
  private readonly auth = inject(AuthService);

  readonly roleOptions = ALL_ROLES.map((value) => ({ value, label: roleLabel(value) }));

  readonly users = signal<UserItem[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);

  readonly panelMode = signal<PanelMode>('closed');
  readonly editingId = signal<string | null>(null);
  readonly selectedRoles = signal<ReadonlySet<string>>(new Set());
  readonly isSubmitting = signal(false);
  readonly submitError = signal<string | null>(null);
  readonly confirmingId = signal<string | null>(null);

  readonly isAdmin = computed(() => this.auth.hasAnyRole('ROLE_ADMIN'));

  readonly form = this.formBuilder.group({
    username: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    password: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(8), Validators.maxLength(100)],
    }),
    displayName: this.formBuilder.control('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(150)],
    }),
    enabled: this.formBuilder.control(true, { nonNullable: true }),
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.userAdminService.list().subscribe({
      next: (response) => {
        this.users.set(response.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('No pudimos cargar los usuarios. Intentá de nuevo.');
      },
    });
  }

  /** A chief cannot manage an admin account (matches the server guard). */
  canManage(user: UserItem): boolean {
    return this.isAdmin() || !user.roles.includes('ROLE_ADMIN');
  }

  isRoleDisabled(role: string): boolean {
    return role === 'ROLE_ADMIN' && !this.isAdmin();
  }

  isRoleSelected(role: string): boolean {
    return this.selectedRoles().has(role);
  }

  toggleRole(role: string): void {
    if (this.isRoleDisabled(role)) {
      return;
    }
    const next = new Set(this.selectedRoles());
    next.has(role) ? next.delete(role) : next.add(role);
    this.selectedRoles.set(next);
  }

  label(role: string): string {
    return roleLabel(role);
  }

  openCreate(): void {
    this.resetPanel();
    this.form.reset({ username: '', password: '', displayName: '', enabled: true });
    // Password is mandatory when creating an account.
    this.form.controls.password.setValidators([
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(100),
    ]);
    this.form.controls.password.updateValueAndValidity();
    this.selectedRoles.set(new Set(['ROLE_THERAPIST']));
    this.panelMode.set('create');
  }

  openEdit(user: UserItem): void {
    this.resetPanel();
    this.editingId.set(user.id);
    this.form.reset({ username: user.username, password: '', displayName: user.displayName, enabled: user.enabled });
    // Password is optional when editing — blank keeps the current one.
    this.form.controls.password.setValidators([Validators.minLength(8), Validators.maxLength(100)]);
    this.form.controls.password.updateValueAndValidity();
    this.selectedRoles.set(new Set(user.roles));
    this.panelMode.set('edit');
  }

  closePanel(): void {
    this.panelMode.set('closed');
    this.editingId.set(null);
  }

  canSubmit(): boolean {
    if (this.isSubmitting() || this.selectedRoles().size === 0) {
      return false;
    }
    if (this.form.controls.displayName.invalid) {
      return false;
    }
    if (this.panelMode() === 'create') {
      return this.form.controls.username.valid && this.form.controls.password.valid;
    }
    // Edit: password is optional, but if typed it must satisfy its validators.
    return this.form.controls.password.valid;
  }

  submit(): void {
    if (!this.canSubmit()) {
      this.form.markAllAsTouched();
      return;
    }
    const roles = [...this.selectedRoles()];
    const { username, password, displayName, enabled } = this.form.getRawValue();
    this.isSubmitting.set(true);
    this.submitError.set(null);

    const newPassword = password.trim();
    const request$ =
      this.panelMode() === 'edit' && this.editingId()
        ? this.userAdminService.update(this.editingId()!, {
            displayName: displayName.trim(),
            roles,
            enabled,
            ...(newPassword ? { password: newPassword } : {}),
          })
        : this.userAdminService.create({
            username: username.trim(),
            password,
            displayName: displayName.trim(),
            roles,
            enabled,
          });

    request$.subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.closePanel();
        this.load();
      },
      error: (error: unknown) => {
        this.isSubmitting.set(false);
        this.submitError.set(this.resolveError(error));
      },
    });
  }

  askDisable(user: UserItem): void {
    this.actionError.set(null);
    this.confirmingId.set(user.id);
  }

  cancelDisable(): void {
    this.confirmingId.set(null);
  }

  confirmDisable(user: UserItem): void {
    this.confirmingId.set(null);
    this.userAdminService.disable(user.id).subscribe({
      next: () => this.load(),
      error: (error: unknown) => this.actionError.set(this.resolveError(error)),
    });
  }

  private resetPanel(): void {
    this.submitError.set(null);
    this.isSubmitting.set(false);
    this.confirmingId.set(null);
  }

  private resolveError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 409) {
        return 'Ese nombre de usuario ya está en uso.';
      }
      if (error.status === 403) {
        return 'No tenés permisos para esta acción.';
      }
      if (error.status === 400 && typeof error.error?.message === 'string') {
        return error.error.message;
      }
    }
    return 'No pudimos completar la operación. Intentá de nuevo.';
  }
}
