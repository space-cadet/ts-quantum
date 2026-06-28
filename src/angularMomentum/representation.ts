/**
 * SU(2) representation matrices D^j(g) and character functions
 * 
 * Provides the irreducible representations of SU(2) for arbitrary spin j,
 * including Wigner D-matrices, characters, and state rotation operations.
 */

import { Complex, IOperator } from '../core/types';
import * as math from 'mathjs';
import { 
  SU2Element, 
  multiplySU2, 
  inverseSU2,
  rotationAngle,
  dimensionSU2 
} from './su2';
import { 
  createJplus, 
  createJminus, 
  createJz 
} from './core';
import { MatrixOperator } from '../operators/operator';
import { StateVector } from '../states/stateVector';
import { matrixExponential } from '../utils/matrixOperations';

/**
 * Computes the Wigner D-matrix D^j(g) for an arbitrary SU(2) element g.
 * 
 * For g = (a, b), the matrix elements are:
 * D^j_{m',m}(g) = ⟨j,m'|D(g)|j,m⟩
 * 
 * We construct this using the Euler angle decomposition:
 * D^j(α,β,γ) = exp(-iαJz) * d^j(β) * exp(-iγJz)
 * 
 * where d^j(β) is the reduced Wigner d-matrix.
 * 
 * @param j Total angular momentum (spin)
 * @param g SU(2) group element
 * @returns (2j+1) × (2j+1) complex matrix representing D^j(g)
 */
export function representationMatrix(
  j: number, 
  g: SU2Element
): Complex[][] {
  const dim = dimensionSU2(j);
  const { alpha, beta, gamma } = su2ToEulerAngles(g);
  
  // D^j(α,β,γ) = e^{-iαJz} * d^j(β) * e^{-iγJz}
  const expAlpha = diagonalPhaseMatrix(j, -alpha);
  const dMatrix = reducedWignerMatrix(j, beta);
  const expGamma = diagonalPhaseMatrix(j, -gamma);
  
  // Multiply: expAlpha * dMatrix * expGamma
  const temp = multiplyComplexMatrices(expAlpha, dMatrix);
  return multiplyComplexMatrices(temp, expGamma);
}

/**
 * Alias for representationMatrix - Wigner D-matrix
 * 
 * @param j Total angular momentum (spin)
 * @param g SU(2) group element
 * @returns Wigner D-matrix D^j(g)
 */
export function wignerD(
  j: number, 
  g: SU2Element
): Complex[][] {
  return representationMatrix(j, g);
}

/**
 * Computes the character (trace) of the SU(2) representation with spin j
 * 
 * χ^j(g) = Tr(D^j(g)) = sin((2j+1)θ/2) / sin(θ/2)
 * where θ is the rotation angle.
 * 
 * For θ → 0: χ^j(0) = 2j + 1 (the dimension)
 * 
 * @param j Total angular momentum (spin)
 * @param g SU(2) group element
 * @returns Character value χ^j(g)
 */
export function characterSU2(j: number, g: SU2Element): number {
  const theta = rotationAngle(g);
  
  if (Math.abs(theta) < 1e-10) {
    // Limit as θ → 0: χ^j(0) = 2j + 1
    return dimensionSU2(j);
  }
  
  const numerator = Math.sin((2 * j + 1) * theta / 2);
  const denominator = Math.sin(theta / 2);
  
  return numerator / denominator;
}

/**
 * Computes the SU(2) character directly from rotation angle
 * More efficient than characterSU2 when θ is already known
 * 
 * @param j Total angular momentum (spin)
 * @param theta Rotation angle in radians
 * @returns Character value χ^j(θ)
 */
export function characterAngle(j: number, theta: number): number {
  if (Math.abs(theta) < 1e-10) {
    return dimensionSU2(j);
  }
  
  const numerator = Math.sin((2 * j + 1) * theta / 2);
  const denominator = Math.sin(theta / 2);
  
  return numerator / denominator;
}

