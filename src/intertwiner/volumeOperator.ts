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
 * For j=1/2: J_i = (1/2) σ_i (Pauli matrices)
 * 
 * @param intertwinerSpace Intertwiner space with basis states
 * @returns Real symmetric matrix Q[i][j] = ⟨Φ_i|Q̂|Φ_j⟩
 */
/**
 * Geometric embedding for n-valent vertices
 * 
 * Specifies the spatial orientation of edges and computes ε_{ijk} factors.
 * For a vertex embedded in 3D, ε_{ijk} = sign of the scalar triple product
 * of the edge direction vectors.
 */
export interface GeometricEmbedding {
  /** Edge direction vectors (unit vectors in 3D) */
  edgeDirections: number[][];
  
  /** Precomputed ε_{ijk} for all triples (i<j<k) */
  epsilonTriplets: Map<string, number>;
}

/**
 * Create a geometric embedding from edge direction vectors
 */
export function createGeometricEmbedding(directions: number[][]): GeometricEmbedding {
  const n = directions.length;
  const epsilonTriplets = new Map<string, number>();
  
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        const di = directions[i];
        const dj = directions[j];
        const dk = directions[k];
        
        // Scalar triple product: di · (dj × dk)
        const tripleProduct = 
          di[0] * (dj[1] * dk[2] - dj[2] * dk[1]) -
          di[1] * (dj[0] * dk[2] - dj[2] * dk[0]) +
          di[2] * (dj[0] * dk[1] - dj[1] * dk[0]);
        
        const eps = Math.abs(tripleProduct) < 1e-10 ? 0 : Math.sign(tripleProduct);
        epsilonTriplets.set(`${i},${j},${k}`, eps);
      }
    }
  }
  
  return { edgeDirections: directions, epsilonTriplets };
}

/**
 * Build a generic 6-valent geometric embedding (non-coplanar edges)
 */
export function buildGeneric6ValentEmbedding(): GeometricEmbedding {
  // 6 edges pointing to vertices of a triangular prism
  // This ensures non-coplanar triples
  const directions = [
    [1, 0, 0],           // edge 0: +x
    [-0.5, Math.sqrt(3)/2, 0],  // edge 1: 120° in xy
    [-0.5, -Math.sqrt(3)/2, 0], // edge 2: 240° in xy
    [0.5, Math.sqrt(3)/6, 1],   // edge 3: upper triangle
    [-0.5, Math.sqrt(3)/6, 1],  // edge 4: upper triangle
    [0, -Math.sqrt(3)/3, 1],    // edge 5: upper triangle
  ];
  
  return createGeometricEmbedding(directions);
}
export function buildVolumeOperatorMatrix(
  intertwinerSpace: IntertwinerSpace,
  embedding?: GeometricEmbedding
): number[][] {
  const { basisStates, dimension, edgeSpins } = intertwinerSpace;
  
  if (dimension === 0) {
    return [];
  }
  
  // Check if all edges have j=1/2 (our implemented case)
  const allHalf = edgeSpins.every(j => Math.abs(j - 0.5) < 1e-10);
  if (!allHalf) {
    console.warn('Volume operator implementation currently only supports j=1/2 edges');
    return Array(dimension).fill(0).map(() => Array(dimension).fill(0));
  }
  
  const n = edgeSpins.length;
  
  // Special case: 4-valent j=1/2 (well-known analytical result)
  if (n === 4 && dimension === 2) {
    // In the standard basis {|Φ_1⟩, |Φ_2⟩}:
    // The volume operator connects the two basis states.
    // Eigenvalues: ±8√3/9 (in units where l_P = 1 and γ = 1)
    const c = 8 * Math.sqrt(3) / 9;
    return [[0, c], [c, 0]];
  }
  
  // For n=5, j=1/2: no singlet subspace (odd number of half-integers)
  // Dimension should be 0, so we shouldn't reach here
  if (n === 5) {
    return [];
  }
  
  // For n=6, j=1/2: numerical computation with optional geometric embedding
  if (n === 6) {
    return computeVolumeMatrix6Valent(basisStates, embedding);
  }
  
  // Generic placeholder for other cases
  console.warn(`Volume operator for ${n}-valent j=1/2 not yet implemented`);
  return Array(dimension).fill(0).map(() => Array(dimension).fill(0));
}

