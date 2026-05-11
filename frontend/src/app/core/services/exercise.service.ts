import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface TestCaseDto {
  id: number;
  input: string;
  expectedOutput: string;
  isHidden: boolean;
}

export interface ExerciseDto {
  id: number;
  title: string;
  description: string;
  language: string;
  boilerplate: string;
  stuckThresholdMinutes: number;
  shareToken: string;
  instructorId: string;
  instructorName: string;
  createdAt: string;
  testCases: TestCaseDto[];
}

export interface ExerciseListDto {
  id: number;
  title: string;
  language: string;
  stuckThresholdMinutes: number;
  shareToken: string;
  createdAt: string;
  testCaseCount: number;
}

export interface CreateExerciseRequest {
  title: string;
  description: string;
  language: string;
  boilerplate: string;
  stuckThresholdMinutes: number;
  testCases: { input: string; expectedOutput: string; isHidden: boolean }[];
}

export interface UpdateExerciseRequest {
  title: string;
  description: string;
  boilerplate: string;
  stuckThresholdMinutes: number;
}

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly base = `${environment.apiUrl}/exercises`;

  constructor(private http: HttpClient) {}

  list(): Observable<ExerciseListDto[]> {
    return this.http.get<ExerciseListDto[]>(this.base);
  }

  get(id: number): Observable<ExerciseDto> {
    return this.http.get<ExerciseDto>(`${this.base}/${id}`);
  }

  getByShareToken(token: string): Observable<ExerciseDto> {
    return this.http.get<ExerciseDto>(`${this.base}/share/${token}`);
  }

  create(req: CreateExerciseRequest): Observable<ExerciseDto> {
    return this.http.post<ExerciseDto>(this.base, req);
  }

  update(id: number, req: UpdateExerciseRequest): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, req);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  addTestCase(exerciseId: number, tc: { input: string; expectedOutput: string; isHidden: boolean }): Observable<TestCaseDto> {
    return this.http.post<TestCaseDto>(`${this.base}/${exerciseId}/test-cases`, tc);
  }

  deleteTestCase(exerciseId: number, tcId: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${exerciseId}/test-cases/${tcId}`);
  }
}
