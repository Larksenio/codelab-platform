import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  template: `
    <header class="topbar">
      <h1 class="page-title">{{ pageTitle() }}</h1>

      <div class="topbar-actions">
        <!-- Dark / Light toggle -->
        <button class="theme-toggle" (click)="theme.toggle()" [attr.aria-label]="theme.isDark() ? 'Switch to light mode' : 'Switch to dark mode'">
          <span class="toggle-track" [class.dark]="theme.isDark()">
            <span class="toggle-thumb"></span>
          </span>
          <mat-icon class="toggle-icon">{{ theme.isDark() ? 'dark_mode' : 'light_mode' }}</mat-icon>
        </button>
      </div>
    </header>
  `,
  styles: [`
    .topbar {
      height: 56px;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 24px;
      position: sticky;
      top: 0;
      z-index: 50;
    }

    .page-title {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      letter-spacing: -0.2px;
    }

    .topbar-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .theme-toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 10px;
      border: 1px solid var(--border);
      border-radius: 8px;
      background: var(--bg-hover);
      color: var(--text-muted);
      cursor: pointer;
      transition: border-color 0.12s, background 0.12s;

      &:hover { border-color: var(--accent); color: var(--text-primary); }
    }

    .toggle-track {
      position: relative;
      width: 32px; height: 18px;
      background: var(--border);
      border-radius: 9px;
      transition: background 0.2s;
      flex-shrink: 0;

      &.dark { background: var(--accent); }
    }

    .toggle-thumb {
      position: absolute;
      top: 2px; left: 2px;
      width: 14px; height: 14px;
      background: #fff;
      border-radius: 50%;
      transition: left 0.2s;
      box-shadow: 0 1px 3px rgba(0,0,0,.2);

      .dark & { left: 16px; }
    }

    .toggle-icon {
      font-size: 16px;
      width: 16px; height: 16px;
    }
  `],
})
export class TopbarComponent {
  theme = inject(ThemeService);
  private router = inject(Router);

  readonly pageTitle = computed(() => {
    const url = this.router.url;
    if (url.includes('exercises/new'))   return 'New Exercise';
    if (url.includes('exercises/') && !url.includes('share')) return 'Edit Exercise';
    if (url.includes('exercises'))       return 'Exercises';
    if (url.includes('monitor'))         return 'Live Monitor';
    if (url.includes('analytics'))       return 'Analytics';
    if (url.includes('dashboard'))       return 'Dashboard';
    return 'CodeLab';
  });
}
