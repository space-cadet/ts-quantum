/**
 * Volume Operator for Intertwiner Spaces
 * 
 * Implements the volume operator Q̂ for n-valent spin network vertices.
 * The volume operator measures the quantum volume at a vertex and is
 * central to Loop Quantum Gravity's geometric interpretation.
 */

import { StateVector } from '../states/stateVector';
import { IntertwinerBasisState, IntertwinerSpace } from './types';
import * as math from 'mathjs';

/**
 * Construct the volume operator matrix in a given intertwiner basis
 * 
 * The volume operator for an n-valent vertex is:
 * Q̂ = Σ_{i<j<k} ε_{ijk} J_i · (J_j × J_k)
 * 
 * For practical computation, we use the simplified form:
 * Q̂_{αβ} = ⟨Φ_α| Q̂ |Φ_β⟩
 * 
 * @param intertwinerSpace Intertwiner space with basis states
 * @returns Real symmetric matrix Q[i][j] = ⟨Φ_i|Q̂|Φ_j⟩
 */
export function buildVolumeOperatorMatrix(intertwinerSpace: IntertwinerSpace): number[][] {
  const { basisStates, dimension } = intertwinerSpace;
  
  if (dimension === 0) {
    return [];
  }
  
  // Initialize matrix
  const Q: number[][] = Array(dimension).fill(0).map(() => Array(dimension).fill(0));
  
  // Compute matrix elements Q_{ab} = <Φ_a| Q̂ |Φ_b>
  for (let a = 0; a < dimension; a++) {
    for (let b = 0; b < dimension; b++) {
      Q[a][b] = volumeMatrixElement(basisStates[a], basisStates[b]);
    }
  }
  
  // Symmetrize (numerical errors may break exact symmetry)
  for (let i = 0; i < dimension; i++) {
    for (let j = i + 1; j < dimension; j++) {
      const sym = (Q[i][j] + Q[j][i]) / 2;
      Q[i][j] = sym;
      Q[j][i] = sym;
    }
  }
  
  return Q;
}

/**
 * Compute single matrix element ⟨Φ_a|Q̂|Φ_b⟩
 * 
 * For the volume operator, we use the fact that:
 * Q̂|Φ⟩ = i * Σ_{i<j<k} J_i · (J_j × J_k) |Φ⟩
 * 
 * In the intertwiner basis (j=0), this simplifies to:
 * Q̂ = c * (L_+ - L_-) where L_± are ladder operators
 */
function volumeMatrixElement(stateA: IntertwinerBasisState, stateB: IntertwinerBasisState): number {
  const vecA = stateA.stateVector;
  const vecB = stateB.stateVector;
  
  // For the simplest case (4-valent, j=1/2), the volume operator
  // acts as: Q̂ = (i/4) * [J_1 · (J_2 × J_3) + cyclic permutations]
  // 
  // In the |Φ_1⟩, |Φ_2⟩ basis, this becomes:
  // Q̂ = (i * l_P^3 / 4) * σ_y (Pauli Y matrix)
  //
  // For now, return a placeholder that preserves the structure.
  // Full implementation requires angular momentum operator action.
  
  const dim = vecA.dimension;
  if (dim !== vecB.dimension) {
    throw new Error('State vectors must have same dimension');
  }
  
  // Compute ⟨Φ_a|Q̂|Φ_b⟩ by acting with Q̂ on |Φ_b⟩ and projecting onto ⟨Φ_a|
  // TODO: Full implementation using angular momentum operator matrix elements
  
  // For j=1/2, 4-valent: volume operator is proportional to i*σ_y in the 2D basis
  // This gives Q_{12} = -Q_{21} = i * constant, which is purely imaginary
  // But the matrix element as defined should be real, so we need to reconsider
  
  return 0;  // Placeholder - will be implemented with proper J_i operators
}

/**
 * Diagonalize a real symmetric matrix
 * 
 * Uses Jacobi eigenvalue algorithm for robustness with small matrices
 * (typical intertwiner dimensions are ≤ 10)
 * 
 * @param matrix Real symmetric matrix
 * @returns Eigenvalues (sorted ascending) and eigenvectors (columns)
 */
