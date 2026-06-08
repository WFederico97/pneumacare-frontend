import { Component, OnInit, effect, inject, input, output, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IcuBed } from '../../core/models/icu-bed.model';
import { IcuBedsService } from '../../core/services/icu-beds.service';
import { BedsGrid } from '../beds-grid/beds-grid';

@Component({
  selector: 'app-beds-dashboard',
  imports: [BedsGrid, RouterLink],
  templateUrl: './beds-dashboard.html',
  styleUrl: './beds-dashboard.css',
  host: { class: 'block' },
})
export class BedsDashboard implements OnInit {
  private readonly icuBedsService = inject(IcuBedsService);
  readonly admittedBed = input<{ bedId: string; patientId: string } | null>(null);

  readonly beds = signal<IcuBed[]>([]);
  readonly bedsLoading = signal(true);
  readonly bedsError = signal(false);
  readonly bedSelected = output<IcuBed>();

  private lastProcessedAdmissionId: string | null = null;

  constructor() {
    effect(() => {
      const admission = this.admittedBed();
      if (!admission || admission.bedId === this.lastProcessedAdmissionId) {
        return;
      }

      this.beds.update(currentBeds =>
        currentBeds.map(bed =>
          bed.bedId === admission.bedId
            ? { ...bed, status: 'OCCUPIED', patientId: admission.patientId }
            : bed
        )
      );
      this.lastProcessedAdmissionId = admission.bedId;
    });
  }

  ngOnInit(): void {
    this.loadBeds();
  }

  loadBeds(): void {
    this.bedsLoading.set(true);
    this.bedsError.set(false);

    this.icuBedsService.getBeds().subscribe({
      next: data => {
        this.beds.set(data);
        this.bedsLoading.set(false);
      },
      error: () => {
        this.bedsError.set(true);
        this.bedsLoading.set(false);
      },
    });
  }

  handleAvailableBedClick(bed: IcuBed): void {
    this.bedSelected.emit(bed);
  }
}
