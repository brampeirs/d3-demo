import {
  Component,
  ChangeDetectionStrategy,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
  computed,
  viewChild,
  effect,
} from '@angular/core';
import { bisector, extent, max, min } from 'd3-array';
import { axisBottom, axisLeft } from 'd3-axis';
import { format } from 'd3-format';
import { scaleLinear, scaleTime, type ScaleLinear, type ScaleTime } from 'd3-scale';
import { pointer, select, type Selection } from 'd3-selection';
import { area, curveMonotoneX, line } from 'd3-shape';
import { timeDay, timeHour, timeMonth, timeWeek, timeYear, type TimeInterval } from 'd3-time';
import { timeFormat } from 'd3-time-format';
import { AreaChartDataPoint, AreaChartConfig, DEFAULT_CHART_CONFIG } from './area-chart.model';

/** Minimum data points required to render a meaningful chart */
const MIN_DATA_POINTS = 2;

/** Debounce delay for resize events in milliseconds */
const RESIZE_DEBOUNCE_MS = 100;

/** Chart styling constants - can be moved to config if needed */
const CHART_STYLES = {
  gridLineColor: '#F3F4F6',
  axisTextColor: '#9CA3AF',
  hoverLineColor: '#9CA3AF',
  fontSize: '12px',
  fontWeight: '400',
} as const;

@Component({
  selector: 'app-area-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './area-chart.component.html',
  styleUrl: './area-chart.component.css',
})
export class AreaChartComponent {
  private readonly destroyRef = inject(DestroyRef);

  /** Input data for the chart - requires at least a 'date' field and any number of numeric series */
  readonly data = input.required<AreaChartDataPoint[]>();

  /** Chart configuration */
  readonly config = input<AreaChartConfig>(DEFAULT_CHART_CONFIG);

  /** Reference to the chart container element */
  readonly chartContainer = viewChild.required<ElementRef<HTMLDivElement>>('chartContainer');

  /** Current hovered data point for tooltip */
  readonly hoveredData = signal<AreaChartDataPoint | null>(null);

  /** Tooltip position */
  readonly tooltipPosition = signal<{ x: number; y: number }>({ x: 0, y: 0 });

  /** Whether tooltip should appear on the left side of the cursor */
  readonly tooltipOnLeft = signal<boolean>(false);

  /** Whether tooltip is visible */
  readonly tooltipVisible = computed(() => this.hoveredData() !== null);

  /** Whether there's enough data to render the chart */
  readonly hasValidData = computed(() => {
    const data = this.data();
    return data && data.length >= MIN_DATA_POINTS;
  });

  /** Formatted tooltip date */
  readonly tooltipDate = computed(() => {
    const dataPoint = this.hoveredData();
    if (!dataPoint) return '';
    return timeFormat(this.config().dateFormat)(dataPoint.date);
  });

  /** Gets the value for a specific series key from the hovered data point */
  protected getSeriesValue(key: string): string {
    const dataPoint = this.hoveredData();
    if (!dataPoint) return '';
    const val = dataPoint[key];
    if (typeof val === 'number') {
      const formatter = this.config().yAxisFormat;
      return formatter ? formatter(val) : format(',.0f')(val);
    }
    return '';
  }

  private svg: Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private resizeDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private width = 0;
  private height = 0;

