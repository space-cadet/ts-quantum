/**
 * Tests for 2D Quantum Random Walk
 */

import { describe, it, expect } from 'vitest';
import { lattice2D } from '@spin-network/graph-core/src/core/builders';
import { QuantumWalk2D } from '../../../src/algorithms/quantumWalk';

describe('QuantumWalk2D', () => {
  
  it('should correctly calculate position distribution from known state', () => {
    console.log('\n=== Position Distribution Test ===');
    const lattice = lattice2D(5, 5);
    const walker = new QuantumWalk2D(lattice, { x: 1, y: 1 });
    
    // Get initial state - should be 100% at position (1,1) with UP coin
    const initialDist = walker.getPositionDistribution();
    console.log('Initial distribution:');
    initialDist.forEach((prob, pos) => {
      console.log(`  Position ${pos}: ${(prob * 100).toFixed(4)}%`);
    });
    
    const totalInitial = Array.from(initialDist.values()).reduce((sum, p) => sum + p, 0);
    console.log(`Total initial probability: ${(totalInitial * 100).toFixed(4)}%`);
    
    expect(totalInitial).toBeCloseTo(1.0, 12);
    expect(initialDist.size).toBe(1);
    expect(initialDist.get('1,1')).toBeCloseTo(1.0, 12);
    
    // Test after coin operation only (no shift)
    // Manually access the internal state to test coin operation in isolation
    const walkerAny = walker as any;
    walkerAny.applyCoin();
    
    const afterCoinDist = walker.getPositionDistribution();
    console.log('\nAfter coin operation only:');
    afterCoinDist.forEach((prob, pos) => {
      console.log(`  Position ${pos}: ${(prob * 100).toFixed(4)}%`);
    });
    
    const totalAfterCoin = Array.from(afterCoinDist.values()).reduce((sum, p) => sum + p, 0);
    console.log(`Total after coin: ${(totalAfterCoin * 100).toFixed(4)}%`);
    
    expect(totalAfterCoin).toBeCloseTo(1.0, 12);
    expect(afterCoinDist.size).toBe(1);
    expect(afterCoinDist.get('1,1')).toBeCloseTo(1.0, 12);
  });

  it('should initialize with correct state normalization', () => {
    console.log('\n=== Initialization Test ===');
    const lattice = lattice2D(5, 5);
    const walker = new QuantumWalk2D(lattice, { x: 2, y: 2 });
    
    const distribution = walker.getPositionDistribution();
    const totalProb = Array.from(distribution.values()).reduce((sum, p) => sum + p, 0);
    
    console.log(`Initial position: (2, 2)`);
    console.log(`Total probability: ${(totalProb * 100).toFixed(2)}%`);
    console.log(`Distribution size: ${distribution.size} positions`);
    
    expect(totalProb).toBeCloseTo(1.0, 10);
    expect(distribution.size).toBe(1);
  });

  it('should preserve probability after single step', () => {
    console.log('\n=== Single Step Test ===');
    const lattice = lattice2D(5, 5);
    const walker = new QuantumWalk2D(lattice, { x: 2, y: 2 });
    
    walker.step();
    const distribution = walker.getPositionDistribution();
    const totalProb = Array.from(distribution.values()).reduce((sum, p) => sum + p, 0);
    
    console.log(`After 1 step:`);
    console.log(`Total probability: ${(totalProb * 100).toFixed(2)}%`);
    console.log(`Distribution size: ${distribution.size} positions`);
    
    distribution.forEach((prob, pos) => {
      console.log(`  Position ${pos}: ${(prob * 100).toFixed(2)}%`);
    });
    
    expect(totalProb).toBeCloseTo(1.0, 10);
  });

  it('should preserve probability after multiple steps', () => {
    console.log('\n=== Multiple Steps Test ===');
    const lattice = lattice2D(7, 7);
    
    for (let steps = 1; steps <= 10; steps++) {
      const walker = new QuantumWalk2D(lattice, { x: 3, y: 3 });
      walker.evolve(steps);
      const distribution = walker.getPositionDistribution();
      const totalProb = Array.from(distribution.values()).reduce((sum, p) => sum + p, 0);
      
      console.log(`After ${steps} steps: probability = ${(totalProb * 100).toFixed(2)}%, positions = ${distribution.size}`);
      
      expect(totalProb).toBeCloseTo(1.0, 8);
    }
  });

  it('should handle boundary conditions correctly', () => {
    console.log('\n=== Boundary Test ===');
    const lattice = lattice2D(3, 3);
    const walker = new QuantumWalk2D(lattice, { x: 0, y: 0 }); // Corner position
    
    walker.evolve(3);
    const distribution = walker.getPositionDistribution();
    const totalProb = Array.from(distribution.values()).reduce((sum, p) => sum + p, 0);
    
    console.log(`Corner start after 3 steps:`);
    console.log(`Total probability: ${(totalProb * 100).toFixed(2)}%`);
    
    const sortedPositions = Array.from(distribution.entries())
      .sort(([,a], [,b]) => b - a);
    
    sortedPositions.forEach(([pos, prob]) => {
      console.log(`  Position ${pos}: ${(prob * 100).toFixed(2)}%`);
    });
    
    expect(totalProb).toBeCloseTo(1.0, 8);
  });

  it('should show spreading behavior', () => {
    console.log('\n=== Spreading Analysis ===');
    const lattice = lattice2D(11, 11);
    
    const spreadData: Array<{steps: number, positions: number, maxDist: number}> = [];
    
    for (let steps = 0; steps <= 10; steps += 2) {
      const walker = new QuantumWalk2D(lattice, { x: 5, y: 5 });
      if (steps > 0) walker.evolve(steps);
      
      const distribution = walker.getPositionDistribution();
      let maxDist = 0;
      
      distribution.forEach((prob, posStr) => {
        const [x, y] = posStr.split(',').map(Number);
        const dist = Math.abs(x - 5) + Math.abs(y - 5); // Manhattan distance
        maxDist = Math.max(maxDist, dist);
      });
      
      spreadData.push({
        steps,
        positions: distribution.size,
        maxDist
      });
      
      console.log(`Step ${steps}: ${distribution.size} positions, max distance = ${maxDist}`);
    }
    
    // Check that spreading generally increases
    expect(spreadData[spreadData.length - 1].maxDist).toBeGreaterThan(spreadData[0].maxDist);
  });
});
