
import React, { useState, useEffect, useCallback } from 'react';
import { generateMockData } from './utils/mockData';
import type { DataPoint, ForecastResponse } from './types';
import { generateNiftyForecast } from './services/geminiService';
import NiftyChart from './components/NiftyChart';
import { ChartIcon, LoadingSpinner, BrainCircuitIcon, AlertTriangleIcon } from './components/Icons';

const App: React.FC = () => {
  const [historicalData, setHistoricalData] = useState<DataPoint[]>([]);
  const [forecastData, setForecastData] = useState<DataPoint[] | null>(null);
  const [forecastSummary, setForecastSummary] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setHistoricalData(generateMockData(30));
  }, []);

  const handleForecast = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    setForecastData(null);
    setForecastSummary(null);

    try {
      const result: ForecastResponse = await generateNiftyForecast(historicalData);
      // Validate dates to ensure they follow the historical data
      const lastHistoricalDate = new Date(historicalData[historicalData.length - 1].date);
      const validatedForecast = result.forecast.map((point, index) => {
        const newDate = new Date(lastHistoricalDate);
        newDate.setDate(newDate.getDate() + index + 1);
        return { ...point, date: newDate.toISOString().split('T')[0] };
      });
      setForecastData(validatedForecast);
      setForecastSummary(result.summary);
    } catch (err) {
      console.error("Forecast generation failed:", err);
      setError("Failed to generate forecast. The model might be temporarily unavailable. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  }, [historicalData]);

  const combinedData = historicalData.concat(forecastData || []);

  return (
    <div className="bg-gray-900 text-gray-100 min-h-screen font-sans flex flex-col items-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-7xl">
        <header className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-2">
            <ChartIcon className="h-10 w-10 text-cyan-400" />
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              NIFTY FIFTY Forecasting Bot
            </h1>
          </div>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Using Gemini to analyze historical data and predict the next 7 days of the NIFTY FIFTY index.
          </p>
        </header>

        <main className="flex flex-col gap-8">
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl shadow-2xl p-4 sm:p-6 lg:p-8 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold mb-6 text-cyan-300">NIFTY FIFTY Price (Last 30 Days & Forecast)</h2>
            <div className="h-80 sm:h-96 w-full">
              <NiftyChart data={combinedData} forecastStartIndex={historicalData.length} />
            </div>
          </div>

          <div className="flex justify-center">
            <button
              onClick={handleForecast}
              disabled={isLoading}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-cyan-500 text-white font-bold rounded-full text-lg shadow-lg hover:bg-cyan-600 disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-300/50"
            >
              {isLoading ? (
                <>
                  <LoadingSpinner className="h-6 w-6" />
                  <span>Generating Forecast...</span>
                </>
              ) : (
                <>
                  <BrainCircuitIcon className="h-6 w-6" />
                  <span>Generate 7-Day Forecast</span>
                </>
              )}
            </button>
          </div>
          
          {error && (
            <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-xl relative flex items-start gap-3" role="alert">
              <AlertTriangleIcon className="h-6 w-6 mt-1 flex-shrink-0" />
              <div>
                <strong className="font-bold">Error! </strong>
                <span className="block sm:inline">{error}</span>
              </div>
            </div>
          )}

          {forecastSummary && !isLoading && (
            <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 animate-fade-in">
              <h3 className="text-2xl font-semibold mb-4 text-cyan-300 flex items-center gap-3">
                <BrainCircuitIcon className="h-7 w-7" />
                Forecast Analysis
              </h3>
              <p className="text-gray-300 leading-relaxed">{forecastSummary}</p>
            </div>
          )}
        </main>
        
        <footer className="text-center mt-12 text-gray-500 text-sm">
          <p>Disclaimer: This is a technology demonstration and should not be used for financial advice.</p>
          <p>Generated mock data is for visualization purposes only.</p>
        </footer>
      </div>
    </div>
  );
};

export default App;
