
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { generateMockData } from './utils/mockData';
import type { DataPoint, ForecastResponse } from './types';
import { generateNiftyForecast } from './services/geminiService';
import { calculateSMA, calculateEMA, calculateRSI } from './utils/indicators';
import NiftyChart from './components/NiftyChart';
import { ChartIcon, LoadingSpinner, BrainCircuitIcon, AlertTriangleIcon, CalendarIcon, RefreshIcon, ArrowUpIcon, ArrowDownIcon, SlidersHorizontalIcon } from './components/Icons';

type IndicatorSettings = {
  enabled: boolean;
  period: number;
};

const App: React.FC = () => {
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);
  const [forecastData, setForecastData] = useState<DataPoint[] | null>(null);
  const [forecastSummary, setForecastSummary] = useState<string | null>(null);
  const [forecastMetrics, setForecastMetrics] = useState<{ high: number; low: number; change: number } | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: '', end: '' });
  const [forecastDays, setForecastDays] = useState<number>(7);
  const [indicators, setIndicators] = useState({
    sma: { enabled: false, period: 20 },
    ema: { enabled: false, period: 20 },
    rsi: { enabled: false, period: 14 },
  });

  useEffect(() => {
    const mockData = generateMockData(60); // Generate more data for indicators
    setHistoricalData(mockData);
    if (mockData.length > 0) {
      setDateRange({
        start: mockData[0].date,
        end: mockData[mockData.length - 1].date,
      });
    }
  }, []);
  
  const handleIndicatorChange = (name: keyof typeof indicators, field: keyof IndicatorSettings, value: boolean | number) => {
    setIndicators(prev => ({
        ...prev,
        [name]: {
            ...prev[name],
            [field]: value
        }
    }));
  };

  const handleForecast = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setForecastData(null);
    setForecastSummary(null);
    setForecastMetrics(null);

    const validForecastDays = Math.max(3, Math.min(15, forecastDays));
    if (validForecastDays !== forecastDays) {
      setForecastDays(validForecastDays);
    }

    try {
      const result: ForecastResponse = await generateNiftyForecast(historicalData, validForecastDays);
      const lastHistoricalDate = new Date(historicalData[historicalData.length - 1].date);
      const validatedForecast = result.forecast.map((point, index) => {
        const newDate = new Date(lastHistoricalDate);
        newDate.setDate(newDate.getDate() + index + 1);
        return { ...point, date: newDate.toISOString().split('T')[0] };
      });
      setForecastData(validatedForecast);
      setForecastSummary(result.summary);
      setForecastMetrics({
        high: result.predictedHigh,
        low: result.predictedLow,
        change: result.percentageChange,
      });
      if (validatedForecast.length > 0) {
        setDateRange(prev => ({
          ...prev,
          end: validatedForecast[validatedForecast.length - 1].date,
        }));
      }
    } catch (err) {
      console.error("Forecast generation failed:", err);
      setError("Failed to generate forecast. The model might be temporarily unavailable. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [historicalData, forecastDays]);

  const combinedData = useMemo(() => historicalData.concat(forecastData || []), [historicalData, forecastData]);
  
  const dataWithIndicators = useMemo(() => {
    if (combinedData.length === 0) return [];
    let processedData = [...combinedData];
    if (indicators.sma.enabled) {
        processedData = calculateSMA(processedData, indicators.sma.period);
    }
    if (indicators.ema.enabled) {
        processedData = calculateEMA(processedData, indicators.ema.period);
    }
    if (indicators.rsi.enabled) {
        processedData = calculateRSI(processedData, indicators.rsi.period);
    }
    return processedData;
  }, [combinedData, indicators]);


  const fullDateRange = useMemo(() => {
    if (dataWithIndicators.length === 0) {
      return { min: '', max: '' };
    }
    return {
      min: dataWithIndicators[0].date,
      max: dataWithIndicators[dataWithIndicators.length - 1].date,
    };
  }, [dataWithIndicators]);
  
  const chartData = useMemo(() => {
    if (!dateRange.start || !dateRange.end || dataWithIndicators.length === 0) {
      return dataWithIndicators;
    }
    const start = new Date(dateRange.start);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateRange.end);
    end.setHours(23, 59, 59, 999);
    
    return dataWithIndicators.filter(point => {
      const pointDate = new Date(point.date);
      return pointDate >= start && pointDate <= end;
    });
  }, [dataWithIndicators, dateRange]);

  const forecastStartIndexForChart = useMemo(() => {
    if (!forecastData || forecastData.length === 0) {
      return chartData.length;
    }
    const firstForecastDate = forecastData[0].date;
    const index = chartData.findIndex(d => d.date === firstForecastDate);
    return index === -1 ? chartData.length : index;
  }, [chartData, forecastData]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDateRange(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleReset = () => {
    if (dataWithIndicators.length > 0) {
      setDateRange({
        start: dataWithIndicators[0].date,
        end: dataWithIndicators[dataWithIndicators.length - 1].date,
      });
    } else {
      setDateRange({ start: '', end: '' });
    }
  };

  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col font-sans">
      <header className="p-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-center flex items-center justify-center gap-3">
          <ChartIcon className="h-8 w-8 text-cyan-400" />
          <span>NIFTY FIFTY Forecasting Bot</span>
        </h1>
      </header>
      <main className="flex-grow flex flex-col lg:flex-row p-4 gap-4">
        <aside className="w-full lg:w-1/3 xl:w-1/4 bg-gray-800/50 p-6 rounded-xl shadow-lg border border-gray-700 flex flex-col">
          <h2 className="text-xl font-semibold mb-4 text-cyan-300">Analysis & Controls</h2>
          <p className="text-gray-400 mb-6 text-sm">
            Using historical data, the Gemini model will forecast the next <strong>{forecastDays}</strong> days of the NIFTY FIFTY index.
          </p>
          <div className="mb-4">
            <label htmlFor="forecast-days" className="block text-sm font-medium text-gray-400 mb-2">
              Forecast Period (Days)
            </label>
            <input
              type="number"
              id="forecast-days"
              name="forecast-days"
              min="3"
              max="15"
              value={forecastDays}
              onChange={(e) => setForecastDays(e.target.valueAsNumber || 7)}
              onBlur={() => setForecastDays(prev => Math.max(3, Math.min(15, isNaN(prev) ? 7 : prev)))}
              className="w-full bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block p-2.5"
              aria-label="Number of days to forecast"
            />
          </div>
          <button
            onClick={handleForecast}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg transition-all duration-300 disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <LoadingSpinner className="h-5 w-5" />
                <span>Generating Forecast...</span>
              </>
            ) : (
              <>
                <BrainCircuitIcon className="h-6 w-6" />
                <span>Generate Forecast</span>
              </>
            )}
          </button>
          
          {/* Technical Indicators */}
          <fieldset className="mt-6 border-t border-gray-700 pt-4">
            <legend className="text-lg font-semibold text-cyan-300 mb-4 flex items-center gap-2">
                <SlidersHorizontalIcon className="h-5 w-5" />
                Technical Indicators
            </legend>
            <div className="space-y-4">
              {Object.entries(indicators).map(([key, { enabled, period }]) => (
                <div key={key} className="bg-gray-700/50 p-3 rounded-lg">
                  <div className="flex items-center justify-between">
                    <label htmlFor={`${key}-toggle`} className="flex items-center gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        id={`${key}-toggle`}
                        checked={enabled}
                        onChange={(e) => handleIndicatorChange(key as keyof typeof indicators, 'enabled', e.target.checked)}
                        className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-500"
                      />
                      <span className="font-medium uppercase text-white">{key}</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <label htmlFor={`${key}-period`} className="text-xs text-gray-400">Period:</label>
                      <input
                        type="number"
                        id={`${key}-period`}
                        value={period}
                        min="2"
                        max="100"
                        onChange={(e) => handleIndicatorChange(key as keyof typeof indicators, 'period', e.target.valueAsNumber || 20)}
                        onBlur={(e) => {
                            const val = e.target.valueAsNumber;
                            if (isNaN(val) || val < 2 || val > 100) {
                                handleIndicatorChange(key as keyof typeof indicators, 'period', key === 'rsi' ? 14 : 20);
                            }
                        }}
                        disabled={!enabled}
                        className="w-16 bg-gray-800 border border-gray-600 text-white text-sm rounded-md focus:ring-cyan-500 focus:border-cyan-500 p-1 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </fieldset>


          <div className="mt-6 flex-grow">
            {error && (
              <div className="bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangleIcon className="h-6 w-6 text-red-400 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-bold">Error</h3>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
            {(forecastSummary || forecastMetrics) && !error && (
              <div className="bg-gray-700/50 p-4 rounded-lg border border-gray-600 space-y-4">
                {forecastSummary && (
                    <div>
                        <h3 className="font-semibold text-lg mb-2 text-cyan-300">Forecast Summary</h3>
                        <p className="text-gray-300 text-sm leading-relaxed">{forecastSummary}</p>
                    </div>
                )}
                {forecastMetrics && (
                    <div>
                        <h3 className="font-semibold text-lg mb-3 text-cyan-300">Key Metrics</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center bg-gray-800/50 p-2 rounded-md">
                                <span className="text-sm text-gray-400">Predicted High</span>
                                <span className="font-bold text-green-400 flex items-center gap-1"><ArrowUpIcon className="h-4 w-4" />₹{forecastMetrics.high.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-800/50 p-2 rounded-md">
                                <span className="text-sm text-gray-400">Predicted Low</span>
                                <span className="font-bold text-red-400 flex items-center gap-1"><ArrowDownIcon className="h-4 w-4" />₹{forecastMetrics.low.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center bg-gray-800/50 p-2 rounded-md">
                                <span className="text-sm text-gray-400">Est. Change</span>
                                <span className={`font-bold flex items-center gap-1 ${forecastMetrics.change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                    {forecastMetrics.change >= 0 ? <ArrowUpIcon className="h-4 w-4" /> : <ArrowDownIcon className="h-4 w-4" />}
                                    {forecastMetrics.change.toFixed(2)}%
                                </span>
                            </div>
                        </div>
                    </div>
                )}
              </div>
            )}
          </div>
        </aside>
        <section className="w-full lg:w-2/3 xl:w-3/4 bg-gray-800/50 p-4 rounded-xl shadow-lg border border-gray-700 flex flex-col">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-4 px-2">
            <h2 className="text-xl font-semibold text-cyan-300">Price Chart</h2>
            <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-center">
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  name="start"
                  value={dateRange.start}
                  min={fullDateRange.min}
                  max={fullDateRange.max}
                  onChange={handleDateChange}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-10 p-2.5 appearance-none"
                  aria-label="Start Date"
                />
              </div>
              <span className="text-gray-400 hidden sm:inline">to</span>
              <div className="relative">
                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  name="end"
                  value={dateRange.end}
                  min={fullDateRange.min}
                  max={fullDateRange.max}
                  onChange={handleDateChange}
                  className="bg-gray-700 border border-gray-600 text-white text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full pl-10 p-2.5 appearance-none"
                  aria-label="End Date"
                />
              </div>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-4 py-2.5 bg-gray-600 hover:bg-gray-500 text-white font-semibold rounded-lg shadow-md transition-colors duration-300"
                aria-label="Reset Date Range"
              >
                <RefreshIcon className="h-5 w-5" />
                <span className="hidden sm:inline">Reset</span>
              </button>
            </div>
          </div>
          <div className="flex-grow w-full h-96">
            <NiftyChart 
                data={chartData} 
                forecastStartIndex={forecastStartIndexForChart}
                indicatorConfig={indicators}
            />
          </div>
        </section>
      </main>
    </div>
  );
};

export default App;