export function diagonalizeSymmetric(matrix: number[][]): {
  eigenvalues: number[];
  eigenvectors: number[][];
} {
  const n = matrix.length;
  
  if (n === 0) {
    return { eigenvalues: [], eigenvectors: [] };
  }
  
  // Copy matrix (will be destroyed during algorithm)
  let A = matrix.map(row => [...row]);
  
  // Initialize eigenvector matrix as identity
  let V = Array(n).fill(0).map((_, i) => 
    Array(n).fill(0).map((_, j) => i === j ? 1 : 0)
  );
  
  // Jacobi sweeps
  const maxSweeps = 100;
  const tolerance = 1e-15;
  
  for (let sweep = 0; sweep < maxSweeps; sweep++) {
    let maxOffDiag = 0;
    let p = 0, q = 0;
    
    // Find largest off-diagonal element
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (Math.abs(A[i][j]) > maxOffDiag) {
          maxOffDiag = Math.abs(A[i][j]);
          p = i;
          q = j;
        }
      }
    }
    
    if (maxOffDiag < tolerance) break;
    
    // Compute Jacobi rotation
    const app = A[p][p];
    const aqq = A[q][q];
    const apq = A[p][q];
    
    const phi = 0.5 * Math.atan2(2 * apq, aqq - app);
    const c = Math.cos(phi);
    const s = Math.sin(phi);
    
    // Apply rotation to A
    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const aip = A[i][p];
        const aiq = A[i][q];
        A[i][p] = c * aip - s * aiq;
        A[p][i] = A[i][p];
        A[i][q] = c * aiq + s * aip;
        A[q][i] = A[i][q];
      }
    }
    
    A[p][p] = c * c * app - 2 * c * s * apq + s * s * aqq;
    A[q][q] = s * s * app + 2 * c * s * apq + c * c * aqq;
    A[p][q] = 0;
    A[q][p] = 0;
    
    // Apply rotation to V
    for (let i = 0; i < n; i++) {
      const vip = V[i][p];
      const viq = V[i][q];
      V[i][p] = c * vip - s * viq;
      V[i][q] = c * viq + s * vip;
    }
  }
  
  // Extract eigenvalues
  const eigenvalues: number[] = [];
  for (let i = 0; i < n; i++) {
    eigenvalues.push(A[i][i]);
  }
  
  // Sort eigenvalues and eigenvectors by eigenvalue
  const indexed = eigenvalues.map((val, i) => ({ val, index: i }));
  indexed.sort((a, b) => a.val - b.val);
  
  const sortedEigenvalues = indexed.map(item => item.val);
  const sortedEigenvectors = indexed.map(item => 
    V.map(row => row[item.index])
  );
  
  return {
    eigenvalues: sortedEigenvalues,
    eigenvectors: sortedEigenvectors
  };
}

/**
 * Check if eigenvalue spectrum has Z₂ sign-flip structure (±q degeneracy)
 * 
 * For a Z₂ symmetric volume operator, eigenvalues come in pairs ±q.
 * This is a key diagnostic for the manuscript's central claim.
 * 
 * @param eigenvalues Sorted eigenvalue array
 * @param tolerance Numerical tolerance for degeneracy check
 * @returns True if spectrum shows ±q pairs
 */
export function checkZ2Structure(eigenvalues: number[], tolerance: number = 1e-10): boolean {
  if (eigenvalues.length === 0) return true;
  
  // Sort by absolute value to pair ±q
  const sortedByAbs = [...eigenvalues].sort((a, b) => Math.abs(a) - Math.abs(b));
  
  for (let i = 0; i < sortedByAbs.length - 1; i += 2) {
    const q1 = sortedByAbs[i];
    const q2 = sortedByAbs[i + 1];
    
    // Check if q2 ≈ -q1
    if (Math.abs(q1 + q2) > tolerance * Math.max(Math.abs(q1), 1)) {
      return false;
    }
  }
  
  // If odd number of eigenvalues, the last one should be ~0
  if (sortedByAbs.length % 2 === 1) {
    const last = sortedByAbs[sortedByAbs.length - 1];
    if (Math.abs(last) > tolerance) {
      return false;
    }
  }
  
  return true;
}

/**
 * Compute the volume spectrum for an n-valent intertwiner
 * 
 * Convenience function that constructs the volume operator,
 * diagonalizes it, and returns the spectrum with Z₂ diagnostic.
 * 
 * @param intertwinerSpace Intertwiner space
 * @returns Spectrum and diagnostic info
 */
export function computeVolumeSpectrum(intertwinerSpace: IntertwinerSpace): {
  eigenvalues: number[];
  eigenvectors: number[][];
  hasZ2Structure: boolean;
  dimension: number;
} {
  const Q = buildVolumeOperatorMatrix(intertwinerSpace);
  const { eigenvalues, eigenvectors } = diagonalizeSymmetric(Q);
  const hasZ2Structure = checkZ2Structure(eigenvalues);
  
  return {
    eigenvalues,
    eigenvectors,
    hasZ2Structure,
    dimension: intertwinerSpace.dimension
  };
}
