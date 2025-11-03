import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { InfoCard } from './components/InfoCard';
import { DetectionPlot } from './components/DetectionPlot';
import { SwerlingModel } from './types';
import { DEFAULT_BASE_SNR_DB, X_MAX, NUM_POINTS } from './constants';
import { calculateDetectionData, CalculationParams } from './services/radarCalculations';

const App: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(4.5);
  const [numPulses, setNumPulses] = useState<number>(1);
  const [swerlingModel, setSwerlingModel] = useState<SwerlingModel>(SwerlingModel.SWERLING_1);
  const [baseSnrDb, setBaseSnrDb] = useState<number>(DEFAULT_BASE_SNR_DB);


  const effectiveSnrDb = useMemo(() => baseSnrDb + 10 * Math.log10(numPulses), [baseSnrDb, numPulses]);

  const [detectionData, setDetectionData] = useState({
    steady: { pd: 0, pfa: 0, plotData: { noise: [], signal: [] } },
    swirling: { pd: 0, pfa: 0, plotData: { noise: [], signal: [] } }
  });

  useEffect(() => {
    // FIX: Removed `CalculationParams` type annotation. The `params` object is a base
    // configuration and doesn't include `swerlingModel`, which is added later.
    const params = {
      snrDb: effectiveSnrDb,
      threshold,
      numPoints: NUM_POINTS,
      xMax: X_MAX
    };

    const steadyData = calculateDetectionData({ ...params, swerlingModel: SwerlingModel.NON_FLUCTUATING });
    const swirlingData = calculateDetectionData({ ...params, swerlingModel });

    setDetectionData({
      steady: steadyData,
      swirling: swirlingData
    });
  }, [threshold, numPulses, swerlingModel, effectiveSnrDb]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ControlPanel
              threshold={threshold}
              setThreshold={setThreshold}
              baseSnrDb={baseSnrDb}
              setBaseSnrDb={setBaseSnrDb}
              numPulses={numPulses}
              setNumPulses={setNumPulses}
              swerlingModel={swerlingModel}
              setSwerlingModel={setSwerlingModel}
              effectiveSnrDb={effectiveSnrDb}
            />
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-1 gap-6">
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
              <h2 className="text-xl font-bold text-cyan-400 mb-2">Non-Fluctuating Target (Swerling 0)</h2>
              <p className="text-sm text-gray-400 mb-4">
                The target's radar cross-section is constant. This plot shows the classic case of a steady signal in Additive White Gaussian Noise (AWGN).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-4">
                <InfoCard title="Probability of Detection (Pd)" value={detectionData.steady.pd} />
                <InfoCard title="Probability of False Alarm (Pfa)" value={detectionData.steady.pfa} isPfa={true} />
              </div>
              <div className="w-full h-72">
                <DetectionPlot
                  plotData={detectionData.steady.plotData}
                  threshold={threshold}
                />
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
               <h2 className="text-xl font-bold text-teal-400 mb-2">Fluctuating Target ({swerlingModel})</h2>
              <p className="text-sm text-gray-400 mb-4">
                The target's radar cross-section fluctuates according to the selected Swerling model, affecting the signal's probability distribution.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-4">
                <InfoCard title="Probability of Detection (Pd)" value={detectionData.swirling.pd} />
                <InfoCard title="Probability of False Alarm (Pfa)" value={detectionData.swirling.pfa} isPfa={true} />
              </div>
              <div className="w-full h-72">
                 <DetectionPlot
                  plotData={detectionData.swirling.plotData}
                  threshold={threshold}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;