/**
 * n-Valent Intertwiner Construction
 * 
 * Generalization of the intertwiner basis construction to arbitrary n-valent nodes.
 * Uses recursive pairwise coupling: (...((j1 ⊗ j2) ⊗ j3) ⊗ ... ⊗ jn) → 0
 */

import { StateVector } from '../states/stateVector';
import { clebschGordan } from '../angularMomentum/composition';
import { allowedIntermediateSpins, triangleInequality } from './core';
import { IntertwinerBasisState, IntertwinerSpace } from './types';
import { orthogonalizeStateVectors } from '../utils/matrixOperations';
import * as math from 'mathjs';

/**
 * Construct intertwiner space for n-valent node with equal spins j
 * 
 * @param n Valence (number of edges)
 * @param j Edge spin quantum number (same for all edges)
 * @returns Intertwiner space with orthonormal basis
 */
export function constructNValentBasis(n: number, j: number): IntertwinerSpace {
  if (n < 2) {
    throw new Error('Valence must be at least 2');
  }
  
  if (j < 0 || Math.abs(2 * j - Math.round(2 * j)) > 1e-10) {
    throw new Error('Spin j must be non-negative integer or half-integer');
  }
  
  const edgeSpins = Array(n).fill(j);
  
  // Special cases: delegate to existing optimized implementations
  if (n === 2) {
    return constructTwoValentBasis(edgeSpins);
  }
  if (n === 3) {
    return constructThreeValentBasis(edgeSpins);
  }
  if (n === 4) {
    return constructFourValentBasis(edgeSpins);
  }
  
  // General case: recursive coupling
  const basisStates = recursiveCouplingBasis(edgeSpins);
  const orthonormalBasis = orthonormalizeBasis(basisStates);
  
  return {
    dimension: orthonormalBasis.length,
    basisStates: orthonormalBasis,
    edgeSpins,
    totalJ: 0
  };
}

/**
 * Build all intertwiner basis states by recursively coupling spins pairwise
 */
function recursiveCouplingBasis(edgeSpins: number[]): IntertwinerBasisState[] {
  const n = edgeSpins.length;
  
  if (n === 2) {
    // Base case: two spins must couple to j=0
    if (Math.abs(edgeSpins[0] - edgeSpins[1]) > 1e-10) {
      return [];
    }
    return constructTwoValentBasis(edgeSpins).basisStates;
  }
  
  // Recursive case: couple first spin with (n-1)-valent intertwiner
  const j1 = edgeSpins[0];
  const remainingSpins = edgeSpins.slice(1);
  
  // Get all possible intermediate states for remaining spins
  const remainingBasis = recursiveCouplingBasis(remainingSpins);
  
  if (remainingBasis.length === 0) {
    return [];
  }
  
  // Group remaining states by their total spin
  const statesBySpin = new Map<number, IntertwinerBasisState[]>();
  for (const state of remainingBasis) {
    const j = state.intermediateJ;
    if (!statesBySpin.has(j)) {
      statesBySpin.set(j, []);
    }
    statesBySpin.get(j)!.push(state);
  }
  
  const result: IntertwinerBasisState[] = [];
  
  // For each possible total spin of remaining, couple with j1 to get j=0
  for (const [jRem, states] of statesBySpin) {
    // Check if j1 and jRem can couple to 0
    if (Math.abs(j1 - jRem) > 1e-10) {
      continue;  // Can't couple to j=0 if j1 ≠ jRem
    }
    
    // For j1 ⊗ jRem → 0 with j1 = jRem, there's exactly one coupling
    // with m1 = -mRem. The CG coefficient is (-1)^(j1 - m1) / sqrt(2j1 + 1)
    for (const state of states) {
      result.push({
        ...state,
        recouplingScheme: `${j1}⊗(${state.recouplingScheme})→0`
      });
    }
  }
  
  return result;
}

// ==================== Helpers ====================

