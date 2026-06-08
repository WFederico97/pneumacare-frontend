import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateEvaluationRequest, EvaluationApiResponse } from '../models/evaluation.model';

@Injectable({ providedIn: 'root' })
export class EvaluationService {
  private readonly http = inject(HttpClient);

  createEvaluation(payload: CreateEvaluationRequest): Observable<EvaluationApiResponse> {
    return this.http.post<EvaluationApiResponse>('/api/v1/evaluations', payload);
  }
}
