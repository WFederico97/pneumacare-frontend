import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { IdentifierTypeApiResponse } from '../models/identifier-type.model';

@Injectable({ providedIn: 'root' })
export class IdentifierTypeService {
  private readonly http = inject(HttpClient);

  getIdentifierTypes(): Observable<IdentifierTypeApiResponse> {
    return this.http.get<IdentifierTypeApiResponse>('/api/v1/identifier-types');
  }
}
