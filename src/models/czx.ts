import * as math from 'mathjs';

import { Complex } from '../core/types';
import { IntertwinerSpace } from '../intertwiner/types';
import { MatrixOperator } from '../operators/operator';

export interface CzxIntertwinerAudit {
  subspaceDimension: number;
  squaredProjectionNorms: number[];
  squaredLeakageNorms: number[];
  preservesIntertwinerSubspace: boolean;
}

const FOUR_QUBIT_DIMENSION = 16;

function bit(value: number, qubit: number): number {
  return (value >> (3 - qubit)) & 1;
}

/**
 * Construct the original CZX on-site Z2 symmetry on four qubits:
 *
 * U_CZX = X_1 X_2 X_3 X_4 CZ_12 CZ_23 CZ_34 CZ_41.
 *
 * Qubit zero is the most significant bit in the computational-basis index.
 */
export function createCzxOnSiteSymmetry(): MatrixOperator {
  const matrix: Complex[][] = Array.from(
    { length: FOUR_QUBIT_DIMENSION },
    () => Array.from({ length: FOUR_QUBIT_DIMENSION }, () => math.complex(0, 0))
  );

  for (let input = 0; input < FOUR_QUBIT_DIMENSION; input++) {
    const controlledZExponent =
      bit(input, 0) * bit(input, 1) +
      bit(input, 1) * bit(input, 2) +
      bit(input, 2) * bit(input, 3) +
      bit(input, 3) * bit(input, 0);
    const phase = controlledZExponent % 2 === 0 ? 1 : -1;
    const flipped = input ^ 0b1111;
    matrix[flipped][input] = math.complex(phase, 0);
  }

  return new MatrixOperator(matrix, 'unitary');
}

/**
 * Measure whether the literal CZX on-site symmetry leaves an SU(2)
 * intertwiner subspace invariant.  A non-zero leakage is a physical audit
 * result, not a numerical failure.
 */
export function auditCzxOnIntertwinerSubspace(
  intertwinerSpace: IntertwinerSpace,
  tolerance: number = 1e-10
): CzxIntertwinerAudit {
  const symmetry = createCzxOnSiteSymmetry();
  const basis = intertwinerSpace.basisStates.map(state => state.stateVector);

  if (basis.length === 0 || basis.some(state => state.dimension !== FOUR_QUBIT_DIMENSION)) {
    throw new Error('CZX audit requires a non-empty four-qubit intertwiner basis');
  }

  const squaredProjectionNorms = basis.map(state => {
    const transformed = symmetry.apply(state);
    return basis.reduce((norm, basisState) => {
      const overlap = basisState.innerProduct(transformed);
      const magnitude = math.abs(overlap) as unknown as number;
      return norm + magnitude * magnitude;
    }, 0);
  });
  const squaredLeakageNorms = squaredProjectionNorms.map(norm => Math.max(0, 1 - norm));

  return {
    subspaceDimension: basis.length,
    squaredProjectionNorms,
    squaredLeakageNorms,
    preservesIntertwinerSubspace: squaredLeakageNorms.every(norm => norm <= tolerance)
  };
}
