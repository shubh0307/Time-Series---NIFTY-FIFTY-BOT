
export interface DataPoint {
  date: string; // YYYY-MM-DD format
  price: number;
  high?: number; // Upper bound of confidence interval
  low?: number;  // Lower bound of confidence interval
  sma?: number;
  ema?: number;
  rsi?: number;
}

export interface ForecastResponse {
  forecast: DataPoint[];
  summary: string;
  predictedHigh: number;
  predictedLow: number;
  percentageChange: number;
}
