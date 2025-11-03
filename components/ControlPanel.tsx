import React from 'react';
import { SwerlingModel } from '../types';

interface ControlPanelProps {
    threshold: number;
    setThreshold: (value: number) => void;
    baseSnrDb: number;
    setBaseSnrDb: (value: number) => void;
    numPulses: number;
    setNumPulses: (value: number) => void;
    swerlingModel: SwerlingModel;
    setSwerlingModel: (model: SwerlingModel) => void;
    effectiveSnrDb: number;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
    threshold,
    setThreshold,
    baseSnrDb,
    setBaseSnrDb,
    numPulses,
    setNumPulses,
    swerlingModel,
    setSwerlingModel,
    effectiveSnrDb
}) => {
    return (
        <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 sticky top-24">
            <h2 className="text-xl font-bold mb-4 text-cyan-400 border-b border-gray-600 pb-2">Controls</h2>
            
            <div className="space-y-6">
                <div>
                    <label htmlFor="threshold" className="block text-sm font-medium text-gray-300">
                        Detection Threshold
                    </label>
                    <div className="flex items-center space-x-4 mt-2">
                        <input
                            id="threshold"
                            type="range"
                            min="0"
                            max="10"
                            step="0.1"
                            value={threshold}
                            onChange={(e) => setThreshold(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                        />
                        <span className="text-cyan-400 font-semibold w-16 text-center bg-gray-700 px-2 py-1 rounded">
                            {threshold.toFixed(1)}
                        </span>
                    </div>
                </div>

                <div>
                    <label htmlFor="baseSnr" className="block text-sm font-medium text-gray-300">
                        Base SNR (per pulse)
                    </label>
                    <div className="flex items-center space-x-4 mt-2">
                        <input
                            id="baseSnr"
                            type="range"
                            min="0"
                            max="30"
                            step="0.5"
                            value={baseSnrDb}
                            onChange={(e) => setBaseSnrDb(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                        />
                        <span className="text-purple-400 font-semibold w-16 text-center bg-gray-700 px-2 py-1 rounded">
                            {baseSnrDb.toFixed(1)} dB
                        </span>
                    </div>
                </div>

                <div>
                    <label htmlFor="numPulses" className="block text-sm font-medium text-gray-300">
                        Number of Pulses Integrated
                    </label>
                    <div className="flex items-center space-x-4 mt-2">
                        <input
                            id="numPulses"
                            type="range"
                            min="1"
                            max="100"
                            step="1"
                            value={numPulses}
                            onChange={(e) => setNumPulses(Number(e.target.value))}
                            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-teal-500"
                        />
                        <span className="text-teal-400 font-semibold w-16 text-center bg-gray-700 px-2 py-1 rounded">
                            {numPulses}
                        </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        Effective SNR: <span className="font-bold text-teal-300">{effectiveSnrDb.toFixed(1)} dB</span>
                    </p>
                </div>

                <div>
                    <label htmlFor="swerlingModel" className="block text-sm font-medium text-gray-300">
                        Swerling Model (Fluctuating Target)
                    </label>
                    <select
                        id="swerlingModel"
                        value={swerlingModel}
                        onChange={(e) => setSwerlingModel(e.target.value as SwerlingModel)}
                        className="mt-2 block w-full pl-3 pr-10 py-2 text-base border-gray-600 bg-gray-700 focus:outline-none focus:ring-cyan-500 focus:border-cyan-500 sm:text-sm rounded-md text-white"
                    >
                        <option value={SwerlingModel.SWERLING_1}>Swerling I</option>
                        <option value={SwerlingModel.SWERLING_2}>Swerling II</option>
                        <option value={SwerlingModel.SWERLING_3}>Swerling III</option>
                        <option value={SwerlingModel.SWERLING_4}>Swerling IV</option>
                    </select>
                </div>
            </div>
        </div>
    );
};