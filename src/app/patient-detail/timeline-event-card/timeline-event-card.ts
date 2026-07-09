import { Component, computed, input } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  AirwayEventPayload,
  EvaluationPayload,
  SbtPayload,
  TimelineEntry,
} from '../../core/models/timeline.model';
import { ConsultantInsight } from '../consultant-insight/consultant-insight';

/**
 * Renders a single timeline entry (PNMC-96) with a layout, icon and text label
 * distinct per event type (AC3). The icon is decorative ({@code aria-hidden}); the
 * visible type label carries the meaning so the distinction is never colour-only.
 */
@Component({
  selector: 'app-timeline-event-card',
  imports: [DatePipe, DecimalPipe, ConsultantInsight],
  templateUrl: './timeline-event-card.html',
  styleUrl: './timeline-event-card.css',
  host: { class: 'block' },
})
export class TimelineEventCard {
  readonly entry = input.required<TimelineEntry>();

  /** Spanish label for the airway respiratory status produced by an event. */
  private static readonly STATUS_LABELS: Record<string, string> = {
    SPONTANEOUS: 'Ventilación espontánea',
    INTUBATED: 'Intubado',
    TRACHEOSTOMY: 'Traqueostomía',
  };

  private static readonly AIRWAY_LABELS: Record<string, string> = {
    INTUBATION: 'Intubación',
    EXTUBATION: 'Extubación',
    TRACHEOSTOMY: 'Traqueostomía',
  };

  readonly evaluation = computed(() => this.entry().payload as EvaluationPayload);
  readonly airway = computed(() => this.entry().payload as AirwayEventPayload);
  readonly sbt = computed(() => this.entry().payload as SbtPayload);

  typeLabel(): string {
    switch (this.entry().type) {
      case 'EVALUATION':
        return 'Evaluación respiratoria';
      case 'AIRWAY':
        return 'Evento de vía aérea';
      case 'SBT':
        return 'Prueba de respiración espontánea (SBT)';
    }
  }

  airwayLabel(): string {
    return TimelineEventCard.AIRWAY_LABELS[this.airway().eventType] ?? this.airway().eventType;
  }

  resultingStatusLabel(): string {
    return TimelineEventCard.STATUS_LABELS[this.airway().resultingStatus] ?? this.airway().resultingStatus;
  }

  sbtOutcomeLabel(): string {
    return this.sbt().toleranceResult === 'SUCCESS' ? 'Tolerada' : 'No tolerada';
  }
}
