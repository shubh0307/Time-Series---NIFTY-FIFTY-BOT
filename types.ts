
export interface DataPoint {
  date: string; // YYYY-MM-DD format
  price: number;
}

export interface ForecastResponse {
  forecast: DataPoint[];
  summary: string;
}
