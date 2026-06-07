import { Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Navbar } from '../dashboard/navbar/navbar';
import { Sidebar } from '../dashboard/sidebar/sidebar';
import { BedsDashboard } from '../dashboard/beds-dashboard/beds-dashboard';
import { DetailPanel } from '../dashboard/detail-panel/detail-panel';
import { IcuBed } from '../core/models/icu-bed.model';
import { AdmissionModal } from '../dashboard/admission-modal/admission-modal';

@Component({
  selector: 'app-home',
  imports: [RouterLink, Navbar, Sidebar, BedsDashboard, DetailPanel, AdmissionModal],
  templateUrl: './home.html',
  styleUrl: './home.css',
  host: { class: 'block' }
})
export class Home {
  readonly selectedBed = signal<IcuBed | null>(null);
  readonly isAdmissionModalOpen = signal(false);
  readonly admittedBedId = signal<string | null>(null);
  readonly toastMessage = signal<string | null>(null);

  handleBedSelected(bed: IcuBed): void {
    this.selectedBed.set(bed);
    if (bed.status === 'AVAILABLE') {
      this.isAdmissionModalOpen.set(true);
    }
  }

  clearSelectedBed(): void {
    this.selectedBed.set(null);
  }

  closeAdmissionModal(): void {
    this.isAdmissionModalOpen.set(false);
    this.selectedBed.set(null);
  }

  handlePatientAdmitted(bedId: string): void {
    this.admittedBedId.set(bedId);
    this.selectedBed.set(null);
    this.isAdmissionModalOpen.set(false);
    this.toastMessage.set('Paciente admitido correctamente.');
    setTimeout(() => this.toastMessage.set(null), 3000);
  }
}
