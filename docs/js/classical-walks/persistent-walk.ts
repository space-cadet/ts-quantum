/**
 * Persistent classical random walk implementation (telegraph-like)
 */

import { QuantumWalk1DData, IClassicalWalk, QuantumWalkSnapshot } from '../core/types.ts';
import { weightedAverage, calculateVariance, clampValue } from '../utils/math-helpers.ts';

export class PersistentClassicalWalk implements IClassicalWalk {
    private pLeft: number[] = [];
    private pRight: number[] = [];
    private latticeSize: number = 0;
    private currentStep: number = 0;
    private persistence: number = 0.9;
    private history: QuantumWalkSnapshot[] = [];

    /**
     * Initialize persistent classical random walk
     */
    initialize(latticeSize: number, persistence: number = 0.9): QuantumWalk1DData {
        this.latticeSize = latticeSize;
        this.persistence = clampValue(persistence, 0, 1);
        
        this.pLeft = new Array(latticeSize).fill(0);
        this.pRight = new Array(latticeSize).fill(0);
        
        // Start at center with equal probability in both directions
        const center = Math.floor(latticeSize / 2);
        this.pLeft[center] = 0.5;
        this.pRight[center] = 0.5;
        
        this.currentStep = 0;
        this.history = [];
        
        const initialData = this.extractData();
        this.history.push({ step: 0, data: initialData });
        
        return initialData;
    }

    /**
     * Execute one step of persistent classical random walk
     */
    step(): QuantumWalk1DData {
        this.validateInitialized();
        
        const newLeft = new Array(this.latticeSize).fill(0);
        const newRight = new Array(this.latticeSize).fill(0);

        // Transport + velocity scattering.
        // With probability persistence, keep direction; with (1-persistence), flip.
        for (let pos = 0; pos < this.latticeSize; pos++) {
            const pl = this.pLeft[pos];
            const pr = this.pRight[pos];
            
            if (pl > 0) {
                const target = pos > 0 ? pos - 1 : 0;
                // reflect at boundary by flipping direction if blocked
                if (pos > 0) {
                    newLeft[target] += pl * this.persistence;
                    newRight[target] += pl * (1 - this.persistence);
                } else {
                    newRight[target] += pl;
                }
            }
            
            if (pr > 0) {
                const target = pos < this.latticeSize - 1 ? pos + 1 : this.latticeSize - 1;
                if (pos < this.latticeSize - 1) {
                    newRight[target] += pr * this.persistence;
                    newLeft[target] += pr * (1 - this.persistence);
                } else {
                    newLeft[target] += pr;
                }
            }
        }

        this.pLeft = newLeft;
        this.pRight = newRight;
        this.currentStep++;
        
        const data = this.extractData();
        this.history.push({ step: this.currentStep, data });
        
        return data;
    }

    /**
     * Reset the walk
     */
    reset(): void {
        this.pLeft = [];
        this.pRight = [];
        this.latticeSize = 0;
        this.currentStep = 0;
        this.persistence = 0.9;
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
     * Update persistence parameter
     */
    setPersistence(persistence: number): void {
        this.persistence = clampValue(persistence, 0, 1);
    }

    /**
     * Get current persistence
     */
    getPersistence(): number {
        return this.persistence;
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
            const posProb = this.pLeft[pos] + this.pRight[pos];
            probabilities.push({ position: pos, probability: posProb });
            totalProb += posProb;
            maxProb = Math.max(maxProb, posProb);
        }

        // Calculate center of mass
        const positions = probabilities.map(p => p.position - x0);
        const weights = probabilities.map(p => p.probability);
        const centerOfMass = weightedAverage(positions, weights);

        // Calculate variance
        const variance = calculateVariance(positions, weights);

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
        if (this.latticeSize === 0 || this.pLeft.length === 0 || this.pRight.length === 0) {
            throw new Error('Persistent classical walk not initialized. Call initialize() first.');
        }
    }
}