/**
 * Compute volume operator matrix for 6-valent j=1/2
 * 
 * For 6-valent j=1/2, the singlet subspace has dimension 5.
 * We compute the matrix elements numerically by expanding in the full
 * tensor product basis (dimension 64) and projecting onto the singlet.
 */
function computeVolumeMatrix6Valent(
  basisStates: IntertwinerBasisState[],
  embedding?: GeometricEmbedding
): number[][] {
  const dim = basisStates.length;  // Should be 5 for 6-valent j=1/2
  const Q: number[][] = Array(dim).fill(0).map(() => Array(dim).fill(0));
  
  // For each pair of basis states, compute <Φ_a| Q̂ |Φ_b>
  // For j=1/2 in |j,m⟩ basis, Q̂ has purely imaginary matrix elements.
  // We store the imaginary part (the real part is zero).
  for (let a = 0; a < dim; a++) {
    for (let b = 0; b < dim; b++) {
      const val = computeVolumeElement6Valent(basisStates[a], basisStates[b], embedding);
      Q[a][b] = val; // val is the imaginary part of the matrix element
    }
  }
  
  return Q;
}

/**
 * Compute single volume operator matrix element for 6-valent j=1/2
 * 
 * Q̂ = Σ_{i<j<k} J_i · (J_j × J_k)  (abstract intertwiner, all signs = +1)
 * 
 * For j=1/2: J = (1/2)σ, so J_i · (J_j × J_k) = (1/8) Σ_{a,b,c} ε_{abc} σ_i^a σ_j^b σ_k^c
 * 
 * The matrix element ⟨Φ_a| Q̂ |Φ_b⟩ is computed by summing over all triples
 * and all computational basis states.
 */
function computeVolumeElement6Valent(
  stateA: IntertwinerBasisState,
  stateB: IntertwinerBasisState,
  embedding?: GeometricEmbedding
): number {
  const vecA = stateA.stateVector;
  const vecB = stateB.stateVector;
  
  if (vecA.dimension !== vecB.dimension) {
    throw new Error('State vectors must have same dimension');
  }
  
  const n = 6; // 6-valent
  const totalDim = vecA.dimension; // Should be 64 = 2^6
  
  let total = 0;
  
  // Sum over all edge triples with geometric embedding factors
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      for (let k = j + 1; k < n; k++) {
        let epsilon = 1; // default: all-positive (abstract intertwiner)
        if (embedding) {
          epsilon = embedding.epsilonTriplets.get(`${i},${j},${k}`) ?? 0;
        }
        if (epsilon === 0) continue; // coplanar triples don't contribute
        
        const contribution = epsilon * computeTripleProductElement(vecA, vecB, i, j, k, totalDim);
        total += contribution;
      }
    }
  }
  
  return total;
}

/**
 * Compute matrix element of J_i · (J_j × J_k) between two states.
 * 
 * For j=1/2, this operator only connects basis states that differ at exactly
 * 2 of the 3 edges (i,j,k). The matrix elements involve Pauli matrix overlaps.
 */
