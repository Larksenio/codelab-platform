import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface SessionDto {
  id: number;
  exerciseId: number;
  studentId: string | null;
  studentAlias: string;
  joinedAt: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly base = `${environment.apiUrl}/sessions`;

  constructor(private http: HttpClient) {}

  createOrGet(exerciseId: number, studentAlias?: string): Observable<SessionDto> {
    return this.http.post<SessionDto>(this.base, { exerciseId, studentAlias });
  }
}
