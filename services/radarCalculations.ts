import { SwerlingModel, type PlotData, type PlotPoint } from '../types.ts';

export interface CalculationParams {
    baseSnrDb: number;
    numPulses: number;
    threshold: number;
    swerlingModel: SwerlingModel;
    numPoints: number;
    xMax?: number;
}

export interface DetectionResult {
    pd: number;
    pfa: number;
    xMax: number;
    plotData: PlotData;
}

/**
 * Natural logarithm of the Gamma function (Lanczos approximation).
 */
function logGamma(z: number): number {
    const g = 7;
    const p = [
        0.99999999999980993,
        676.5203681218851,
        -1259.1392167224028,
        771.32342877765313,
        -176.61502916214059,
        12.507343278686905,
        -0.13857109526572012,
        9.9843695780195716e-6,
        1.5056327351493116e-7,
    ];

    if (z < 0.5) {
        return Math.log(Math.PI / Math.sin(Math.PI * z)) - logGamma(1 - z);
    }

    const zm1 = z - 1;
    let x = p[0];
    for (let i = 1; i < g + 2; i++) {
        x += p[i] / (zm1 + i);
    }
    const t = zm1 + g + 0.5;
    return 0.5 * Math.log(2 * Math.PI) + (zm1 + 0.5) * Math.log(t) - t + Math.log(x);
}

/**
 * Regularized lower incomplete gamma function P(a, x) = gamma(a, x) / Gamma(a)
 * and upper incomplete gamma function Q(a, x) = 1 - P(a, x).
 */
function regularizedGammaP(a: number, x: number): number {
    if (x <= 0) return 0;
    if (a <= 0) return 1;

    if (x < a + 1) {
        // Series representation for P(a, x)
        let ap = a;
        let sum = 1 / a;
        let del = sum;
        for (let n = 1; n <= 200; n++) {
            ap += 1;
            del *= x / ap;
            sum += del;
            if (Math.abs(del) < Math.abs(sum) * 1e-14) {
                break;
            }
        }
        return Math.min(1, Math.max(0, sum * Math.exp(-x + a * Math.log(x) - logGamma(a))));
    }

    // Continued fraction representation for Q(a, x) = 1 - P(a, x)
    return 1 - regularizedGammaQ(a, x);
}

function regularizedGammaQ(a: number, x: number): number {
    if (x <= 0) return 1;
    if (a <= 0) return 0;

    if (x < a + 1) {
        return 1 - regularizedGammaP(a, x);
    }

    // Lentz's method for continued fraction of Q(a, x)
    const fpmin = 1e-300;
    let b = x + 1 - a;
    let c = 1 / fpmin;
    let d = 1 / b;
    let h = d;
    for (let i = 1; i <= 200; i++) {
        const an = -i * (i - a);
        b += 2;
        d = an * d + b;
        if (Math.abs(d) < fpmin) d = fpmin;
        c = b + an / c;
        if (Math.abs(c) < fpmin) c = fpmin;
        d = 1 / d;
        const del = d * c;
        h *= del;
        if (Math.abs(del - 1) < 1e-14) {
            break;
        }
    }
    return Math.min(1, Math.max(0, Math.exp(-x + a * Math.log(x) - logGamma(a)) * h));
}

/**
 * Exponentially scaled modified Bessel function of the first kind:
 * i0e(x) = I_0(x) * exp(-|x|), avoiding overflow for large x.
 */
function i0e(x: number): number {
    const ax = Math.abs(x);
    if (ax < 3.75) {
        const y = (ax / 3.75) * (ax / 3.75);
        const val =
            1.0 +
            y *
                (3.5156229 +
                    y * (3.0899424 + y * (1.2067492 + y * (0.2659732 + y * (0.0360768 + y * 0.0045813)))));
        return val * Math.exp(-ax);
    }
    const y = 3.75 / ax;
    return (
        (0.39894228 +
            y *
                (0.01328592 +
                    y *
                        (0.00225319 -
                            y *
                                (0.00157565 -
                                    y *
                                        (0.00916281 -
                                            y *
                                                (0.02057706 -
                                                    y * (0.02635537 - y * (0.01647633 + y * 0.00392377)))))))) /
        Math.sqrt(ax)
    );
}

