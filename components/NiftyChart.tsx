import React, { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Brush, Area, ReferenceLine, Label } from 'recharts';
import type { DataPoint } from '../types';

interface NiftyChartProps {
  data: DataPoint[];
  forecastStartIndex: number;
  indicatorConfig: {
    sma: { enabled: boolean, period: number },
    ema: { enabled: boolean, period: number },
    rsi: { enabled: boolean, period: number },
  }
}

const CustomTooltip: React.FC<any> = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const dataPoint = payload[0]?.payload;
    if (!dataPoint) return null;

    return (
      <div className="bg-gray-800/80 backdrop-blur-sm border border-gray-600 p-3 rounded-lg shadow-lg text-sm w-48">
        <p className="label text-gray-300 font-semibold mb-2">{`Date : ${dataPoint.date}`}</p>
        <div className="space-y-1">
          {dataPoint.historical !== undefined && dataPoint.historical !== null && (
            <p className="flex justify-between">
              <span className="text-cyan-400">Price:</span>
              <span className="font-bold text-cyan-400">₹{dataPoint.historical.toFixed(2)}</span>
            </p>
          )}
          {dataPoint.forecast !== undefined && dataPoint.forecast !== null && (
            <p className="flex justify-between">
              <span className="text-green-400">Forecast:</span>
              <span className="font-bold text-green-400">₹{dataPoint.forecast.toFixed(2)}</span>
            </p>
          )}
          {dataPoint.confidence && (
            <>
              <p className="flex justify-between text-xs text-gray-400">
                  <span>High:</span>
                  <span>₹{dataPoint.confidence[1].toFixed(2)}</span>
              </p>
              <p className="flex justify-between text-xs text-gray-400">
                  <span>Low:</span>
                  <span>₹{dataPoint.confidence[0].toFixed(2)}</span>
              </p>
            </>
          )}
          {dataPoint.sma !== undefined && (
            <p className="flex justify-between">
              <span className="text-yellow-400">SMA:</span>
              <span className="font-bold text-yellow-400">{dataPoint.sma.toFixed(2)}</span>
            </p>
          )}
          {dataPoint.ema !== undefined && (
            <p className="flex justify-between">
              <span className="text-purple-400">EMA:</span>
              <span className="font-bold text-purple-400">{dataPoint.ema.toFixed(2)}</span>
            </p>
          )}
          {dataPoint.rsi !== undefined && (
            <p className="flex justify-between">
              <span className="text-red-400">RSI:</span>
              <span className="font-bold text-red-400">{dataPoint.rsi.toFixed(2)}</span>
            </p>
          )}
        </div>
      </div>
    );
  }
  return null;
};


