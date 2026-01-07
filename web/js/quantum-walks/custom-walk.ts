/**
 * Custom quantum walk implementation with configurable coin and boundary conditions
 */

import { StateVector, MatrixOperator, SparseOperator, createSparseMatrix, setSparseEntry } from '../../../dist/index.js';
import * as math from 'mathjs';
import { BaseQuantumWalk } from './base-walk.ts';
import { QuantumWalk1DData, QuantumWalk1DBoundary, QuantumWalk1DCoin } from '../core/types.ts';

export class CustomQuantumWalk extends BaseQuantumWalk {
    private theta: number = Math.PI / 4;
    private coinType: QuantumWalk1DCoin = 'hadamard';
    private boundaryType: QuantumWalk1DBoundary = 'reflecting';

    /**
     * Initialize custom quantum walk with configurable parameters
     */
    initialize(
        latticeSize: number, 
        coin: QuantumWalk1DCoin = 'hadamard',
        boundary: QuantumWalk1DBoundary = 'reflecting',
        theta: number = Math.PI / 4
    ): QuantumWalk1DData {
        this.latticeSize = latticeSize;
        this.coinType = coin;
        this.boundaryType = boundary;
        this.theta = theta;
        
        const dimension = 2 * latticeSize;

        // Create coin operator
        this.coinOp = this.buildCoinOperator(coin, theta);
        
        // Create shift operator
        this.shiftOp = this.buildShiftOperator(boundary);
        
        // Create initial state
        this.state = this.createInitialState(dimension);
        
        // Store initial data
        const initialData = this.extractData(this.state);
        this.storeInitialData(initialData);
        
        return initialData;
    }

    /**
     * Build coin operator based on type and parameters
     */
    protected buildCoinOperator(coin: QuantumWalk1DCoin = this.coinType, theta: number = this.theta): MatrixOperator {
        if (coin === 'hadamard') {
            const hadamardMatrix: any[][] = [
                [math.complex(1 / Math.sqrt(2), 0), math.complex(1 / Math.sqrt(2), 0)],
                [math.complex(1 / Math.sqrt(2), 0), math.complex(-1 / Math.sqrt(2), 0)]
            ];
            return new MatrixOperator(hadamardMatrix, 'unitary');
        }

        if (coin === 'grover') {
            // Grover diffusion operator: G = 2|s><s| - I, |s> = (1,1)/sqrt(2)
            const d = 2;
            const a = 2 / d;
            const groverMatrix: any[][] = [
                [math.complex(a - 1, 0), math.complex(a, 0)],
                [math.complex(a, 0), math.complex(a - 1, 0)]
            ];
            return new MatrixOperator(groverMatrix, 'unitary');
        }

        // Rotation coin (real, unbiased family). A common 1-parameter choice:
        // C(θ) = [[cosθ, sinθ],[sinθ, -cosθ]] (unitary, determinant -1)
        const c = Math.cos(theta);
        const s = Math.sin(theta);
        const rotMatrix: any[][] = [
            [math.complex(c, 0), math.complex(s, 0)],
            [math.complex(s, 0), math.complex(-c, 0)]
        ];
        return new MatrixOperator(rotMatrix, 'unitary');
    }

    /**
     * Build shift operator with configurable boundary conditions
     */
    protected buildShiftOperator(boundary: QuantumWalk1DBoundary = this.boundaryType): SparseOperator {
        const dimension = 2 * this.latticeSize;
        const shiftMatrix = createSparseMatrix(dimension, dimension);

        for (let pos = 0; pos < this.latticeSize; pos++) {
            // LEFT coin at position pos
            const leftIndex = pos;

            if (boundary === 'periodic') {
                const prevPos = (pos - 1 + this.latticeSize) % this.latticeSize;
                const rightIndexPrev = this.latticeSize + prevPos;
                setSparseEntry(shiftMatrix, rightIndexPrev, leftIndex, math.complex(1, 0));
            } else {
                // Reflecting boundary
                if (pos > 0) {
                    const rightIndexPrev = this.latticeSize + (pos - 1);
                    setSparseEntry(shiftMatrix, rightIndexPrev, leftIndex, math.complex(1, 0));
                } else {
                    const rightIndex = this.latticeSize + 0;
                    setSparseEntry(shiftMatrix, rightIndex, leftIndex, math.complex(1, 0));
                }
            }

            // RIGHT coin at position pos
            const rightIndex = this.latticeSize + pos;
            
            if (boundary === 'periodic') {
                const nextPos = (pos + 1) % this.latticeSize;
                const leftIndexNext = nextPos;
                setSparseEntry(shiftMatrix, leftIndexNext, rightIndex, math.complex(1, 0));
            } else {
                // Reflecting boundary
                if (pos < this.latticeSize - 1) {
                    const leftIndexNext = pos + 1;
                    setSparseEntry(shiftMatrix, leftIndexNext, rightIndex, math.complex(1, 0));
                } else {
                    const leftIndexBound = pos;
                    setSparseEntry(shiftMatrix, leftIndexBound, rightIndex, math.complex(1, 0));
                }
            }
        }

        return new SparseOperator(shiftMatrix, 'unitary');
    }

    /**
     * Evolve state by applying coin and shift operations
     */
    protected evolveState(): StateVector {
        return this.applyCoinAndShift(this.state!);
    }

    /**
     * Update configuration
     */
    updateConfig(coin?: QuantumWalk1DCoin, boundary?: QuantumWalk1DBoundary, theta?: number): void {
        if (coin !== undefined) this.coinType = coin;
        if (boundary !== undefined) this.boundaryType = boundary;
        if (theta !== undefined) this.theta = theta;
        
        // Rebuild operators if state is initialized
        if (this.state) {
            this.coinOp = this.buildCoinOperator();
            this.shiftOp = this.buildShiftOperator();
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): { coinType: QuantumWalk1DCoin; boundaryType: QuantumWalk1DBoundary; theta: number } {
        return {
            coinType: this.coinType,
            boundaryType: this.boundaryType,
            theta: this.theta
        };
    }
}