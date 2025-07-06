/**
 * Basic 2D quantum walk demonstration
 */

import { lattice2D } from '@spin-network/graph-core/src/core/builders';
import { QuantumWalk2D } from '../../../src/algorithms/quantumWalk';

console.log('2D Quantum Random Walk Demo');
console.log('============================');

// Create 10×10 lattice
const lattice = lattice2D(10, 10);
console.log('Created 10×10 lattice');

// Initialize walker at center
const startPosition = { x: 5, y: 5 };
const walker = new QuantumWalk2D(lattice, startPosition);
console.log(`Walker initialized at (${startPosition.x}, ${startPosition.y})`);

// Evolve for 20 steps
console.log('\nEvolving for 20 steps...');
walker.evolve(20);

// Get final distribution
const distribution = walker.getPositionDistribution();
console.log(`\nFinal distribution (${distribution.size} non-zero positions):`);

// Print top 10 most probable positions
const sorted = Array.from(distribution.entries())
  .sort(([,a], [,b]) => b - a)
  .slice(0, 10);

sorted.forEach(([position, probability], index) => {
  console.log(`${index + 1}. Position ${position}: ${(probability * 100).toFixed(2)}%`);
});

// Calculate spreading
const positions = Array.from(distribution.entries());
let meanX = 0, meanY = 0, totalProb = 0;

positions.forEach(([pos, prob]) => {
  const [x, y] = pos.split(',').map(Number);
  meanX += x * prob;
  meanY += y * prob;
  totalProb += prob;
});

meanX /= totalProb;
meanY /= totalProb;

console.log(`\nCenter of mass: (${meanX.toFixed(2)}, ${meanY.toFixed(2)})`);
console.log(`Total probability: ${(totalProb * 100).toFixed(2)}%`);
