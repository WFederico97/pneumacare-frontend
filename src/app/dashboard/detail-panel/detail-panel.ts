import { Component, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VentilatorForm } from '../ventilator-form/ventilator-form';
import { TimelineService } from '../../core/services/timeline.service';
import { EvaluationResult } from '../../core/models/evaluation.model';
import { EvaluationPayload } from '../../core/models/timeline.model';

@Component({
  selector: 'app-detail-panel',
  imports: [VentilatorForm, RouterLink],
  templateUrl: './detail-panel.html',
  styleUrl: './detail-panel.css',
  host: { class: 'block' },
})
export class DetailPanel {
  private readonly timelineService = inject(TimelineService);

  readonly selectedBedId = input<string | null>(null);
  readonly selectedBedNumber = input<string | null>(null);
  readonly patientId = input<string | null>(null);

  /**
   * True when the patient's latest evaluation triggered a clinical alert —
   * drives the "Atención prioritaria" pill so it only shows for real risk.
   */
  readonly hasActiveAlert = signal(false);

  constructor() {
    effect(() => {
      const currentPatientId = this.patientId();
      this.hasActiveAlert.set(false);
      if (!currentPatientId) {
        return;
      }
      // The timeline arrives newest-first; the first EVALUATION entry is the latest.
      this.timelineService.getTimeline(currentPatientId).subscribe({
        next: (response) => {
          const latest = response.data.find((entry) => entry.type === 'EVALUATION');
          this.hasActiveAlert.set(!!latest && (latest.payload as EvaluationPayload).alertTriggered);
        },
        error: () => {},
      });
    });
  }

  onEvaluationSaved(result: EvaluationResult): void {
    this.hasActiveAlert.set(result.alertTriggered);
  }
}
