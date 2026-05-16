/**
 * Simple classical random walk implementation
 */

import { QuantumWalk1DData, IClassicalWalk, QuantumWalkSnapshot } from '../core/types.ts';
import { weightedAverage, calculateVariance } from '../utils/math-helpers.ts';

export class SimpleClassicalWalk implements IClassicalWalk {
    private probabilities: number[] = [];
    private latticeSize: number = 0;
    private currentStep: number = 0;
    private history: QuantumWalkSnapshot[] = [];

    /**
     * Initialize classical random walk
     */
    initialize(latticeSize: number): QuantumWalk1DData {
        this.latticeSize = latticeSize;
        this.probabilities = new Array(latticeSize).fill(0);
        
        // Start at center with certainty
        const center = Math.floor(latticeSize / 2);
        this.probabilities[center] = 1.0;
        
        this.currentStep = 0;
        this.history = [];
        
        const initialData = this.extractData();
        this.history.push({ step: 0, data: initialData });
        
        return initialData;
    }

    /**
     * Execute one step of classical random walk
     */
    step(): QuantumWalk1DData {
        this.validateInitialized();
        
        const newProbs = new Array(this.latticeSize).fill(0);

        // From each position, move left or right with 50% probability
        for (let pos = 0; pos < this.latticeSize; pos++) {
            if (this.probabilities[pos] > 0) {
                // Move left
                const prevPos = pos > 0 ? pos - 1 : 0; // Reflect at boundary
                newProbs[prevPos] += this.probabilities[pos] * 0.5;

                // Move right
                const nextPos = pos < this.latticeSize - 1 ? pos + 1 : this.latticeSize - 1; // Reflect at boundary
                newProbs[nextPos] += this.probabilities[pos] * 0.5;
            }
        }

        this.probabilities = newProbs;
        this.currentStep++;
        
        const data = this.extractData();
        this.history.push({ step: this.currentStep, data });
        
        return data;
    }

    /**
     * Reset the walk
     */
    reset(): void {
        this.probabilities = [];
        this.latticeSize = 0;
        this.currentStep = 0;
        this.history = [];
    }

    /**
     * Get current state
     */
    getState(): QuantumWalk1DData {
        this.validateInitialized();
        return this.history[this.history.length - 1].data;
    }

    /**
     * Get complete history
     */
    getHistory(): QuantumWalkSnapshot[] {
        return [...this.history];
    }

    /**
     * Extract probability data from current distribution
     */
    private extractData(): QuantumWalk1DData {
        const probabilities: { position: number; probability: number }[] = [];
        let totalProb = 0;
        let maxProb = 0;

        const x0 = (this.latticeSize - 1) / 2;

        for (let pos = 0; pos < this.latticeSize; pos++) {
            const posProb = this.probabilities[pos];
            probabilities.push({ position: pos, probability: posProb });
            totalProb += posProb;
            maxProb = Math.max(maxProb, posProb);
        }

        // Calculate center of mass
        const positions = probabilities.map(p => p.position - x0);
        const centerOfMass = weightedAverage(positions, this.probabilities);

        // Calculate variance
        const variance = calculateVariance(positions, this.probabilities);

        return {
            step: this.currentStep,
            probabilities,
            centerOfMass,
            variance,
            totalProbability: totalProb,
            maxProbability: maxProb
        };
    }

    /**
     * Validate that the walk is properly initialized
     */
    private validateInitialized(): void {
        if (this.latticeSize === 0 || this.probabilities.length === 0) {
            throw new Error('Classical walk not initialized. Call initialize() first.');
        }
    }
}