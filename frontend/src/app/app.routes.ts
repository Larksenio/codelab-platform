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

  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },

  // Student — public exercise view (no auth, must be BEFORE :id to avoid conflict)
  {
    path: 'exercises/share/:token',
    loadComponent: () =>
      import('./features/editor/editor-page/editor-page.component')
        .then(m => m.EditorPageComponent),
  },

  // Instructor — exercise management
  {
    path: 'exercises',
    canActivate: [instructorGuard],
    loadComponent: () =>
      import('./features/exercises/exercise-list/exercise-list.component')
        .then(m => m.ExerciseListComponent),
  },
  {
    path: 'exercises/new',
    canActivate: [instructorGuard],
    loadComponent: () =>
      import('./features/exercises/exercise-form/exercise-form.component')
        .then(m => m.ExerciseFormComponent),
  },
  {
    path: 'exercises/:id',
    canActivate: [instructorGuard],
    loadComponent: () =>
      import('./features/exercises/exercise-form/exercise-form.component')
        .then(m => m.ExerciseFormComponent),
  },

  // Instructor — analytics dashboard
  {
    path: 'analytics',
    canActivate: [instructorGuard],
    loadComponent: () =>
      import('./features/analytics/analytics-dashboard.component')
        .then(m => m.AnalyticsDashboardComponent),
  },

  // Instructor — live monitor
  {
    path: 'monitor',
    canActivate: [instructorGuard],
    loadComponent: () =>
      import('./features/monitor/monitor-page.component')
        .then(m => m.MonitorPageComponent),
  },

  { path: '**', redirectTo: '/dashboard' },
];
