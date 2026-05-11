import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface HintResponse {
  hint: string;
  promptTokens: number;
  completionTokens: number;
}

@Injectable({ providedIn: 'root' })
export class HintService {
  private readonly base = `${environment.apiUrl}/hints`;

  constructor(private http: HttpClient) {}

  getHint(sessionId: number, code: string, submissionId?: number): Observable<HintResponse> {
    return this.http.post<HintResponse>(this.base, { sessionId, code, submissionId });
  }
}
