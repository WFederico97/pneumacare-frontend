import { Component, computed, input } from '@angular/core';

export interface BreakdownSegment {
  label: string;
  value: number;
  colorClass: string;
}

/**
 * A segmented horizontal bar with a legend, rendered in plain CSS (no chart
 * library). A zero total renders as a neutral slate track.
 */
@Component({
  selector: 'app-breakdown-bar',
  template: `
    <div>
      @if (title()) {
        <p class="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{{ title() }}</p>
      }
      <div class="flex h-3 w-full overflow-hidden rounded-full bg-slate-800" role="img" [attr.aria-label]="ariaLabel()">
        @for (s of segments(); track s.label) {
          @if (s.value > 0) {
            <span class="h-full {{ s.colorClass }}" [style.width.%]="pct(s.value)"></span>
          }
        }
      </div>
      <div class="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        @for (s of segments(); track s.label) {
          <span class="text-[11px] text-slate-300">{{ s.label }}: {{ s.value }}</span>
        }
      </div>
    </div>
  `,
  host: { class: 'block' },
})
export class BreakdownBar {
  readonly title = input<string | null>(null);
  readonly segments = input.required<BreakdownSegment[]>();

  private readonly total = computed(() => this.segments().reduce((acc, s) => acc + s.value, 0));
  readonly ariaLabel = computed(() => this.segments().map((s) => `${s.label} ${s.value}`).join(', '));

  pct(value: number): number {
    const t = this.total();
    return t === 0 ? 0 : (value / t) * 100;
  }
}