const NiftyChart: React.FC<NiftyChartProps> = ({ data, forecastStartIndex, indicatorConfig }) => {
  const displayData = useMemo(() => {
    return data.map((point, index) => {
      if (index < forecastStartIndex) {
        return {
          index,
          date: point.date,
          historical: point.price,
          forecast: index === forecastStartIndex - 1 ? point.price : null,
          confidence: null,
          sma: point.sma,
          ema: point.ema,
          rsi: point.rsi,
        };
      } else {
        return {
          index,
          date: point.date,
          historical: null,
          forecast: point.price,
          confidence: [point.low, point.high],
          sma: point.sma,
          ema: point.ema,
          rsi: point.rsi,
        };
      }
    });
  }, [data, forecastStartIndex]);
  
  if (!data || data.length === 0) {
    return <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>;
  }
  
  const yDomain: [number, number] = [
    Math.min(...data.map(d => d.low ?? d.price)) * 0.99,
    Math.max(...data.map(d => d.high ?? d.price)) * 1.01
  ];

  const hasRsi = indicatorConfig.rsi.enabled;

  return (
    <div className="w-full h-full flex flex-col">
        <ResponsiveContainer width="100%" height={hasRsi ? '70%' : '100%'}>
          <LineChart
            data={displayData}
            margin={{ top: 5, right: 30, left: 20, bottom: hasRsi ? 5 : 20 }}
            syncId="niftyChartSync"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis 
                type="number"
                dataKey="index"
                tickLine={false}
                axisLine={false}
                tick={hasRsi ? { display: 'none' } : { fontSize: 12, fill: '#A0AEC0' }}
                tickFormatter={(index) => {
                    const point = displayData[Math.round(index)];
                    return point ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                }}
                domain={['dataMin', 'dataMax']}
                height={hasRsi ? 1 : 30}
            />
            <YAxis 
                stroke="#A0AEC0" 
                tick={{ fontSize: 12 }} 
                domain={yDomain} 
                tickFormatter={(tick) => `₹${Math.round(tick)}`}
                width={60}
            />
            <Tooltip 
              content={<CustomTooltip />} 
              cursor={{ stroke: 'rgba(100, 116, 139, 0.5)', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Legend wrapperStyle={{ color: '#E2E8F0', paddingTop: hasRsi ? '10px' : '20px' }} />
            <Area 
                type="monotone" 
                dataKey="confidence"
                stroke="transparent"
                fill="#34D399" 
                fillOpacity={0.15}
                name="90% Confidence"
                connectNulls
            />
            <Line 
                type="monotone" 
                dataKey="historical" 
                name="Historical"
                stroke="#38BDF8" 
                strokeWidth={2} 
                dot={false}
                activeDot={{ r: 8, strokeWidth: 2, stroke: '#0e7490' }}
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
                activeDot={{ r: 8, strokeWidth: 2, stroke: '#059669' }}
                connectNulls
            />
            {indicatorConfig.sma.enabled && (
                <Line type="monotone" dataKey="sma" name={`SMA(${indicatorConfig.sma.period})`} stroke="#FBBF24" strokeWidth={1.5} dot={false} connectNulls />
            )}
            {indicatorConfig.ema.enabled && (
                <Line type="monotone" dataKey="ema" name={`EMA(${indicatorConfig.ema.period})`} stroke="#A78BFA" strokeWidth={1.5} dot={false} connectNulls />
            )}
          </LineChart>
        </ResponsiveContainer>

        {hasRsi && (
            <ResponsiveContainer width="100%" height="30%">
                <LineChart
                    data={displayData}
                    margin={{ top: 10, right: 30, left: 20, bottom: 20 }}
                    syncId="niftyChartSync"
                >
                    <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
                    <XAxis 
                        type="number"
                        dataKey="index"
                        stroke="#A0AEC0" 
                        tick={{ fontSize: 12 }} 
                        tickFormatter={(index) => {
                            const point = displayData[Math.round(index)];
                            return point ? new Date(point.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '';
                        }}
                        domain={['dataMin', 'dataMax']}
                    />
                    <YAxis 
                        stroke="#A0AEC0" 
                        tick={{ fontSize: 12 }} 
                        domain={[0, 100]} 
                        width={60}
                    />
                    <Tooltip 
                        content={<CustomTooltip />} 
                        cursor={{ stroke: 'rgba(100, 116, 139, 0.5)', strokeWidth: 1, strokeDasharray: '3 3' }}
                    />
                    <ReferenceLine y={70} stroke="#F87171" strokeDasharray="3 3">
                        <Label value="Overbought (70)" position="insideTopRight" fill="#F87171" fontSize={12} dy={-5} />
                    </ReferenceLine>
                    <ReferenceLine y={30} stroke="#4ADE80" strokeDasharray="3 3">
                        <Label value="Oversold (30)" position="insideBottomRight" fill="#4ADE80" fontSize={12} dy={15} />
                    </ReferenceLine>
                    <Line type="monotone" dataKey="rsi" name={`RSI(${indicatorConfig.rsi.period})`} stroke="#F472B6" strokeWidth={1.5} dot={false} connectNulls />
                    <Brush
                      dataKey="index"
                      height={25}
                      stroke="#38BDF8"
                      fill="rgba(45, 212, 191, 0.1)"
                      tickFormatter={(index) => {
                        const point = displayData[index];
                        return point ? new Date(point.date).toLocaleDateString('en-US', { month: 'short'}) : '';
                      }}
                    />
                </LineChart>
            </ResponsiveContainer>
        )}
    </div>
  );
};

export default NiftyChart;