/**
 * Basic tests for quantum graph general operations
 */

import { describe, it, expect, test, beforeEach } from 'vitest';
import { QuantumGraph } from '../../src/qgraph/QuantumGraph';
import { StateVector } from '../../src/states/stateVector';
import { MatrixOperator } from '../../src/operators/operator';
import * as math from 'mathjs';

describe('Quantum Graph General Operations', () => {
  let graph: QuantumGraph;
  let hadamard: MatrixOperator;
  let cnot: MatrixOperator;

  beforeEach(() => {
    graph = new QuantumGraph();
    
    // Hadamard gate
    const hadamardMatrix = [
      [math.complex(1/Math.sqrt(2), 0), math.complex(1/Math.sqrt(2), 0)],
      [math.complex(1/Math.sqrt(2), 0), math.complex(-1/Math.sqrt(2), 0)]
    ];
    hadamard = new MatrixOperator(hadamardMatrix);

    // CNOT gate (4x4 for 2-qubit system)
    const cnotMatrix = [
      [math.complex(1, 0), math.complex(0, 0), math.complex(0, 0), math.complex(0, 0)],
      [math.complex(0, 0), math.complex(1, 0), math.complex(0, 0), math.complex(0, 0)],
      [math.complex(0, 0), math.complex(0, 0), math.complex(0, 0), math.complex(1, 0)],
      [math.complex(0, 0), math.complex(0, 0), math.complex(1, 0), math.complex(0, 0)]
    ];
    cnot = new MatrixOperator(cnotMatrix);
  });

  test('single vertex operation', () => {
    // Setup
    graph.addNode({id: 'q0', type: 'qubit', properties: {}});
    graph.setVertexQuantumObject('q0', StateVector.computationalBasis(2, 0)); // |0⟩
    
    // Apply Hadamard
    graph.applyVertexOperation(['q0'], hadamard);
    
    // Check result
    const result = graph.getVertexQuantumObject('q0');
    expect(result).toBeDefined();
    expect(result?.objectType).toBe('state');
    expect((result as any).dimension).toBe(2);
  });

  test('multi-vertex operation creates composite', () => {
    // Setup two vertices
    graph.addNode({id: 'q0', type: 'qubit', properties: {}});
    graph.addNode({id: 'q1', type: 'qubit', properties: {}});
    graph.setVertexQuantumObject('q0', StateVector.computationalBasis(2, 0)); // |0⟩
    graph.setVertexQuantumObject('q1', StateVector.computationalBasis(2, 0)); // |0⟩
    
    // Apply CNOT
    graph.applyVertexOperation(['q0', 'q1'], cnot);
    
    // Check composite was created
    const composite = graph.getCompositeQuantumObject(['q0', 'q1']);
    expect(composite).toBeDefined();
    expect(composite?.objectType).toBe('state');
    expect((composite as any).dimension).toBe(4); // 2^2
    
    // Individual vertices should return composite state
    const q0State = graph.getVertexQuantumObject('q0');
    const q1State = graph.getVertexQuantumObject('q1');
    expect(q0State).toBe(composite);
    expect(q1State).toBe(composite);
  });

  test('edge operations work', () => {
    // Setup
    graph.addNode({id: 'q0', type: 'qubit', properties: {}});
    graph.addNode({id: 'q1', type: 'qubit', properties: {}});
    graph.addEdge({id: 'e01', sourceId: 'q0', targetId: 'q1', directed: false, type: 'quantum', properties: {}});
    graph.setEdgeQuantumObject('e01', StateVector.computationalBasis(2, 0));
    
    // Apply operation to edge
    graph.applyEdgeOperation(['e01'], hadamard);
    
    // Check result
    const result = graph.getEdgeQuantumObject('e01');
    expect(result).toBeDefined();
    expect(result?.objectType).toBe('state');
  });

  test('mixed vertex and edge operation', () => {
    // Setup vertex and edge
    graph.addNode({id: 'q0', type: 'qubit', properties: {}});
    graph.addNode({id: 'q1', type: 'qubit', properties: {}});
    graph.addEdge({id: 'e01', sourceId: 'q0', targetId: 'q1', directed: false, type: 'quantum', properties: {}});
    graph.setVertexQuantumObject('q0', StateVector.computationalBasis(2, 0));
    graph.setEdgeQuantumObject('e01', StateVector.computationalBasis(2, 0));
    
    // Apply operation to both
    graph.applyOperation(['q0', 'e01'], cnot);
    
    // Check composite was created
    const composite = graph.getCompositeQuantumObject(['q0', 'e01']);
    expect(composite).toBeDefined();
    expect((composite as any).dimension).toBe(4);
  });

  test('measurement operation', () => {
    // Setup
    graph.addNode({id: 'q0', type: 'qubit', properties: {}});
    graph.setVertexQuantumObject('q0', StateVector.computationalBasis(2, 0));
    
    // Measure
    const result = graph.measureSubsystem(['q0']);
    
    // Check measurement result
    expect(result.outcome).toBeDefined();
    expect(result.probability).toBeGreaterThan(0);
    expect(result.postMeasurementState).toBeDefined();
    expect(result.measuredSubsystem).toEqual(['q0']);
  });

  test('error handling for missing elements', () => {
    expect(() => {
      graph.applyVertexOperation(['nonexistent'], hadamard);
    }).toThrow();
  });

  test('error handling for empty element list', () => {
    expect(() => {
      graph.applyVertexOperation([], hadamard);
    }).toThrow();
  });
});
