/**
 * Basic example demonstrating quantum graph general operations
 */

import { QuantumGraph } from '../../src/qgraph/QuantumGraph';
import { StateVector } from '../../src/states/stateVector';
import { MatrixOperator } from '../../src/operators/operator';
import * as math from 'mathjs';

// Create quantum gates
function createHadamardGate(): MatrixOperator {
  const matrix = [
    [math.complex(1/Math.sqrt(2), 0), math.complex(1/Math.sqrt(2), 0)],
    [math.complex(1/Math.sqrt(2), 0), math.complex(-1/Math.sqrt(2), 0)]
  ];
  return new MatrixOperator(matrix);
}

function createCNOTGate(): MatrixOperator {
  const matrix = [
    [math.complex(1, 0), math.complex(0, 0), math.complex(0, 0), math.complex(0, 0)],
    [math.complex(0, 0), math.complex(1, 0), math.complex(0, 0), math.complex(0, 0)],
    [math.complex(0, 0), math.complex(0, 0), math.complex(0, 0), math.complex(1, 0)],
    [math.complex(0, 0), math.complex(0, 0), math.complex(1, 0), math.complex(0, 0)]
  ];
  return new MatrixOperator(matrix);
}

function basicVertexOperations() {
  console.log('=== Basic Vertex Operations ===');
  
  const graph = new QuantumGraph();
  const hadamard = createHadamardGate();
  
  // Add vertex and set initial state
  graph.addNode({id: 'q0', type: 'qubit', properties: {}});
  graph.setVertexQuantumObject('q0', StateVector.computationalBasis(2, 0)); // |0⟩
  
  console.log('Initial state dimension:', (graph.getVertexQuantumObject('q0') as any)?.dimension);
  
  // Apply Hadamard gate
  graph.applyVertexOperation(['q0'], hadamard);
  
  console.log('After Hadamard - dimension:', (graph.getVertexQuantumObject('q0') as any)?.dimension);
  console.log('State stored as individual vertex object');
}

function bellStateCreation() {
  console.log('\n=== Bell State Creation ===');
  
  const graph = new QuantumGraph();
  const hadamard = createHadamardGate();
  const cnot = createCNOTGate();
  
  // Setup two qubits
  graph.addNode({id: 'q0', type: 'qubit', properties: {}});
  graph.addNode({id: 'q1', type: 'qubit', properties: {}});
  graph.setVertexQuantumObject('q0', StateVector.computationalBasis(2, 0)); // |0⟩
  graph.setVertexQuantumObject('q1', StateVector.computationalBasis(2, 0)); // |0⟩
  
  // Apply Hadamard to first qubit
  graph.applyVertexOperation(['q0'], hadamard);
  console.log('After H on q0 - individual states exist');
  
  // Apply CNOT to create Bell state
  graph.applyVertexOperation(['q0', 'q1'], cnot);
  
  // Check composite state
  const composite = graph.getCompositeQuantumObject(['q0', 'q1']);
  console.log('Bell state dimension:', (composite as any)?.dimension);
  console.log('q0 and q1 now return the same composite state');
  
  // Verify composite priority
  const q0State = graph.getVertexQuantumObject('q0');
  const q1State = graph.getVertexQuantumObject('q1');
  console.log('q0 === composite:', q0State === composite);
  console.log('q1 === composite:', q1State === composite);
}

function edgeOperations() {
  console.log('\n=== Edge Operations ===');
  
  const graph = new QuantumGraph();
  const hadamard = createHadamardGate();
  
  // Setup graph with edge
  graph.addNode({id: 'q0', type: 'qubit', properties: {}});
  graph.addNode({id: 'q1', type: 'qubit', properties: {}});
  graph.addEdge({id: 'e01', sourceId: 'q0', targetId: 'q1', directed: false, type: 'quantum', properties: {}});
  
  // Assign quantum state to edge
  graph.setEdgeQuantumObject('e01', StateVector.computationalBasis(2, 0));
  console.log('Edge state dimension:', (graph.getEdgeQuantumObject('e01') as any)?.dimension);
  
  // Apply operation to edge
  graph.applyEdgeOperation(['e01'], hadamard);
  console.log('After Hadamard on edge - dimension:', (graph.getEdgeQuantumObject('e01') as any)?.dimension);
}

function mixedOperations() {
  console.log('\n=== Mixed Vertex and Edge Operations ===');
  
  const graph = new QuantumGraph();
  const cnot = createCNOTGate();
  
  // Setup
  graph.addNode({id: 'q0', type: 'qubit', properties: {}});
  graph.addNode({id: 'q1', type: 'qubit', properties: {}});
  graph.addEdge({id: 'e01', sourceId: 'q0', targetId: 'q1', directed: false, type: 'quantum', properties: {}});
  
  graph.setVertexQuantumObject('q0', StateVector.computationalBasis(2, 0));
  graph.setEdgeQuantumObject('e01', StateVector.computationalBasis(2, 0));
  
  // Apply operation to both vertex and edge
  graph.applyOperation(['q0', 'e01'], cnot);
  
  const composite = graph.getCompositeQuantumObject(['q0', 'e01']);
  console.log('Mixed composite dimension:', (composite as any)?.dimension);
  console.log('Vertex q0 now returns composite:', graph.getVertexQuantumObject('q0') === composite);
  console.log('Edge e01 now returns composite:', graph.getEdgeQuantumObject('e01') === composite);
}

function measurementExample() {
  console.log('\n=== Measurement Operations ===');
  
  const graph = new QuantumGraph();
  
  // Setup qubit
  graph.addNode({id: 'q0', type: 'qubit', properties: {}});
  graph.setVertexQuantumObject('q0', StateVector.computationalBasis(2, 0));
  
  // Measure
  const result = graph.measureSubsystem(['q0']);
  console.log('Measurement outcome:', result.outcome);
  console.log('Measurement probability:', result.probability);
  console.log('Measured subsystem:', result.measuredSubsystem);
}

// Run all examples
export function runQuantumGraphExamples() {
  console.log('Quantum Graph General Operations Examples\n');
  
  try {
    basicVertexOperations();
    bellStateCreation();
    edgeOperations();
    mixedOperations();
    measurementExample();
    
    console.log('\n=== All Examples Complete ===');
  } catch (error) {
    console.error('Example failed:', error);
  }
}

// Run if called directly
// if (require.main === module) {
runQuantumGraphExamples();
// }
