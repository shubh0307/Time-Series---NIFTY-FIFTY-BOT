
import type { DataPoint } from '../types';

export const generateMockData = (days: number): DataPoint[] => {
  const data: DataPoint[] = [];
  let currentPrice = 19500 + Math.random() * 1000; // Start with a realistic base price
  const today = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    
    // Simulate some market volatility
    const change = (Math.random() - 0.48) * (currentPrice * 0.02); // -2% to +2.2% daily change
    currentPrice += change;
    
    // Ensure price doesn't go negative (highly unlikely for an index but good practice)
    if (currentPrice < 0) {
      currentPrice = Math.abs(currentPrice);
    }
    
    data.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(currentPrice.toFixed(2)),
    });
  }

  return data;
};
