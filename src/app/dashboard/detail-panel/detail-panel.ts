import { Component, input } from '@angular/core';
import { VentilatorForm } from '../ventilator-form/ventilator-form';

@Component({
  selector: 'app-detail-panel',
  imports: [VentilatorForm],
  templateUrl: './detail-panel.html',
  styleUrl: './detail-panel.css',
  host: { class: 'block' },
})
export class DetailPanel {
  readonly selectedBedId = input<string | null>(null);
  readonly selectedBedNumber = input<string | null>(null);
}