/**
 * Applies an SU(2) rotation to an angular momentum state |j,m⟩
 * 
 * |ψ'⟩ = D^j(g)|j,m⟩
 * 
 * @param g SU(2) group element
 * @param j Total angular momentum
 * @param m Magnetic quantum number
 * @returns Rotated state as StateVector
 */
export function rotateState(
  g: SU2Element,
  j: number,
  m: number
): StateVector {
  const dim = dimensionSU2(j);
  const D = representationMatrix(j, g);
  
  // Initial state |j,m⟩ has amplitude 1 at index corresponding to m
  // Index mapping: idx = j - m (for m from -j to +j)
  const initialIdx = j - m;
  
  // Apply D^j(g): new_amplitude[m'] = Σ_m D^j_{m',m}(g) * amplitude[m]
  const newAmplitudes: Complex[] = [];
  for (let mp = 0; mp < dim; mp++) {
    let sum = math.complex(0, 0) as Complex;
    for (let mIdx = 0; mIdx < dim; mIdx++) {
      sum = math.add(sum, math.multiply(D[mp][mIdx], mIdx === initialIdx ? math.complex(1, 0) : math.complex(0, 0))) as Complex;
    }
    newAmplitudes.push(sum);
  }
  
  return new StateVector(dim, newAmplitudes, `D^${j}(g)|${j},${m}⟩`);
}

/**
 * Computes the reduced Wigner d-matrix d^j(β)
 * 
 * d^j_{m',m}(β) = ⟨j,m'|exp(-iβJy)|j,m⟩
 * 
 * Uses the explicit formula:
 * d^j_{m',m}(β) = Σ_k (-1)^k * sqrt[(j+m)!(j-m)!(j+m')!(j-m')!] / 
 *   [(j+m-k)!(j-m'-k)!k!(k+m'-m)!] * (cos(β/2))^{2j+m-m'-2k} * (sin(β/2))^{m'-m+2k}
 * 
 * @param j Total angular momentum
 * @param beta Rotation angle about y-axis
 * @returns Reduced Wigner d-matrix
 */
export function reducedWignerMatrix(
  j: number, 
  beta: number
): Complex[][] {
  const dim = dimensionSU2(j);
  const halfBeta = beta / 2;
  const cosHalf = Math.cos(halfBeta);
  const sinHalf = Math.sin(halfBeta);
  
  const matrix: Complex[][] = [];
  
  for (let mp = 0; mp < dim; mp++) {
    const mPrime = j - mp; // m' ranges from j to -j
    const row: Complex[] = [];
    
    for (let m = 0; m < dim; m++) {
      const mVal = j - m; // m ranges from j to -j
      
      // Compute d^j_{m',m}(β) using the sum formula
      let sum = 0;
      
      // k ranges such that all factorial arguments are non-negative
      const kMin = Math.max(0, Math.round(mVal - mPrime));
      const kMax = Math.min(
        Math.round(j + mVal),
        Math.round(j - mPrime)
      );
      
      for (let k = kMin; k <= kMax; k++) {
        const sign = Math.pow(-1, k);
        
        // Binomial-like coefficients
        const num = factorial(j + mVal) * factorial(j - mVal) * 
                    factorial(j + mPrime) * factorial(j - mPrime);
        const den = factorial(j + mVal - k) * factorial(j - mPrime - k) * 
                    factorial(k) * factorial(k + mPrime - mVal);
        
        const coeff = Math.sqrt(num / den);
        
        // Angular dependence
        const cosPower = 2 * j + mVal - mPrime - 2 * k;
        const sinPower = mPrime - mVal + 2 * k;
        
        const angular = Math.pow(cosHalf, cosPower) * Math.pow(sinHalf, sinPower);
        
        sum += sign * coeff * angular;
      }
      
      row.push(math.complex(sum, 0) as Complex);
    }
    
    matrix.push(row);
  }
  
  return matrix;
}

