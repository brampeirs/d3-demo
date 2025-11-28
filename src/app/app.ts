import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { format as d3Format } from 'd3-format';
import { AreaChartComponent } from './area-chart/area-chart.component';
import { AreaChartConfig } from './area-chart/area-chart.model';
import {
  NET_WORTH_DATA,
  SAMPLE_DUAL_SERIES_DATA,
  SAMPLE_SINGLE_SERIES_DATA,
} from './area-chart/area-chart.data';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AreaChartComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly title = signal('D3 Area Chart Demo');

  // EUR formatter for Y-axis
  private readonly eurFormatter = (d: number) => `€ ${d3Format(',.0f')(d).replace(/,/g, '.')}`;

  // Dual series chart (Mobile vs Desktop)
  protected readonly dualSeriesData = signal(SAMPLE_DUAL_SERIES_DATA);
  protected readonly dualSeriesConfig = signal<AreaChartConfig>({
    series: [
      { name: 'Mobile', color: '#4F46E5', key: 'mobile' },
      { name: 'Desktop', color: '#93C5FD', key: 'desktop' },
    ],
    dateFormat: '%b %d',
    showLegend: true,
    margin: { top: 20, right: 30, bottom: 40, left: 50 },
  });

  // Single series chart
  protected readonly singleSeriesData = signal(SAMPLE_SINGLE_SERIES_DATA);
  protected readonly singleSeriesConfig = signal<AreaChartConfig>({
    series: [{ name: 'Total Visitors', color: '#4F46E5', key: 'visitors' }],
    dateFormat: '%b %d',
    showLegend: true,
    margin: { top: 20, right: 30, bottom: 40, left: 50 },
  });

  // Net Worth chart (shadcn/ui purple/blue style)
  protected readonly netWorthData = signal(NET_WORTH_DATA);
  protected readonly netWorthConfig = signal<AreaChartConfig>({
    series: [{ name: 'Vermogen', color: '#8B5CF6', key: 'totalEur' }],
    dateFormat: '%Y',
    showLegend: false,
    margin: { top: 20, right: 20, bottom: 30, left: 80 },
    yAxisFormat: this.eurFormatter,
    autoMinY: true,
  });
}
