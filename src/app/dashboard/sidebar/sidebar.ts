import { Component } from '@angular/core';

interface NavItem {
  readonly label: string;
  readonly short: string;
}

@Component({
  selector: 'app-dashboard-sidebar',
  imports: [],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  host: { class: 'block' },
})
export class Sidebar {
  readonly navItems: readonly NavItem[] = [
    { label: 'Tablero', short: 'TB' },
    { label: 'Pacientes', short: 'PC' },
    { label: 'Camas', short: 'CM' },
    { label: 'Destete', short: 'DT' },
    { label: 'Alertas', short: 'AL' },
    { label: 'Ajustes', short: 'AJ' },
  ];
}
