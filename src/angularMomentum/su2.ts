/**
 * SU(2) group element operations and Haar measure sampling
 * 
 * SU(2) elements are represented as pairs of complex numbers (a, b) with |a|² + |b|² = 1,
 * corresponding to the matrix:
 *   [ a   -b* ]
 *   [ b    a* ]
 * 
 * This is the standard quaternion/unitary representation.
 */

import { Complex } from '../core/types';
import * as math from 'mathjs';

/**
 * SU(2) group element represented by complex parameters (a, b)
 * Satisfying |a|² + |b|² = 1
 */
export interface SU2Element {
  /** Complex parameter a */
  a: Complex;
  /** Complex parameter b */
  b: Complex;
}

/**
 * Identity element of SU(2): I = (1, 0)
 */
export const SU2_IDENTITY: SU2Element = {
  a: math.complex(1, 0) as Complex,
  b: math.complex(0, 0) as Complex
};

/**
 * Validates that an SU(2) element satisfies |a|² + |b|² = 1
 * 
 * @param g SU(2) element to validate
 * @param tolerance Numerical tolerance for unitarity check
 * @returns true if valid SU(2) element
 */
export function isValidSU2(g: SU2Element, tolerance: number = 1e-10): boolean {
  const normSq = Math.abs((g.a as any).re) ** 2 + Math.abs((g.a as any).im) ** 2 + Math.abs((g.b as any).re) ** 2 + Math.abs((g.b as any).im) ** 2;
  return Math.abs(normSq - 1.0) < tolerance;
}

/**
 * Multiplies two SU(2) elements: g1 * g2
 * 
 * For g1 = (a1, b1), g2 = (a2, b2):
 * g1 * g2 = (a1*a2 - b1*b2*, a1*b2 + b1*a2*)
 * 
 * @param g1 First SU(2) element
 * @param g2 Second SU(2) element
 * @returns Product g1 * g2
 */
export function multiplySU2(g1: SU2Element, g2: SU2Element): SU2Element {
  const a = math.subtract(
    math.multiply(g1.a, g2.a),
    math.multiply(g1.b, math.conj(g2.b as any))
  ) as Complex;
  
  const b = math.add(
    math.multiply(g1.a, g2.b),
    math.multiply(g1.b, math.conj(g2.a as any))
  ) as Complex;
  
  return { a, b };
}

/**
 * Computes the inverse of an SU(2) element
 * For SU(2), g⁻¹ = (a*, -b)
 * 
 * @param g SU(2) element
 * @returns Inverse g⁻¹
 */
export function inverseSU2(g: SU2Element): SU2Element {
  return {
    a: math.conj(g.a as any) as Complex,
    b: math.multiply(-1, g.b) as Complex
  };
}

/**
 * Computes the Hermitian conjugate of an SU(2) element
 * For SU(2), g† = g⁻¹ = (a*, -b)
 * 
 * @param g SU(2) element
 * @returns Hermitian conjugate g†
 */
export function conjugateSU2(g: SU2Element): SU2Element {
  return inverseSU2(g);
}

/**
 * Computes the trace of an SU(2) element
 * Tr(g) = a + a* = 2 Re(a)
 * 
 * @param g SU(2) element
 * @returns Trace value (real number)
 */
export function traceSU2(g: SU2Element): number {
  return 2 * (g.a as any).re;
}

/**
 * Computes the rotation angle of an SU(2) element
 * θ = 2 arccos(Re(a))
 * 
 * @param g SU(2) element
 * @returns Rotation angle in radians [0, π]
 */
export function rotationAngle(g: SU2Element): number {
  const cosHalfTheta = (g.a as any).re;
  // Clamp to [-1, 1] to avoid numerical errors
  const clamped = Math.max(-1, Math.min(1, cosHalfTheta));
  return 2 * Math.acos(clamped);
}

/**
 * Converts Euler angles (α, β, γ) to SU(2) element
 * Uses the Z-Y-Z convention: D(α,β,γ) = exp(-iαJz)exp(-iβJy)exp(-iγJz)
 * 
 * @param alpha First Euler angle (rotation about Z)
 * @param beta Second Euler angle (rotation about Y')
 * @param gamma Third Euler angle (rotation about Z'')
 * @returns SU(2) element representing the rotation
 */
