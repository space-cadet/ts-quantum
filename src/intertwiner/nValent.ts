/**
 * n-Valent Intertwiner Construction
 * 
 * Generalization of the intertwiner basis construction to arbitrary n-valent nodes.
 * Uses recursive pairwise coupling for small n, and brute-force null-space method
 * for j=1/2 with n ≥ 2.
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
  
  // Quick parity check: odd number of half-integer spins cannot couple to J=0
  if (n % 2 === 1 && Math.abs(2 * j % 2 - 1) < 1e-10) {
    return { dimension: 0, basisStates: [], edgeSpins: Array(n).fill(j), totalJ: 0 };
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
  
  // For j=1/2 with n ≥ 6, use brute-force null-space method (robust and general)
  if (Math.abs(j - 0.5) < 1e-10) {
    return constructSpinHalfIntertwinerBasis(n);
  }
  
  // General case: recursive coupling (currently only works reliably for n ≤ 4)
  console.warn(`Recursive coupling for ${n}-valent j=${j} may be unreliable. Using fallback.`);
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

// ==================== Brute-Force Null-Space Method for j=1/2 ====================

/**
 * Construct intertwiner basis for n spin-1/2 edges using brute-force null-space.
 * 
 * The intertwiner space is the subspace of the full tensor product space that
 * is invariant under SU(2), i.e., states with total J=0. For j=1/2, this is
 * equivalent to the null space of the total lowering operator J_- in the M=0
 * subspace (states with equal number of up and down spins).
 * 
 * @param n Number of spin-1/2 edges (must be even)
 * @returns Intertwiner space with orthonormal basis
 */
function constructSpinHalfIntertwinerBasis(n: number): IntertwinerSpace {
  if (n % 2 !== 0) {
    return { dimension: 0, basisStates: [], edgeSpins: Array(n).fill(0.5), totalJ: 0 };
  }
  
  // Generate M=0 states (exactly n/2 up spins)
  const m0States = generateBitStrings(n, n / 2);
  const m0Dim = m0States.length; // C(n, n/2)
  
  // Generate M=-1 states (exactly n/2 - 1 up spins)
  const mMinus1States = generateBitStrings(n, n / 2 - 1);
  const mMinus1Dim = mMinus1States.length; // C(n, n/2 - 1)
  
  if (m0Dim === 0) {
    return { dimension: 0, basisStates: [], edgeSpins: Array(n).fill(0.5), totalJ: 0 };
  }
  
  // Build J_- matrix: rows = M=-1 states, cols = M=0 states
  // (J_-)_{t,s} = number of ways to flip an up spin in s to get t
  const jMinus: number[][] = Array(mMinus1Dim).fill(0).map(() => Array(m0Dim).fill(0));
  
  for (let sIdx = 0; sIdx < m0Dim; sIdx++) {
    const s = m0States[sIdx];
    for (let bit = 0; bit < n; bit++) {
      if ((s >> bit) & 1) { // spin up at position bit
        const t = s ^ (1 << bit); // flip to down
        const tIdx = findBitStringIndex(mMinus1States, t);
        if (tIdx >= 0) {
          jMinus[tIdx][sIdx] += 1;
        }
      }
    }
  }
  
  // Find null space of J_- using SVD
  const nullSpaceVectors = computeNullSpace(jMinus);
  
  // Convert to StateVectors
  const totalDim = 1 << n;
  const basisStates: IntertwinerBasisState[] = [];
  
  for (const vec of nullSpaceVectors) {
    const coeffs: math.Complex[] = Array(totalDim).fill(math.complex(0, 0));
    for (let i = 0; i < m0Dim; i++) {
      const idx = m0States[i];
      coeffs[idx] = math.complex(vec[i], 0);
    }
    
    const stateVector = new StateVector(
      totalDim,
      coeffs,
      'intertwiner',
      { dimensions: Array(n).fill(2), tensorProduct: true }
    );
    
    basisStates.push({
      intermediateJ: 0,
      stateVector: stateVector.normalize(),
      recouplingScheme: `${n}-valent j=1/2`,
      normalization: 1.0
    });
  }
  
  return {
    dimension: basisStates.length,
    basisStates,
    edgeSpins: Array(n).fill(0.5),
    totalJ: 0
  };
}

