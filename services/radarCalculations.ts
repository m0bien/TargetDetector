
import { SwerlingModel, PlotData, PlotPoint } from '../types';

export interface CalculationParams {
    snrDb: number;
    threshold: number;
    swerlingModel: SwerlingModel;
    numPoints: number;
    xMax: number;
}

/**
 * Modified Bessel function of the first kind, order 0.
 * Using a simple polynomial approximation.
 */
function i0(x: number): number {
    const ax = Math.abs(x);
    if (ax < 3.75) {
        const y = x / 3.75 * x / 3.75;
        return 1.0 + y * (3.5156229 + y * (3.0899424 + y * (1.2067492 + y * (0.2659732 + y * (0.0360768 + y * 0.0045813)))));
    }
    const y = 3.75 / ax;
    return (Math.exp(ax) / Math.sqrt(ax)) * (0.39894228 + y * (0.01328592 + y * (0.00225319 - y * (0.00157565 - y * (0.00916281 - y * (0.02057706 - y * (0.02635537 - y * (0.01647633 + y * 0.00392377))))))));
}


/**
 * Probability Density Function for Noise envelope (Rayleigh distribution).
 * Noise power is normalized to 1 (sigma^2 = 0.5).
 */
function rayleighPdf(x: number): number {
    if (x < 0) return 0;
    return 2 * x * Math.exp(-x * x);
}

/**
 * Probability Density Function for a steady signal + noise (Rician distribution).
 */
function ricianPdf(x: number, snr: number): number {
    if (x < 0) return 0;
    const s = Math.sqrt(2 * snr);
    return 2 * x * Math.exp(-(x * x + s * s)) * i0(2 * x * s);
}

/**
 * PDF for Swerling I/II target models.
 */
function swerling1Pdf(x: number, snr: number): number {
    if (x < 0) return 0;
    const avgPower = 1 + snr;
    return (2 * x / avgPower) * Math.exp(-x * x / avgPower);
}

/**
 * PDF for Swerling III/IV target models.
 */
function swerling3Pdf(x: number, snr: number): number {
    if (x < 0) return 0;
    const snrHalf = snr / 2;
    const term1 = (2 * x / Math.pow(1 + snrHalf, 2));
    const term2 = 1 + (2 * x * x * snrHalf) / (1 + 2 * snrHalf);
    const exponent = -(2 * x * x) / (1 + 2 * snrHalf);
    return term1 * term2 * Math.exp(exponent);
}

export function calculateDetectionData(params: CalculationParams) {
    const { snrDb, threshold, swerlingModel, numPoints, xMax } = params;
    
    const snrLinear = Math.pow(10, snrDb / 10);
    const dx = xMax / numPoints;

    let signalPdf: (x: number, snr: number) => number;
    switch (swerlingModel) {
        case SwerlingModel.NON_FLUCTUATING:
            signalPdf = ricianPdf;
            break;
        case SwerlingModel.SWERLING_1:
        case SwerlingModel.SWERLING_2:
            signalPdf = swerling1Pdf;
            break;
        case SwerlingModel.SWERLING_3:
        case SwerlingModel.SWERLING_4:
            signalPdf = swerling3Pdf;
            break;
        default:
            signalPdf = ricianPdf;
    }
    
    const noisePoints: PlotPoint[] = [];
    const signalPoints: PlotPoint[] = [];
    let pfa = 0;
    let pd = 0;

    for (let i = 0; i <= numPoints; i++) {
        const x = i * dx;
        const noiseVal = rayleighPdf(x);
        const signalVal = signalPdf(x, snrLinear);
        
        noisePoints.push({ x, noise: noiseVal, signal: 0 }); // Use a unified structure
        signalPoints.push({ x, noise: 0, signal: signalVal });

        if (x >= threshold) {
            pfa += noiseVal * dx;
            pd += signalVal * dx;
        }
    }
    
    // Combine into a single plot data structure
    const plotDataPoints = noisePoints.map((p, i) => ({
        x: p.x,
        noise: p.noise,
        signal: signalPoints[i].signal
    }));

    return {
        pd: Math.min(pd, 1), // Clamp to 1
        pfa: Math.min(pfa, 1),
        plotData: {
            noise: plotDataPoints.map(p => ({ x: p.x, noise: p.noise, signal: 0 })),
            signal: plotDataPoints.map(p => ({ x: p.x, noise: 0, signal: p.signal })),
        },
    };
}
