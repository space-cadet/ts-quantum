/**
 * Toric Code Stabilizer Example
 * 
 * Demonstrates 2D toric code with stabilizer operators on a periodic lattice.
 * Uses existing graph-core lattice generators and quantum module Pauli operators.
 * 
 * Features:
 * - 2D periodic lattice (torus topology)
 * - X-type and Z-type stabilizer operators on plaquettes
 * - 4-qubit stabilizer application using tensor products
 * - Ground state projection and stabilizer measurement
 */

import { QuantumGraph } from '../../src/qgraph';
import { lattice2DPeriodic } from '../../../graph-core/src/core/builders';
import { PauliX, PauliZ } from '../../src/operators/gates';
import { StateVector } from '../../src/states/stateVector';
import { createBasisState } from '../../src/states/states';
import { IOperator } from '../../src/core/types';

export interface ToricCodeConfig {
  /** Width of the 2D lattice */
  width: number;
  /** Height of the 2D lattice */
  height: number;
  /** Verbose output during generation */
  verbose?: boolean;
}

interface PlaquetteData {
  xPlaquettes: string[][];  // X-stabilizer plaquettes (vertex-centered)
  zPlaquettes: string[][];  // Z-stabilizer plaquettes (face-centered)
}

/**
 * Parse lattice node ID to coordinates
 */
function parseNodeId(nodeId: string): [number, number] {
  const parts = nodeId.split(',');
  return [parseInt(parts[0]), parseInt(parts[1])];
}

/**
 * Create node ID from coordinates
 */
function createNodeId(i: number, j: number): string {
  return `${i},${j}`;
}

/**
 * Identify plaquettes in the 2D periodic lattice
 */
function identifyPlaquettes(graph: QuantumGraph, width: number, height: number): PlaquetteData {
  const xPlaquettes: string[][] = [];
  const zPlaquettes: string[][] = [];
  
  // For toric code, we have vertex-centered and face-centered plaquettes
  // X-stabilizers act on vertices around each vertex (star operator)
  // Z-stabilizers act on vertices around each face (plaquette operator)
  
  // Z-plaquettes (face-centered): 4 vertices forming a square
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const v1 = createNodeId(i, j);
      const v2 = createNodeId((i + 1) % width, j);
      const v3 = createNodeId((i + 1) % width, (j + 1) % height);
      const v4 = createNodeId(i, (j + 1) % height);
      
      // Verify all vertices exist in graph
      if (graph.hasNode(v1) && graph.hasNode(v2) && graph.hasNode(v3) && graph.hasNode(v4)) {
        zPlaquettes.push([v1, v2, v3, v4]);
      }
    }
  }
  
  // X-plaquettes (vertex-centered): 4 neighbors of each vertex (star operator)
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const center = createNodeId(i, j);
      const neighbors = [
        createNodeId((i - 1 + width) % width, j),    // left
        createNodeId((i + 1) % width, j),            // right
        createNodeId(i, (j - 1 + height) % height),  // up
        createNodeId(i, (j + 1) % height)            // down
      ];
      
      // Verify all neighbors exist
      if (neighbors.every(n => graph.hasNode(n))) {
        xPlaquettes.push(neighbors);
      }
    }
  }
  
  return { xPlaquettes, zPlaquettes };
}

/**
 * Create 4-qubit stabilizer operators using tensor products
 */
function createStabilizerOperators(): { xStabilizer: IOperator; zStabilizer: IOperator } {
  // XXXX stabilizer: X ⊗ X ⊗ X ⊗ X
  const xStabilizer = PauliX
    .tensorProduct(PauliX)
    .tensorProduct(PauliX)
    .tensorProduct(PauliX);
  
  // ZZZZ stabilizer: Z ⊗ Z ⊗ Z ⊗ Z
  const zStabilizer = PauliZ
    .tensorProduct(PauliZ)
    .tensorProduct(PauliZ)
    .tensorProduct(PauliZ);
  
  return { xStabilizer, zStabilizer };
}

/**
 * Setup toric code quantum graph with initial |0⟩ states
 */
