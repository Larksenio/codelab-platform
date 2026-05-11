import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/services/auth.service';
import { SignalRService } from '../../core/services/signalr.service';
import { MonitorService, SubmissionEvent } from '../../core/services/monitor.service';

interface ActiveStudent {
  exerciseId: string;
  exerciseTitle: string;
  sessionId: string;
}

@Component({
  selector: 'app-monitor-page',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatToolbarModule, MatCardModule, MatIconModule,
    MatButtonModule, MatDividerModule, MatProgressSpinnerModule,
  ],
  template: `
    <mat-toolbar color="primary">
      <button mat-icon-button routerLink="/dashboard"><mat-icon>arrow_back</mat-icon></button>
      <mat-icon style="margin: 0 8px">monitor</mat-icon>
      <span>Live Monitor</span>
      <span style="flex:1"></span>
      <span style="font-size:14px;opacity:.8">{{ auth.currentUser()?.name }}</span>
    </mat-toolbar>

    <div class="monitor-layout">

      <!-- Active Students -->
      <div class="section">
        <h2 class="section-title">
          <mat-icon>people</mat-icon>
          Active Students
          @if (activeStudents().length > 0) {
            <span class="badge">{{ activeStudents().length }}</span>
          }
        </h2>

        @if (activeStudents().length === 0) {
          <div class="empty-state">
            <mat-icon>person_off</mat-icon>
            <p>No students connected right now.</p>
            <p class="sub">Students appear here when they open a shared exercise link while you're on this page.</p>
          </div>
        } @else {
          <div class="student-grid">
            @for (s of activeStudents(); track s.sessionId) {
              <div class="student-chip">
                <mat-icon class="online-dot">circle</mat-icon>
                <div>
                  <div class="student-exercise">{{ s.exerciseTitle }}</div>
                  <div class="student-session">Session #{{ s.sessionId }}</div>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <mat-divider></mat-divider>

      <!-- Submission Feed -->
      <div class="section">
        <h2 class="section-title">
          <mat-icon>history</mat-icon>
          Submission Feed
          @if (submissions().length > 0) {
            <span class="badge">{{ submissions().length }}</span>
          }
        </h2>

        @if (loading()) {
          <div class="empty-state"><mat-spinner diameter="36"></mat-spinner></div>
        } @else if (submissions().length === 0) {
          <div class="empty-state">
            <mat-icon>inbox</mat-icon>
            <p>No submissions yet.</p>
            <p class="sub">Student submissions appear here in real-time and on page load.</p>
          </div>
        } @else {
          <div class="feed">
            @for (sub of submissions(); track sub.submissionId) {
              <mat-card class="submission-card" [class.success]="sub.success" [class.failure]="!sub.success">
                <mat-card-header>
                  <mat-icon mat-card-avatar>{{ sub.success ? 'check_circle' : 'cancel' }}</mat-icon>
                  <mat-card-title>{{ sub.exerciseTitle }}</mat-card-title>
                  <mat-card-subtitle>
                    {{ sub.studentAlias || 'Anónimo' }} · Session #{{ sub.sessionId }} ·
                    {{ sub.language }} · {{ sub.passedCount }}/{{ sub.totalCount }} tests ·
                    {{ sub.executionMs }}ms
                  </mat-card-subtitle>
                </mat-card-header>
                <mat-card-content>
                  <pre class="code-preview">{{ sub.code | slice:0:400 }}{{ sub.code.length > 400 ? '\n...' : '' }}</pre>
                  <div class="timestamp">{{ sub.timestamp | date:'dd/MM HH:mm:ss' }}</div>
                </mat-card-content>
              </mat-card>
            }
          </div>
        }
      </div>

    </div>
  `,
  styles: [`
    .monitor-layout { padding: 24px; max-width: 1100px; margin: auto; }
    .section { margin-bottom: 24px; }
    .section-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 18px; font-weight: 500; margin-bottom: 16px;
    }
    .badge {
      background: #1976d2; color: white;
      border-radius: 12px; padding: 2px 8px; font-size: 12px;
    }
    .empty-state {
      text-align: center; padding: 40px; color: #666;
    }
    .empty-state mat-icon { font-size: 48px; width: 48px; height: 48px; color: #bbb; }
    .empty-state .sub { font-size: 12px; opacity: .7; margin-top: 4px; }
    .student-grid { display: flex; flex-wrap: wrap; gap: 12px; }
    .student-chip {
      display: flex; align-items: center; gap: 8px;
      background: #e8f5e9; border-radius: 8px; padding: 8px 12px;
    }
    .online-dot { color: #4caf50; font-size: 14px; width: 14px; height: 14px; }
    .student-exercise { font-weight: 500; font-size: 14px; }
    .student-session { font-size: 12px; color: #666; }
    .feed { display: flex; flex-direction: column; gap: 12px; }
    .submission-card { border-left: 4px solid #ccc; }
    .submission-card.success { border-left-color: #4caf50; }
    .submission-card.failure { border-left-color: #f44336; }
    .code-preview {
      background: #1e1e1e; color: #d4d4d4;
      padding: 12px; border-radius: 4px;
      font-size: 12px; overflow-x: auto; margin: 8px 0 0;
      white-space: pre-wrap; word-break: break-all;
    }
    .timestamp { font-size: 11px; color: #999; text-align: right; margin-top: 4px; }
  `],
})
export class MonitorPageComponent implements OnInit, OnDestroy {
  auth       = inject(AuthService);
  private signalR  = inject(SignalRService);
  private monitorSvc = inject(MonitorService);

  activeStudents = signal<ActiveStudent[]>([]);
  submissions    = signal<SubmissionEvent[]>([]);
  loading        = signal(true);

  async ngOnInit(): Promise<void> {
    // Load historical submissions from DB
    this.monitorSvc.getRecentSubmissions(50).subscribe({
      next: subs => {
        this.submissions.set(subs.map(s => ({ ...s, timestamp: new Date(s.timestamp) })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    // Connect SignalR for real-time updates
    const token = this.auth.getToken();
    const hub   = await this.signalR.connectAsync(token);

    hub.on('StudentOnline', (data: ActiveStudent) => {
      this.activeStudents.update(list => {
        const exists = list.some(s => s.sessionId === data.sessionId);
        return exists ? list : [data, ...list];
      });
    });

    hub.on('StudentOffline', (data: { sessionId: string }) => {
      this.activeStudents.update(list => list.filter(s => s.sessionId !== data.sessionId));
    });

    hub.on('NewSubmission', (data: SubmissionEvent) => {
      const event = { ...data, timestamp: new Date(data.timestamp) };
      this.submissions.update(list => [event, ...list].slice(0, 50));
      if (data.success) {
        this.activeStudents.update(list =>
          list.filter(s => s.sessionId !== String(data.sessionId)));
      }
    });

    hub.onreconnected(() => hub.invoke('JoinMonitor').catch(console.error));
    await hub.invoke('JoinMonitor');
  }

  ngOnDestroy(): void {
    this.signalR.disconnect();
  }
}
