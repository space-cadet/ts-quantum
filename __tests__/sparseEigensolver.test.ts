import { describe, it, expect } from 'vitest';
import { lanczosEigensolver, findLowestEigenvalues, findHighestEigenvalues } from '../src/operators/sparseEigensolver';
import { SparseOperator } from '../src/operators/sparseOperator';
import { createSparseMatrix, setSparseEntry, denseToSparse } from '../src/operators/sparse';
import { MatrixOperator } from '../src/operators/operator';
import * as math from 'mathjs';

describe('Sparse Lanczos Eigensolver', () => {
  it('should find the lowest eigenvalue of a 2x2 diagonal matrix', () => {
    // Create a simple 2x2 diagonal matrix: diag(1, 3)
    const sparse = createSparseMatrix(2, 2);
    setSparseEntry(sparse, 0, 0, math.complex(1, 0));
    setSparseEntry(sparse, 1, 1, math.complex(3, 0));
    
    const result = findLowestEigenvalues(sparse, 1, { seed: 42 });
    
    expect(result.converged).toBe(true);
    expect(result.eigenvalues.length).toBe(1);
    expect(result.eigenvalues[0]).toBeCloseTo(1, 6);
    expect(result.eigenvectors.length).toBe(1);
    expect(result.eigenvectors[0].dimension).toBe(2);
  });

  it('should find both eigenvalues of a 2x2 matrix', () => {
    // Matrix: [[1, 2], [2, 1]] with eigenvalues 3, -1
    const sparse = createSparseMatrix(2, 2);
    setSparseEntry(sparse, 0, 0, math.complex(1, 0));
    setSparseEntry(sparse, 0, 1, math.complex(2, 0));
    setSparseEntry(sparse, 1, 0, math.complex(2, 0));
    setSparseEntry(sparse, 1, 1, math.complex(1, 0));
    
    const result = findLowestEigenvalues(sparse, 2, { seed: 42 });
    
    expect(result.converged).toBe(true);
    expect(result.eigenvalues.length).toBe(2);
    expect(result.eigenvalues[0]).toBeCloseTo(-1, 6);
    expect(result.eigenvalues[1]).toBeCloseTo(3, 6);
  });

  it('should find eigenvalues of a larger diagonal matrix', () => {
    // 10x10 diagonal matrix with values 1, 2, ..., 10
    const sparse = createSparseMatrix(10, 10);
    for (let i = 0; i < 10; i++) {
      setSparseEntry(sparse, i, i, math.complex(i + 1, 0));
    }
    
    const result = findLowestEigenvalues(sparse, 3, { seed: 42 });
    
    expect(result.converged).toBe(true);
    expect(result.eigenvalues.length).toBe(3);
    expect(result.eigenvalues[0]).toBeCloseTo(1, 6);
    expect(result.eigenvalues[1]).toBeCloseTo(2, 6);
    expect(result.eigenvalues[2]).toBeCloseTo(3, 6);
  });

  it('should work with SparseOperator wrapper', () => {
    // Pauli Z matrix: [[1, 0], [0, -1]]
    const sparse = createSparseMatrix(2, 2);
    setSparseEntry(sparse, 0, 0, math.complex(1, 0));
    setSparseEntry(sparse, 1, 1, math.complex(-1, 0));
    
    const operator = new SparseOperator(sparse, 'hermitian');
    const result = operator.eigenDecompose({ numEigenvalues: 2, seed: 42 });
    
    expect(result.values.length).toBe(2);
    expect(result.values[0].re).toBeCloseTo(-1, 6);
    expect(result.values[1].re).toBeCloseTo(1, 6);
  });

  it('should find highest eigenvalues', () => {
    // 10x10 diagonal matrix with values 1, 2, ..., 10
    const sparse = createSparseMatrix(10, 10);
    for (let i = 0; i < 10; i++) {
      setSparseEntry(sparse, i, i, math.complex(i + 1, 0));
    }
    
    const result = findHighestEigenvalues(sparse, 3, { seed: 42 });
    
    expect(result.converged).toBe(true);
    expect(result.eigenvalues.length).toBe(3);
    expect(result.eigenvalues[0]).toBeCloseTo(10, 6);
    expect(result.eigenvalues[1]).toBeCloseTo(9, 6);
    expect(result.eigenvalues[2]).toBeCloseTo(8, 6);
  });

  it('should handle complex matrices', () => {
    // Simple complex Hermitian matrix
    // [[2, i], [-i, 2]] with eigenvalues 1, 3
    const sparse = createSparseMatrix(2, 2);
    setSparseEntry(sparse, 0, 0, math.complex(2, 0));
    setSparseEntry(sparse, 0, 1, math.complex(0, 1));
    setSparseEntry(sparse, 1, 0, math.complex(0, -1));
    setSparseEntry(sparse, 1, 1, math.complex(2, 0));
    
    const result = findLowestEigenvalues(sparse, 2, { seed: 42 });
    
    expect(result.converged).toBe(true);
    expect(result.eigenvalues.length).toBe(2);
    expect(result.eigenvalues[0]).toBeCloseTo(1, 6);
    expect(result.eigenvalues[1]).toBeCloseTo(3, 6);
  });
});
