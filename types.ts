export const SwerlingModel = {
    NON_FLUCTUATING: 'Swerling 0',
    SWERLING_1: 'Swerling I',
    SWERLING_2: 'Swerling II',
    SWERLING_3: 'Swerling III',
    SWERLING_4: 'Swerling IV',
} as const;

export type SwerlingModel = (typeof SwerlingModel)[keyof typeof SwerlingModel];

export interface PlotPoint {
    x: number;
    noise: number;
    signal: number;
}

export interface PlotData {
    noise: PlotPoint[];
    signal: PlotPoint[];
}
