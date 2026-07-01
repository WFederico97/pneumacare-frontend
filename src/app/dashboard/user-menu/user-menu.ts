import {
  Component,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { initialsFrom, roleLabel } from '../../core/auth/auth.model';

/**
 * Logged-in user menu: identity chip that opens an accessible dropdown with
 * "Mi perfil", "Mi cuenta" and "Cerrar sesión".
 *
 * <p>Implements the WAI-ARIA menu-button pattern: {@code aria-haspopup}/
 * {@code aria-expanded} on the trigger, {@code role="menu"} with
 * {@code role="menuitem"} children, arrow-key navigation, Escape to close, and
 * focus restored to the trigger on close. Closes on outside click / blur.
 */
@Component({
  selector: 'app-user-menu',
  imports: [RouterLink],
  templateUrl: './user-menu.html',
  styleUrl: './user-menu.css',
  host: {
    class: 'relative block',
    '(keydown.escape)': 'close(true)',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class UserMenu {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly trigger = viewChild<ElementRef<HTMLButtonElement>>('trigger');
  private readonly menuItems = viewChildren<ElementRef<HTMLElement>>('menuItem');

  readonly isOpen = signal(false);
  readonly isLoggingOut = signal(false);

  readonly displayName = computed(() => this.auth.displayName() ?? 'Usuario');
  readonly initials = computed(() => initialsFrom(this.auth.displayName()));
  readonly roleText = computed(() =>
    this.auth.currentUserRoles().map(roleLabel).join(' · ') || 'Sin rol asignado',
  );

  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  open(focusFirst = false): void {
    this.isOpen.set(true);
    if (focusFirst) {
      // Macrotask so the conditional menu items have rendered (zoneless CD).
      setTimeout(() => this.menuItems()[0]?.nativeElement.focus());
    }
  }

  close(restoreFocus = false): void {
    if (!this.isOpen()) {
      return;
    }
    this.isOpen.set(false);
    if (restoreFocus) {
      this.trigger()?.nativeElement.focus();
    }
  }

  /** Roving focus across menu items with the arrow keys. */
  onMenuKeydown(event: KeyboardEvent, index: number): void {
    const items = this.menuItems();
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      const delta = event.key === 'ArrowDown' ? 1 : -1;
      const next = (index + delta + items.length) % items.length;
      items[next]?.nativeElement.focus();
    } else if (event.key === 'Home') {
      event.preventDefault();
      items[0]?.nativeElement.focus();
    } else if (event.key === 'End') {
      event.preventDefault();
      items[items.length - 1]?.nativeElement.focus();
    }
  }

  onDocumentClick(event: MouseEvent): void {
    if (this.isOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.close();
    }
  }

  logout(): void {
    if (this.isLoggingOut()) {
      return;
    }
    this.isLoggingOut.set(true);
    this.close();
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