/**
 * Creates a diagonal phase matrix exp(-iφJz) for angular momentum j
 * 
 * ⟨j,m'|exp(-iφJz)|j,m⟩ = δ_{m',m} * e^{-iφm}
 * 
 * @param j Total angular momentum
 * @param phi Phase angle
 * @returns Diagonal complex matrix
 */
function diagonalPhaseMatrix(j: number, phi: number): Complex[][] {
  const dim = dimensionSU2(j);
  const matrix: Complex[][] = [];
  
  for (let i = 0; i < dim; i++) {
    const row: Complex[] = [];
    const m = j - i; // m ranges from j to -j
    
    for (let j_idx = 0; j_idx < dim; j_idx++) {
      if (i === j_idx) {
        const phase = math.complex(Math.cos(-phi * m), Math.sin(-phi * m)) as Complex;
        row.push(phase);
      } else {
        row.push(math.complex(0, 0) as Complex);
      }
    }
    
    matrix.push(row);
  }
  
  return matrix;
}

/**
 * Multiplies two complex matrices
 * 
 * @param A First matrix
 * @param B Second matrix
 * @returns Product A * B
 */
function multiplyComplexMatrices(A: Complex[][], B: Complex[][]): Complex[][] {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  
  const result: Complex[][] = [];
  
  for (let i = 0; i < rowsA; i++) {
    const row: Complex[] = [];
    for (let j = 0; j < colsB; j++) {
      let sum = math.complex(0, 0) as Complex;
      for (let k = 0; k < colsA; k++) {
        sum = math.add(sum, math.multiply(A[i][k], B[k][j])) as Complex;
      }
      row.push(sum);
    }
    result.push(row);
  }
  
  return result;
}

/**
 * Converts SU(2) element to Euler angles (α, β, γ)
 * Internal helper for representationMatrix
 * 
 * @param g SU(2) element
 * @returns Euler angles
 */
function su2ToEulerAngles(g: SU2Element): { alpha: number; beta: number; gamma: number } {
  const a = g.a;
  const b = g.b;
  
  // beta from |b| = sin(β/2)
  const sinHalfBeta = Math.sqrt((b as any).re ** 2 + (b as any).im ** 2);
  const cosHalfBeta = Math.sqrt((a as any).re ** 2 + (a as any).im ** 2);
  
  const sinBeta = 2 * sinHalfBeta * cosHalfBeta;
  const beta = Math.asin(Math.max(-1, Math.min(1, sinBeta)));
  
  if (sinHalfBeta < 1e-10) {
    // beta ≈ 0
    const angle = -2 * Math.atan2((a as any).im, (a as any).re);
    return { alpha: angle, beta: 0, gamma: 0 };
  }
  
  if (cosHalfBeta < 1e-10) {
    // beta ≈ π
    const angle = -2 * Math.atan2((b as any).im, (b as any).re);
    return { alpha: angle, beta: Math.PI, gamma: 0 };
  }
  
  const halfSum = Math.atan2(-(a as any).im, (a as any).re);
  const halfDiff = Math.atan2((b as any).im, (b as any).re);
  
  return {
    alpha: halfSum + halfDiff,
    beta,
    gamma: halfSum - halfDiff
  };
}

/**
 * Simple factorial function for small integers
 * Uses exact arithmetic (no approximation needed for j ≤ 10)
 * 
 * @param n Non-negative integer
 * @returns n!
 */
function factorial(n: number): number {
  if (n < 0) throw new Error('Factorial of negative number');
  if (n === 0 || n === 1) return 1;
  
  let result = 1;
  for (let i = 2; i <= n; i++) {
    result *= i;
  }
  return result;
}

/**
 * Creates a Wigner D-matrix as an IOperator for composition with other operators
 * 
 * @param j Total angular momentum
 * @param g SU(2) group element
 * @returns MatrixOperator wrapping D^j(g)
 */
export function wignerDOperator(j: number, g: SU2Element): IOperator {
  const matrix = representationMatrix(j, g);
  return new MatrixOperator(matrix, 'unitary', true, { j, su2: g });
}
