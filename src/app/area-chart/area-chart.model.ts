/**
 * Represents a single data point in the area chart time series.
 * Uses dynamic keys for series values to support any number of series.
 */
export interface AreaChartDataPoint {
  /** Date for the data point */
  date: Date;
  /** Dynamic series values - use any key name */
  [key: string]: number | Date;
}

/**
 * Configuration for an individual data series in the chart.
 */
export interface SeriesConfig {
  /** Display name for the series (shown in tooltip/legend) */
  name: string;
  /** Color for the area fill and line */
  color: string;
  /** Key in the data point object that contains this series' values */
  key: string;
}

/**
 * Configuration options for the area chart component.
 */
export interface AreaChartConfig {
  /** Series configurations - supports any number of series */
  series: SeriesConfig[];
  /** Date format for axis labels (e.g., '%b %d', '%Y') */
  dateFormat: string;
  /** Optional: Date format for tooltip (defaults to dateFormat if not specified) */
  tooltipDateFormat?: string;
  /** Whether to show the legend */
  showLegend: boolean;
  /** Chart margins */
  margin: { top: number; right: number; bottom: number; left: number };
  /** Optional: Y-axis value formatter (e.g., for currency) */
  yAxisFormat?: (value: number) => string;
  /** Auto-calculate Y-axis minimum based on data range (default: false, starts at 0) */
  autoMinY?: boolean;
  /** Whether to show the vertical crosshair on hover (default: true) */
  showCrosshair?: boolean;
  /** Whether to animate the tooltip following the cursor (default: false) */
  tooltipAnimation?: boolean;
}

/**
 * Default configuration for the area chart.
 */
export const DEFAULT_CHART_CONFIG: AreaChartConfig = {
  series: [{ name: 'Value', color: '#8B5CF6', key: 'value' }],
  dateFormat: '%b %d',
  showLegend: true,
  margin: { top: 20, right: 30, bottom: 40, left: 50 },
  showCrosshair: true,
  tooltipAnimation: true,
};

/**
 * Time range options for the range picker.
 */
export type TimeRange = 'ALL' | '2Y' | '1Y' | 'YTD';

/**
 * Configuration for a time range button.
 */
export interface TimeRangeOption {
  value: TimeRange;
  label: string;
}

/**
 * Default time range options.
 */
export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: 'ALL', label: 'All' },
  { value: '2Y', label: '2Y' },
  { value: '1Y', label: '1Y' },
  { value: 'YTD', label: 'YTD' },
];
