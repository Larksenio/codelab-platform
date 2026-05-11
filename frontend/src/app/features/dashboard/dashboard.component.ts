import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  template: `
    <div class="dash">
      <div class="greeting">
        <p class="greeting-name">Welcome back, <strong>{{ auth.currentUser()?.name }}</strong></p>
        <p class="greeting-sub">{{ auth.isInstructor() ? 'Instructor dashboard' : 'Student view' }}</p>
      </div>

      @if (auth.isInstructor()) {
        <div class="cards">
          <a class="card" routerLink="/exercises">
            <div class="card-icon accent">
              <mat-icon>code</mat-icon>
            </div>
            <div class="card-body">
              <div class="card-title">Exercises</div>
              <div class="card-desc">Create and manage coding exercises for your students</div>
            </div>
            <mat-icon class="card-arrow">chevron_right</mat-icon>
          </a>
          <a class="card" routerLink="/monitor">
            <div class="card-icon blue">
              <mat-icon>monitor</mat-icon>
            </div>
            <div class="card-body">
              <div class="card-title">Live Monitor</div>
              <div class="card-desc">Watch students working in real-time and track submissions</div>
            </div>
            <mat-icon class="card-arrow">chevron_right</mat-icon>
          </a>
          <a class="card" routerLink="/analytics">
            <div class="card-icon purple">
              <mat-icon>bar_chart</mat-icon>
            </div>
            <div class="card-body">
              <div class="card-title">Analytics</div>
              <div class="card-desc">View performance dashboards and student progress</div>
            </div>
            <mat-icon class="card-arrow">chevron_right</mat-icon>
          </a>
        </div>
      } @else {
        <div class="cards">
          <div class="card">
            <div class="card-icon accent">
              <mat-icon>link</mat-icon>
            </div>
            <div class="card-body">
              <div class="card-title">My Exercises</div>
              <div class="card-desc">Access coding exercises via the share link provided by your instructor</div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .dash {
      display: flex;
      flex-direction: column;
      gap: 28px;
      max-width: 900px;
    }

    .greeting-name { font-size: 20px; color: var(--text-primary); }
    .greeting-sub  { font-size: 13px; color: var(--text-muted); margin-top: 4px; }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 14px;
    }

    .card {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
      background: var(--bg-surface);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      color: var(--text-primary);
      cursor: default;
      transition: border-color 0.12s, box-shadow 0.12s;

      &[routerLink] {
        cursor: pointer;
        &:hover { border-color: var(--accent); box-shadow: var(--shadow); }
      }
    }

    .card-icon {
      width: 44px; height: 44px;
      border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;

      mat-icon { font-size: 22px; width: 22px; height: 22px; }

      &.accent { background: var(--accent-subtle); color: var(--accent-fg); }
      &.blue   { background: #eff6ff; color: #1d4ed8; }
      &.purple { background: #faf5ff; color: #7c3aed; }
    }

    .card-body { flex: 1; }
    .card-title { font-size: 14px; font-weight: 600; }
    .card-desc  { font-size: 12px; color: var(--text-muted); margin-top: 3px; line-height: 1.5; }

    .card-arrow { color: var(--text-muted); font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
  `],
})
export class DashboardComponent {
  constructor(public auth: AuthService) {}
}
