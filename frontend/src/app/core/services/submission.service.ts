import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TestResultDto {
  input: string;
  expected: string;
  actual: string;
  passed: boolean;
  errorMessage: string | null;
}

export interface SubmissionResultDto {
  id: number;
  passedCount: number;
  totalCount: number;
  executionMs: number;
  success: boolean;
  errorMessage: string | null;
  testResults: TestResultDto[];
}

@Injectable({ providedIn: 'root' })
export class SubmissionService {
  private readonly base = `${environment.apiUrl}/submissions`;

  constructor(private http: HttpClient) {}

  submit(sessionId: number, code: string): Observable<SubmissionResultDto> {
    return this.http.post<SubmissionResultDto>(this.base, { sessionId, code });
  }
}
