import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface ExerciseOverviewDto {
  exerciseId: number;
  title: string;
  totalSessions: number;
  passedSessions: number;
  successRate: number;
  totalSubmissions: number;
  hintsUsed: number;
}

export interface ExerciseAnalyticsDto {
  exerciseId: number;
  title: string;
  totalSessions: number;
  passedSessions: number;
  successRate: number;
  avgExecutionMs: number;
  avgAttemptsToPass: number;
  hintsUsed: number;
  stuckCount: number;
  compilationErrors: number;
  runtimeErrors: number;
  wrongAnswerErrors: number;
  tleErrors: number;
  computedAt: string;
}

export interface StudentRowDto {
  sessionId: number;
  studentAlias: string;
  attempts: number;
  passed: boolean;
  hintsUsed: number;
  needsReinforcement: boolean;
  joinedAt: string;
  lastExecutionMs: number | null;
}

export interface GroupAnalyticsDto {
  exerciseId: number;
  title: string;
  totalStudents: number;
  passedCount: number;
  stuckCount: number;
  needsReinforcementCount: number;
  students: StudentRowDto[];
}

export interface WeeklyPointDto {
  week: string;
  totalSubmissions: number;
  passedSubmissions: number;
}

export interface WeeklyAnalyticsDto {
  points: WeeklyPointDto[];
}

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private readonly base = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getOverview(): Observable<ExerciseOverviewDto[]> {
    return this.http.get<ExerciseOverviewDto[]>(`${this.base}/overview`);
  }

  getExercise(id: number): Observable<ExerciseAnalyticsDto> {
    return this.http.get<ExerciseAnalyticsDto>(`${this.base}/exercise/${id}`);
  }

  getGroup(exerciseId: number): Observable<GroupAnalyticsDto> {
    return this.http.get<GroupAnalyticsDto>(`${this.base}/group/${exerciseId}`);
  }

  getWeekly(): Observable<WeeklyAnalyticsDto> {
    return this.http.get<WeeklyAnalyticsDto>(`${this.base}/weekly`);
  }

  getCsvUrl(exerciseId: number): string {
    return `${this.base}/group/${exerciseId}/csv`;
  }
}
