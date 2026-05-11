import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDividerModule } from '@angular/material/divider';
import { AuthService } from '../../core/services/auth.service';
import {
  AnalyticsService, ExerciseOverviewDto, ExerciseAnalyticsDto,
  GroupAnalyticsDto, WeeklyAnalyticsDto, StudentRowDto,
} from '../../core/services/analytics.service';
import { ChartComponent, ChartData } from '../../shared/chart/chart.component';
import { environment } from '../../../environments/environment';

const PALETTE = {
  blue:   'rgba(25,118,210,0.8)',
  green:  'rgba(46,125,50,0.8)',
  red:    'rgba(198,40,40,0.8)',
  orange: 'rgba(245,124,0,0.8)',
  purple: 'rgba(123,31,162,0.8)',
  teal:   'rgba(0,121,107,0.8)',
};

@Component({
  selector: 'app-analytics-dashboard',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatCardModule, MatButtonModule, MatIconModule,
    MatSelectModule, MatProgressSpinnerModule, MatTableModule,
    MatTooltipModule, MatDividerModule,
    ChartComponent,
  ],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
})
export class AnalyticsDashboardComponent implements OnInit {
  auth         = inject(AuthService);
  private svc  = inject(AnalyticsService);
  private http  = inject(HttpClient);

  loading        = signal(true);
  overview       = signal<ExerciseOverviewDto[]>([]);
  weekly         = signal<WeeklyAnalyticsDto | null>(null);
  detail         = signal<ExerciseAnalyticsDto | null>(null);
  group          = signal<GroupAnalyticsDto | null>(null);
  selectedId     = signal<number | null>(null);
  detailLoading  = signal(false);

  // Chart data
  barChart    = signal<ChartData>({ labels: [], datasets: [] });
  lineChart   = signal<ChartData>({ labels: [], datasets: [] });
  donutChart  = signal<ChartData>({ labels: [], datasets: [] });

  ngOnInit(): void {
    this.svc.getOverview().subscribe({
      next: data => {
        this.overview.set(data);
        this.buildBarChart(data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });

    this.svc.getWeekly().subscribe({
      next: w => {
        this.weekly.set(w);
        this.buildLineChart(w);
      },
    });
  }

  selectExercise(id: number): void {
    if (this.selectedId() === id) return;
    this.selectedId.set(id);
    this.detailLoading.set(true);

    this.svc.getExercise(id).subscribe({
      next: d => {
        this.detail.set(d);
        this.buildDonutChart(d);
      },
    });

    this.svc.getGroup(id).subscribe({
      next: g => {
        this.group.set(g);
        this.detailLoading.set(false);
      },
      error: () => this.detailLoading.set(false),
    });
  }

  exportCsv(): void {
    const id = this.selectedId();
    if (!id) return;
    const token = this.auth.getToken();
    this.http.get(`${environment.apiUrl}/analytics/group/${id}/csv`,
      { headers: { Authorization: `Bearer ${token}` }, responseType: 'blob' })
      .subscribe(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `group_${id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }

  get avgSuccessRate(): string {
    const data = this.overview();
    if (!data.length) return '—';
    const avg = data.reduce((s, e) => s + e.successRate, 0) / data.length;
    return `${avg.toFixed(1)}%`;
  }

  get totalSessions(): number {
    return this.overview().reduce((s, e) => s + e.totalSessions, 0);
  }

  get tableStudents(): StudentRowDto[] {
    return this.group()?.students ?? [];
  }

  displayedColumns = ['alias', 'attempts', 'hints', 'status', 'joined'];

  readonly barOptions: Record<string, unknown> = {
    scales: { y: { min: 0, max: 100 } },
  };

  private buildBarChart(data: ExerciseOverviewDto[]): void {
    this.barChart.set({
      labels: data.map(e => e.title.length > 20 ? e.title.slice(0, 20) + '…' : e.title),
      datasets: [{
        label: 'Success Rate (%)',
        data: data.map(e => e.successRate),
        backgroundColor: data.map(e =>
          e.successRate >= 70 ? PALETTE.green :
          e.successRate >= 40 ? PALETTE.orange :
          PALETTE.red),
      }],
    });
  }

  private buildLineChart(w: WeeklyAnalyticsDto): void {
    this.lineChart.set({
      labels: w.points.map(p => p.week),
      datasets: [
        {
          label: 'Total Submissions',
          data: w.points.map(p => p.totalSubmissions),
          borderColor: PALETTE.blue,
          backgroundColor: 'rgba(25,118,210,0.1)',
          fill: true,
          tension: 0.3,
        },
        {
          label: 'Passed',
          data: w.points.map(p => p.passedSubmissions),
          borderColor: PALETTE.green,
          backgroundColor: 'rgba(46,125,50,0.1)',
          fill: true,
          tension: 0.3,
        },
      ],
    });
  }

  private buildDonutChart(d: ExerciseAnalyticsDto): void {
    this.donutChart.set({
      labels: ['Wrong Answer', 'Compilation Error', 'Runtime Error', 'Time Limit'],
      datasets: [{
        label: 'Errors',
        data: [d.wrongAnswerErrors, d.compilationErrors, d.runtimeErrors, d.tleErrors],
        backgroundColor: [PALETTE.orange, PALETTE.red, PALETTE.purple, PALETTE.teal],
      }],
    });
  }
}
