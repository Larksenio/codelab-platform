import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CodeEditorComponent } from '../../../shared/code-editor/code-editor.component';
import { ExerciseService, ExerciseDto } from '../../../core/services/exercise.service';
import { SessionService } from '../../../core/services/session.service';
import { SubmissionService, SubmissionResultDto } from '../../../core/services/submission.service';
import { HintService } from '../../../core/services/hint.service';
import { SignalRService } from '../../../core/services/signalr.service';

const SESSION_KEY = 'cl_session_';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatDividerModule,
    MatToolbarModule, MatSnackBarModule,
    CodeEditorComponent,
  ],
  templateUrl: './editor-page.component.html',
  styleUrl: './editor-page.component.scss',
})
export class EditorPageComponent implements OnInit, OnDestroy {
  private route       = inject(ActivatedRoute);
  private exerciseSvc = inject(ExerciseService);
  private sessionSvc  = inject(SessionService);
  private submitSvc   = inject(SubmissionService);
  private hintSvc     = inject(HintService);
  private signalR     = inject(SignalRService);
  private snackBar    = inject(MatSnackBar);

  exercise   = signal<ExerciseDto | null>(null);
  sessionId  = signal<number | null>(null);
  loading    = signal(true);
  submitting = signal(false);
  result     = signal<SubmissionResultDto | null>(null);
  error      = signal('');

  hinting    = signal(false);
  hint       = signal<string | null>(null);

  code     = '';
  language = 'python';

  ngOnInit(): void {
    const token = this.route.snapshot.paramMap.get('token')!;
    this.exerciseSvc.getByShareToken(token).subscribe({
      next: ex => {
        this.exercise.set(ex);
        this.code     = ex.boilerplate;
        this.language = this.mapLang(ex.language);
        this.initSession(ex.id);
      },
      error: () => { this.error.set('Exercise not found.'); this.loading.set(false); },
    });
  }

  private initSession(exerciseId: number): void {
    const cacheKey = `${SESSION_KEY}${exerciseId}`;
    const cached   = sessionStorage.getItem(cacheKey);
    if (cached) {
      this.sessionId.set(+cached);
      this.loading.set(false);
      this.joinHub(exerciseId, +cached);
      return;
    }

    this.sessionSvc.createOrGet(exerciseId).subscribe({
      next: s => {
        this.sessionId.set(s.id);
        sessionStorage.setItem(cacheKey, String(s.id));
        this.loading.set(false);
        this.joinHub(exerciseId, s.id);
      },
      error: () => { this.loading.set(false); },
    });
  }

  private joinHub(exerciseId: number, sessionId: number): void {
    this.signalR.connectAsync().then(hub => {
      hub.invoke('JoinExercise', String(exerciseId), String(sessionId)).catch(console.error);
      hub.onreconnected(() =>
        hub.invoke('JoinExercise', String(exerciseId), String(sessionId)).catch(console.error));
    });
  }

  submit(): void {
    if (!this.sessionId() || this.submitting()) return;
    this.submitting.set(true);
    this.result.set(null);
    this.hint.set(null);

    this.submitSvc.submit(this.sessionId()!, this.code).subscribe({
      next: r => {
        this.result.set(r);
        this.submitting.set(false);
        if (r.success) this.snackBar.open('All tests passed!', 'OK', { duration: 3000 });
      },
      error: err => {
        this.snackBar.open(err.error?.detail ?? 'Submission failed', 'OK', { duration: 3000 });
        this.submitting.set(false);
      },
    });
  }

  getHint(): void {
    if (!this.sessionId() || this.hinting()) return;
    this.hinting.set(true);
    this.hint.set(null);

    this.hintSvc.getHint(this.sessionId()!, this.code, this.result()?.id).subscribe({
      next: r => {
        this.hint.set(r.hint);
        this.hinting.set(false);
      },
      error: err => {
        const msg = err.status === 429 ? 'Hint limit reached. Try again in a minute.' : 'Could not get hint.';
        this.snackBar.open(msg, 'OK', { duration: 4000 });
        this.hinting.set(false);
      },
    });
  }

  onCodeChange(newCode: string): void {
    this.code = newCode;
  }

  ngOnDestroy(): void {
    this.signalR.disconnect();
  }

  private mapLang(lang: string): string {
    const map: Record<string, string> = {
      python: 'python', javascript: 'javascript', csharp: 'csharp', java: 'java',
    };
    return map[lang] ?? 'plaintext';
  }
}
