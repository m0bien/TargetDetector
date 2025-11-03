
import React from 'react';

interface InfoCardProps {
    title: string;
    value: number;
    isPfa?: boolean;
}

export const InfoCard: React.FC<InfoCardProps> = ({ title, value, isPfa = false }) => {
    const displayValue = isPfa ? value.toExponential(2) : value.toFixed(3);
    const bgColor = isPfa ? 'bg-red-900/50' : 'bg-green-900/50';
    const textColor = isPfa ? 'text-red-400' : 'text-green-400';
    const borderColor = isPfa ? 'border-red-700' : 'border-green-700';

    return (
        <div className={`p-4 rounded-lg text-center ${bgColor} border ${borderColor}`}>
            <h3 className="text-sm font-medium text-gray-300">{title}</h3>
            <p className={`text-2xl font-bold mt-1 ${textColor}`}>
                {displayValue}
            </p>
        </div>
    );
};
