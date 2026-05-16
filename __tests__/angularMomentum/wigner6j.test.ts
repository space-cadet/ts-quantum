/**
 * Tests for Wigner 6j symbols implementation
 */

import { describe, it, expect } from 'vitest';
import { wigner6j } from '../../src/angularMomentum/wignerSymbols';
import * as math from 'mathjs';

describe('Wigner 6j Symbols', () => {
  describe('Triangle validation', () => {
    it('should return zero for invalid triangle conditions', () => {
      // Invalid triangle: j1 + j2 < j3
      const result = wigner6j(1, 1, 3, 1, 1, 1);
      expect(math.abs(result.re)).toBeCloseTo(0, 10);
      expect(math.abs(result.im)).toBeCloseTo(0, 10);
    });
    
    it('should handle valid triangle conditions', () => {
      const result = wigner6j(1, 1, 1, 1, 1, 1);
      expect(Number.isFinite(result.re)).toBe(true);
      expect(Number.isFinite(result.im)).toBe(true);
    });
  });
  
  describe('Known values from Varshalovich', () => {
    it('should calculate {1/2 1/2 1; 1/2 1/2 0} = 1/2', () => {
      const result = wigner6j(0.5, 0.5, 1, 0.5, 0.5, 0);
      expect(result.re).toBeCloseTo(0.5, 6);
      expect(math.abs(result.im)).toBeCloseTo(0, 10);
    });
    
    it('should calculate {1 1 2; 1 1 0} = 1/3', () => {
      const result = wigner6j(1, 1, 2, 1, 1, 0);
      expect(result.re).toBeCloseTo(1/3, 6);
      expect(math.abs(result.im)).toBeCloseTo(0, 10);
    });
    
    it('should calculate {3/2 3/2 3; 3/2 3/2 0} = 1/4', () => {
      const result = wigner6j(1.5, 1.5, 3, 1.5, 1.5, 0);
      expect(result.re).toBeCloseTo(1/4, 6);
      expect(math.abs(result.im)).toBeCloseTo(0, 10);
    });
  });

  describe('Special cases from theory', () => {
    it('should handle zero argument case correctly', () => {
      // From theory: If one argument is 0, symbol reduces to delta function
      const result = wigner6j(1, 1, 1, 1, 1, 0);
      expect(result.re).toBeCloseTo(-1/3, 6);
    });

    it('should handle equal pairs case correctly', () => {
      // From theory: When a=b and d=e, special formula applies
      const result = wigner6j(1, 1, 2, 1, 1, 2);
      // Expected value from sympy
      expect(result.re).toBeCloseTo(1/30, 6);
    });
  });

  describe('Symmetry properties', () => {
    it('should be invariant under even permutations', () => {
      const original = wigner6j(1, 1, 2, 1, 1, 2);
      const permuted = wigner6j(2, 1, 1, 2, 1, 1); // Even permutation
      expect(original.re).toBeCloseTo(permuted.re, 6);
    });

    it('should satisfy column permutation symmetry', () => {
      // Permuting columns should leave the 6j symbol invariant
      const original = wigner6j(2, 1, 1, 2, 1, 1);
      const permuted = wigner6j(1, 2, 1, 1, 2, 1); // Swap columns 1 and 2
      expect(original.re).toBeCloseTo(permuted.re, 6);
    });
  });

  describe('Sum rules', () => {
    it('should satisfy orthogonality relation', () => {
      let sum = 0;
      const j1 = 1, j2 = 1, j3 = 2, l2 = 1;
      for (let j = Math.abs(j1-j2); j <= j1+j2; j++) {
        const symbol = wigner6j(j1, j2, j, l2, l2, j3);
        sum += (2*j + 1) * symbol.re * symbol.re;
      }
      expect(sum).toBeCloseTo(1/(2*j3 + 1), 6);
    });

    it('should satisfy Racah backcoupling rule', () => {
      const j1 = 1, j2 = 1, j3 = 1, j4 = 1;
      let sum = 0;
      for (let x = Math.abs(j1-j2); x <= j1+j2; x++) {
        if (Math.abs(j3-j4) <= x && x <= j3+j4) {
          const symbol = wigner6j(j1, j2, x, j4, j3, j2);
          sum += (2*x + 1) * symbol.re;
        }
      }
      expect(sum).toBeCloseTo(1, 6);
    });
  });
});
