import React, { useState, useMemo } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { InfoCard } from './components/InfoCard';
import { DetectionPlot } from './components/DetectionPlot';
import { SwerlingModel } from './types';
import { DEFAULT_BASE_SNR_DB, NUM_POINTS } from './constants';
import { calculateDetectionData } from './services/radarCalculations';

const App: React.FC = () => {
  const [threshold, setThreshold] = useState<number>(4.5);
  const [numPulses, setNumPulses] = useState<number>(1);
  const [swerlingModel, setSwerlingModel] = useState<SwerlingModel>(SwerlingModel.SWERLING_1);
  const [baseSnrDb, setBaseSnrDb] = useState<number>(DEFAULT_BASE_SNR_DB);

  const effectiveSnrDb = useMemo(
    () => baseSnrDb + 10 * Math.log10(numPulses),
    [baseSnrDb, numPulses]
  );

  const thresholdMax = useMemo(() => {
    const snrLinear = Math.pow(10, baseSnrDb / 10);
    return Math.max(10, Math.ceil(Math.sqrt(1 + snrLinear) * 1.5));
  }, [baseSnrDb]);

  const clampedThreshold = Math.min(threshold, thresholdMax);

  const detectionData = useMemo(() => {
    const baseParams = {
      baseSnrDb,
      numPulses,
      threshold: clampedThreshold,
      numPoints: NUM_POINTS,
    };

    const steady = calculateDetectionData({
      ...baseParams,
      swerlingModel: SwerlingModel.NON_FLUCTUATING,
    });
    const swerling = calculateDetectionData({
      ...baseParams,
      swerlingModel,
    });

    return { steady, swerling };
  }, [baseSnrDb, numPulses, clampedThreshold, swerlingModel]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <ControlPanel
              threshold={clampedThreshold}
              thresholdMax={thresholdMax}
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
                The target's radar cross-section is constant. This plot shows a steady signal with non-coherent pulse integration in Additive White Gaussian Noise (AWGN).
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-4">
                <InfoCard title="Probability of Detection (Pd)" value={detectionData.steady.pd} />
                <InfoCard title="Probability of False Alarm (Pfa)" value={detectionData.steady.pfa} isPfa={true} />
              </div>
              <div className="w-full h-72">
                <DetectionPlot
                  plotData={detectionData.steady.plotData}
                  threshold={clampedThreshold}
                />
              </div>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700">
              <h2 className="text-xl font-bold text-teal-400 mb-2">Fluctuating Target ({swerlingModel})</h2>
              <p className="text-sm text-gray-400 mb-4">
                The target's radar cross-section fluctuates according to the selected Swerling model, affecting the signal's probability distribution across integrated pulses.
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 mb-4">
                <InfoCard title="Probability of Detection (Pd)" value={detectionData.swerling.pd} />
                <InfoCard title="Probability of False Alarm (Pfa)" value={detectionData.swerling.pfa} isPfa={true} />
              </div>
              <div className="w-full h-72">
                <DetectionPlot
                  plotData={detectionData.swerling.plotData}
                  threshold={clampedThreshold}
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
