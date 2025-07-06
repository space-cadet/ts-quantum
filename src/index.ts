// Quantum library entry point
// This file will export all public APIs from the quantum package

// Export types from core
export * from './core/types';

// Export from states
export * from './states/stateVector';
export * from './states/states';
export * from './states/composite';
export * from './states/densityMatrix';

// Export from operators
export * from './operators/operator';
export * from './operators/algebra';
export * from './operators/gates';
export * from './operators/measurement';
export * from './operators/hamiltonian';
export * from './operators/circuit';

// Export utilities (excluding conflicting exports)
export { 
    ComplexMatrix, 
    IMatrixDimensions, 
    IValidationResult,
    multiplyMatrices,
    transpose,
    tensorProduct,
    eigenDecomposition,
    addMatrices,
    scaleMatrix,
    normalizeMatrix,
    isHermitian,
    isUnitary,
    orthogonalizeStateVectors
} from './utils/matrixOperations';
export * from './utils/matrixFunctions';
export * from './utils/information';
export * from './utils/oscillator';

// Export angular momentum module
export * from './angularMomentum';

// Export geometry module
export * from './geometry';
