/**
 * Bell State Chain Example
 * 
 * Demonstrates a quantum graph with configurable vertices in a chain/ring topology.
 * Each pair of adjacent vertices shares a Bell state entanglement.
 * 
 * Features:
 * - Arbitrary number of vertices (minimum 2)
 * - Periodic boundary conditions (ring) or aperiodic (chain)
 * - Each vertex labeled with qubit states
 * - Each edge labeled with Bell state creation operators
 */

import { QuantumGraph } from '../../src/qgraph';
import { StateVector } from '../../src/states/stateVector';
import { IOperator, QuantumObject } from '../../src/core/types';
import { measureState } from '../../src/operators/measurement';
import { MatrixOperator } from '../../src/operators/operator';
import * as math from 'mathjs';

export interface BellChainConfig {
  /** Number of vertices in the chain */
  numVertices: number;
  /** Whether to connect last vertex back to first (ring topology) */
  periodic: boolean;
  /** Initial state for each vertex (default: |0⟩) */
  initialState?: StateVector;
}

/**
 * Creates a Bell state chain quantum graph
 */
export function createBellStateChain(config: BellChainConfig): QuantumGraph {
  const { numVertices, periodic, initialState } = config;
  
  if (numVertices < 2) {
    throw new Error('Bell state chain requires at least 2 vertices');
  }

  const graph = new QuantumGraph();
  
  // Default initial state is |0⟩
  const defaultState = initialState || StateVector.computationalBasis(2, 0);
  
  // Add vertices with initial qubit states
  const vertexIds: string[] = [];
  for (let i = 0; i < numVertices; i++) {
    const vertexId = `q${i}`;
    graph.addNode({ 
      id: vertexId, 
      type: 'qubit',
      properties: {
        label: `Qubit ${i}`,
        position: {x: i * 100, y: 0}
      }
    });
    graph.setVertexQuantumObject(vertexId, defaultState);
    vertexIds.push(vertexId);
  }
  
  // Create Bell state edges between pairs
  for (let i = 0; i < numVertices - 1; i++) {
    const sourceId = vertexIds[i];
    const targetId = vertexIds[i + 1];
    const edgeId = `bell_${i}_${i + 1}`;
    graph.addEdge({ 
      id: edgeId, 
      sourceId,
      targetId, 
      type: 'bell',
      directed: false,
      properties: {
        label: `Bell ${i}`,
        type: 'entanglement'
      }
    });
  }
  
  // Add closing edge for periodic boundary conditions
  if (periodic && numVertices > 2) {
    const sourceId = vertexIds[numVertices - 1]; 
    const targetId = vertexIds[0];
    const edgeId = `bell_${numVertices - 1}_0`;
    graph.addEdge({ 
      id: edgeId, 
      sourceId,
      targetId, 
      type: 'bell',
      directed: false,
      properties: {
        label: `Bell ${numVertices - 1}`,
        type: 'entanglement'
      }
    });
  }
  
  console.log(`Created quantum graph with ${numVertices} qubits`);
  console.log(`Total edges: ${graph.getEdges().length}`);

  return graph;
}

/**
 * Analyzes the Bell state chain and prints information
 */
export function analyzeBellStateChain(graph: QuantumGraph): void {
  // Analyze vertex quantum objects
  for (const node of graph.getNodes()) {
    const quantumObj = graph.getVertexQuantumObject(node.id);
    console.log(`Vertex ${node.id}: ${quantumObj ? 'Has quantum state' : 'No quantum state'}`);
  }

  // Analyze edge quantum objects
  for (const edge of graph.getEdges()) {
    const quantumObj = graph.getEdgeQuantumObject(edge.id);
    console.log(`Edge ${edge.id}: ${quantumObj ? 'Has quantum state' : 'No quantum state'}`);
  }

  const nodes = graph.getNodes();
  console.log(`\nTotal nodes: ${nodes.length}`);
  console.log(`Total edges: ${graph.getEdges().length}`);
}

/**
 * Simulates Bell state preparation along the chain
 */
export function simulateBellStateChain(graph: QuantumGraph): QuantumGraph {
  const expectedEdges = graph.nodeCount / 2;
  console.log(`\nConnectivity: ${graph.getEdges().length}/${expectedEdges} edges`);

  // Simulate measurement on first vertex if it has a quantum state
  const nodes = graph.getNodes();
  if (nodes.length > 0) {
    const firstVertex = nodes[0].id;
    const quantumObj = graph.getVertexQuantumObject(firstVertex);
    
    if (quantumObj && isStateVector(quantumObj)) {
      try {
        // Create measurement operator (projector onto computational basis)
        const measurementOperator = new MatrixOperator([
          [math.complex(1, 0), math.complex(0, 0)],
          [math.complex(0, 0), math.complex(0, 0)]
        ], 'hermitian');
        
        // Perform measurement
        const result = measureState(quantumObj as StateVector, measurementOperator);
        
        // Update state with measurement result
        graph.setVertexQuantumObject(firstVertex, result.state);
        console.log(`Measured vertex ${firstVertex} with probability ${result.probability}`);
      } catch (err) {
        console.error(`Failed to measure vertex ${firstVertex}:`, err);
      }
    } else {
      console.log(`Vertex ${firstVertex} does not have a measurable quantum state`);
    }
  }

  return graph;
}

// Type guard to check if an object is a StateVector
function isStateVector(obj: QuantumObject): obj is StateVector {
  return obj && (obj as any).objectType === 'state';
}

/**
 * Example usage and demonstration
 */
export function runBellChainExample(): void {
  console.log('🔬 Quantum Graph Bell State Chain Example\n');
  
  // Example 1: Simple 3-vertex chain
  console.log('Example 1: 3-vertex chain (aperiodic)');
  const chainConfig: BellChainConfig = {
    numVertices: 3,
    periodic: false
  };
  
  let chain = createBellStateChain(chainConfig);
  analyzeBellStateChain(chain);
  chain = simulateBellStateChain(chain);
  
  // Example 2: 4-vertex ring
  console.log('\n' + '='.repeat(50));
  console.log('Example 2: 4-vertex ring (periodic)');
  const ringConfig: BellChainConfig = {
    numVertices: 4,
    periodic: true
  };
  
  let ring = createBellStateChain(ringConfig);
  analyzeBellStateChain(ring);
  ring = simulateBellStateChain(ring);
  
  // Example 3: Large chain
  console.log('\n' + '='.repeat(50));
  console.log('Example 3: 6-vertex chain with custom initial state');
  
  // Create custom initial state |1⟩
  const customState = StateVector.computationalBasis(2, 1);
  const largeChainConfig: BellChainConfig = {
    numVertices: 6,
    periodic: false,
    initialState: customState
  };
  
  const largeChain = createBellStateChain(largeChainConfig);
  analyzeBellStateChain(largeChain);
  
  console.log('\n✨ Bell state chain examples completed!');
}

// Run the example if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runBellChainExample();
}
