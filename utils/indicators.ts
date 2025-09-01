
import type { DataPoint } from '../types';

// SMA Calculation
export const calculateSMA = (data: DataPoint[], period: number): DataPoint[] => {
  if (!data || data.length < period) return data.map(d => ({ ...d, sma: undefined }));
  
  const dataWithSma = data.map(d => ({ ...d, sma: undefined as number | undefined }));

  for (let i = period - 1; i < data.length; i++) {
    const slice = data.slice(i - period + 1, i + 1);
    const sum = slice.reduce((acc, val) => acc + val.price, 0);
    dataWithSma[i].sma = sum / period;
  }
  return dataWithSma;
};

// EMA Calculation
export const calculateEMA = (data: DataPoint[], period: number): DataPoint[] => {
  if (!data || data.length < period) return data.map(d => ({ ...d, ema: undefined }));

  const dataWithEma = data.map(d => ({ ...d, ema: undefined as number | undefined }));
  const multiplier = 2 / (period + 1);
  let ema: number | undefined = undefined;

  // Calculate initial SMA for the first EMA value
  const initialSlice = data.slice(0, period);
  const initialSum = initialSlice.reduce((acc, val) => acc + val.price, 0);
  ema = initialSum / period;
  dataWithEma[period - 1].ema = ema;

  // Calculate subsequent EMAs
  for (let i = period; i < data.length; i++) {
    ema = (data[i].price - ema) * multiplier + ema;
    dataWithEma[i].ema = ema;
  }
  
  return dataWithEma;
};

// RSI Calculation
export const calculateRSI = (data: DataPoint[], period: number): DataPoint[] => {
  const dataWithRsi = data.map(d => ({ ...d, rsi: undefined as number | undefined }));

  if (data.length <= period) return dataWithRsi;
  
  const changes = data.map((point, i) => i > 0 ? point.price - data[i-1].price : 0).slice(1);

  let sumGain = 0;
  let sumLoss = 0;

  for (let i = 0; i < period; i++) {
    if (changes[i] >= 0) {
      sumGain += changes[i];
    } else {
      sumLoss -= changes[i];
    }
  }

  let avgGain = sumGain / period;
  let avgLoss = sumLoss / period;
  
  let rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
  dataWithRsi[period].rsi = 100 - (100 / (1 + rs));

  for (let i = period; i < changes.length; i++) {
    const currentChange = changes[i];
    const currentGain = currentChange >= 0 ? currentChange : 0;
    const currentLoss = currentChange < 0 ? -currentChange : 0;

    avgGain = (avgGain * (period - 1) + currentGain) / period;
    avgLoss = (avgLoss * (period - 1) + currentLoss) / period;
    
    rs = avgLoss === 0 ? Infinity : avgGain / avgLoss;
    dataWithRsi[i + 1].rsi = 100 - (100 / (1 + rs));
  }
  
  return dataWithRsi;
};
