import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatToolbarModule],
  template: `
    <mat-toolbar color="primary">
      <span>CodeLab</span>
      <span style="flex:1"></span>
      <span style="margin-right:16px">{{ auth.currentUser()?.name }}</span>
      <button mat-button (click)="auth.logout()">
        <mat-icon>logout</mat-icon> Logout
      </button>
    </mat-toolbar>

    <div style="padding:32px;max-width:960px;margin:auto">
      <h1>Welcome, {{ auth.currentUser()?.name }}!</h1>
      <p>Role: <strong>{{ auth.currentUser()?.role }}</strong></p>

      @if (auth.isInstructor()) {
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px;margin-top:24px">
          <mat-card>
            <mat-card-header><mat-card-title>Exercises</mat-card-title></mat-card-header>
            <mat-card-content><p>Create and manage coding exercises.</p></mat-card-content>
            <mat-card-actions><button mat-button color="primary" routerLink="/exercises">Open</button></mat-card-actions>
          </mat-card>
          <mat-card>
            <mat-card-header><mat-card-title>Monitor</mat-card-title></mat-card-header>
            <mat-card-content><p>Watch students in real-time.</p></mat-card-content>
            <mat-card-actions><button mat-button color="primary" routerLink="/monitor">Open</button></mat-card-actions>
          </mat-card>
          <mat-card>
            <mat-card-header><mat-card-title>Analytics</mat-card-title></mat-card-header>
            <mat-card-content><p>View performance dashboards.</p></mat-card-content>
            <mat-card-actions><button mat-button color="primary" routerLink="/analytics">Open</button></mat-card-actions>
          </mat-card>
        </div>
      } @else {
        <div style="margin-top:24px">
          <mat-card>
            <mat-card-header><mat-card-title>My Exercises</mat-card-title></mat-card-header>
            <mat-card-content><p>Access your coding exercises via share link.</p></mat-card-content>
          </mat-card>
        </div>
      }
    </div>
  `,
})
export class DashboardComponent {
  constructor(public auth: AuthService) {}
}
