import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

interface NavItem {
  readonly label: string;
  readonly short: string;
  /** Target route; when absent the section is not built yet (rendered disabled). */
  readonly route?: string;
  /** When true, matches the route exactly (used for the dashboard root). */
  readonly exact?: boolean;
  /** Roles allowed to see this item; absent means visible to everyone. */
  readonly roles?: readonly string[];
}

@Component({
  selector: 'app-dashboard-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  host: { class: 'block' },
})
export class Sidebar {
  private readonly auth = inject(AuthService);

  private readonly allItems: readonly NavItem[] = [
    { label: 'Tablero', short: 'TB', route: '/', exact: true },
    { label: 'Pacientes', short: 'PC', route: '/patients' },
    { label: 'Camas', short: 'CM', route: '/beds/new' },
    { label: 'Alertas', short: 'AL' },
    { label: 'Analítica', short: 'AN', route: '/analytics' },
    { label: 'Dirección', short: 'DR', route: '/executive', roles: ['ROLE_DIRECTOR', 'ROLE_ADMIN'] },
    { label: 'Usuarios', short: 'US', route: '/users', roles: ['ROLE_ADMIN', 'ROLE_CHIEF_OF_GUARD'] },
    { label: 'Ajustes', short: 'AJ', route: '/account' },
  ];

  readonly navItems = computed(() =>
    this.allItems.filter((item) => !item.roles || this.auth.hasAnyRole(...item.roles)),
  );
}
