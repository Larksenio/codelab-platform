import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { ExerciseService, ExerciseListDto } from '../../../core/services/exercise.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-exercise-list',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatButtonModule, MatIconModule,
    MatToolbarModule, MatChipsModule, MatProgressSpinnerModule, MatSnackBarModule,
  ],
  templateUrl: './exercise-list.component.html',
  styleUrl: './exercise-list.component.scss',
})
export class ExerciseListComponent implements OnInit {
  private exerciseService = inject(ExerciseService);
  private snackBar = inject(MatSnackBar);
  auth = inject(AuthService);

  exercises = signal<ExerciseListDto[]>([]);
  loading = signal(true);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.exerciseService.list().subscribe({
      next: data => { this.exercises.set(data); this.loading.set(false); },
      error: () => { this.loading.set(false); },
    });
  }

  delete(id: number, title: string): void {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    this.exerciseService.delete(id).subscribe({
      next: () => {
        this.exercises.update(list => list.filter(e => e.id !== id));
        this.snackBar.open('Exercise deleted', 'OK', { duration: 3000 });
      },
      error: () => this.snackBar.open('Failed to delete exercise', 'OK', { duration: 3000 }),
    });
  }

  copyShareLink(token: string): void {
    const url = `${window.location.origin}/exercises/share/${token}`;
    navigator.clipboard.writeText(url).then(() =>
      this.snackBar.open('Share link copied!', 'OK', { duration: 2000 })
    );
  }

  langColor(lang: string): string {
    const map: Record<string, string> = {
      python: '#3572A5', javascript: '#f1e05a', csharp: '#178600', java: '#b07219',
    };
    return map[lang] ?? '#888';
  }
}
