/**
 * @fileoverview Intertwiner spaces for Loop Quantum Gravity and spin networks
 * @module Intertwiner
 * 
 * This module provides functionality for calculating and manipulating intertwiner spaces
 * in Loop Quantum Gravity and spin network theory. Intertwiners are SU(2)-invariant
 * tensors that ensure gauge invariance at network nodes.
 * 
 * Key features:
 * - Intertwiner space dimension calculations
 * - Basis state construction using Clebsch-Gordan coefficients
 * - Tensor representation with StateVector integration
 * - Support for 2, 3, 4, and n-valent nodes
 * - Volume operator construction and diagonalization
 * - Z₂ spectrum diagnostics
 * - Optimized implementations for common cases
 */

// Export all type definitions
export * from './types';

// Export core functions for dimension calculations and validation
export {
  triangleInequality,
  allowedIntermediateSpins,
  calculateDimension
} from './core';

// Export basis construction functions
export {
  constructBasis,
  constructBasisVector,
  getFourSpinHalfBasis
} from './basis';

// Export n-valent intertwiner construction (generalizes 2,3,4-valent)
export {
  constructNValentBasis
} from './nValent';

// Export volume operator and diagonalization tools
export {
  buildVolumeOperatorMatrix,
  diagonalizeSymmetric,
  checkZ2Structure,
  computeVolumeSpectrum
} from './volumeOperator';

// Export tensor operations (Phase 3 - to be implemented)
export {
  basisToTensor,
  createIntertwinerTensor
} from './tensor';
