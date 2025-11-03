
export enum SwerlingModel {
    NON_FLUCTUATING = 'Swerling 0',
    SWERLING_1 = 'Swerling I',
    SWERLING_2 = 'Swerling II', // Same PDF as I, but different correlation properties
    SWERLING_3 = 'Swerling III',
    SWERLING_4 = 'Swerling IV', // Same PDF as III
}

export interface PlotPoint {
    x: number;
    noise: number;
    signal: number;
}

export interface PlotData {
    noise: PlotPoint[];
    signal: PlotPoint[];
}
