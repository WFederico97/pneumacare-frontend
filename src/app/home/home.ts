import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../dashboard/navbar/navbar';
import { Sidebar } from '../dashboard/sidebar/sidebar';
import { BedsDashboard } from '../dashboard/beds-dashboard/beds-dashboard';
import { DetailPanel } from '../dashboard/detail-panel/detail-panel';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Navbar, Sidebar, BedsDashboard, DetailPanel],
  templateUrl: './home.html',
  styleUrl: './home.css',
  host: { class: 'block' }
})
export class Home {
  readonly selectedBedId = signal<string | null>(null);

  handleBedSelected(bedId: string): void {
    this.selectedBedId.set(bedId);
  }
}