export function eulerToSU2(alpha: number, beta: number, gamma: number): SU2Element {
  const halfAlpha = alpha / 2;
  const halfBeta = beta / 2;
  const halfGamma = gamma / 2;
  
  const a = math.complex(
    Math.cos(halfBeta) * Math.cos(halfAlpha + halfGamma),
    -Math.cos(halfBeta) * Math.sin(halfAlpha + halfGamma)
  ) as Complex;
  
  const b = math.complex(
    Math.sin(halfBeta) * Math.cos(halfAlpha - halfGamma),
    Math.sin(halfBeta) * Math.sin(halfAlpha - halfGamma)
  ) as Complex;
  
  return { a, b };
}

/**
 * Converts an SU(2) element to Euler angles (α, β, γ)
 * Uses the Z-Y-Z convention.
 * 
 * Note: This has a branch cut ambiguity. We choose the principal branch.
 * 
 * @param g SU(2) element
 * @returns Euler angles { alpha, beta, gamma }
 */
export function su2ToEuler(g: SU2Element): { alpha: number; beta: number; gamma: number } {
  const a = g.a;
  const b = g.b;
  
  // beta is determined by |b| = sin(β/2)
  const sinHalfBeta = Math.sqrt((b as any).re ** 2 + (b as any).im ** 2);
  const cosHalfBeta = Math.sqrt((a as any).re ** 2 + (a as any).im ** 2);
  
  // Clamp for numerical stability
  const sinBetaClamped = Math.max(-1, Math.min(1, 2 * sinHalfBeta * cosHalfBeta));
  const beta = Math.asin(sinBetaClamped);
  
  if (Math.abs(sinHalfBeta) < 1e-10) {
    // beta ≈ 0, g is essentially exp(-i(α+γ)Jz)
    const angle = -2 * Math.atan2((a as any).im, (a as any).re);
    return { alpha: angle, beta: 0, gamma: 0 };
  }
  
  if (Math.abs(cosHalfBeta) < 1e-10) {
    // beta ≈ π
    const angle = -2 * Math.atan2((b as any).im, (b as any).re);
    return { alpha: angle, beta: Math.PI, gamma: 0 };
  }
  
  // General case
  const halfAlphaPlusGamma = Math.atan2(-(a as any).im, (a as any).re);
  const halfAlphaMinusGamma = Math.atan2((b as any).im, (b as any).re);
  
  const alpha = halfAlphaPlusGamma + halfAlphaMinusGamma;
  const gamma = halfAlphaPlusGamma - halfAlphaMinusGamma;
  
  return { alpha, beta, gamma };
}

/**
 * Generates a single random SU(2) element uniformly distributed
 * with respect to the Haar measure.
 * 
 * Uses the algorithm: sample uniformly on S³ (unit sphere in ℝ⁴)
 * 
 * Algorithm:
 * 1. Generate 4 independent standard normal random numbers
 * 2. Normalize to unit length → uniform on S³
 * 3. Map (x0, x1, x2, x3) → (a, b) = (x0 + ix1, x2 + ix3)
 * 
 * @returns Random SU(2) element with Haar measure
 */
export function randomSU2(): SU2Element {
  // Box-Muller for normal distribution
  const normal = (): number => {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  };
  
  // Sample 4 independent normals
  const x0 = normal();
  const x1 = normal();
  const x2 = normal();
  const x3 = normal();
  
  // Normalize to unit sphere
  const norm = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2 + x3 * x3);
  
  return {
    a: math.complex(x0 / norm, x1 / norm) as Complex,
    b: math.complex(x2 / norm, x3 / norm) as Complex
  };
}

/**
 * Generates n random SU(2) elements uniformly distributed
 * with respect to the Haar measure.
 * 
 * @param n Number of samples
 * @returns Array of n random SU(2) elements
 */
export function sampleSU2Haar(n: number): SU2Element[] {
  const samples: SU2Element[] = [];
  for (let i = 0; i < n; i++) {
    samples.push(randomSU2());
  }
  return samples;
}

/**
 * Computes the Haar measure volume element for an SU(2) element.
 * For normalized elements, this is always 1 (the measure is uniform on S³).
 * 
 * @param g SU(2) element
 * @returns Volume element (always 1 for valid SU(2))
 */
export function haarMeasureElement(_g: SU2Element): number {
  // For properly normalized SU(2), the Haar measure is uniform
  return 1.0;
}

/**
 * Computes the SU(2) Casimir invariant for representation j
 * C₂(j) = j(j+1)
 * 
 * @param j Angular momentum quantum number
 * @returns Casimir invariant value
 */
export function casimirSU2(j: number): number {
  return j * (j + 1);
}

/**
 * Computes the dimension of the SU(2) representation with spin j
 * dim(j) = 2j + 1
 * 
 * @param j Angular momentum quantum number
 * @returns Dimension of representation
 */
export function dimensionSU2(j: number): number {
  return Math.floor(2 * j + 1);
}
