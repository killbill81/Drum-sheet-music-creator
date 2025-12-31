export const NOTES_PER_MEASURE = 4; // Assuming 4/4 for now, can be dynamic
export const SUBDIVISIONS = 8; // 8th notes grid by default

export function getQuantizedBeat(
    xInMeasure: number,
    measureWidth: number,
    timeSignatureTop: number = 4
): number {
    const noteAreaWidth = measureWidth; // Assuming full width is playable for simplified grid
    const totalBeats = timeSignatureTop;
    const quantizationSteps = totalBeats * 2; // 8th notes

    const stepWidth = noteAreaWidth / quantizationSteps;
    const rawStep = Math.round(xInMeasure / stepWidth);
    const clampedStep = Math.max(0, Math.min(rawStep, quantizationSteps - 1));

    return clampedStep * 0.5; // Return beat value (0, 0.5, 1, 1.5, etc.)
}
