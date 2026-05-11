import { Routes } from '@angular/router';
import { authGuard, guestGuard, instructorGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/dashboard', pathMatch: 'full' },

  {
    path: 'auth',
    canActivate: [guestGuard],
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login.component').then(m => m.LoginComponent),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register.component').then(m => m.RegisterComponent),
      },
      { path: '', redirectTo: 'login', pathMatch: 'full' },
    ],
  },

  // Student editor — no sidebar layout
  {
    path: 'exercises/share/:token',
    loadComponent: () =>
      import('./features/editor/editor-page/editor-page.component')
        .then(m => m.EditorPageComponent),
  },

  // Authenticated shell — sidebar + topbar
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./core/layout/main-layout/main-layout.component')
        .then(m => m.MainLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'exercises',
        canActivate: [instructorGuard],
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./features/exercises/exercise-list/exercise-list.component')
                .then(m => m.ExerciseListComponent),
          },
          {
            path: 'new',
            loadComponent: () =>
              import('./features/exercises/exercise-form/exercise-form.component')
                .then(m => m.ExerciseFormComponent),
          },
          {
            path: ':id',
            loadComponent: () =>
              import('./features/exercises/exercise-form/exercise-form.component')
                .then(m => m.ExerciseFormComponent),
          },
        ],
      },
      {
        path: 'analytics',
        canActivate: [instructorGuard],
        loadComponent: () =>
          import('./features/analytics/analytics-dashboard.component')
            .then(m => m.AnalyticsDashboardComponent),
      },
      {
        path: 'monitor',
        canActivate: [instructorGuard],
        loadComponent: () =>
          import('./features/monitor/monitor-page.component')
            .then(m => m.MonitorPageComponent),
      },
    ],
  },

  { path: '**', redirectTo: '/dashboard' },
];