/**
 * Exponentially scaled modified Bessel function of integer order n >= 0:
 * iNe(n, x) = I_n(x) * exp(-x) for x >= 0.
 * Uses asymptotic expansion for large x and Miller's downward recurrence otherwise.
 */
function iNe(n: number, x: number): number {
    if (n === 0) return i0e(x);
    if (x <= 0) return 0;

    // For very small x, leading series term avoids unnecessary work
    if (x < 1e-10) {
        return Math.exp(n * Math.log(x / 2) - logGamma(n + 1) - x);
    }

    // Uniformly accurate Hankel asymptotic expansion when x is large relative to n^2
    if (x > Math.max(100, 2 * n * n + 40)) {
        const mu = 4 * n * n;
        const eightX = 8 * x;
        let sum = 1;
        let term = 1;
        for (let k = 1; k <= 8; k++) {
            const oddSq = (2 * k - 1) * (2 * k - 1);
            term *= -(mu - oddSq) / (k * eightX);
            sum += term;
            if (Math.abs(term) < 1e-14) break;
        }
        return sum / Math.sqrt(2 * Math.PI * x);
    }

    // Downward recurrence from m large enough to guarantee convergence
    const m = Math.max(n + 30, Math.ceil(x + Math.sqrt(40 * x) + 30));
    let bNext = 0;
    let bCurr = 1e-200;
    let target = 0;
    let sum = 0;

    const twoOverX = 2 / x;
    for (let k = m; k >= 1; k--) {
        const bPrev = bNext + k * twoOverX * bCurr;
        bNext = bCurr;
        bCurr = bPrev;

        if (k - 1 === n) {
            target = bCurr;
        }
        sum += 2 * bCurr;

        // Rescale to prevent overflow
        if (bCurr > 1e200) {
            bNext *= 1e-200;
            bCurr *= 1e-200;
            target *= 1e-200;
            sum *= 1e-200;
        }
    }

    // Normalization: I_0(x) + 2 * sum_{k=1}^\infty I_k(x) = exp(x)
    // Currently sum includes 2 * (I_0 + I_1 + ...), so subtract bCurr (I_0) once
    const norm = sum - bCurr;
    return norm > 0 ? target / norm : 0;
}

/**
 * Gamma PDF in log-space for y > 0 with shape k and scale theta.
 */
function gammaPdf(y: number, k: number, theta: number): number {
    if (y <= 0) {
        return k === 1 ? 1 / theta : 0;
    }
    const logVal = (k - 1) * Math.log(y) - y / theta - k * Math.log(theta) - logGamma(k);
    return Math.exp(logVal);
}

/**
 * Noise-only power PDF for N non-coherently integrated pulses: y ~ Gamma(N, 1).
 * Plotted against RMS amplitude x = sqrt(y / N), so p_X(x) = 2 * N * x * p_Y(N * x^2).
 */
function noiseAmplitudePdf(x: number, numPulses: number): number {
    if (x < 0) return 0;
    const y = numPulses * x * x;
    return 2 * numPulses * x * gammaPdf(y, numPulses, 1);
}

/**
 * Swerling 0 (Non-fluctuating) amplitude PDF for N pulses and per-pulse linear SNR.
 */
function swerling0AmplitudePdf(x: number, snr: number, numPulses: number): number {
    if (x < 0) return 0;
    if (snr <= 0) return noiseAmplitudePdf(x, numPulses);

    const y = numPulses * x * x;
    const lambda = numPulses * snr;

    if (y === 0) return 0;

    const sqrtTerm = Math.sqrt(lambda * y);
    const diff = Math.sqrt(y) - Math.sqrt(lambda);
    const exponent = -diff * diff;
    const ratioLog = ((numPulses - 1) / 2) * Math.log(y / lambda);
    const pY = Math.exp(ratioLog + exponent) * iNe(numPulses - 1, 2 * sqrtTerm);
    return 2 * numPulses * x * pY;
}

/**
 * Swerling I (slowly fluctuating, 2-DOF) amplitude PDF for N pulses.
 */
