import { Component, computed, inject, signal } from '@angular/core';
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
  imports: [AppShell],
  templateUrl: './account.html',
  styleUrl: './account.css',
  host: { class: 'block' },
})
export class Account {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly isLoggingOut = signal(false);

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
