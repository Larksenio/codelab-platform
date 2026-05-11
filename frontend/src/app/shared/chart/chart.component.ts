import {
  Component, Input, OnChanges, OnDestroy, AfterViewInit,
  ViewChild, ElementRef, SimpleChanges,
} from '@angular/core';

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
  tension?: number;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

@Component({
  selector: 'app-chart',
  standalone: true,
  template: `<canvas #canvas style="width:100%;height:100%"></canvas>`,
})
export class ChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;

  @Input() type: 'bar' | 'line' | 'doughnut' = 'bar';
  @Input() data: ChartData = { labels: [], datasets: [] };
  @Input() options: Record<string, unknown> = {};

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private chart: any = null;
  private ready = false;

  async ngAfterViewInit(): Promise<void> {
    const { Chart, registerables } = await import('chart.js');
    Chart.register(...registerables);
    this.chart = new Chart(this.canvasRef.nativeElement, {
      type: this.type,
      data: this.data,
      options: { responsive: true, maintainAspectRatio: false, ...this.options },
    });
    this.ready = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready || !this.chart) return;
    if (changes['data']) {
      this.chart.data = this.data;
      this.chart.update();
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
  }
}
