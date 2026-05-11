import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormArray, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { ExerciseService } from '../../../core/services/exercise.service';

const LANGUAGES = ['python', 'javascript', 'csharp', 'java'];

const BOILERPLATES: Record<string, string> = {
  python:     'def solution():\n    # Write your code here\n    pass\n',
  javascript: 'function solution() {\n  // Write your code here\n}\n',
  csharp:     'using System;\n\nclass Solution {\n    static void Main() {\n        // Write your code here\n    }\n}\n',
  java:       'import java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n    }\n}\n',
};

@Component({
  selector: 'app-exercise-form',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, RouterLink,
    MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule,
    MatIconModule, MatSelectModule, MatSliderModule, MatCheckboxModule,
    MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
  ],
  templateUrl: './exercise-form.component.html',
  styleUrl: './exercise-form.component.scss',
})
export class ExerciseFormComponent implements OnInit {
  private fb       = inject(FormBuilder);
  private service  = inject(ExerciseService);
  private router   = inject(Router);
  private route    = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  languages = LANGUAGES;
  editId = signal<number | null>(null);
  loading  = signal(false);
  saving   = signal(false);

  form = this.fb.nonNullable.group({
    title:                ['', [Validators.required, Validators.minLength(3)]],
    description:          ['', Validators.required],
    language:             ['python', Validators.required],
    boilerplate:          [BOILERPLATES['python']],
    stuckThresholdMinutes:[15, [Validators.required, Validators.min(1), Validators.max(120)]],
    testCases: this.fb.array([this.newTestCaseGroup()]),
  });

  get testCases() { return this.form.controls.testCases as FormArray; }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.editId.set(+id);
      this.loadExisting(+id);
    }

    // Auto-fill boilerplate when language changes
    this.form.controls.language.valueChanges.subscribe(lang => {
      if (!this.editId()) {
        this.form.controls.boilerplate.setValue(BOILERPLATES[lang] ?? '');
      }
    });
  }

  loadExisting(id: number): void {
    this.loading.set(true);
    this.service.get(id).subscribe({
      next: ex => {
        this.form.patchValue({
          title: ex.title,
          description: ex.description,
          language: ex.language,
          boilerplate: ex.boilerplate,
          stuckThresholdMinutes: ex.stuckThresholdMinutes,
        });
        this.testCases.clear();
        ex.testCases.forEach(tc => this.testCases.push(this.fb.nonNullable.group({
          input:          [tc.input, Validators.required],
          expectedOutput: [tc.expectedOutput, Validators.required],
          isHidden:       [tc.isHidden],
        })));
        this.loading.set(false);
      },
      error: () => { this.loading.set(false); this.router.navigate(['/exercises']); },
    });
  }

  addTestCase(): void {
    this.testCases.push(this.newTestCaseGroup());
  }

  removeTestCase(i: number): void {
    if (this.testCases.length > 1) this.testCases.removeAt(i);
  }

  save(): void {
    if (this.form.invalid || this.saving()) return;
    this.saving.set(true);

    const value = this.form.getRawValue();
    const id = this.editId();

    const onSuccess = () => {
      this.snackBar.open(id ? 'Exercise updated!' : 'Exercise created!', 'OK', { duration: 2000 });
      this.router.navigate(['/exercises']);
    };
    const onError = (err: any) => {
      this.snackBar.open(err.error?.detail ?? 'Save failed', 'OK', { duration: 3000 });
      this.saving.set(false);
    };

    if (id) {
      this.service.update(id, {
        title: value.title,
        description: value.description,
        boilerplate: value.boilerplate,
        stuckThresholdMinutes: value.stuckThresholdMinutes,
      }).subscribe({ next: onSuccess, error: onError });
    } else {
      this.service.create(value as any).subscribe({ next: onSuccess, error: onError });
    }
  }

  private newTestCaseGroup() {
    return this.fb.nonNullable.group({
      input:          ['', Validators.required],
      expectedOutput: ['', Validators.required],
      isHidden:       [false],
    });
  }
}
