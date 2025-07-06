/**
 * Basic types for 2D quantum random walks
 */

import { IStateVector } from '../../core/types';

/**
 * 2D position on lattice
 */
export interface Position2D {
  x: number;
  y: number;
}

/**
 * Coin state directions
 */
export enum CoinDirection {
  UP = 0,
  DOWN = 1,
  LEFT = 2,
  RIGHT = 3
}

/**
 * Quantum walk interface
 */
export interface IQuantumWalk2D {
  step(): void;
  evolve(steps: number): IStateVector;
  getPositionDistribution(): Map<string, number>;
}