function computeTripleProductElement(
  vecA: StateVector,
  vecB: StateVector,
  i: number,
  j: number,
  k: number,
  totalDim: number
): number {
  let sumRe = 0;
  let sumIm = 0;
  
  // Iterate over all computational basis states |s⟩
  for (let s = 0; s < totalDim; s++) {
    const coeffB = vecB.amplitudes[s];
    const absB = Math.sqrt(coeffB.re * coeffB.re + coeffB.im * coeffB.im);
    if (absB < 1e-15) continue;
    
    const si = (s >> i) & 1;
    const sj = (s >> j) & 1;
    const sk = (s >> k) & 1;
    
    // Apply operator to |s⟩: only 2-flip terms contribute
    // Case 1: flips at i and j, preserve k
    if (si !== sj) {
      const sip = 1 - si;
      const sjp = 1 - sj;
      const skp = sk;
      const sPrime = (s & ~((1 << i) | (1 << j) | (1 << k))) | (sip << i) | (sjp << j) | (skp << k);
      
      const coeffA = vecA.amplitudes[sPrime];
      const me = tripleProductMatrixElement(si, sj, sk, sip, sjp, skp);
      
      // conj(coeffA) * coeffB * me
      // Let z1 = conj(coeffA) = a - ib, z2 = coeffB = c + id, z3 = me = e + if
      // z1*z2 = (ac+bd) + i(ad-bc)
      // (z1*z2)*z3 = [(ac+bd)e - (ad-bc)f] + i[(ac+bd)f + (ad-bc)e]
      const a = coeffA.re, b = coeffA.im;
      const c = coeffB.re, d = coeffB.im;
      const e = me.re, f = me.im;
      
      const termRe = (a*c + b*d)*e - (a*d - b*c)*f;
      const termIm = (a*c + b*d)*f + (a*d - b*c)*e;
      
      sumRe += termRe;
      sumIm += termIm;
    }
    
    // Case 2: flips at i and k, preserve j
    if (si !== sk) {
      const sip = 1 - si;
      const sjp = sj;
      const skp = 1 - sk;
      const sPrime = (s & ~((1 << i) | (1 << j) | (1 << k))) | (sip << i) | (sjp << j) | (skp << k);
      
      const coeffA = vecA.amplitudes[sPrime];
      const me = tripleProductMatrixElement(si, sj, sk, sip, sjp, skp);
      
      const a = coeffA.re, b = coeffA.im;
      const c = coeffB.re, d = coeffB.im;
      const e = me.re, f = me.im;
      
      const termRe = (a*c + b*d)*e - (a*d - b*c)*f;
      const termIm = (a*c + b*d)*f + (a*d - b*c)*e;
      
      sumRe += termRe;
      sumIm += termIm;
    }
    
    // Case 3: flips at j and k, preserve i
    if (sj !== sk) {
      const sip = si;
      const sjp = 1 - sj;
      const skp = 1 - sk;
      const sPrime = (s & ~((1 << i) | (1 << j) | (1 << k))) | (sip << i) | (sjp << j) | (skp << k);
      
      const coeffA = vecA.amplitudes[sPrime];
      const me = tripleProductMatrixElement(si, sj, sk, sip, sjp, skp);
      
      const a = coeffA.re, b = coeffA.im;
      const c = coeffB.re, d = coeffB.im;
      const e = me.re, f = me.im;
      
      const termRe = (a*c + b*d)*e - (a*d - b*c)*f;
      const termIm = (a*c + b*d)*f + (a*d - b*c)*e;
      
      sumRe += termRe;
      sumIm += termIm;
    }
  }
  
  // The triple product operator in |j,m⟩ basis has purely imaginary matrix elements.
  // For Hermitian operators in a real basis, the matrix is purely imaginary antisymmetric.
  // We return the imaginary part here; the real part is zero.
  return sumIm;
}

/**
 * Compute the matrix element ⟨s'| J_i·(J_j×J_k) |s⟩ for a single pair of
 * computational basis states that differ at exactly 2 of the 3 positions.
 * 
 * Returns the complex matrix element. For j=1/2, this is purely imaginary.
 */
