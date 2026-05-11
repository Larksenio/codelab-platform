import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, MatIconModule],
  template: `
    <aside class="sidebar">
      <div class="logo">
        <div class="logo-icon">&gt;_</div>
        <span class="logo-text">CodeLab</span>
      </div>

      <nav class="nav">
        @for (item of visibleItems(); track item.route) {
          <a class="nav-item"
             [routerLink]="item.route"
             routerLinkActive="active"
             [routerLinkActiveOptions]="{ exact: item.route === '/dashboard' }">
            <mat-icon>{{ item.icon }}</mat-icon>
            <span>{{ item.label }}</span>
          </a>
        }
      </nav>

      <div class="sidebar-footer">
        <div class="user-row">
          <div class="user-avatar">{{ initials() }}</div>
          <div class="user-info">
            <div class="user-name">{{ auth.currentUser()?.name }}</div>
            <div class="user-role">{{ auth.currentUser()?.role }}</div>
          </div>
        </div>
        <button class="logout-btn" (click)="auth.logout()">
          <mat-icon>logout</mat-icon>
          <span>Sign out</span>
        </button>
      </div>
    </aside>
  `,
  styles: [`
    .sidebar {
      width: var(--sidebar-w);
      height: 100vh;
      position: fixed;
      top: 0; left: 0;
      background: var(--bg-surface);
      border-right: 1px solid var(--border);
      display: flex;
      flex-direction: column;
      padding: 16px 12px;
      z-index: 100;
    }

    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 8px 24px;
    }

    .logo-icon {
      width: 34px; height: 34px;
      background: var(--text-primary);
      color: var(--bg-surface);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 700; font-size: 13px;
      flex-shrink: 0;
    }

    .logo-text {
      font-weight: 700; font-size: 17px;
      color: var(--text-primary);
      letter-spacing: -0.3px;
    }

    .nav {
      display: flex;
      flex-direction: column;
      gap: 2px;
      flex: 1;
    }

    .nav-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 10px;
      border-radius: 8px;
      color: var(--text-muted);
      text-decoration: none;
      font-size: 13.5px;
      font-weight: 500;
      transition: background 0.12s, color 0.12s;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      &:hover { background: var(--bg-hover); color: var(--text-primary); }

      &.active {
        background: var(--accent-subtle);
        color: var(--accent-fg);
        font-weight: 600;
      }
    }

    .sidebar-footer {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px solid var(--border);
    }

    .user-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 8px;
    }

    .user-avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--accent-subtle);
      color: var(--accent-fg);
      font-size: 12px; font-weight: 700;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0;
    }

    .user-name { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .user-role { font-size: 11px; color: var(--text-muted); text-transform: capitalize; }

    .logout-btn {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 8px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      font-size: 13.5px;
      font-weight: 500;
      cursor: pointer;
      width: 100%;
      transition: background 0.12s, color 0.12s;

      mat-icon { font-size: 18px; width: 18px; height: 18px; }

      &:hover { background: var(--danger-subtle); color: var(--danger); }
    }
  `],
})
export class SidebarComponent {
  auth = inject(AuthService);

  private readonly allItems: NavItem[] = [
    { icon: 'home',      label: 'Dashboard',    route: '/dashboard' },
    { icon: 'code',      label: 'Exercises',    route: '/exercises',  roles: ['Instructor'] },
    { icon: 'monitor',   label: 'Live Monitor', route: '/monitor',    roles: ['Instructor'] },
    { icon: 'bar_chart', label: 'Analytics',    route: '/analytics',  roles: ['Instructor'] },
  ];

  visibleItems() {
    const role = this.auth.currentUser()?.role;
    return this.allItems.filter(i => !i.roles || i.roles.includes(role ?? ''));
  }

  initials(): string {
    const name = this.auth.currentUser()?.name ?? '';
    return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  }
}
