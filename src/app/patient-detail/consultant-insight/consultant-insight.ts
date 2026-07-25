import { Component, computed, inject, input, signal } from '@angular/core';
import { EvaluationService } from '../../core/services/evaluation.service';
import { InsightResponse } from '../../core/models/evaluation.model';

type InsightState = 'idle' | 'loading' | 'loaded' | 'error';

/**
 * Clinical consultant insight card (PNMC-107). A disclosure control that lazily
 * fetches the deterministic guidance for one evaluation from
 * GET /api/v1/evaluations/{id}/insights (PNMC-106) and renders it inline within
 * the evaluation timeline entry.
 *
 * Fetch is deferred to first expansion on purpose: the backend cache is
 * cache-aside (the first read composes and persists), so eager loading of every
 * timeline card would trigger needless composition work.
 */
@Component({
  selector: 'app-consultant-insight',
  imports: [],
  templateUrl: './consultant-insight.html',
  styleUrl: './consultant-insight.css',
  host: { class: 'block' },
})
export class ConsultantInsight {
  private readonly evaluations = inject(EvaluationService);

  readonly evaluationId = input.required<string>();

  readonly expanded = signal(false);
  readonly state = signal<InsightState>('idle');
  readonly insight = signal<InsightResponse | null>(null);

  /** Stable ids wiring the toggle button (aria-controls) to its region. */
  readonly regionId = computed(() => `insight-region-${this.evaluationId()}`);
  readonly headingId = computed(() => `insight-heading-${this.evaluationId()}`);

  /**
   * Parses the composed insight string into its display parts. The backend emits
   * a verdict headline, then one `• ` bullet per finding, then a `Fuentes:` line —
   * so the card can render a scannable list instead of a wall of text.
   */
  readonly parsed = computed(() => {
    const lines = (this.insight()?.insightText ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);
    const bullets = lines
      .filter((line) => line.startsWith('•'))
      .map((line) => line.replace(/^•\s*/, ''));
    const sourcesLine = lines.find((line) => line.startsWith('Fuentes:'));
    const sources = sourcesLine ? sourcesLine.replace(/^Fuentes:\s*/, '') : '';
    const headline =
      lines.find((line) => !line.startsWith('•') && !line.startsWith('Fuentes:')) ?? '';
    const ready = /^compatible/i.test(headline);
    return { headline, bullets, sources, ready };
  });

  toggle(): void {
    const next = !this.expanded();
    this.expanded.set(next);
    if (next && this.state() === 'idle') {
      this.load();
    }
  }

  load(): void {
    this.state.set('loading');
    this.evaluations.getInsight(this.evaluationId()).subscribe({
      next: (response) => {
        this.insight.set(response.data);
        this.state.set('loaded');
      },
      error: () => this.state.set('error'),
    });
  }
}