function tripleProductMatrixElement(
  si: number, sj: number, sk: number,
  sip: number, sjp: number, skp: number
): { re: number; im: number } {
  // Count flips
  const flipsI = si !== sip ? 1 : 0;
  const flipsJ = sj !== sjp ? 1 : 0;
  const flipsK = sk !== skp ? 1 : 0;
  const totalFlips = flipsI + flipsJ + flipsK;
  
  if (totalFlips !== 2) {
    return { re: 0, im: 0 };
  }
  
  // Pauli matrix elements for J = (1/2)σ:
  // J^x flip: ⟨0|J^x|1⟩ = 1/2, ⟨1|J^x|0⟩ = 1/2
  // J^y flip: ⟨0|J^y|1⟩ = -i/2, ⟨1|J^y|0⟩ = i/2
  // J^z preserve: ⟨0|J^z|0⟩ = 1/2, ⟨1|J^z|1⟩ = -1/2
  
  let resultIm = 0;
  
  if (flipsI && flipsJ && !flipsK) {
    // Flips at i,j; preserve at k
    const jx_i = 0.5;
    const jy_i_coeff = (si === 0) ? 0.5 : -0.5; // coefficient of i in ⟨s'_i|J^y|s_i⟩
    
    const jx_j = 0.5;
    const jy_j_coeff = (sj === 0) ? 0.5 : -0.5;
    
    const jz_k = (sk === 0) ? 0.5 : -0.5;
    
    // J^x_i J^y_j J^z_k - J^y_i J^x_j J^z_k
    // = (1/2)(i*jy_j_coeff)(jz_k) - (i*jy_i_coeff)(1/2)(jz_k)
    resultIm = jx_i * jy_j_coeff * jz_k - jy_i_coeff * jx_j * jz_k;
    
  } else if (flipsI && !flipsJ && flipsK) {
    // Flips at i,k; preserve at j
    const jx_i = 0.5;
    const jy_i_coeff = (si === 0) ? 0.5 : -0.5;
    
    const jx_k = 0.5;
    const jy_k_coeff = (sk === 0) ? 0.5 : -0.5;
    
    const jz_j = (sj === 0) ? 0.5 : -0.5;
    
    // J^x_i J^z_j J^y_k - J^y_i J^z_j J^x_k
    // ε_{xzy} = -1, ε_{yzx} = +1? Let me use the direct formula.
    // O = J^x_i J^y_j J^z_k - J^y_i J^x_j J^z_k + J^y_i J^z_j J^x_k - J^z_i J^y_j J^x_k + J^z_i J^x_j J^y_k - J^x_i J^z_j J^y_k
    // For flips at i,k and preserve at j: a∈{x,y}, c∈{x,y}, b=z
    // Non-zero terms: J^x_i J^z_j J^y_k (ε_{xzy}=-1) and J^y_i J^z_j J^x_k (ε_{yzx}=+1?)
    // ε_{x z y} = -ε_{x y z} = -1
    // ε_{y z x} = +ε_{y x z} = -1? No wait.
    // ε_{abc} with a=x, b=z, c=y: ε_{xzy} = -1 (odd permutation of xyz)
    // ε_{abc} with a=y, b=z, c=x: ε_{yzx} = +1 (even permutation of xyz)
    resultIm = -jx_i * jy_k_coeff * jz_j + jy_i_coeff * jz_j * jx_k;
    
  } else if (!flipsI && flipsJ && flipsK) {
    // Flips at j,k; preserve at i
    const jx_j = 0.5;
    const jy_j_coeff = (sj === 0) ? 0.5 : -0.5;
    
    const jx_k = 0.5;
    const jy_k_coeff = (sk === 0) ? 0.5 : -0.5;
    
    const jz_i = (si === 0) ? 0.5 : -0.5;
    
    // J^z_i J^x_j J^y_k - J^z_i J^y_j J^x_k
    // ε_{zxy} = +1, ε_{zyx} = -1
    resultIm = jz_i * jx_j * jy_k_coeff - jz_i * jy_j_coeff * jx_k;
  }
  
  return { re: 0, im: resultIm };
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
  let A: number[][] = matrix.map(row => [...row]);
  
  // Initialize eigenvector matrix as identity
  let V: number[][] = Array(n).fill(0).map((_, i) => 
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
/**
 * Diagonalize a real antisymmetric matrix via block-symmetric embedding
 * 
 * For real antisymmetric Q, iQ is Hermitian. We diagonalize iQ by
 * constructing the real symmetric block matrix M = [[0, Q], [-Q, 0]]
 * and extracting eigenvalues.
 */
function diagonalizeAntisymmetric(Q: number[][]): {
  eigenvalues: number[];
  eigenvectors: number[][];
} {
  const n = Q.length;
  if (n === 0) return { eigenvalues: [], eigenvectors: [] };
  
  // Check symmetry: Q should be antisymmetric
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (Math.abs(Q[i][j] + Q[j][i]) > 1e-10) {
        console.warn(`Matrix not antisymmetric at (${i},${j}): ${Q[i][j]} vs ${Q[j][i]}`);
      }
    }
  }
  
  // Construct block matrix M = [[0, Q], [-Q, 0]]
  const size = 2 * n;
  const M: number[][] = Array(size).fill(0).map(() => Array(size).fill(0));
  
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      M[i][j + n] = Q[i][j];         // top-right = Q
      M[i + n][j] = -Q[i][j];        // bottom-left = -Q
    }
  }
  
  // Diagonalize M (symmetric)
  const { eigenvalues: eigsM, eigenvectors: vecsM } = diagonalizeSymmetric(M);
  
  // Eigenvalues of M come in ± pairs with multiplicity 2
  // We need to extract eigenvalues of iQ with half the multiplicity
  const eigenvalueCounts = new Map<number, number>();
  for (const val of eigsM) {
    const rounded = Math.round(val / 1e-10) * 1e-10; // round to avoid floating point issues
    eigenvalueCounts.set(rounded, (eigenvalueCounts.get(rounded) || 0) + 1);
  }
  
  const eigenvalues: number[] = [];
  for (const [val, count] of eigenvalueCounts) {
    const halfCount = Math.round(count / 2);
    for (let i = 0; i < halfCount; i++) {
      eigenvalues.push(val);
    }
  }
  
  // Sort eigenvalues
  eigenvalues.sort((a, b) => a - b);
  
  // For eigenvectors, extract from vecsM (first n components of eigenvectors with positive eigenvalues)
  // This is a bit involved; for now, return empty eigenvectors
  const eigenvectors: number[][] = [];
  
  return { eigenvalues, eigenvectors };
}
export function checkZ2Structure(eigenvalues: number[], tolerance: number = 1e-10): boolean {
  if (eigenvalues.length === 0) return true;
  
  // Filter out exact zeros (they are their own pair)
  const nonZero = eigenvalues.filter(v => Math.abs(v) > tolerance);
  const numZeros = eigenvalues.length - nonZero.length;
  
  // Non-zero eigenvalues must pair as ±q
  // Group by absolute value
  const byAbs = new Map<number, number[]>();
  for (const v of nonZero) {
    const absVal = Math.abs(v);
    let found = false;
    for (const [key, arr] of byAbs) {
      if (Math.abs(key - absVal) < tolerance) {
        arr.push(v);
        found = true;
        break;
      }
    }
    if (!found) {
      byAbs.set(absVal, [v]);
    }
  }
  
  // Each group must have equal numbers of +q and -q
  for (const [absVal, vals] of byAbs) {
    const positive = vals.filter(v => v > 0).length;
    const negative = vals.filter(v => v < 0).length;
    if (positive !== negative) {
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
export function computeVolumeSpectrum(
  intertwinerSpace: IntertwinerSpace,
  embedding?: GeometricEmbedding
): {
  eigenvalues: number[];
  eigenvectors: number[][];
  hasZ2Structure: boolean;
  dimension: number;
} {
  const Q = buildVolumeOperatorMatrix(intertwinerSpace, embedding);
  
  // Detect if matrix is antisymmetric (for 6-valent and higher with j=1/2)
  let isAntisymmetric = false;
  if (Q.length > 0) {
    isAntisymmetric = true;
    for (let i = 0; i < Q.length; i++) {
      for (let j = 0; j < Q.length; j++) {
        if (Math.abs(Q[i][j] + Q[j][i]) > 1e-10) {
          isAntisymmetric = false;
          break;
        }
      }
      if (!isAntisymmetric) break;
    }
  }
  
  let eigenvalues: number[];
  let eigenvectors: number[][];
  
  if (isAntisymmetric) {
    const result = diagonalizeAntisymmetric(Q);
    eigenvalues = result.eigenvalues;
    eigenvectors = result.eigenvectors;
  } else {
    const result = diagonalizeSymmetric(Q);
    eigenvalues = result.eigenvalues;
    eigenvectors = result.eigenvectors;
  }
  
  const hasZ2Structure = checkZ2Structure(eigenvalues);
  
  return {
    eigenvalues,
    eigenvectors,
    hasZ2Structure,
    dimension: intertwinerSpace.dimension
  };
}
