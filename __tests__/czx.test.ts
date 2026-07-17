import { describe, expect, it } from 'vitest';

import { getFourSpinHalfBasis } from '../src/intertwiner';
import {
  auditCzxOnIntertwinerSubspace,
  createCzxOnSiteSymmetry
} from '../src/models/czx';

describe('CZX on-site symmetry audit', () => {
  it('is a Z2 symmetry on the four-qubit Hilbert space', () => {
    const symmetry = createCzxOnSiteSymmetry();
    const squared = symmetry.compose(symmetry).toMatrix();

    for (let row = 0; row < 16; row++) {
      for (let col = 0; col < 16; col++) {
        expect(squared[row][col].re).toBeCloseTo(row === col ? 1 : 0);
        expect(squared[row][col].im).toBeCloseTo(0);
      }
    }
  });

  it('records leakage from the four-spin-half SU(2) intertwiner subspace', () => {
    const audit = auditCzxOnIntertwinerSubspace(getFourSpinHalfBasis());

    expect(audit.subspaceDimension).toBe(2);
    expect(audit.preservesIntertwinerSubspace).toBe(false);
    expect(audit.squaredLeakageNorms.some(norm => norm > 1e-10)).toBe(true);
  });
});
