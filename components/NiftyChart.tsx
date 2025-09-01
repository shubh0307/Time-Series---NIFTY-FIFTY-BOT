
import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import type { DataPoint } from '../types';

interface NiftyChartProps {
  data: DataPoint[];
  forecastStartIndex: number;
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-600 p-3 rounded-lg shadow-lg">
        <p className="label text-gray-300">{`Date : ${label}`}</p>
        <p className="intro text-cyan-400 font-bold">{`Price : ₹${payload[0].value.toFixed(2)}`}</p>
      </div>
    );
  }
  return null;
};


const NiftyChart: React.FC<NiftyChartProps> = ({ data, forecastStartIndex }) => {
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>;
  }

  const historicalData = data.slice(0, forecastStartIndex);
  const forecastData = data.slice(forecastStartIndex);

  // Combine them for line drawing but keep separate for data definition
  const displayData = historicalData.map((d, i) => ({
    date: d.date,
    historical: d.price,
    forecast: i === forecastStartIndex - 1 ? d.price : null, // Connects the lines
  })).concat(
    forecastData.map(d => ({
      date: d.date,
      historical: null,
      forecast: d.price,
    }))
  );
  
  const yDomain = [
    Math.min(...data.map(d => d.price)) * 0.99,
    Math.max(...data.map(d => d.price)) * 1.01
  ];

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={displayData}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
        <XAxis 
            dataKey="date" 
            stroke="#A0AEC0" 
            tick={{ fontSize: 12 }} 
            tickFormatter={(tick) => new Date(tick).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        />
        <YAxis 
            stroke="#A0AEC0" 
            tick={{ fontSize: 12 }} 
            domain={yDomain} 
            tickFormatter={(tick) => `₹${Math.round(tick)}`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ color: '#E2E8F0' }} />
        <Line 
            type="monotone" 
            dataKey="historical" 
            name="Historical"
            stroke="#38BDF8" 
            strokeWidth={2} 
            dot={false}
            connectNulls
        />
        <Line 
            type="monotone" 
            dataKey="forecast" 
            name="Forecast"
            stroke="#34D399" 
            strokeWidth={2} 
            strokeDasharray="5 5" 
            dot={{ r: 4, strokeWidth: 2 }}
            connectNulls
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default NiftyChart;
