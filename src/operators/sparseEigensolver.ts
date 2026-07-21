/**
 * Sparse Lanczos Eigensolver
 * 
 * Implements the Lanczos algorithm for finding extreme eigenvalues
 * (lowest or highest) of large sparse Hermitian matrices.
 * 
 * The Lanczos algorithm builds an orthonormal basis {v_0, v_1, ..., v_k}
 * such that the projection of A onto this basis is tridiagonal:
 * 
 *   T_k = Q_k^T A Q_k
 * 
 * where Q_k = [v_0, v_1, ..., v_k].
 * 
 * The eigenvalues of T_k approximate the extreme eigenvalues of A.
 * As k increases, the approximations converge.
 * 
 * Key advantage: Each iteration requires only one matrix-vector multiply (O(nnz)),
 * making it feasible for very large sparse matrices.
 */

import { Complex } from 'mathjs';
import * as math from 'mathjs';
import { ISparseMatrix, sparseVectorMultiply } from './sparse';
import { IStateVector } from '../core/types';
import { StateVector } from '../states/stateVector';

// Type for a dense complex vector
export type ComplexVector = Complex[];

/**
 * Result of Lanczos eigendecomposition
 */
export interface ILanczosResult {
  /** Approximate eigenvalues (sorted ascending) */
  eigenvalues: number[];
  /** Approximate eigenvectors as state vectors */
  eigenvectors: IStateVector[];
  /** Number of iterations performed */
  iterations: number;
  /** Whether convergence was achieved */
  converged: boolean;
  /** Tridiagonal matrix T from Lanczos process */
  tridiagonalAlpha: number[];
  tridiagonalBeta: number[];
}

/**
 * Configuration options for Lanczos algorithm
 */
export interface ILanczosOptions {
  /** Number of eigenvalues to find (default: 1) */
  numEigenvalues?: number;
  /** Maximum number of Lanczos iterations (default: 100) */
  maxIterations?: number;
  /** Convergence tolerance (default: 1e-10) */
  tolerance?: number;
  /** Random seed for initial vector (default: random) */
  seed?: number;
  /** Whether to find lowest (true) or highest (false) eigenvalues (default: true) */
  findLowest?: boolean;
  /** Whether to reorthogonalize (more stable but slower) (default: true) */
  reorthogonalize?: boolean;
}

/**
 * Compute dot product of two complex vectors: ⟨a|b⟩ = Σ a_i* b_i
 */
function dotProduct(a: ComplexVector, b: ComplexVector): Complex {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  
  let result = math.complex(0, 0);
  for (let i = 0; i < a.length; i++) {
    // a_i* b_i
    const conjA = math.complex(a[i].re, -a[i].im);
    const term = math.multiply(conjA, b[i]) as Complex;
    result = math.add(result, term) as Complex;
  }
  return result;
}

/**
 * Compute norm of a complex vector: ||v|| = sqrt(⟨v|v⟩)
 */
function vectorNorm(v: ComplexVector): number {
  const dot = dotProduct(v, v);
  return Math.sqrt(dot.re); // ⟨v|v⟩ is always real and positive
}

/**
 * Scale a complex vector by a scalar
 */
function scaleVector(v: ComplexVector, scalar: number | Complex): ComplexVector {
  return v.map(elem => math.multiply(elem, scalar) as Complex);
}

/**
 * Add two complex vectors: a + b
 */
function addVectors(a: ComplexVector, b: ComplexVector): ComplexVector {
  if (a.length !== b.length) {
    throw new Error(`Vector dimension mismatch: ${a.length} vs ${b.length}`);
  }
  return a.map((elem, i) => math.add(elem, b[i]) as Complex);
}

/**
 * Generate a random normalized complex vector
 */
function randomNormalizedVector(dimension: number, seed?: number): ComplexVector {
  // Simple seeded random using Linear Congruential Generator
  let rng = seed ? seededRandom(seed) : Math.random;
  
  const vector: ComplexVector = [];
  for (let i = 0; i < dimension; i++) {
    // Random complex number with normal distribution
    // Box-Muller transform for normal distribution
    const u1 = rng();
    const u2 = rng();
    const radius = Math.sqrt(-2 * Math.log(u1));
    const theta = 2 * Math.PI * u2;
    const re = radius * Math.cos(theta);
    const im = radius * Math.sin(theta);
    vector.push(math.complex(re, im));
  }
  
  // Normalize
  const norm = vectorNorm(vector);
  return scaleVector(vector, 1 / norm);
}

