import { Component, computed, input, output } from '@angular/core';
import { IcuBed, IcuBedStatus } from '../../core/models/icu-bed.model';

@Component({
  selector: 'app-beds-grid',
  imports: [],
  templateUrl: './beds-grid.html',
  styleUrl: './beds-grid.css',
  host: { class: 'block' },
})
export class BedsGrid {
  readonly beds = input.required<IcuBed[]>();

  readonly bedSelected = output<IcuBed>();

  readonly hasBeds = computed(() => this.beds().length > 0);

  onBedClick(bed: IcuBed): void {
    if (bed.status === 'AVAILABLE' || bed.status === 'OCCUPIED') {
      this.bedSelected.emit(bed);
    }
  }

  statusLabel(status: IcuBedStatus): string {
    if (status === 'AVAILABLE') {
      return 'Disponible';
    }
    if (status === 'OCCUPIED') {
      return 'Ocupada';
    }
    return 'Mantenimiento';
  }

  /* WCAG SC 1.4.1: shape glyph so status is never conveyed by color alone.
   * ● available (circle) · ■ occupied (square) · ◆ maintenance (diamond) */
  statusShape(status: IcuBedStatus): string {
    if (status === 'AVAILABLE') return '●';
    if (status === 'OCCUPIED') return '■';
    return '◆';
  }

  cardClasses(status: IcuBedStatus): string {
    if (status === 'AVAILABLE') {
      return 'bg-green-800 text-green-50 ring-green-500/40 hover:bg-green-700';
    }
    if (status === 'OCCUPIED') {
      return 'bg-red-800 text-red-50 ring-red-500/40';
    }
    return 'bg-yellow-700 text-yellow-50 ring-yellow-500/40';
  }

  badgeClasses(status: IcuBedStatus): string {
    if (status === 'AVAILABLE') {
      return 'bg-green-950/60 text-green-100 border-green-300/30';
    }
    if (status === 'OCCUPIED') {
      return 'bg-red-950/60 text-red-100 border-red-300/30';
    }
    return 'bg-yellow-950/50 text-yellow-100 border-yellow-300/30';
  }
}
