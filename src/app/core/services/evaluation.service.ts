import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  CreateEvaluationRequest,
  EvaluationApiResponse,
  InsightApiResponse,
} from '../models/evaluation.model';

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private readonly http = inject(HttpClient);

  createEvaluation(payload: CreateEvaluationRequest): Observable<EvaluationApiResponse> {
    return this.http.post<EvaluationApiResponse>('/api/v1/evaluations', payload);
  }

  /**
   * Fetches the clinical consultant insight for an evaluation (PNMC-106/107).
   * The backend composes and caches on first read, so this is invoked lazily.
   */
  getInsight(evaluationId: string): Observable<InsightApiResponse> {
    return this.http.get<InsightApiResponse>(`/api/v1/evaluations/${evaluationId}/insights`);
  }
}