function swerling1AmplitudePdf(x: number, snr: number, numPulses: number): number {
    if (x < 0) return 0;
    if (snr <= 0) return noiseAmplitudePdf(x, numPulses);

    const y = numPulses * x * x;
    if (numPulses === 1) {
        const avgPower = 1 + snr;
        return (2 * x / avgPower) * Math.exp(-y / avgPower);
    }

    const nSnr = numPulses * snr;
    const mean1 = 1 + nSnr;
    const alpha = nSnr / mean1;
    const logPrefactor = -Math.log(nSnr) + (numPulses - 2) * Math.log(1 + 1 / nSnr) - y / mean1;
    const pY = Math.exp(logPrefactor) * regularizedGammaP(numPulses - 1, alpha * y);
    return 2 * numPulses * x * pY;
}

/**
 * Swerling II (pulse-to-pulse fluctuating, 2-DOF) amplitude PDF for N pulses.
 */
function swerling2AmplitudePdf(x: number, snr: number, numPulses: number): number {
    if (x < 0) return 0;
    const y = numPulses * x * x;
    return 2 * numPulses * x * gammaPdf(y, numPulses, 1 + snr);
}

/**
 * Swerling III (slowly fluctuating, 4-DOF) amplitude PDF for N pulses.
 */
function swerling3AmplitudePdf(x: number, snr: number, numPulses: number): number {
    if (x < 0) return 0;
    if (snr <= 0) return noiseAmplitudePdf(x, numPulses);

    const y = numPulses * x * x;
    const aN = 1 + (numPulses * snr) / 2;

    if (numPulses === 1) {
        const pY = (1 / (aN * aN)) * (1 + (y * (snr / 2)) / aN) * Math.exp(-y / aN);
        return 2 * x * pY;
    }

    if (numPulses === 2) {
        const pY = gammaPdf(y, 2, aN);
        return 2 * numPulses * x * pY;
    }

    // For N >= 3: y = y_a + y_b where y_a ~ Gamma(2, aN) and y_b ~ Gamma(N - 2, 1).
    // Integrate over u = y_b in [0, min(y, (N - 2) + 12*sqrt(N - 2))] where Gamma(N - 2, 1) has its support.
    const kB = numPulses - 2;
    const uMax = Math.min(y, kB + 12 * Math.sqrt(kB) + 5);
    const steps = 64;
    const du = uMax / steps;
    let sum = 0;
    for (let i = 0; i < steps; i++) {
        const u = (i + 0.5) * du;
        sum += gammaPdf(y - u, 2, aN) * gammaPdf(u, kB, 1);
    }
    const pY = sum * du;
    return 2 * numPulses * x * pY;
}

/**
 * Swerling IV (pulse-to-pulse fluctuating, 4-DOF) amplitude PDF for N pulses.
 */
function swerling4AmplitudePdf(x: number, snr: number, numPulses: number): number {
    if (x < 0) return 0;
    if (snr <= 0) return noiseAmplitudePdf(x, numPulses);

    const y = numPulses * x * x;
    const snrHalf = snr / 2;
    const a1 = 1 + snrHalf;
    const logA1 = Math.log(a1);
    const logSnrHalf = Math.log(snrHalf);
    const logNFac = logGamma(numPulses + 1);

    let pY = 0;
    for (let k = 0; k <= numPulses; k++) {
        const logBinom = logNFac - logGamma(k + 1) - logGamma(numPulses - k + 1);
        const logWeight = logBinom + k * logSnrHalf - numPulses * logA1;
        pY += Math.exp(logWeight) * gammaPdf(y, numPulses + k, a1);
    }

    return 2 * numPulses * x * pY;
}

/**
 * Computes a suitable upper x-axis limit so the signal PDF is not clipped at high SNR.
 */
function computeXMax(snrLinear: number, swerlingModel: SwerlingModel): number {
    const meanAmp = Math.sqrt(1 + snrLinear);
    const spreadMultiplier =
        swerlingModel === SwerlingModel.SWERLING_1 || swerlingModel === SwerlingModel.SWERLING_3
            ? 3.0
            : 2.0;
    return Math.max(10, Math.ceil(meanAmp * spreadMultiplier + 3));
}

/**
 * Computes exact Pfa = Q(N, N * T^2).
 */
