import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SubmissionEvent {
  submissionId: number;
  sessionId: number;
  studentAlias: string;
  exerciseId: number;
  exerciseTitle: string;
  language: string;
  passedCount: number;
  totalCount: number;
  success: boolean;
  executionMs: number;
  code: string;
  timestamp: Date;
}

@Injectable({ providedIn: 'root' })
export class MonitorService {
  private readonly base = `${environment.apiUrl}/monitor`;

  constructor(private http: HttpClient) {}

  getRecentSubmissions(limit = 30): Observable<SubmissionEvent[]> {
    return this.http.get<SubmissionEvent[]>(`${this.base}/submissions?limit=${limit}`);
  }
}
