import { Component, input } from '@angular/core';

/** Small KPI tile: an uppercase label, a large mono value, and optional sub-text. */
@Component({
  selector: 'app-kpi-card',
  template: `
    <div class="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-4 text-center shadow-xl">
      <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{{ label() }}</span>
      <b class="mt-1 block font-mono text-2xl font-bold text-cyan-300">{{ value() }}</b>
      @if (sub()) {
        <span class="text-[11px] text-slate-400">{{ sub() }}</span>
      }
    </div>
  `,
  host: { class: 'block' },
})
export class KpiCard {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly sub = input<string | null>(null);
}
