import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateDetectionData } from './radarCalculations.ts';
import { SwerlingModel } from '../types.ts';

const ALL_MODELS = [
    SwerlingModel.NON_FLUCTUATING,
    SwerlingModel.SWERLING_1,
    SwerlingModel.SWERLING_2,
    SwerlingModel.SWERLING_3,
    SwerlingModel.SWERLING_4,
];

test('single-pulse Pfa matches exact Rayleigh closed form exp(-T^2)', () => {
    for (const threshold of [1.5, 3.0, 4.5, 8.0]) {
        const res = calculateDetectionData({
            baseSnrDb: 10,
            numPulses: 1,
            threshold,
            swerlingModel: SwerlingModel.NON_FLUCTUATING,
            numPoints: 500,
        });
        const expected = Math.exp(-threshold * threshold);
        assert.ok(Math.abs(res.pfa - expected) < 1e-12, `threshold=${threshold}: got ${res.pfa}, expected ${expected}`);
    }
});

test('single-pulse Swerling I Pd matches exact exp(-T^2 / (1 + SNR))', () => {
    const baseSnrDb = 13;
    const snrLinear = Math.pow(10, baseSnrDb / 10);
    const threshold = 4.5;
    const res = calculateDetectionData({
        baseSnrDb,
        numPulses: 1,
        threshold,
        swerlingModel: SwerlingModel.SWERLING_1,
        numPoints: 500,
    });
    const expected = Math.exp(-(threshold * threshold) / (1 + snrLinear));
    assert.ok(Math.abs(res.pd - expected) < 1e-12, `got ${res.pd}, expected ${expected}`);
});

test('all models integrate to ~1 and produce finite values even at 30 dB SNR and 100 pulses', () => {
    for (const model of ALL_MODELS) {
        for (const numPulses of [1, 10, 100]) {
            for (const baseSnrDb of [0, 13, 30]) {
                const res = calculateDetectionData({
                    baseSnrDb,
                    numPulses,
                    threshold: 4.5,
                    swerlingModel: model,
                    numPoints: 1000,
                });

                assert.ok(Number.isFinite(res.pd) && res.pd >= 0 && res.pd <= 1, `Invalid Pd for ${model}, N=${numPulses}, SNR=${baseSnrDb}: ${res.pd}`);
                assert.ok(Number.isFinite(res.pfa) && res.pfa >= 0 && res.pfa <= 1, `Invalid Pfa for ${model}, N=${numPulses}, SNR=${baseSnrDb}: ${res.pfa}`);

                const dx = res.xMax / 1000;
                let noiseArea = 0;
                let signalArea = 0;
                for (let i = 0; i < res.plotData.noise.length; i++) {
                    const nVal = res.plotData.noise[i].noise;
                    const sVal = res.plotData.signal[i].signal;
                    assert.ok(Number.isFinite(nVal), `Non-finite noise PDF for ${model}, N=${numPulses}, SNR=${baseSnrDb}`);
                    assert.ok(Number.isFinite(sVal), `Non-finite signal PDF for ${model}, N=${numPulses}, SNR=${baseSnrDb}`);
                    const weight = i === 0 || i === res.plotData.noise.length - 1 ? 0.5 : 1;
                    noiseArea += weight * nVal * dx;
                    signalArea += weight * sVal * dx;
                }

                assert.ok(Math.abs(noiseArea - 1) < 0.02, `Noise area=${noiseArea} for ${model}, N=${numPulses}, SNR=${baseSnrDb}`);
                assert.ok(Math.abs(signalArea - 1) < 0.03, `Signal area=${signalArea} for ${model}, N=${numPulses}, SNR=${baseSnrDb}`);
            }
        }
    }
});

test('Swerling I vs II and III vs IV diverge for N > 1', () => {
    const s1 = calculateDetectionData({
        baseSnrDb: 10,
        numPulses: 10,
        threshold: 2.0,
        swerlingModel: SwerlingModel.SWERLING_1,
        numPoints: 500,
    });
    const s2 = calculateDetectionData({
        baseSnrDb: 10,
        numPulses: 10,
        threshold: 2.0,
        swerlingModel: SwerlingModel.SWERLING_2,
        numPoints: 500,
    });
    assert.ok(Math.abs(s1.pd - s2.pd) > 0.05, `Expected Swerling I (${s1.pd}) and II (${s2.pd}) to differ at N=10`);

    const s3 = calculateDetectionData({
        baseSnrDb: 10,
        numPulses: 10,
        threshold: 2.0,
        swerlingModel: SwerlingModel.SWERLING_3,
        numPoints: 500,
    });
    const s4 = calculateDetectionData({
        baseSnrDb: 10,
        numPulses: 10,
        threshold: 2.0,
        swerlingModel: SwerlingModel.SWERLING_4,
        numPoints: 500,
    });
    assert.ok(Math.abs(s3.pd - s4.pd) > 0.02, `Expected Swerling III (${s3.pd}) and IV (${s4.pd}) to differ at N=10`);
});
