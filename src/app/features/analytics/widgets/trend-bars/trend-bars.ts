import { Component, computed, input } from '@angular/core';
import { TrendPoint } from '../../../../core/models/analytics.model';

/** CSS vertical-bar sparkline for the daily evaluation trend. */
@Component({
  selector: 'app-trend-bars',
  template: `
    <div>
      @if (title()) {
        <p class="mb-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{{ title() }}</p>
      }
      <div class="flex h-16 items-end gap-1" role="img" [attr.aria-label]="ariaLabel()">
        @for (p of points(); track p.day) {
          <span class="flex-1 rounded-t bg-cyan-700" [style.height.%]="height(p.count)" [title]="p.day + ': ' + p.count"></span>
        }
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class TrendBars {
  readonly title = input<string | null>(null);
  readonly points = input.required<TrendPoint[]>();

  private readonly max = computed(() => Math.max(1, ...this.points().map((p) => p.count)));
  readonly ariaLabel = computed(() => `Evaluaciones por día: ${this.points().map((p) => p.count).join(', ')}`);

  height(count: number): number {
    return Math.max(4, (count / this.max()) * 100);
  }
}
