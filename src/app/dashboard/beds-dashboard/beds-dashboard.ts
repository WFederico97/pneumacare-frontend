import { Component, OnInit, inject, output, signal } from '@angular/core';
import { IcuBed } from '../../core/models/icu-bed.model';
import { IcuBedsService } from '../../core/services/icu-beds.service';
import { BedsGrid } from '../beds-grid/beds-grid';

@Component({
  selector: 'app-beds-dashboard',
  imports: [BedsGrid],
  templateUrl: './beds-dashboard.html',
  styleUrl: './beds-dashboard.css',
  host: { class: 'block' },
})
export class BedsDashboard implements OnInit {
  private readonly icuBedsService = inject(IcuBedsService);

  readonly beds = signal<IcuBed[]>([]);
  readonly bedsLoading = signal(true);
  readonly bedsError = signal(false);
  readonly bedSelected = output<string>();

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

  handleAvailableBedClick(bedId: string): void {
    this.bedSelected.emit(bedId);
  }
}
