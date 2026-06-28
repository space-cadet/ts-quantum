import { describe, it, expect } from 'vitest';
import {
  randomSU2,
  sampleSU2Haar,
  multiplySU2,
  inverseSU2,
  conjugateSU2,
  traceSU2,
  rotationAngle,
  eulerToSU2,
  su2ToEuler,
  isValidSU2,
  SU2_IDENTITY,
  casimirSU2,
  dimensionSU2,
  SU2Element
} from '../../src/angularMomentum/su2';

describe('SU(2) Group Operations', () => {
  describe('Identity', () => {
    it('should create identity element', () => {
      expect(isValidSU2(SU2_IDENTITY)).toBe(true);
      expect((SU2_IDENTITY.a as any).re).toBe(1);
      expect((SU2_IDENTITY.a as any).im).toBe(0);
      expect((SU2_IDENTITY.b as any).re).toBe(0);
      expect((SU2_IDENTITY.b as any).im).toBe(0);
    });

    it('should have zero rotation angle', () => {
      expect(rotationAngle(SU2_IDENTITY)).toBeCloseTo(0, 10);
    });

    it('should have trace = 2', () => {
      expect(traceSU2(SU2_IDENTITY)).toBeCloseTo(2, 10);
    });
  });

  describe('Group Multiplication', () => {
    it('should preserve unitarity: |g1*g2|² = 1', () => {
      const g1 = randomSU2();
      const g2 = randomSU2();
      const g12 = multiplySU2(g1, g2);

      const normSq =
        (g12.a as any).re ** 2 + (g12.a as any).im ** 2 +
        (g12.b as any).re ** 2 + (g12.b as any).im ** 2;

      expect(normSq).toBeCloseTo(1, 6);
    });

    it('should satisfy associativity', () => {
      const g1 = eulerToSU2(0.1, 0.2, 0.3);
      const g2 = eulerToSU2(0.4, 0.5, 0.6);
      const g3 = eulerToSU2(0.7, 0.8, 0.9);

      const left = multiplySU2(multiplySU2(g1, g2), g3);
      const right = multiplySU2(g1, multiplySU2(g2, g3));

      expect((left.a as any).re).toBeCloseTo((right.a as any).re, 10);
      expect((left.a as any).im).toBeCloseTo((right.a as any).im, 10);
      expect((left.b as any).re).toBeCloseTo((right.b as any).re, 10);
      expect((left.b as any).im).toBeCloseTo((right.b as any).im, 10);
    });

    it('should have identity as neutral element', () => {
      const g = randomSU2();

      const gI = multiplySU2(g, SU2_IDENTITY);
      const Ig = multiplySU2(SU2_IDENTITY, g);

      expect((gI.a as any).re).toBeCloseTo((g.a as any).re, 10);
      expect((gI.b as any).re).toBeCloseTo((g.b as any).re, 10);
      expect((Ig.a as any).re).toBeCloseTo((g.a as any).re, 10);
      expect((Ig.b as any).re).toBeCloseTo((g.b as any).re, 10);
    });
  });

  describe('Inverse', () => {
    it('should satisfy g * g⁻¹ = I', () => {
      const g = eulerToSU2(0.5, 1.0, 0.3);
      const gInv = inverseSU2(g);
      const product = multiplySU2(g, gInv);

      expect((product.a as any).re).toBeCloseTo(1, 10);
      expect((product.a as any).im).toBeCloseTo(0, 10);
      expect((product.b as any).re).toBeCloseTo(0, 10);
      expect((product.b as any).im).toBeCloseTo(0, 10);
    });

    it('should satisfy g⁻¹ * g = I', () => {
      const g = eulerToSU2(0.5, 1.0, 0.3);
      const gInv = inverseSU2(g);
      const product = multiplySU2(gInv, g);

      expect((product.a as any).re).toBeCloseTo(1, 10);
      expect((product.a as any).im).toBeCloseTo(0, 10);
      expect((product.b as any).re).toBeCloseTo(0, 10);
      expect((product.b as any).im).toBeCloseTo(0, 10);
    });

    it('should have conjugate equal to inverse for SU(2)', () => {
      const g = randomSU2();
      const inv = inverseSU2(g);
      const conj = conjugateSU2(g);

      expect((inv.a as any).re).toBeCloseTo((conj.a as any).re, 10);
      expect((inv.b as any).re).toBeCloseTo((conj.b as any).re, 10);
    });
  });

  describe('Euler Angle Conversion', () => {
    it('should round-trip Euler angles', () => {
      const alpha = 0.5;
      const beta = 1.2;
      const gamma = 0.3;

      const g = eulerToSU2(alpha, beta, gamma);
      const { alpha: a2, beta: b2, gamma: c2 } = su2ToEuler(g);

      expect(a2).toBeCloseTo(alpha, 6);
      expect(b2).toBeCloseTo(beta, 6);
      expect(c2).toBeCloseTo(gamma, 6);
    });

    it('should handle beta ≈ 0', () => {
      const g = eulerToSU2(0.5, 0, 0.3);
      const angles = su2ToEuler(g);
      expect(angles.beta).toBeCloseTo(0, 10);
    });

    it('should handle beta ≈ π', () => {
      const g = eulerToSU2(0.5, Math.PI, 0.3);
      const angles = su2ToEuler(g);
      expect(angles.beta).toBeCloseTo(Math.PI, 10);
    });
  });

  describe('Rotation Angle', () => {
    it('should give 0 for identity', () => {
      expect(rotationAngle(SU2_IDENTITY)).toBeCloseTo(0, 10);
    });

    it('should give 2π for (-1, 0) (SU(2) double cover)', () => {
      const g: SU2Element = { a: { re: -1, im: 0 } as any, b: { re: 0, im: 0 } as any };
      expect(rotationAngle(g)).toBeCloseTo(2 * Math.PI, 10);
    });

    it('should satisfy θ ∈ [0, 2π] (SU(2) range)', () => {
      for (let i = 0; i < 100; i++) {
        const g = randomSU2();
        const theta = rotationAngle(g);
        expect(theta).toBeGreaterThanOrEqual(0);
        expect(theta).toBeLessThanOrEqual(2 * Math.PI + 1e-10);
      }
    });
  });

  describe('Trace', () => {
    it('should satisfy |Tr(g)| ≤ 2', () => {
      for (let i = 0; i < 100; i++) {
        const g = randomSU2();
        expect(Math.abs(traceSU2(g))).toBeLessThanOrEqual(2 + 1e-10);
      }
    });

    it('should give Tr = 2cos(θ/2)', () => {
      const g = eulerToSU2(0.5, 1.0, 0.3);
      const theta = rotationAngle(g);
      expect(traceSU2(g)).toBeCloseTo(2 * Math.cos(theta / 2), 8);
    });
  });

  describe('Haar Sampling', () => {
    it('should generate valid SU(2) elements', () => {
      const samples = sampleSU2Haar(100);
      for (const g of samples) {
        expect(isValidSU2(g)).toBe(true);
      }
    });

    it('should have mean trace ≈ 0 (uniform distribution)', () => {
      const samples = sampleSU2Haar(1000);
      let avgTrace = 0;
      for (const g of samples) {
        avgTrace += traceSU2(g);
      }
      avgTrace /= 1000;
      expect(Math.abs(avgTrace)).toBeLessThan(0.1);
    });
  });

  describe('Dimension and Casimir', () => {
    it('should give correct dimensions', () => {
      expect(dimensionSU2(0)).toBe(1);
      expect(dimensionSU2(0.5)).toBe(2);
      expect(dimensionSU2(1)).toBe(3);
      expect(dimensionSU2(1.5)).toBe(4);
      expect(dimensionSU2(2)).toBe(5);
    });

    it('should give correct Casimir values', () => {
      expect(casimirSU2(0)).toBe(0);
      expect(casimirSU2(0.5)).toBe(0.75);
      expect(casimirSU2(1)).toBe(2);
      expect(casimirSU2(1.5)).toBe(3.75);
    });
  });
});
