import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AppShell } from '../../dashboard/app-shell/app-shell';
import { PatientService } from '../../core/services/patient.service';
import { PatientApiItem } from '../../core/models/patient.model';

/**
 * Patients list (PNMC-56 gap): all admitted patients, searchable, each linking
 * to its clinical detail view. Search is client-side over the loaded set.
 */
@Component({
  selector: 'app-patients',
  imports: [AppShell, RouterLink, DatePipe],
  templateUrl: './patients.html',
  styleUrl: './patients.css',
  host: { class: 'block' },
})
export class Patients implements OnInit {
  private readonly patientService = inject(PatientService);

  readonly patients = signal<PatientApiItem[]>([]);
  readonly isLoading = signal(true);
  readonly loadError = signal<string | null>(null);
  readonly query = signal('');

  readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.patients();
    if (!q) {
      return all;
    }
    return all.filter((p) =>
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(q) ||
      p.identifier.value.toLowerCase().includes(q),
    );
  });

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.patientService.getPatients().subscribe({
      next: (r) => {
        this.patients.set(r.data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.loadError.set('No pudimos cargar los pacientes. Intentá de nuevo.');
      },
    });
  }

  onSearch(value: string): void {
    this.query.set(value);
  }
}
