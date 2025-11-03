
import React from 'react';

// Using an SVG icon directly in the component
const RadarIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 12m-1 0a1 1 0 1 0 2 0a1 1 0 1 0-2 0" />
        <path d="M15.51 15.51a5 5 0 1 0-7.02 0" />
        <path d="M18.83 18.83a9 9 0 1 0-13.66 0" />
        <path d="M22 12h-2" />
        <path d="M2 12H4" />
        <path d="M12 2v2" />
        <path d="M12 22v-2" />
    </svg>
);


export const Header: React.FC = () => {
    return (
        <header className="bg-gray-800/50 backdrop-blur-sm border-b border-gray-700 shadow-lg sticky top-0 z-50">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <RadarIcon className="h-8 w-8 text-cyan-400" />
                        <h1 className="text-2xl font-bold ml-3 tracking-wider text-white">
                            Interactive Radar Detector
                        </h1>
                    </div>
                </div>
            </div>
        </header>
    );
};