function computeExactPfa(threshold: number, numPulses: number): number {
    if (threshold <= 0) return 1;
    const yT = numPulses * threshold * threshold;
    return regularizedGammaQ(numPulses, yT);
}

/**
 * Computes Pd accurately using closed-form Gamma Q where available,
 * and trapezoidal quadrature over [threshold, integrationMax] otherwise.
 */
function computePd(
    threshold: number,
    snrLinear: number,
    numPulses: number,
    swerlingModel: SwerlingModel,
    signalPdf: (x: number, snr: number, n: number) => number
): number {
    if (threshold <= 0) return 1;
    if (snrLinear <= 0) return computeExactPfa(threshold, numPulses);

    const yT = numPulses * threshold * threshold;

    if (swerlingModel === SwerlingModel.SWERLING_2) {
        return regularizedGammaQ(numPulses, yT / (1 + snrLinear));
    }

    if (swerlingModel === SwerlingModel.SWERLING_1 && numPulses === 1) {
        return Math.exp(-yT / (1 + snrLinear));
    }

    if (swerlingModel === SwerlingModel.SWERLING_4) {
        const snrHalf = snrLinear / 2;
        const a1 = 1 + snrHalf;
        const logA1 = Math.log(a1);
        const logSnrHalf = Math.log(snrHalf);
        const logNFac = logGamma(numPulses + 1);
        let pd = 0;
        for (let k = 0; k <= numPulses; k++) {
            const logBinom = logNFac - logGamma(k + 1) - logGamma(numPulses - k + 1);
            const logWeight = logBinom + k * logSnrHalf - numPulses * logA1;
            pd += Math.exp(logWeight) * regularizedGammaQ(numPulses + k, yT / a1);
        }
        return Math.min(1, Math.max(0, pd));
    }

    // Trapezoidal integration from threshold out to a generous tail bound
    const tailBound = Math.max(
        threshold + 12,
        Math.sqrt(1 + snrLinear) * 6 + 10
    );
    const steps = 1000;
    const dx = (tailBound - threshold) / steps;
    let integral = 0.5 * (signalPdf(threshold, snrLinear, numPulses) + signalPdf(tailBound, snrLinear, numPulses));
    for (let i = 1; i < steps; i++) {
        integral += signalPdf(threshold + i * dx, snrLinear, numPulses);
    }
    return Math.min(1, Math.max(0, integral * dx));
}

export function calculateDetectionData(params: CalculationParams): DetectionResult {
    const { baseSnrDb, numPulses, threshold, swerlingModel, numPoints } = params;

    const snrLinear = Math.pow(10, baseSnrDb / 10);
    const xMax = params.xMax ?? computeXMax(snrLinear, swerlingModel);
    const dx = xMax / numPoints;

    let signalPdf: (x: number, snr: number, n: number) => number;
    switch (swerlingModel) {
        case SwerlingModel.NON_FLUCTUATING:
            signalPdf = swerling0AmplitudePdf;
            break;
        case SwerlingModel.SWERLING_1:
            signalPdf = swerling1AmplitudePdf;
            break;
        case SwerlingModel.SWERLING_2:
            signalPdf = swerling2AmplitudePdf;
            break;
        case SwerlingModel.SWERLING_3:
            signalPdf = swerling3AmplitudePdf;
            break;
        case SwerlingModel.SWERLING_4:
            signalPdf = swerling4AmplitudePdf;
            break;
        default:
            signalPdf = swerling0AmplitudePdf;
    }

    const noisePoints: PlotPoint[] = [];
    const signalPoints: PlotPoint[] = [];

    for (let i = 0; i <= numPoints; i++) {
        const x = i * dx;
        const noiseVal = noiseAmplitudePdf(x, numPulses);
        const signalVal = signalPdf(x, snrLinear, numPulses);

        noisePoints.push({ x, noise: noiseVal, signal: 0 });
        signalPoints.push({ x, noise: 0, signal: signalVal });
    }

    const pfa = computeExactPfa(threshold, numPulses);
    const pd = computePd(threshold, snrLinear, numPulses, swerlingModel, signalPdf);

    return {
        pd,
        pfa,
        xMax,
        plotData: {
            noise: noisePoints,
            signal: signalPoints,
        },
    };
}
