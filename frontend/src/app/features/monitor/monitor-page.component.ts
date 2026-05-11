import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
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
  imports: [CommonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="monitor">

      <!-- Active Students -->
      <section class="panel">
        <div class="panel-header">
          <mat-icon>people</mat-icon>
          <h2>Active Students</h2>
          @if (activeStudents().length > 0) {
            <span class="badge">{{ activeStudents().length }}</span>
          }
        </div>

        @if (activeStudents().length === 0) {
          <div class="empty">
            <mat-icon>person_off</mat-icon>
            <p>No students connected right now</p>
            <p class="empty-sub">Students appear here when they open a shared exercise link</p>
          </div>
        } @else {
          <div class="student-grid">
            @for (s of activeStudents(); track s.sessionId) {
              <div class="student-chip">
                <span class="online-dot"></span>
                <div>
                  <div class="student-exercise">{{ s.exerciseTitle }}</div>
                  <div class="student-session">Session #{{ s.sessionId }}</div>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <div class="divider"></div>

      <!-- Submission Feed -->
      <section class="panel">
        <div class="panel-header">
          <mat-icon>history</mat-icon>
          <h2>Submission Feed</h2>
          @if (submissions().length > 0) {
            <span class="badge">{{ submissions().length }}</span>
          }
        </div>

        @if (loading()) {
          <div class="empty"><mat-spinner diameter="32"></mat-spinner></div>
        } @else if (submissions().length === 0) {
          <div class="empty">
            <mat-icon>inbox</mat-icon>
            <p>No submissions yet</p>
            <p class="empty-sub">Student submissions appear here in real-time and on page load</p>
          </div>
        } @else {
          <div class="feed">
            @for (sub of submissions(); track sub.submissionId) {
              <div class="sub-card" [class.success]="sub.success" [class.failure]="!sub.success">
                <div class="sub-header">
                  <mat-icon class="sub-icon">{{ sub.success ? 'check_circle' : 'cancel' }}</mat-icon>
                  <div class="sub-meta">
                    <div class="sub-title">{{ sub.exerciseTitle }}</div>
                    <div class="sub-detail">
                      {{ sub.studentAlias || 'Anonymous' }} · Session #{{ sub.sessionId }} ·
                      {{ sub.language }} · {{ sub.passedCount }}/{{ sub.totalCount }} tests ·
                      {{ sub.executionMs }}ms
                    </div>
                  </div>
                  <div class="sub-time">{{ sub.timestamp | date:'HH:mm:ss' }}</div>
                </div>
                <pre class="code-preview">{{ sub.code | slice:0:400 }}{{ sub.code.length > 400 ? '\n...' : '' }}</pre>
              </div>
            }
          </div>
        }
      </section>

    </div>
  `,
  styles: [`
    .monitor { display: flex; flex-direction: column; gap: 24px; }

    .panel { display: flex; flex-direction: column; gap: 16px; }

    .panel-header {
      display: flex;
      align-items: center;
      gap: 8px;
      h2 { font-size: 15px; font-weight: 600; color: var(--text-primary); }
      mat-icon { font-size: 20px; width: 20px; height: 20px; color: var(--text-muted); }
    }

    .badge {
      background: var(--accent);
      color: #fff;
      border-radius: 12px;
      padding: 1px 8px;
      font-size: 12px;
      font-weight: 600;
    }

    .divider { height: 1px; background: var(--border); }

    .empty {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      mat-icon { font-size: 44px; width: 44px; height: 44px; color: var(--border); }
    }
    .empty-sub { font-size: 12px; opacity: .7; }

    .student-grid { display: flex; flex-wrap: wrap; gap: 10px; }

    .student-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--accent-subtle);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 8px 14px;
    }

    .online-dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: var(--accent);
      flex-shrink: 0;
    }

    .student-exercise { font-weight: 500; font-size: 13px; color: var(--text-primary); }
    .student-session  { font-size: 11px; color: var(--text-muted); }

    .feed { display: flex; flex-direction: column; gap: 10px; }

    .sub-card {
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-left: 4px solid var(--border);
      border-radius: var(--radius);
      padding: 14px 16px;
      display: flex;
      flex-direction: column;
      gap: 10px;

      &.success { border-left-color: var(--accent); }
      &.failure { border-left-color: var(--danger); }
    }

    .sub-header { display: flex; align-items: flex-start; gap: 10px; }

    .sub-icon {
      font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; margin-top: 2px;
      .success & { color: var(--accent); }
      .failure & { color: var(--danger); }
    }

    .sub-meta { flex: 1; }
    .sub-title  { font-size: 14px; font-weight: 600; color: var(--text-primary); }
    .sub-detail { font-size: 12px; color: var(--text-muted); margin-top: 2px; }
    .sub-time   { font-size: 11px; color: var(--text-muted); flex-shrink: 0; }

    .code-preview {
      background: #1e1e1e;
      color: #d4d4d4;
      padding: 10px 14px;
      border-radius: 6px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 12px;
      overflow-x: auto;
      white-space: pre-wrap;
      word-break: break-all;
    }
  `],
})
export class MonitorPageComponent implements OnInit, OnDestroy {
  auth         = inject(AuthService);
  private signalR    = inject(SignalRService);
  private monitorSvc = inject(MonitorService);

  activeStudents = signal<ActiveStudent[]>([]);
  submissions    = signal<SubmissionEvent[]>([]);
  loading        = signal(true);

  async ngOnInit(): Promise<void> {
    this.monitorSvc.getRecentSubmissions(50).subscribe({
      next: subs => {
        this.submissions.set(subs.map(s => ({ ...s, timestamp: new Date(s.timestamp) })));
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

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
