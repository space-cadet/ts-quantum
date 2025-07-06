/**
 * Dynamic Bell State Chain Example
 * 
 * Demonstrates genuine quantum entanglement generation using the quantum graph module.
 * Starting from individual |0⟩ states, creates Bell states dynamically through gate operations.
 * 
 * Features:
 * - Dynamic entanglement generation (not pre-constructed)
 * - Actual quantum operators on edges
 * - Composite state creation via gate operations
 * - Bell state verification and analysis
 */

import { QuantumGraph } from '../../src/qgraph';
import { StateVector } from '../../src/states/stateVector';
import { MatrixOperator } from '../../src/operators/operator';
import * as math from 'mathjs';

export interface DynamicBellConfig {
  /** Number of vertex pairs for Bell states */
  numPairs: number;
  /** Whether to create a ring topology */
  periodic: boolean;
  /** Verbose output during generation */
  verbose?: boolean;
}

/**
 * Create quantum gates for Bell state generation
 */
function createQuantumGates() {
  // Hadamard gate: |0⟩ → (|0⟩ + |1⟩)/√2
  const hadamardMatrix = [
    [math.complex(1/Math.sqrt(2), 0), math.complex(1/Math.sqrt(2), 0)],
    [math.complex(1/Math.sqrt(2), 0), math.complex(-1/Math.sqrt(2), 0)]
  ];
  
  // CNOT gate: |00⟩→|00⟩, |01⟩→|01⟩, |10⟩→|11⟩, |11⟩→|10⟩
  const cnotMatrix = [
    [math.complex(1, 0), math.complex(0, 0), math.complex(0, 0), math.complex(0, 0)],
    [math.complex(0, 0), math.complex(1, 0), math.complex(0, 0), math.complex(0, 0)],
    [math.complex(0, 0), math.complex(0, 0), math.complex(0, 0), math.complex(1, 0)],
    [math.complex(0, 0), math.complex(0, 0), math.complex(1, 0), math.complex(0, 0)]
  ];
  
  return {
    hadamard: new MatrixOperator(hadamardMatrix),
    cnot: new MatrixOperator(cnotMatrix)
  };
}

/**
 * Creates a dynamic Bell state chain with actual entanglement generation
 */
export function createDynamicBellChain(config: DynamicBellConfig): QuantumGraph {
  const { numPairs, periodic, verbose = false } = config;
  
  if (numPairs < 1) {
    throw new Error('Need at least 1 pair for Bell states');
  }

  const graph = new QuantumGraph();
  const gates = createQuantumGates();
  
  if (verbose) console.log(`Creating dynamic Bell chain with ${numPairs} pairs`);

  // Step 1: Add vertices with individual |0⟩ states
  const vertexIds: string[] = [];
  for (let i = 0; i < numPairs * 2; i++) {
    const vertexId = `q${i}`;
    graph.addNode({ 
      id: vertexId, 
      type: 'qubit',
      properties: { label: `Qubit ${i}` }
    });
    // Start with computational basis |0⟩
    graph.setVertexQuantumObject(vertexId, StateVector.computationalBasis(2, 0));
    vertexIds.push(vertexId);
    
    if (verbose) console.log(`Added vertex ${vertexId} with |0⟩ state`);
  }

  // Step 2: Add edges and assign CNOT operators
  const edgeIds: string[] = [];
  for (let i = 0; i < numPairs; i++) {
    const control = vertexIds[i * 2];
    const target = vertexIds[i * 2 + 1];
    const edgeId = `bell_${i}`;
    
    graph.addEdge({ 
      id: edgeId, 
      sourceId: control,
      targetId: target, 
      type: 'entangler',
      directed: true,
      properties: { operation: 'CNOT' }
    });
    
    // Assign actual CNOT operator to edge
    graph.setEdgeQuantumObject(edgeId, gates.cnot);
    edgeIds.push(edgeId);
    
    if (verbose) console.log(`Added edge ${edgeId} with CNOT operator: ${control} → ${target}`);
  }

  // Step 3: Add chain connections for periodic topology
  if (periodic && numPairs > 1) {
    const lastPair = vertexIds[vertexIds.length - 1];
    const firstPair = vertexIds[0];
    const chainEdgeId = 'chain_connect';
    
    graph.addEdge({
      id: chainEdgeId,
      sourceId: lastPair,
      targetId: firstPair,
      type: 'chain',
      directed: false,
      properties: { operation: 'chain' }
    });
    
    if (verbose) console.log(`Added periodic connection: ${lastPair} ↔ ${firstPair}`);
  }

  if (verbose) {
    console.log(`Graph created: ${graph.nodeCount} vertices, ${graph.edgeCount} edges`);
  }

  return graph;
}

/**
 * Generate Bell states dynamically by applying quantum operations
 */
