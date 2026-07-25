import { Component, computed, input } from '@angular/core';

/** Visual emphasis: neutral, or an alert tone for values that demand attention. */
export type KpiTone = 'default' | 'alert';

/** Small KPI tile: an uppercase label, a large mono value, and optional sub-text. */
@Component({
  selector: 'app-kpi-card',
  template: `
    <div class="rounded-2xl border p-4 text-center shadow-xl" [class]="containerClass()">
      <span class="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{{ label() }}</span>
      <b class="mt-1 block font-mono text-2xl font-bold" [class]="valueClass()">{{ value() }}</b>
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
  readonly tone = input<KpiTone>('default');

  protected readonly containerClass = computed(() =>
    this.tone() === 'alert'
      ? 'border-red-500/40 bg-red-950/30'
      : 'border-slate-700/70 bg-slate-900/80',
  );

  protected readonly valueClass = computed(() =>
    this.tone() === 'alert' ? 'text-red-300' : 'text-cyan-300',
  );
}