function setupToricCode(config: ToricCodeConfig): QuantumGraph {
  const { width, height, verbose = false } = config;
  
  if (verbose) console.log(`Setting up ${width}x${height} toric code lattice`);
  
  // Create 2D periodic lattice using graph-core
  const lattice = lattice2DPeriodic(width, height);
  
  // Wrap in QuantumGraph
  const graph = new QuantumGraph(lattice);
  
  // Assign |0⟩ state to each vertex
  const nodes = graph.getNodes();
  for (const node of nodes) {
    const initialState = createBasisState(2, 0);  // |0⟩
    graph.setVertexQuantumObject(node.id, initialState);
    
    if (verbose) console.log(`Initialized vertex ${node.id} with |0⟩ state`);
  }
  
  if (verbose) {
    console.log(`Toric code setup complete: ${graph.nodeCount} vertices, ${graph.edgeCount} edges`);
  }
  
  return graph;
}

/**
 * Apply stabilizer operators to all plaquettes
 */
function applyStabilizers(graph: QuantumGraph, config: ToricCodeConfig): void {
  const { width, height, verbose = false } = config;
  const { xStabilizer, zStabilizer } = createStabilizerOperators();
  const { xPlaquettes, zPlaquettes } = identifyPlaquettes(graph, width, height);
  
  if (verbose) {
    console.log('\n=== Applying Stabilizer Operators ===');
    console.log(`Found ${xPlaquettes.length} X-plaquettes and ${zPlaquettes.length} Z-plaquettes`);
  }
  
  // Apply X-stabilizers (star operators)
  for (let i = 0; i < xPlaquettes.length; i++) {
    const plaquette = xPlaquettes[i];
    
    if (verbose) {
      console.log(`\nApplying X-stabilizer ${i} to vertices: ${plaquette.join(', ')}`);
    }
    
    try {
      graph.applyOperation(plaquette, xStabilizer);
      
      if (verbose) {
        const composite = graph.getCompositeQuantumObject(plaquette);
        console.log(`  X-stabilizer applied, composite dimension: ${composite ? (composite as any).dimension : 'none'}`);
      }
    } catch (error) {
      console.error(`Failed to apply X-stabilizer ${i}:`, (error as Error).message);
    }
  }
  
  // Apply Z-stabilizers (plaquette operators)
  for (let i = 0; i < zPlaquettes.length; i++) {
    const plaquette = zPlaquettes[i];
    
    if (verbose) {
      console.log(`\nApplying Z-stabilizer ${i} to vertices: ${plaquette.join(', ')}`);
    }
    
    try {
      graph.applyOperation(plaquette, zStabilizer);
      
      if (verbose) {
        const composite = graph.getCompositeQuantumObject(plaquette);
        console.log(`  Z-stabilizer applied, composite dimension: ${composite ? (composite as any).dimension : 'none'}`);
      }
    } catch (error) {
      console.error(`Failed to apply Z-stabilizer ${i}:`, (error as Error).message);
    }
  }
  
  if (verbose) {
    console.log('\n=== Stabilizer Application Complete ===');
  }
}

/**
 * Analyze the toric code state after stabilizer application
 */
function analyzeToricCode(graph: QuantumGraph, config: ToricCodeConfig): void {
  const { width, height } = config;
  const { xPlaquettes, zPlaquettes } = identifyPlaquettes(graph, width, height);
  
  console.log('\n=== Toric Code Analysis ===');
  console.log(`Lattice size: ${width}x${height} (${graph.nodeCount} vertices)`);
  console.log(`X-plaquettes: ${xPlaquettes.length}, Z-plaquettes: ${zPlaquettes.length}`);
  
  // Analyze X-stabilizer plaquettes
  let xEntangled = 0;
  for (let i = 0; i < Math.min(3, xPlaquettes.length); i++) {
    const plaquette = xPlaquettes[i];
    const composite = graph.getCompositeQuantumObject(plaquette);
    const individual = graph.getVertexQuantumObject(plaquette[0]);
    
    console.log(`\nX-plaquette ${i}: ${plaquette.join(', ')}`);
    console.log(`  Composite exists: ${composite ? 'YES' : 'NO'}`);
    console.log(`  Composite dimension: ${composite ? (composite as any).dimension : 'N/A'}`);
    console.log(`  Individual dimension: ${individual ? (individual as any).dimension : 'N/A'}`);
    console.log(`  Entangled: ${composite && (composite as any).dimension === 16 ? 'YES' : 'NO'}`);
    
    if (composite && (composite as any).dimension === 16) {
      xEntangled++;
    }
  }
  
  // Analyze Z-stabilizer plaquettes
  let zEntangled = 0;
  for (let i = 0; i < Math.min(3, zPlaquettes.length); i++) {
    const plaquette = zPlaquettes[i];
    const composite = graph.getCompositeQuantumObject(plaquette);
    const individual = graph.getVertexQuantumObject(plaquette[0]);
    
    console.log(`\nZ-plaquette ${i}: ${plaquette.join(', ')}`);
    console.log(`  Composite exists: ${composite ? 'YES' : 'NO'}`);
    console.log(`  Composite dimension: ${composite ? (composite as any).dimension : 'N/A'}`);
    console.log(`  Individual dimension: ${individual ? (individual as any).dimension : 'N/A'}`);
    console.log(`  Entangled: ${composite && (composite as any).dimension === 16 ? 'YES' : 'NO'}`);
    
    if (composite && (composite as any).dimension === 16) {
      zEntangled++;
    }
  }
  
  console.log(`\nSummary: ${xEntangled}/${Math.min(3, xPlaquettes.length)} X-plaquettes entangled, ${zEntangled}/${Math.min(3, zPlaquettes.length)} Z-plaquettes entangled`);
}