export function generateBellStates(graph: QuantumGraph, config: DynamicBellConfig): void {
  const { numPairs, verbose = false } = config;
  const gates = createQuantumGates();
  
  if (verbose) console.log('\n=== Generating Bell States Dynamically ===');

  for (let i = 0; i < numPairs; i++) {
    const control = `q${i * 2}`;
    const target = `q${i * 2 + 1}`;
    
    if (verbose) console.log(`\nProcessing pair ${i}: ${control}, ${target}`);
    
    // Step 1: Apply Hadamard to control qubit
    if (verbose) console.log(`  Applying H to ${control}`);
    graph.applyVertexOperation([control], gates.hadamard);
    
    const controlState = graph.getVertexQuantumObject(control);
    if (verbose && controlState) {
      console.log(`  ${control} now in superposition (dim: ${(controlState as any).dimension})`);
    }
    
    // Step 2: Apply CNOT to create Bell state
    if (verbose) console.log(`  Applying CNOT: ${control} → ${target}`);
    graph.applyVertexOperation([control, target], gates.cnot);
    
    // Verify composite state was created
    const composite = graph.getCompositeQuantumObject([control, target]);
    if (composite && verbose) {
      console.log(`  Bell state created! Composite dimension: ${(composite as any).dimension}`);
      console.log(`  Both ${control} and ${target} now return same composite state`);
    }
  }
  
  if (verbose) console.log('\n=== Bell State Generation Complete ===');
}

/**
 * Analyze the generated Bell states
 */
export function analyzeBellStates(graph: QuantumGraph, config: DynamicBellConfig): void {
  const { numPairs, verbose = false } = config;
  
  console.log('\n=== Bell State Analysis ===');
  
  for (let i = 0; i < numPairs; i++) {
    const control = `q${i * 2}`;
    const target = `q${i * 2 + 1}`;
    
    // Check individual states (should return composite)
    const controlState = graph.getVertexQuantumObject(control);
    const targetState = graph.getVertexQuantumObject(target);
    const composite = graph.getCompositeQuantumObject([control, target]);
    
    console.log(`\nPair ${i}: ${control}, ${target}`);
    console.log(`  ${control} state dimension: ${controlState ? (controlState as any).dimension : 'none'}`);
    console.log(`  ${target} state dimension: ${targetState ? (targetState as any).dimension : 'none'}`);
    console.log(`  Composite exists: ${composite ? 'YES' : 'NO'}`);
    console.log(`  States identical: ${controlState === targetState ? 'YES' : 'NO'}`);
    console.log(`  Entangled: ${composite && (composite as any).dimension === 4 ? 'YES' : 'NO'}`);
    
    if (composite && verbose) {
      const norm = (composite as any).norm();
      console.log(`  Bell state norm: ${norm.toFixed(6)}`);
    }
  }
}

/**
 * Measure Bell states and show results
 */
export function measureBellStates(graph: QuantumGraph, config: DynamicBellConfig): void {
  const { numPairs } = config;
  
  console.log('\n=== Bell State Measurements ===');
  
  for (let i = 0; i < numPairs; i++) {
    const control = `q${i * 2}`;
    const target = `q${i * 2 + 1}`;
    
    try {
      const result = graph.measureSubsystem([control, target]);
      console.log(`Pair ${i}: outcome=${result.outcome}, probability=${result.probability.toFixed(4)}`);
    } catch (error) {
      console.log(`Pair ${i}: measurement failed - ${(error as Error).message}`);
    }
  }
}

/**
 * Main example runner
 */
export function runDynamicBellChainExample(): void {
  console.log('🔬 Dynamic Bell State Chain Example\n');
  
  // Example 1: Simple 2-pair chain
  console.log('Example 1: 2-pair Bell state chain');
  const config1: DynamicBellConfig = {
    numPairs: 2,
    periodic: false,
    verbose: true
  };
  
  let graph1 = createDynamicBellChain(config1);
  generateBellStates(graph1, config1);
  analyzeBellStates(graph1, config1);
  measureBellStates(graph1, config1);
  
  // Example 2: 3-pair periodic ring
  console.log('\n' + '='.repeat(60));
  console.log('Example 2: 3-pair periodic Bell ring');
  const config2: DynamicBellConfig = {
    numPairs: 3,
    periodic: true,
    verbose: false
  };
  
  let graph2 = createDynamicBellChain(config2);
  generateBellStates(graph2, config2);
  analyzeBellStates(graph2, config2);
  measureBellStates(graph2, config2);
  
  // Example 3: Single pair detailed analysis
  console.log('\n' + '='.repeat(60));
  console.log('Example 3: Single Bell pair with detailed steps');
  const config3: DynamicBellConfig = {
    numPairs: 1,
    periodic: false,
    verbose: true
  };
  
  let graph3 = createDynamicBellChain(config3);
  
  // Show step-by-step state evolution
  console.log('\nInitial states:');
  const q0Initial = graph3.getVertexQuantumObject('q0');
  const q1Initial = graph3.getVertexQuantumObject('q1');
  console.log(`q0 dimension: ${q0Initial ? (q0Initial as any).dimension : 'none'}`);
  console.log(`q1 dimension: ${q1Initial ? (q1Initial as any).dimension : 'none'}`);
  
  generateBellStates(graph3, config3);
  analyzeBellStates(graph3, config3);
  
  console.log('\n✨ Dynamic Bell state generation completed!');
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDynamicBellChainExample();
}
