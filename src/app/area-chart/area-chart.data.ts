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
 * Generate realistic net worth data with growth trend and some volatility.
 */
function generateNetWorthData(): AreaChartDataPoint[] {
  const data: AreaChartDataPoint[] = [];
  let currentValue = 50000 + Math.random() * 30000; // Start between 50k-80k

  const startYear = 2020;
  const endYear = 2025;

  for (let year = startYear; year <= endYear; year++) {
    const monthsInYear = year === endYear ? 11 : 12; // Current year up to November
    for (let month = 1; month <= monthsInYear; month++) {
      // Add some monthly growth (average ~2-4% annually with variance)
      const monthlyGrowth = 1 + (0.002 + Math.random() * 0.008);
      // Occasional market dips
      const marketFactor = Math.random() > 0.15 ? 1 : 0.97 + Math.random() * 0.02;
      // Savings contributions (random between 500-2500)
      const savings = 500 + Math.random() * 2000;

      currentValue = currentValue * monthlyGrowth * marketFactor + savings;

      data.push({
        date: new Date(year, month - 1, 1),
        totalEur: Math.round(currentValue * 100) / 100,
      });
    }
  }

  return data;
}

/**
 * Net worth data - total EUR over time.
 * Simulated monthly financial data with realistic growth patterns.
 */
export const NET_WORTH_DATA: AreaChartDataPoint[] = generateNetWorthData();
