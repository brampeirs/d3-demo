import { AreaChartDataPoint } from './area-chart.model';

/**
 * Helper to generate random variation around a base value.
 */
function generateValue(base: number, variance: number): number {
  return Math.round(base + (Math.random() - 0.5) * variance);
}

/**
 * Generate daily data for a date range with dynamic series keys.
 */
function generateDailyData(
  startDate: Date,
  days: number,
  seriesConfig: { key: string; base: number; variance: number }[]
): AreaChartDataPoint[] {
  const data: AreaChartDataPoint[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const point: AreaChartDataPoint = { date };
    seriesConfig.forEach((s) => {
      point[s.key] = generateValue(s.base, s.variance);
    });
    data.push(point);
  }
  return data;
}

/**
 * Sample data for 2-series chart (Mobile vs Desktop visitors).
 * Shows 3 months of daily data.
 */
export const SAMPLE_DUAL_SERIES_DATA: AreaChartDataPoint[] = generateDailyData(
  new Date(2024, 3, 5), // Apr 5
  90, // 3 months
  [
    { key: 'mobile', base: 390, variance: 200 },
    { key: 'desktop', base: 480, variance: 250 },
  ]
);

/**
 * Sample data for single-series chart.
 * Shows visitor data over time.
 */
export const SAMPLE_SINGLE_SERIES_DATA: AreaChartDataPoint[] = generateDailyData(
  new Date(2024, 3, 5),
  90,
  [{ key: 'visitors', base: 450, variance: 200 }]
);

/**
 * Net worth data - total EUR over time.
 * Real monthly financial data sorted chronologically.
 */
export const NET_WORTH_DATA: AreaChartDataPoint[] = [
  // { date: new Date('2019-01-01'), totalEur: 0 },
  { date: new Date('2020-01-01'), totalEur: 147995.14 },
  { date: new Date('2020-02-01'), totalEur: 147995.14 },
  { date: new Date('2020-03-01'), totalEur: 147995.14 },
  { date: new Date('2020-04-01'), totalEur: 147995.14 },
  { date: new Date('2020-05-01'), totalEur: 147995.14 },
  { date: new Date('2020-06-01'), totalEur: 147995.14 },
  { date: new Date('2020-07-01'), totalEur: 159866.44 },
  { date: new Date('2020-08-01'), totalEur: 159866.44 },
  { date: new Date('2020-09-01'), totalEur: 159866.44 },
  { date: new Date('2020-10-01'), totalEur: 159866.44 },
  { date: new Date('2020-11-01'), totalEur: 160213.74 },
  { date: new Date('2020-12-01'), totalEur: 163067.11 },
  { date: new Date('2021-01-01'), totalEur: 168258.77 },
  { date: new Date('2021-02-01'), totalEur: 168258.77 },
  { date: new Date('2021-03-01'), totalEur: 170113.32 },
  { date: new Date('2021-04-01'), totalEur: 170113.32 },
  { date: new Date('2021-05-01'), totalEur: 170113.32 },
  { date: new Date('2021-06-01'), totalEur: 170113.32 },
  { date: new Date('2021-07-01'), totalEur: 179046.58 },
  { date: new Date('2021-08-01'), totalEur: 179046.58 },
  { date: new Date('2021-09-01'), totalEur: 179046.58 },
  { date: new Date('2021-10-01'), totalEur: 179046.58 },
  { date: new Date('2021-11-01'), totalEur: 203382.99 },
  { date: new Date('2021-12-01'), totalEur: 204706.43 },
  { date: new Date('2022-01-01'), totalEur: 207366.6 },
  { date: new Date('2022-02-01'), totalEur: 207366.6 },
  { date: new Date('2022-03-01'), totalEur: 207366.6 },
  { date: new Date('2022-04-01'), totalEur: 210438.85 },
  { date: new Date('2022-05-01'), totalEur: 210438.85 },
  { date: new Date('2022-06-01'), totalEur: 209507.19 },
  { date: new Date('2022-07-01'), totalEur: 258834.08 },
  { date: new Date('2022-08-01'), totalEur: 258834.08 },
  { date: new Date('2022-09-01'), totalEur: 261174.41 },
  { date: new Date('2022-10-01'), totalEur: 261174.41 },
  { date: new Date('2022-11-01'), totalEur: 261174.41 },
  { date: new Date('2022-12-01'), totalEur: 275267.01 },
  { date: new Date('2023-01-01'), totalEur: 279346.82 },
  { date: new Date('2023-02-01'), totalEur: 279346.82 },
  { date: new Date('2023-03-01'), totalEur: 289070.1 },
  { date: new Date('2023-04-01'), totalEur: 292319.66 },
  { date: new Date('2023-05-01'), totalEur: 294264.5 },
  { date: new Date('2023-06-01'), totalEur: 294264.5 },
  { date: new Date('2023-07-01'), totalEur: 298117.05 },
  { date: new Date('2023-08-01'), totalEur: 298117.05 },
  { date: new Date('2023-09-01'), totalEur: 298117.05 },
  { date: new Date('2023-10-01'), totalEur: 299464.15 },
  { date: new Date('2023-11-01'), totalEur: 307642.86 },
  { date: new Date('2023-12-01'), totalEur: 307642.86 },
  { date: new Date('2024-01-01'), totalEur: 317707.25 },
  { date: new Date('2024-02-01'), totalEur: 320223.94 },
  { date: new Date('2024-03-01'), totalEur: 323655.09 },
  { date: new Date('2024-04-01'), totalEur: 323655.09 },
  { date: new Date('2024-05-01'), totalEur: 326702.94 },
  { date: new Date('2024-06-01'), totalEur: 328703.33 },
  { date: new Date('2024-07-01'), totalEur: 328703.33 },
  { date: new Date('2024-08-01'), totalEur: 325555.52 },
  { date: new Date('2024-09-01'), totalEur: 328529.6 },
  { date: new Date('2024-10-01'), totalEur: 328529.6 },
  { date: new Date('2024-11-01'), totalEur: 328529.6 },
  { date: new Date('2024-12-01'), totalEur: 335856.6 },
  { date: new Date('2025-01-01'), totalEur: 335856.6 },
  { date: new Date('2025-02-01'), totalEur: 335856.6 },
  { date: new Date('2025-03-01'), totalEur: 335856.6 },
  { date: new Date('2025-04-01'), totalEur: 335856.6 },
  { date: new Date('2025-05-01'), totalEur: 335856.6 },
  { date: new Date('2025-06-01'), totalEur: 297340.31 },
  { date: new Date('2025-07-01'), totalEur: 297340.31 },
  { date: new Date('2025-08-01'), totalEur: 297340.31 },
  { date: new Date('2025-09-01'), totalEur: 303752.6 },
  { date: new Date('2025-10-01'), totalEur: 303752.6 },
  { date: new Date('2025-11-01'), totalEur: 305184.91 },
];
