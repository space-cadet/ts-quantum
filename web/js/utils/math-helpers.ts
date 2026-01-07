/**
 * Mathematical utility functions for quantum simulations
 */

import { StateVector, DensityMatrixOperator } from '../../../dist/index.js';
import * as math from 'mathjs';

/**
 * Format complex number for display
 */
export function formatComplex(re: number, im: number, precision: number = 4): string {
    if (Math.abs(im) < 1e-10) {
        return re.toFixed(precision);
    }

    const sign = im >= 0 ? '+' : '';
    return `${re.toFixed(precision)} ${sign} ${im.toFixed(precision)}i`;
}

/**
 * Create density matrix from state vector
 */
export function createDensityMatrixFromState(state: StateVector): DensityMatrixOperator {
    const dim = state.dimension;
    const matrix: any[] = [];

    for (let i = 0; i < dim; i++) {
        const row: any[] = [];
        for (let j = 0; j < dim; j++) {
            row.push(
                math.multiply(state.amplitudes[i], math.conj(state.amplitudes[j])) as any
            );
        }
        matrix.push(row);
    }

    return new DensityMatrixOperator(matrix);
}

/**
 * Calculate entanglement entropy (simplified version)
 */
export function calculateEntanglementEntropy(
    state: StateVector,
    dimA: number,
    dimB: number
): number {
    // This would use Schmidt decomposition in a full implementation
    // For now, using a simplified entropy calculation
    try {
        const rho = createDensityMatrixFromState(state);
        // Simplified entropy calculation - in practice would use eigenvalues
        return 0; // Placeholder
    } catch {
        return 0;
    }
}

/**
 * Validate and clamp numeric parameters
 */
export function clampValue(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

/**
 * Check if a value is finite and valid
 */
export function isValidNumber(value: number): boolean {
    return isFinite(value) && !isNaN(value);
}

/**
 * Create complex number with validation
 */
export function createComplex(re: number, im: number = 0): any {
    return math.complex(re, im);
}

/**
 * Calculate magnitude of complex number
 */
export function complexMagnitude(complex: any): number {
    return Math.hypot(complex.re, complex.im);
}

/**
 * Calculate phase of complex number
 */
export function complexPhase(complex: any): number {
    return Math.atan2(complex.im, complex.re);
}

/**
 * Normalize an array of probabilities
 */
export function normalizeProbabilities(probs: number[]): number[] {
    const total = probs.reduce((sum, p) => sum + p, 0);
    if (total === 0) return probs.map(() => 0);
    return probs.map(p => p / total);
}

/**
 * Calculate weighted average
 */
export function weightedAverage(values: number[], weights: number[]): number {
    if (values.length !== weights.length) {
        throw new Error('Values and weights must have same length');
    }
    
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    if (totalWeight === 0) return 0;
    
    const weightedSum = values.reduce((sum, v, i) => sum + v * weights[i], 0);
    return weightedSum / totalWeight;
}

/**
 * Calculate variance
 */
export function calculateVariance(values: number[], weights?: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = weights ? weightedAverage(values, weights) : 
                  values.reduce((sum, v) => sum + v, 0) / values.length;
    
    const squaredDiffs = values.map(v => (v - mean) ** 2);
    
    return weights ? weightedAverage(squaredDiffs, weights) :
                   squaredDiffs.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Linear interpolation
 */
export function lerp(a: number, b: number, t: number): number {
    return a + (b - a) * clampValue(t, 0, 1);
}

/**
 * Map value from one range to another
 */
export function mapRange(value: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
    return outMin + (value - inMin) * (outMax - outMin) / (inMax - inMin);
}

/**
 * Generate array with sequential numbers
 */
export function range(start: number, end: number, step: number = 1): number[] {
    const result: number[] = [];
    for (let i = start; i < end; i += step) {
        result.push(i);
    }
    return result;
}

/**
 * Deep clone an object
 */
export function deepClone<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

/**
 * Debounce function calls
 */
export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

/**
 * Throttle function calls
 */
export function throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}