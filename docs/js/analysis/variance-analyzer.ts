/**
 * Variance growth analysis for quantum vs classical walks
 */

import { QuantumWalkSnapshot, VarianceGrowth, IAnalyzer } from '../core/types.ts';

export class VarianceGrowthAnalyzer implements IAnalyzer {
    /**
     * Analyze variance growth comparing quantum vs classical walks
     */
    analyze(
        quantumHistory: QuantumWalkSnapshot[], 
        classicalHistory: QuantumWalkSnapshot[]
    ): VarianceGrowth[] {
        const maxSteps = Math.min(quantumHistory.length, classicalHistory.length);
        const result: VarianceGrowth[] = [];

        for (let i = 0; i < maxSteps; i++) {
            const qVar = quantumHistory[i].data.variance;
            const cVar = classicalHistory[i].data.variance;
            const advantage = cVar > 0 ? qVar / cVar : 0;

            result.push({
                step: i,
                quantumVariance: qVar,
                classicalVariance: cVar,
                advantage
            });
        }

        return result;
    }

    /**
     * Calculate spreading rates
     */
    calculateSpreadingRates(
        quantumHistory: QuantumWalkSnapshot[],
        classicalHistory: QuantumWalkSnapshot[]
    ): {
        quantumRate: number;
        classicalRate: number;
        advantage: number;
    } {
        if (quantumHistory.length < 2 || classicalHistory.length < 2) {
            return { quantumRate: 0, classicalRate: 0, advantage: 0 };
        }

        const qVar0 = quantumHistory[0].data.variance;
        const qVarFinal = quantumHistory[quantumHistory.length - 1].data.variance;
        const qSteps = quantumHistory.length - 1;

        const cVar0 = classicalHistory[0].data.variance;
        const cVarFinal = classicalHistory[classicalHistory.length - 1].data.variance;
        const cSteps = classicalHistory.length - 1;

        const quantumRate = qSteps > 0 ? (qVarFinal - qVar0) / qSteps : 0;
        const classicalRate = cSteps > 0 ? (cVarFinal - cVar0) / cSteps : 0;
        const advantage = classicalRate > 0 ? quantumRate / classicalRate : 0;

        return {
            quantumRate,
            classicalRate,
            advantage
        };
    }

    /**
     * Determine scaling regime
     */
    determineScalingRegime(step: number, totalSteps: number): string {
        const earlyThreshold = totalSteps / 3;
        const lateThreshold = 2 * totalSteps / 3;

        if (step <= earlyThreshold) {
            return 'Early';
        } else if (step >= lateThreshold) {
            return 'Late';
        } else {
            return 'Mixed';
        }
    }

    /**
     * Generate summary statistics
     */
    generateSummary(analysis: VarianceGrowth[]): {
        maxAdvantage: number;
        avgAdvantage: number;
        finalAdvantage: number;
        quantumScaling: string;
        classicalScaling: string;
    } {
        if (analysis.length === 0) {
            return {
                maxAdvantage: 0,
                avgAdvantage: 0,
                finalAdvantage: 0,
                quantumScaling: 'unknown',
                classicalScaling: 'unknown'
            };
        }

        const advantages = analysis.map(a => a.advantage).filter(a => a > 0);
        const maxAdvantage = Math.max(...advantages, 0);
        const avgAdvantage = advantages.length > 0 ? 
            advantages.reduce((sum, a) => sum + a, 0) / advantages.length : 0;
        const finalAdvantage = analysis[analysis.length - 1].advantage;

        // Determine scaling behavior (simplified)
        const quantumScaling = this.determineScalingBehavior(analysis.map(a => a.quantumVariance));
        const classicalScaling = this.determineScalingBehavior(analysis.map(a => a.classicalVariance));

        return {
            maxAdvantage,
            avgAdvantage,
            finalAdvantage,
            quantumScaling,
            classicalScaling
        };
    }

    /**
     * Simple scaling behavior detection
     */
    private determineScalingBehavior(values: number[]): string {
        if (values.length < 3) return 'insufficient_data';

        // Check if values grow linearly (classical) or quadratically (quantum)
        const midPoint = Math.floor(values.length / 2);
        const earlyGrowth = values[midPoint] - values[0];
        const lateGrowth = values[values.length - 1] - values[midPoint];

        if (Math.abs(lateGrowth - earlyGrowth) < earlyGrowth * 0.2) {
            return 'linear'; // Classical-like
        } else if (lateGrowth > earlyGrowth * 1.5) {
            return 'quadratic'; // Quantum-like
        } else {
            return 'mixed';
        }
    }
}