function constructTwoValentBasis(edgeSpins: number[]): IntertwinerSpace {
  const [j1, j2] = edgeSpins;
  
  if (Math.abs(j1 - j2) > 1e-10) {
    return { dimension: 0, basisStates: [], edgeSpins: [...edgeSpins], totalJ: 0 };
  }
  
  // Identity coupling: |j,m⟩ ⊗ |j,-m⟩ / sqrt(2j+1)
  const dim = Math.floor(2 * j1 + 1);
  const totalDim = dim * dim;
  const coefficients: math.Complex[] = Array(totalDim).fill(math.complex(0, 0));
  
  for (let m = -j1; m <= j1 + 1e-10; m += 1) {
    const mIndex = Math.floor(j1 - m);
    const negMIndex = Math.floor(j1 + m);
    const cg = clebschGordan(j1, m, j1, -m, 0, 0);
    coefficients[mIndex * dim + negMIndex] = math.complex(cg.re, 0);
  }
  
  const norm = Math.sqrt(coefficients.reduce((sum, c) => sum + (math.abs(c) as unknown as number) ** 2, 0));
  const normalized = coefficients.map(c => math.divide(c, math.complex(norm, 0)) as math.Complex);
  
  const stateVector = new StateVector(totalDim, normalized as any, 'intertwiner', { dimensions: [dim, dim], tensorProduct: true });
  
  return {
    dimension: 1,
    basisStates: [{
      intermediateJ: j1,
      stateVector,
      recouplingScheme: `(${j1},${j2})→0`,
      normalization: 1.0
    }],
    edgeSpins: [...edgeSpins],
    totalJ: 0
  };
}

function constructThreeValentBasis(edgeSpins: number[]): IntertwinerSpace {
  const [j1, j2, j3] = edgeSpins;
  
  if (!triangleInequality(j1, j2, j3)) {
    return { dimension: 0, basisStates: [], edgeSpins: [...edgeSpins], totalJ: 0 };
  }
  
  // Single basis state for 3-valent
  const dims = [j1, j2, j3].map(j => Math.floor(2 * j + 1));
  const totalDim = dims.reduce((p, d) => p * d, 1);
  const coefficients: math.Complex[] = Array(totalDim).fill(math.complex(0, 0));
  
  for (let m1 = -j1; m1 <= j1 + 1e-10; m1 += 1) {
    for (let m2 = -j2; m2 <= j2 + 1e-10; m2 += 1) {
      const m3 = -(m1 + m2);
      if (Math.abs(m3) > j3 + 1e-10) continue;
      
      const cg = clebschGordan(j1, m1, j2, m2, j3, m3);
      if (math.abs(cg).re < 1e-10) continue;
      
      const i1 = Math.floor(j1 - m1);
      const i2 = Math.floor(j2 - m2);
      const i3 = Math.floor(j3 - m3);
      const index = i1 * dims[1] * dims[2] + i2 * dims[2] + i3;
      coefficients[index] = math.complex(cg.re, 0);
    }
  }
  
  const norm = Math.sqrt(coefficients.reduce((sum, c) => sum + (math.abs(c) as unknown as number) ** 2, 0));
  const normalized = coefficients.map(c => math.divide(c, math.complex(norm, 0)) as math.Complex);
  
  const stateVector = new StateVector(totalDim, normalized as any, 'intertwiner', { dimensions: dims, tensorProduct: true });
  
  return {
    dimension: 1,
    basisStates: [{
      intermediateJ: 0,
      stateVector,
      recouplingScheme: `(${j1},${j2},${j3})→0`,
      normalization: 1.0
    }],
    edgeSpins: [...edgeSpins],
    totalJ: 0
  };
}

function constructFourValentBasis(edgeSpins: number[]): IntertwinerSpace {
  // Delegate to existing basis.ts implementation for 4-valent
  const { constructBasis } = require('./basis');
  return constructBasis(edgeSpins);
}

function orthonormalizeBasis(basisStates: IntertwinerBasisState[]): IntertwinerBasisState[] {
  if (basisStates.length === 0) return [];
  
  const stateVectors = basisStates.map(s => s.stateVector);
  const orthogonalized = orthogonalizeStateVectors(stateVectors);
  
  return orthogonalized.map((vector, i) => ({
    ...basisStates[i],
    stateVector: vector as StateVector,
    normalization: 1.0
  }));
}