/**
 * Generate all bit strings of length n with exactly k bits set.
 */
function generateBitStrings(n: number, k: number): number[] {
  const result: number[] = [];
  
  function backtrack(pos: number, remaining: number, current: number) {
    if (remaining === 0) {
      result.push(current);
      return;
    }
    if (pos >= n) return;
    if (remaining > n - pos) return;
    
    // Set bit at pos
    backtrack(pos + 1, remaining - 1, current | (1 << pos));
    // Don't set bit at pos
    backtrack(pos + 1, remaining, current);
  }
  
  backtrack(0, k, 0);
  return result;
}

/**
 * Find index of a bit string in an array (using binary search on sorted array).
 */
function findBitStringIndex(states: number[], target: number): number {
  // Linear search is fine for small arrays
  return states.indexOf(target);
}

/**
 * Compute null space of a real matrix using Gaussian elimination.
 * Returns orthonormal basis vectors for the null space.
 */
function computeNullSpace(matrix: number[][]): number[][] {
  const m = matrix.length;
  const n = matrix[0]?.length || 0;
  
  if (m === 0 || n === 0) {
    return Array(n).fill(0).map((_, i) => 
      Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
    );
  }
  
  // Augmented matrix for solving Ax = 0
  // We'll reduce A to row echelon form
  const A: number[][] = matrix.map(row => [...row]);
  const pivotCols: number[] = [];
  let row = 0;
  
  for (let col = 0; col < n && row < m; col++) {
    // Find pivot
    let pivotRow = -1;
    let maxVal = 1e-15;
    for (let r = row; r < m; r++) {
      if (Math.abs(A[r][col]) > maxVal) {
        maxVal = Math.abs(A[r][col]);
        pivotRow = r;
      }
    }
    
    if (pivotRow === -1) continue;
    
    // Swap rows
    [A[row], A[pivotRow]] = [A[pivotRow], A[row]];
    pivotCols.push(col);
    
    // Normalize pivot row
    const pivot = A[row][col];
    for (let c = col; c < n; c++) {
      A[row][c] /= pivot;
    }
    
    // Eliminate below
    for (let r = row + 1; r < m; r++) {
      const factor = A[r][col];
      if (Math.abs(factor) > 1e-15) {
        for (let c = col; c < n; c++) {
          A[r][c] -= factor * A[row][c];
        }
      }
    }
    
    row++;
  }
  
  // Free variables = columns without pivots
  const freeCols: number[] = [];
  for (let col = 0; col < n; col++) {
    if (!pivotCols.includes(col)) {
      freeCols.push(col);
    }
  }
  
  const nullDim = freeCols.length;
  const nullSpace: number[][] = [];
  
  for (let freeIdx = 0; freeIdx < nullDim; freeIdx++) {
    const vec = Array(n).fill(0);
    const freeCol = freeCols[freeIdx];
    vec[freeCol] = 1;
    
    // Back-substitution: express pivot variables in terms of free variables
    for (let p = pivotCols.length - 1; p >= 0; p--) {
      const pivotCol = pivotCols[p];
      let sum = 0;
      for (let c = pivotCol + 1; c < n; c++) {
        sum += A[p][c] * vec[c];
      }
      vec[pivotCol] = -sum;
    }
    
    nullSpace.push(vec);
  }
  
  // Orthonormalize using Gram-Schmidt
  return orthonormalizeVectors(nullSpace);
}

/**
 * Orthonormalize a set of vectors using Gram-Schmidt.
 */
function orthonormalizeVectors(vectors: number[][]): number[][] {
  if (vectors.length === 0) return [];
  
  const result: number[][] = [];
  
  for (const v of vectors) {
    let u = [...v];
    
    // Subtract projections onto previous vectors
    for (const w of result) {
      const dot = u.reduce((sum, ui, i) => sum + ui * w[i], 0);
      u = u.map((ui, i) => ui - dot * w[i]);
    }
    
    // Normalize
    const norm = Math.sqrt(u.reduce((sum, ui) => sum + ui * ui, 0));
    if (norm > 1e-15) {
      result.push(u.map(ui => ui / norm));
    }
  }
  
  return result;
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