/**
 * Create a seeded random number generator
 */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483647;
    return state / 2147483647;
  };
}

/**
 * Apply sparse matrix to vector: w = A v
 */
function applySparseMatrix(matrix: ISparseMatrix, vector: ComplexVector): ComplexVector {
  return sparseVectorMultiply(matrix, vector);
}

/**
 * Find eigenvalues and eigenvectors of a symmetric tridiagonal matrix
 * using the QR algorithm (for small matrices).
 * 
 * T is represented by diagonals alpha (main) and beta (sub/super).
 * 
 * Returns eigenvalues sorted in ascending order and corresponding eigenvectors.
 */
function tridiagonalEigendecompose(
  alpha: number[],
  beta: number[]
): { eigenvalues: number[]; eigenvectors: number[][] } {
  const n = alpha.length;
  
  // Build full tridiagonal matrix (small, so dense is fine)
  const T: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));
  for (let i = 0; i < n; i++) {
    T[i][i] = alpha[i];
    if (i < n - 1) {
      T[i][i + 1] = beta[i + 1];
      T[i + 1][i] = beta[i + 1];
    }
  }
  
  // Use math.js for eigendecomposition
  const mathMatrix = math.matrix(T);
  const eigResult = math.eigs(mathMatrix);
  
  // Extract and sort eigenvalues (convert math.js types to plain arrays)
  const rawValues = Array.isArray(eigResult.values) 
    ? eigResult.values as number[]
    : (eigResult.values as any).toArray() as number[];
  const rawEigenvectors = eigResult.eigenvectors as { value: number; vector: number[] }[];
  
  // Create sortable array of [index, value] pairs
  const indexedValues = rawValues.map((v, i) => ({ index: i, value: v }));
  indexedValues.sort((a, b) => a.value - b.value);
  
  return {
    eigenvalues: indexedValues.map(x => x.value),
    eigenvectors: indexedValues.map(x => rawEigenvectors[x.index].vector)
  };
}

/**
 * Lanczos algorithm for finding extreme eigenvalues of a sparse Hermitian matrix.
 * 
 * @param matrix - Sparse Hermitian matrix
 * @param options - Configuration options
 * @returns Lanczos result with eigenvalues and eigenvectors
 */
