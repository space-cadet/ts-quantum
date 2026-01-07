/**
 * Hadamard quantum walk implementation
 */

import { StateVector, MatrixOperator, SparseOperator, createSparseMatrix, setSparseEntry } from '../../../dist/index.js';
import * as math from 'mathjs';
import { BaseQuantumWalk } from './base-walk.ts';
import { QuantumWalk1DData, QuantumWalk1DBoundary } from '../core/types.ts';

export class HadamardQuantumWalk extends BaseQuantumWalk {
    /**
     * Initialize Hadamard quantum walk
     */
    initialize(latticeSize: number): QuantumWalk1DData {
        this.latticeSize = latticeSize;
        const dimension = 2 * latticeSize;

        // Create Hadamard coin operator (2×2)
        this.coinOp = this.buildCoinOperator();
        
        // Create shift operator
        this.shiftOp = this.buildShiftOperator('reflecting');
        
        // Create initial state
        this.state = this.createInitialState(dimension);
        
        // Store initial data
        const initialData = this.extractData(this.state);
        this.storeInitialData(initialData);
        
        return initialData;
    }

    /**
     * Build Hadamard coin operator
     */
    protected buildCoinOperator(): MatrixOperator {
        const hadamardMatrix: any[][] = [
            [math.complex(1 / Math.sqrt(2), 0), math.complex(1 / Math.sqrt(2), 0)],
            [math.complex(1 / Math.sqrt(2), 0), math.complex(-1 / Math.sqrt(2), 0)]
        ];
        return new MatrixOperator(hadamardMatrix, 'unitary');
    }

    /**
     * Build shift operator with reflecting boundaries
     */
    protected buildShiftOperator(boundary: QuantumWalk1DBoundary): SparseOperator {
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
}