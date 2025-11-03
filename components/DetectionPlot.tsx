
import React, { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer, Legend } from 'recharts';
import { PlotData } from '../types';

interface DetectionPlotProps {
    plotData: PlotData;
    threshold: number;
}

export const DetectionPlot: React.FC<DetectionPlotProps> = ({ plotData, threshold }) => {

    const chartData = useMemo(() => {
        return plotData.noise.map((p, i) => ({
            x: p.x,
            noise: p.noise,
            signal: plotData.signal[i]?.signal || 0
        }));
    }, [plotData]);

    const thresholdIndex = useMemo(() => {
        return chartData.findIndex(p => p.x >= threshold);
    }, [chartData, threshold]);

    if (!chartData || chartData.length === 0) {
        return <div className="flex items-center justify-center h-full text-gray-500">Loading chart data...</div>;
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart
                data={chartData}
                margin={{
                    top: 5,
                    right: 20,
                    left: 20,
                    bottom: 5,
                }}
            >
                <defs>
                    <linearGradient id="colorSignal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#2dd4bf" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#2dd4bf" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorNoise" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f87171" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis 
                    dataKey="x" 
                    type="number"
                    domain={[0, 'dataMax']}
                    stroke="#a0aec0"
                    label={{ value: 'Amplitude', position: 'insideBottom', offset: -5, fill: '#a0aec0' }}
                />
                <YAxis 
                    stroke="#a0aec0"
                    label={{ value: 'PDF', angle: -90, position: 'insideLeft', fill: '#a0aec0' }}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1a202c', border: '1px solid #4a5568' }}
                    labelStyle={{ color: '#e2e8f0' }}
                    itemStyle={{ color: '#cbd5e0' }}
                />
                <Legend wrapperStyle={{ color: '#e2e8f0' }} />

                {/* Noise PDF */}
                <Area type="monotone" dataKey="noise" stroke="#f87171" fill="url(#colorNoise)" name="Noise" />
                
                {/* Signal + Noise PDF */}
                <Area type="monotone" dataKey="signal" stroke="#2dd4bf" fill="url(#colorSignal)" name="Signal + Noise" />

                {/* Shaded Area for Pfa */}
                <Area 
                    type="monotone" 
                    dataKey="noise" 
                    stroke="none" 
                    fill="#ef4444" 
                    fillOpacity={0.5} 
                    data={chartData.slice(thresholdIndex)}
                    name="Pfa Area"
                    activeDot={false}
                />
                {/* Shaded Area for Pd */}
                <Area 
                    type="monotone" 
                    dataKey="signal" 
                    stroke="none" 
                    fill="#14b8a6" 
                    fillOpacity={0.5} 
                    data={chartData.slice(thresholdIndex)}
                    name="Pd Area"
                    activeDot={false}
                />

                <ReferenceLine 
                    x={threshold} 
                    stroke="#facc15" 
                    strokeWidth={2} 
                    label={{ value: 'Threshold', position: 'top', fill: '#facc15' }} 
                />
            </AreaChart>
        </ResponsiveContainer>
    );
};
