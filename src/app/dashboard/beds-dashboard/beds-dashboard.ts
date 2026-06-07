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
  readonly admittedBedId = input<string | null>(null);

  readonly beds = signal<IcuBed[]>([]);
  readonly bedsLoading = signal(true);
  readonly bedsError = signal(false);
  readonly bedSelected = output<IcuBed>();

  private lastProcessedAdmissionId: string | null = null;

  constructor() {
    effect(() => {
      const bedId = this.admittedBedId();
      if (!bedId || bedId === this.lastProcessedAdmissionId) {
        return;
      }

      this.beds.update(currentBeds =>
        currentBeds.map(bed =>
          bed.bedId === bedId ? { ...bed, status: 'OCCUPIED' } : bed
        )
      );
      this.lastProcessedAdmissionId = bedId;
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
