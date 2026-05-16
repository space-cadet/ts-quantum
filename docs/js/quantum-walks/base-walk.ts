/**
 * Base quantum walk implementation with common patterns
 */

import { StateVector, MatrixOperator, SparseOperator } from '../../../dist/index.js';
import * as math from 'mathjs';
import { 
    QuantumWalk1DData, 
    QuantumWalk1DBoundary,
    IQuantumWalk,
    QuantumWalkSnapshot,
    QuantumWalkError
} from '../core/types.ts';

export abstract class BaseQuantumWalk implements IQuantumWalk {
    protected state: StateVector | null = null;
    protected coinOp: MatrixOperator | null = null;
    protected shiftOp: SparseOperator | null = null;
    protected latticeSize: number = 0;
    protected currentStep: number = 0;
    protected history: QuantumWalkSnapshot[] = [];

    /**
     * Initialize the quantum walk with given parameters
     */
    abstract initialize(latticeSize: number, ...args: any[]): QuantumWalk1DData;

    /**
     * Execute one step of the quantum walk
     */
    step(): QuantumWalk1DData {
        this.validateInitialized();
        
        const nextState = this.evolveState();
        this.updateState(nextState);
        this.currentStep++;
        
        const data = this.extractData(nextState);
        this.history.push({ step: this.currentStep, data });
        
        return data;
    }

    /**
     * Reset the quantum walk to initial state
     */
    reset(): void {
        this.state = null;
        this.coinOp = null;
        this.shiftOp = null;
        this.latticeSize = 0;
        this.currentStep = 0;
        this.history = [];
    }

    /**
     * Get current quantum walk state
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
     * Template method for state evolution - to be implemented by subclasses
     */
    protected abstract evolveState(): StateVector;

    /**
     * Build coin operator - to be implemented by subclasses
     */
    protected abstract buildCoinOperator(...args: any[]): MatrixOperator;

    /**
     * Build shift operator - to be implemented by subclasses
     */
    protected abstract buildShiftOperator(boundary: QuantumWalk1DBoundary): SparseOperator;

    /**
     * Create initial state at center of lattice
     */
    protected createInitialState(dimension: number): StateVector {
        const center = Math.floor(this.latticeSize / 2);
        const initialAmplitudes: any[] = new Array(dimension).fill(null).map(() => math.complex(0, 0));
        const invSqrt2 = 1 / Math.sqrt(2);
        
        initialAmplitudes[center] = math.complex(invSqrt2, 0); // LEFT at center
        initialAmplitudes[this.latticeSize + center] = math.complex(invSqrt2, 0); // RIGHT at center
        
        return new StateVector(dimension, initialAmplitudes);
    }

    /**
     * Extract probability data from quantum state
     */
    protected extractData(state: StateVector): QuantumWalk1DData {
        const probabilities: { position: number; probability: number }[] = [];
        let totalProb = 0;
        let centerOfMass = 0;
        let maxProb = 0;

        const x0 = (this.latticeSize - 1) / 2;

        // Sum probabilities across both coin states for each position
        for (let pos = 0; pos < this.latticeSize; pos++) {
            const leftAmp = state.amplitudes[pos];
            const rightAmp = state.amplitudes[this.latticeSize + pos];

            const leftProb = Math.abs(leftAmp.re) ** 2 + Math.abs(leftAmp.im) ** 2;
            const rightProb = Math.abs(rightAmp.re) ** 2 + Math.abs(rightAmp.im) ** 2;

            const posProb = leftProb + rightProb;
            probabilities.push({ position: pos, probability: posProb });
            totalProb += posProb;
            const x = pos - x0;
            centerOfMass += x * posProb;
            maxProb = Math.max(maxProb, posProb);
        }

        // Normalize center of mass
        centerOfMass = totalProb > 0 ? centerOfMass / totalProb : 0;

        // Calculate variance
        let variance = 0;
        for (let pos = 0; pos < this.latticeSize; pos++) {
            const posProb = probabilities[pos].probability;
            const x = pos - x0;
            variance += (x - centerOfMass) ** 2 * posProb;
        }

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
     * Update internal state
     */
    protected updateState(newState: StateVector): void {
        this.state = newState;
    }

    /**
     * Validate that the walk is properly initialized
     */
    protected validateInitialized(): void {
        if (!this.state || !this.coinOp || !this.shiftOp || this.latticeSize === 0) {
            throw new QuantumWalkError('Quantum walk not initialized. Call initialize() first.');
        }
    }

    /**
     * Create identity operator for position space
     */
    protected createIdentityOperator(): MatrixOperator {
        const identityMatrix: any[][] = [];
        for (let i = 0; i < this.latticeSize; i++) {
            const row: any[] = [];
            for (let j = 0; j < this.latticeSize; j++) {
                row.push(i === j ? math.complex(1, 0) : math.complex(0, 0));
            }
            identityMatrix.push(row);
        }
        return new MatrixOperator(identityMatrix, 'unitary');
    }

    /**
     * Apply coin and shift operations
     */
    protected applyCoinAndShift(state: StateVector): StateVector {
        const identityOp = this.createIdentityOperator();
        const coinFullOp = this.coinOp!.tensorProduct(identityOp);
        
        let nextState = coinFullOp.apply(state);
        nextState = this.shiftOp!.apply(nextState);
        return nextState.normalize();
    }

    /**
     * Store initial data in history
     */
    protected storeInitialData(data: QuantumWalk1DData): void {
        this.history.push({ step: 0, data });
    }
}