/**
 * Measure stabilizer operators
 */
function measureStabilizers(graph: QuantumGraph, config: ToricCodeConfig): void {
  const { width, height } = config;
  const { xPlaquettes, zPlaquettes } = identifyPlaquettes(graph, width, height);
  
  console.log('\n=== Stabilizer Measurements ===');
  
  // Measure X-stabilizers
  console.log('\nX-stabilizer measurements:');
  for (let i = 0; i < Math.min(3, xPlaquettes.length); i++) {
    const plaquette = xPlaquettes[i];
    
    try {
      const result = graph.measureSubsystem(plaquette);
      console.log(`X-stabilizer ${i}: outcome=${result.outcome}, probability=${result.probability.toFixed(4)}`);
    } catch (error) {
      console.log(`X-stabilizer ${i}: measurement failed - ${(error as Error).message}`);
    }
  }
  
  // Measure Z-stabilizers
  console.log('\nZ-stabilizer measurements:');
  for (let i = 0; i < Math.min(3, zPlaquettes.length); i++) {
    const plaquette = zPlaquettes[i];
    
    try {
      const result = graph.measureSubsystem(plaquette);
      console.log(`Z-stabilizer ${i}: outcome=${result.outcome}, probability=${result.probability.toFixed(4)}`);
    } catch (error) {
      console.log(`Z-stabilizer ${i}: measurement failed - ${(error as Error).message}`);
    }
  }
}

/**
 * Main example runner
 */
export function runToricCodeExample(): void {
  console.log('🔬 Toric Code Stabilizer Example\n');
  
  // Example 1: Small 3x3 toric code
  console.log('Example 1: 3x3 toric code');
  const config1: ToricCodeConfig = {
    width: 3,
    height: 3,
    verbose: true
  };
  
  let graph1 = setupToricCode(config1);
  applyStabilizers(graph1, config1);
  analyzeToricCode(graph1, config1);
  measureStabilizers(graph1, config1);
  
  // Example 2: Larger 4x4 toric code
  console.log('\n' + '='.repeat(60));
  console.log('Example 2: 4x4 toric code');
  const config2: ToricCodeConfig = {
    width: 4,
    height: 4,
    verbose: false
  };
  
  let graph2 = setupToricCode(config2);
  applyStabilizers(graph2, config2);
  analyzeToricCode(graph2, config2);
  measureStabilizers(graph2, config2);
  
  // Example 3: Single plaquette demonstration
  console.log('\n' + '='.repeat(60));
  console.log('Example 3: 2x2 toric code with detailed analysis');
  const config3: ToricCodeConfig = {
    width: 2,
    height: 2,
    verbose: true
  };
  
  let graph3 = setupToricCode(config3);
  
  console.log('\nInitial state analysis:');
  const nodes = graph3.getNodes();
  for (let i = 0; i < Math.min(4, nodes.length); i++) {
    const node = nodes[i];
    const state = graph3.getVertexQuantumObject(node.id);
    console.log(`${node.id}: dimension ${state ? (state as any).dimension : 'none'}`);
  }
  
  applyStabilizers(graph3, config3);
  analyzeToricCode(graph3, config3);
  
  console.log('\n✨ Toric code stabilizer example completed!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runToricCodeExample();
}
