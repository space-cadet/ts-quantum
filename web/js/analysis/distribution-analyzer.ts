/**
 * Distribution snapshot analysis for quantum walks
 */

import { QuantumWalkSnapshot, IAnalyzer } from '../core/types.ts';

export interface DistributionSnapshot {
    step: number;
    centerOfMass: number;
    variance: number;
    maxProbability: number;
    entropy: number;
    distribution: { position: number; probability: number }[];
}

export interface DistributionAnalysis {
    snapshots: DistributionSnapshot[];
    evolution: {
        centerOfMassDrift: number;
        varianceGrowth: number;
        peakProbabilityDecay: number;
        entropyGrowth: number;
    };
    characteristics: {
        symmetry: number;
        spread: number;
        peakedness: number;
    };
}

export class DistributionAnalyzer implements IAnalyzer {
    /**
     * Analyze distribution snapshots across evolution
     */
    analyze(quantumHistory: QuantumWalkSnapshot[]): DistributionAnalysis {
        const snapshots = this.generateSnapshots(quantumHistory);
        const evolution = this.analyzeEvolution(snapshots);
        const characteristics = this.analyzeCharacteristics(snapshots);

        return {
            snapshots,
            evolution,
            characteristics
        };
    }

    /**
     * Generate distribution snapshots at key steps
     */
    generateSnapshots(history: QuantumWalkSnapshot[], numSnapshots: number = 4): DistributionSnapshot[] {
        if (history.length === 0) return [];

        const stepIndices = this.selectSnapshotSteps(history.length, numSnapshots);
        const snapshots: DistributionSnapshot[] = [];

        for (const stepIndex of stepIndices) {
            const data = history[stepIndex].data;
            const snapshot: DistributionSnapshot = {
                step: stepIndex,
                centerOfMass: data.centerOfMass,
                variance: data.variance,
                maxProbability: data.maxProbability,
                entropy: this.calculateEntropy(data.probabilities),
                distribution: [...data.probabilities]
            };
            snapshots.push(snapshot);
        }

        return snapshots;
    }

    /**
     * Select evenly distributed snapshot steps
     */
    private selectSnapshotSteps(totalSteps: number, numSnapshots: number): number[] {
        if (totalSteps <= numSnapshots) {
            return Array.from({ length: totalSteps }, (_, i) => i);
        }

        const stepSize = Math.floor((totalSteps - 1) / (numSnapshots - 1));
        const steps: number[] = [];
        
        for (let i = 0; i < numSnapshots - 1; i++) {
            steps.push(i * stepSize);
        }
        steps.push(totalSteps - 1); // Always include final step

        return steps;
    }

    /**
     * Analyze evolution patterns
     */
    private analyzeEvolution(snapshots: DistributionSnapshot[]): DistributionAnalysis['evolution'] {
        if (snapshots.length < 2) {
            return {
                centerOfMassDrift: 0,
                varianceGrowth: 0,
                peakProbabilityDecay: 0,
                entropyGrowth: 0
            };
        }

        const first = snapshots[0];
        const last = snapshots[snapshots.length - 1];

        return {
            centerOfMassDrift: Math.abs(last.centerOfMass - first.centerOfMass),
            varianceGrowth: last.variance - first.variance,
            peakProbabilityDecay: first.maxProbability - last.maxProbability,
            entropyGrowth: last.entropy - first.entropy
        };
    }

    /**
     * Analyze distribution characteristics
     */
    private analyzeCharacteristics(snapshots: DistributionSnapshot[]): DistributionAnalysis['characteristics'] {
        if (snapshots.length === 0) {
            return { symmetry: 0, spread: 0, peakedness: 0 };
        }

        const finalSnapshot = snapshots[snapshots.length - 1];
        
        return {
            symmetry: this.calculateSymmetry(finalSnapshot.distribution),
            spread: Math.sqrt(finalSnapshot.variance),
            peakedness: this.calculatePeakedness(finalSnapshot.distribution)
        };
    }

    /**
     * Calculate Shannon entropy of probability distribution
     */
    private calculateEntropy(probabilities: { position: number; probability: number }[]): number {
        let entropy = 0;
        
        for (const { probability } of probabilities) {
            if (probability > 1e-10) {
                entropy -= probability * Math.log2(probability);
            }
        }
        
        return entropy;
    }

    /**
     * Calculate symmetry of distribution around center
     */
    private calculateSymmetry(probabilities: { position: number; probability: number }[]): number {
        const center = (probabilities.length - 1) / 2;
        let symmetry = 0;
        let totalWeight = 0;

        for (const { position, probability } of probabilities) {
            const mirrorPos = 2 * center - position;
            const mirrorProb = this.getProbabilityAt(probabilities, mirrorPos);
            
            if (probability > 0) {
                const diff = Math.abs(probability - mirrorProb);
                symmetry += (1 - diff / probability) * probability;
                totalWeight += probability;
            }
        }

        return totalWeight > 0 ? symmetry / totalWeight : 0;
    }

    /**
     * Get probability at specific position (with bounds checking)
     */
    private getProbabilityAt(probabilities: { position: number; probability: number }[], position: number): number {
        const pos = Math.round(position);
        if (pos >= 0 && pos < probabilities.length) {
            return probabilities[pos].probability;
        }
        return 0;
    }

    /**
     * Calculate peakedness (kurtosis-like measure)
     */
    private calculatePeakedness(probabilities: { position: number; probability: number }[]): number {
        const maxProb = Math.max(...probabilities.map(p => p.probability));
        const avgProb = probabilities.reduce((sum, p) => sum + p.probability, 0) / probabilities.length;
        
        return avgProb > 0 ? maxProb / avgProb : 0;
    }

    /**
     * Get distribution at specific step
     */
    getDistributionAt(history: QuantumWalkSnapshot[], step: number): DistributionSnapshot | null {
        if (step < 0 || step >= history.length) return null;

        const data = history[step].data;
        return {
            step,
            centerOfMass: data.centerOfMass,
            variance: data.variance,
            maxProbability: data.maxProbability,
            entropy: this.calculateEntropy(data.probabilities),
            distribution: [...data.probabilities]
        };
    }

    /**
     * Compare two distributions
     */
    compareDistributions(dist1: DistributionSnapshot, dist2: DistributionSnapshot): {
        centerOfMassDiff: number;
        varianceRatio: number;
        peakProbabilityRatio: number;
        entropyDiff: number;
        overlap: number;
    } {
        const overlap = this.calculateOverlap(dist1.distribution, dist2.distribution);

        return {
            centerOfMassDiff: Math.abs(dist1.centerOfMass - dist2.centerOfMass),
            varianceRatio: dist2.variance > 0 ? dist1.variance / dist2.variance : 0,
            peakProbabilityRatio: dist2.maxProbability > 0 ? dist1.maxProbability / dist2.maxProbability : 0,
            entropyDiff: dist1.entropy - dist2.entropy,
            overlap
        };
    }

    /**
     * Calculate overlap between two probability distributions
     */
    private calculateOverlap(
        dist1: { position: number; probability: number }[],
        dist2: { position: number; probability: number }[]
    ): number {
        let overlap = 0;
        
        for (const { position, probability } of dist1) {
            const prob2 = this.getProbabilityAt(dist2, position);
            overlap += Math.min(probability, prob2);
        }
        
        return overlap;
    }
}