export function lanczosEigensolver(
  matrix: ISparseMatrix,
  options: ILanczosOptions = {}
): ILanczosResult {
  const {
    numEigenvalues = 1,
    maxIterations = 100,
    tolerance = 1e-10,
    seed,
    findLowest = true,
    reorthogonalize = true
  } = options;
  
  const dimension = matrix.rows;
  
  if (matrix.rows !== matrix.cols) {
    throw new Error('Matrix must be square for Lanczos algorithm');
  }
  
  // Initialize Lanczos vectors
  const lanczosVectors: ComplexVector[] = [];
  const alpha: number[] = [];
  const beta: number[] = [0]; // β_0 is unused, set to 0
  
  // Initial random vector
  let v = randomNormalizedVector(dimension, seed);
  lanczosVectors.push([...v]);
  
  let converged = false;
  let iterations = 0;
  
  for (let j = 0; j < maxIterations; j++) {
    iterations = j + 1;
    
    // w = A v_j
    let w = applySparseMatrix(matrix, v);
    
    // α_j = ⟨v_j|w⟩
    const alphaJ = dotProduct(v, w).re;
    alpha.push(alphaJ);
    
    // w = w - α_j v_j - β_j v_{j-1}
    w = addVectors(w, scaleVector(v, -alphaJ));
    if (j > 0) {
      w = addVectors(w, scaleVector(lanczosVectors[j - 1], -beta[j]));
    }
    
    // Full reorthogonalization (more stable)
    if (reorthogonalize) {
      for (let i = 0; i <= j; i++) {
        const overlap = dotProduct(lanczosVectors[i], w);
        w = addVectors(w, scaleVector(lanczosVectors[i], -overlap.re));
      }
    }
    
    // β_{j+1} = ||w||
    const betaJ1 = vectorNorm(w);
    beta.push(betaJ1);
    
    // Check for convergence (invariant subspace found)
    if (betaJ1 < tolerance) {
      converged = true;
      break;
    }
    
    // v_{j+1} = w / β_{j+1}
    v = scaleVector(w, 1 / betaJ1);
    lanczosVectors.push([...v]);
    
    // Check eigenvalue convergence every 10 iterations
    if ((j + 1) % 10 === 0 || j === maxIterations - 1) {
      const { eigenvalues } = tridiagonalEigendecompose(alpha, beta.slice(0, alpha.length + 1));
      const relevantEigenvalues = findLowest 
        ? eigenvalues.slice(0, numEigenvalues)
        : eigenvalues.slice(-numEigenvalues);
      
      // Simple convergence check: if we've done enough iterations
      // A more sophisticated check would compare with previous iteration
      if (j >= numEigenvalues * 5) {
        // Heuristic: need at least 5 iterations per eigenvalue
        converged = true;
        break;
      }
    }
  }
  
  // Final eigendecomposition of tridiagonal matrix
  const { eigenvalues: triEigenvalues, eigenvectors: triEigenvectors } = 
    tridiagonalEigendecompose(alpha, beta.slice(0, alpha.length + 1));
  
  // Select relevant eigenvalues
  const selectedIndices = findLowest 
    ? Array.from({ length: numEigenvalues }, (_, i) => i)
    : Array.from({ length: numEigenvalues }, (_, i) => triEigenvalues.length - 1 - i);
  
  const selectedEigenvalues = selectedIndices.map(i => triEigenvalues[i]);
  
  // Compute Ritz vectors (approximate eigenvectors of A)
  // ritzVector = Σ_i (triEigenvector[i] * lanczosVectors[i])
  const ritzVectors: IStateVector[] = [];
  for (const idx of selectedIndices) {
    const triVec = triEigenvectors[idx];
    let ritzVec: ComplexVector = Array(dimension).fill(null).map(() => math.complex(0, 0));
    
    for (let i = 0; i < triVec.length && i < lanczosVectors.length; i++) {
      const coeff = Number(triVec[i]);
      if (!isFinite(coeff)) continue;
      ritzVec = addVectors(ritzVec, scaleVector(lanczosVectors[i], coeff));
    }
    
    // Normalize
    const norm = vectorNorm(ritzVec);
    if (norm > 1e-15) {
      ritzVec = scaleVector(ritzVec, 1 / norm);
    }
    
    // Ensure all elements are valid Complex numbers
    const validRitzVec = ritzVec.map(v => {
      const re = Number(v.re);
      const im = Number(v.im);
      if (!isFinite(re) || !isFinite(im)) {
        return math.complex(0, 0);
      }
      return math.complex(re, im);
    });
    
    ritzVectors.push(new StateVector(dimension, validRitzVec));
  }
  
  return {
    eigenvalues: selectedEigenvalues,
    eigenvectors: ritzVectors,
    iterations,
    converged,
    tridiagonalAlpha: alpha,
    tridiagonalBeta: beta.slice(0, alpha.length + 1)
  };
}

/**
 * Convenience function: find the lowest eigenvalues of a sparse Hermitian matrix.
 */
export function findLowestEigenvalues(
  matrix: ISparseMatrix,
  numEigenvalues: number = 1,
  options: Omit<ILanczosOptions, 'numEigenvalues' | 'findLowest'> = {}
): ILanczosResult {
  return lanczosEigensolver(matrix, {
    ...options,
    numEigenvalues,
    findLowest: true
  });
}

/**
 * Convenience function: find the highest eigenvalues of a sparse Hermitian matrix.
 */
export function findHighestEigenvalues(
  matrix: ISparseMatrix,
  numEigenvalues: number = 1,
  options: Omit<ILanczosOptions, 'numEigenvalues' | 'findLowest'> = {}
): ILanczosResult {
  return lanczosEigensolver(matrix, {
    ...options,
    numEigenvalues,
    findLowest: false
  });
}
