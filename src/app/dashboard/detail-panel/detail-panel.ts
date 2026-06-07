import { Component, input } from '@angular/core';

@Component({
  selector: 'app-detail-panel',
  imports: [],
  templateUrl: './detail-panel.html',
  styleUrl: './detail-panel.css',
  host: { class: 'block' },
})
export class DetailPanel {
  readonly selectedBedId = input<string | null>(null);
}