  constructor() {
    afterNextRender(() => {
      this.initializeChart();
      this.setupResizeObserver();
    });

    // Track data changes and update chart
    effect(() => {
      // Read the data signal to establish dependency
      this.data();
      if (this.svg) {
        this.updateChart();
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.cleanup();
    });
  }

  /**
   * Cleans up resources when component is destroyed.
   */
  private cleanup(): void {
    if (this.resizeDebounceTimer) {
      clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.svg) {
      this.svg.selectAll('*').remove();
      this.svg = null;
    }
  }

  private initializeChart(): void {
    const container = this.chartContainer().nativeElement;
    const rect = container.getBoundingClientRect();
    const margin = this.config().margin;

    this.width = Math.max(0, rect.width - margin.left - margin.right);
    this.height = Math.max(0, rect.height - margin.top - margin.bottom);

    this.svg = select(container)
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${rect.width} ${rect.height}`)
      .attr('role', 'img')
      .attr('aria-label', 'Area chart visualization');

    this.updateChart();
  }

  private setupResizeObserver(): void {
    this.resizeObserver = new ResizeObserver(() => {
      // Debounce resize events to avoid excessive redraws
      if (this.resizeDebounceTimer) {
        clearTimeout(this.resizeDebounceTimer);
      }

      this.resizeDebounceTimer = setTimeout(() => {
        this.handleResize();
      }, RESIZE_DEBOUNCE_MS);
    });

    this.resizeObserver.observe(this.chartContainer().nativeElement);
  }

  private handleResize(): void {
    if (!this.svg) return;

    const container = this.chartContainer().nativeElement;
    const rect = container.getBoundingClientRect();
    const margin = this.config().margin;

    this.width = Math.max(0, rect.width - margin.left - margin.right);
    this.height = Math.max(0, rect.height - margin.top - margin.bottom);

    this.svg.attr('viewBox', `0 0 ${rect.width} ${rect.height}`);
    this.updateChart();
  }

  private updateChart(): void {
    if (!this.svg) return;

    const data = this.data();
    const config = this.config();

    // Clear previous content
    this.svg.selectAll('*').remove();

    // Guard: Check for valid data
    if (!data || data.length < MIN_DATA_POINTS) {
      this.renderEmptyState();
      return;
    }

    // Guard: Check for valid dimensions
    if (this.width <= 0 || this.height <= 0) {
      return;
    }

    try {
      this.renderChart(data, config);
    } catch (error) {
      console.error('AreaChartComponent: Error rendering chart', error);
      this.renderErrorState();
    }
  }

  /**
   * Renders the empty state when there's insufficient data.
   */
  private renderEmptyState(): void {
    if (!this.svg) return;

    const container = this.chartContainer().nativeElement;
    const rect = container.getBoundingClientRect();

    this.svg
      .append('text')
      .attr('x', rect.width / 2)
      .attr('y', rect.height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', CHART_STYLES.axisTextColor)
      .attr('font-size', '14px')
      .text('No data available');
  }

  /**
   * Renders the error state when chart rendering fails.
   */
  private renderErrorState(): void {
    if (!this.svg) return;

    const container = this.chartContainer().nativeElement;
    const rect = container.getBoundingClientRect();

    this.svg
      .append('text')
      .attr('x', rect.width / 2)
      .attr('y', rect.height / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#EF4444')
      .attr('font-size', '14px')
      .text('Error rendering chart');
  }

  /**
   * Renders the chart with the provided data and configuration.
   */
  private renderChart(data: AreaChartDataPoint[], config: AreaChartConfig): void {
    if (!this.svg) return;

    const margin = config.margin;
    const seriesKeys = config.series.map((s) => s.key);

    // Helper to get numeric value from data point
    const getValue = (d: AreaChartDataPoint, key: string): number => {
      const val = d[key];
      return typeof val === 'number' ? val : 0;
    };

    // Create defs for gradients (shadcn/ui style - subtle gradient)
    const defs = this.svg.append('defs');

    // Create gradients for each series
    config.series.forEach((series, index) => {
      const gradient = defs
        .append('linearGradient')
        .attr('id', `areaGradient${index}`)
        .attr('x1', '0%')
        .attr('y1', '0%')
        .attr('x2', '0%')
        .attr('y2', '100%');

      gradient
        .append('stop')
        .attr('offset', '0%')
        .attr('stop-color', series.color)
        .attr('stop-opacity', 0.3);

      gradient
        .append('stop')
        .attr('offset', '100%')
        .attr('stop-color', series.color)
        .attr('stop-opacity', 0.02);
    });

    const g = this.svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Create scales
    const dateExtent = extent(data, (d) => d.date);
    if (!dateExtent[0] || !dateExtent[1]) {
      throw new Error('Invalid date extent');
    }

    const xScale = scaleTime()
      .domain(dateExtent as [Date, Date])
      .range([0, this.width]);

    // Calculate yMin and yMax across ALL series
    const yMax = max(data, (d) => Math.max(...seriesKeys.map((key) => getValue(d, key)))) ?? 0;
    const yMin = min(data, (d) => Math.min(...seriesKeys.map((key) => getValue(d, key)))) ?? 0;

    // Auto-calculate Y-axis minimum if enabled
    let yAxisMin = 0;
    if (config.autoMinY && yMin > 0) {
      const range = yMax - yMin;
      // Start at ~10% below the minimum value, rounded to a nice number
      yAxisMin = Math.max(0, yMin - range * 0.1);
      // Round down to a nice number based on the magnitude
      if (yAxisMin > 0) {
        const magnitude = Math.pow(10, Math.floor(Math.log10(yAxisMin)));
        yAxisMin = Math.floor(yAxisMin / magnitude) * magnitude;
      }
    }

    const yScale = scaleLinear()
      .domain([yAxisMin, yMax * 1.05])
      .range([this.height, 0]);

    // Add horizontal grid lines FIRST (behind everything else)
    const yTicks = yScale.ticks(6);
    g.selectAll('.grid-line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', this.width)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', CHART_STYLES.gridLineColor)
      .attr('stroke-width', 1);

    // Draw areas and lines for ALL series dynamically
    config.series.forEach((series, index) => {
      const areaGenerator = area<AreaChartDataPoint>()
        .x((d) => xScale(d.date))
        .y0(this.height)
        .y1((d) => yScale(getValue(d, series.key)))
        .curve(curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('class', `area area-${index}`)
        .attr('fill', `url(#areaGradient${index})`)
        .attr('d', areaGenerator);

      const lineGenerator = line<AreaChartDataPoint>()
        .x((d) => xScale(d.date))
        .y((d) => yScale(getValue(d, series.key)))
        .curve(curveMonotoneX);

      g.append('path')
        .datum(data)
        .attr('class', `line line-${index}`)
        .attr('fill', 'none')
        .attr('stroke', series.color)
        .attr('stroke-width', 1.5)
        .attr('d', lineGenerator);
    });

    // Add axes with smart tick density based on available width
    const xAxis = this.createResponsiveXAxis(xScale, data);
    const yAxisFormatter = config.yAxisFormat ?? ((d: number) => format(',.0f')(d));
    const yAxis = axisLeft(yScale)
      .ticks(6)
      .tickFormat((d) => yAxisFormatter(d as number));

    // X-axis (shadcn/ui style - minimal, light gray)
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${this.height})`)
      .call(xAxis)
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('.tick line').remove())
      .selectAll('text')
      .attr('fill', CHART_STYLES.axisTextColor)
      .attr('font-size', CHART_STYLES.fontSize)
      .attr('font-weight', CHART_STYLES.fontWeight);

    // Y-axis (shadcn/ui style - minimal, light gray)
    g.append('g')
      .attr('class', 'y-axis')
      .call(yAxis)
      .call((sel) => sel.select('.domain').remove())
      .call((sel) => sel.selectAll('.tick line').remove())
      .selectAll('text')
      .attr('fill', CHART_STYLES.axisTextColor)
      .attr('font-size', CHART_STYLES.fontSize)
      .attr('font-weight', CHART_STYLES.fontWeight);

    // Setup interactive elements
    this.setupInteractivity(g, xScale, yScale, data, config, seriesKeys, getValue, margin);
  }

  /**
   * Sets up hover line, circles, and mouse event handlers.
   */
  private setupInteractivity(
    g: Selection<SVGGElement, unknown, null, undefined>,
    xScale: ScaleTime<number, number>,
    yScale: ScaleLinear<number, number>,
    data: AreaChartDataPoint[],
    config: AreaChartConfig,
    seriesKeys: string[],
    getValue: (d: AreaChartDataPoint, key: string) => number,
    margin: AreaChartConfig['margin']
  ): void {
    // Add vertical hover line (initially hidden)
    const hoverLine = g
      .append('line')
      .attr('class', 'hover-line')
      .attr('stroke', CHART_STYLES.hoverLineColor)
      .attr('stroke-dasharray', '4,4')
      .attr('y1', 0)
      .attr('y2', this.height)
      .style('opacity', 0);

    // Add hover circles for each series
    const hoverCircles: Selection<SVGCircleElement, unknown, null, undefined>[] = [];
    config.series.forEach((series, index) => {
      const circle = g
        .append('circle')
        .attr('class', `hover-circle-${index}`)
        .attr('r', 6)
        .attr('fill', series.color)
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('opacity', 0);
      hoverCircles.push(circle);
    });

    // Add invisible overlay for mouse events
    g.append('rect')
      .attr('class', 'overlay')
      .attr('fill', 'transparent')
      .attr('width', this.width)
      .attr('height', this.height)
      .on('mousemove', (event: MouseEvent) => {
        this.handleMouseMove(
          event,
          xScale,
          yScale,
          data,
          config,
          seriesKeys,
          getValue,
          margin,
          hoverLine,
          hoverCircles
        );
      })
      .on('mouseleave', () => {
        hoverLine.style('opacity', 0);
        hoverCircles.forEach((circle) => circle.style('opacity', 0));
        this.hoveredData.set(null);
      });
  }

  /**
   * Handles mouse move events for tooltip and hover effects.
   */
  private handleMouseMove(
    event: MouseEvent,
    xScale: ScaleTime<number, number>,
    yScale: ScaleLinear<number, number>,
    data: AreaChartDataPoint[],
    config: AreaChartConfig,
    seriesKeys: string[],
    getValue: (d: AreaChartDataPoint, key: string) => number,
    margin: AreaChartConfig['margin'],
    hoverLine: Selection<SVGLineElement, unknown, null, undefined>,
    hoverCircles: Selection<SVGCircleElement, unknown, null, undefined>[]
  ): void {
    const [mouseX] = pointer(event);
    const dateBisector = bisector<AreaChartDataPoint, Date>((d) => d.date).left;
    const x0 = xScale.invert(mouseX);
    const i = dateBisector(data, x0, 1);
    const d0 = data[i - 1];
    const d1 = data[i];

    if (!d0 && !d1) return;

    // Handle edge cases where we're at the boundaries
    const d = !d0
      ? d1
      : !d1
      ? d0
      : x0.getTime() - d0.date.getTime() > d1.date.getTime() - x0.getTime()
      ? d1
      : d0;

    const xPos = xScale(d.date);
    const containerRect = this.chartContainer().nativeElement.getBoundingClientRect();

    hoverLine.attr('x1', xPos).attr('x2', xPos).style('opacity', 1);

    // Position hover circles for ALL series
    config.series.forEach((series, index) => {
      const yVal = getValue(d, series.key);
      hoverCircles[index].attr('cx', xPos).attr('cy', yScale(yVal)).style('opacity', 1);
    });

    this.hoveredData.set(d);

    // Find the minimum Y position (highest point on screen) for tooltip
    const minY = Math.min(...seriesKeys.map((key) => yScale(getValue(d, key))));

    // Determine if tooltip should flip to the left (when cursor is past midpoint)
    const chartMidpoint = this.width / 2;
    this.tooltipOnLeft.set(xPos > chartMidpoint);

    this.tooltipPosition.set({
      x: xPos + margin.left + containerRect.left,
      y: minY + margin.top + containerRect.top,
    });
  }

  /**
   * Creates a responsive x-axis that automatically adjusts tick density
   * based on available width and time range (similar to ApexCharts behavior).
   */
  private createResponsiveXAxis(xScale: ScaleTime<number, number>, data: AreaChartDataPoint[]) {
    const [minDate, maxDate] = extent(data, (d) => d.date) as [Date, Date];
    const timeRangeMs = maxDate.getTime() - minDate.getTime();

    // Calculate optimal tick count based on available width
    // Assume ~80px minimum spacing per tick label to prevent overlap
    const minTickSpacing = 80;
    const maxTicks = Math.max(2, Math.floor(this.width / minTickSpacing));

    // Determine appropriate time interval based on range and available ticks
    const { interval, format: dateFormat } = this.getOptimalTimeInterval(timeRangeMs, maxTicks);

    return axisBottom(xScale)
      .ticks(interval)
      .tickFormat((d) => timeFormat(dateFormat)(d as Date));
  }

  /**
   * Determines the optimal D3 time interval and date format based on
   * the time range and maximum number of ticks that can fit.
   */
  private getOptimalTimeInterval(
    timeRangeMs: number,
    maxTicks: number
  ): { interval: TimeInterval; format: string } {
    const days = timeRangeMs / (1000 * 60 * 60 * 24);
    const months = days / 30;
    const years = days / 365;

    // Helper to safely create time intervals with fallback
    const safeInterval = (
      intervalFn: () => TimeInterval | null,
      fallback: TimeInterval
    ): TimeInterval => {
      const result = intervalFn();
      return result ?? fallback;
    };

    // Define time intervals from smallest to largest with increasing granularity
    // Each entry specifies the max days threshold and expected number of ticks it would generate
    const intervals: Array<{
      threshold: number; // max days for this interval to be considered
      interval: TimeInterval;
      format: string;
      ticksPerUnit: number; // approximate ticks this would generate
    }> = [
      {
        threshold: 2,
        interval: safeInterval(() => timeHour.every(4), timeHour),
        format: '%H:%M',
        ticksPerUnit: 6,
      },
      {
        threshold: 7,
        interval: safeInterval(() => timeDay.every(1), timeDay),
        format: '%b %d',
        ticksPerUnit: days,
      },
      {
        threshold: 14,
        interval: safeInterval(() => timeDay.every(2), timeDay),
        format: '%b %d',
        ticksPerUnit: days / 2,
      },
      {
        threshold: 30,
        interval: safeInterval(() => timeWeek.every(1), timeWeek),
        format: '%b %d',
        ticksPerUnit: days / 7,
      },
      {
        threshold: 90,
        interval: safeInterval(() => timeWeek.every(2), timeWeek),
        format: '%b %d',
        ticksPerUnit: days / 14,
      },
      {
        threshold: 180,
        interval: safeInterval(() => timeMonth.every(1), timeMonth),
        format: '%b',
        ticksPerUnit: months,
      },
      {
        threshold: 365,
        interval: safeInterval(() => timeMonth.every(2), timeMonth),
        format: '%b',
        ticksPerUnit: months / 2,
      },
      {
        threshold: 730,
        interval: safeInterval(() => timeMonth.every(3), timeMonth),
        format: '%b %Y',
        ticksPerUnit: months / 3,
      },
      // Yearly intervals with different step sizes for multi-year ranges
      {
        threshold: Infinity,
        interval: safeInterval(() => timeYear.every(1), timeYear),
        format: '%Y',
        ticksPerUnit: years,
      },
      {
        threshold: Infinity,
        interval: safeInterval(() => timeYear.every(2), timeYear),
        format: '%Y',
        ticksPerUnit: years / 2,
      },
      {
        threshold: Infinity,
        interval: safeInterval(() => timeYear.every(5), timeYear),
        format: '%Y',
        ticksPerUnit: years / 5,
      },
      {
        threshold: Infinity,
        interval: safeInterval(() => timeYear.every(10), timeYear),
        format: '%Y',
        ticksPerUnit: years / 10,
      },
    ];

    // Find the first interval that fits within maxTicks
    for (const config of intervals) {
      if (days <= config.threshold && config.ticksPerUnit <= maxTicks) {
        return { interval: config.interval, format: config.format };
      }
    }

    // Fallback: use the last (most sparse) interval
    const fallback = intervals[intervals.length - 1];
    return { interval: fallback.interval, format: fallback.format };
  }
}
