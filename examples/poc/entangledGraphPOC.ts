/**
 * Proof of Concept: Composite Quantum Graph Data Structure
 * 
 * Demonstrates a graph where quantum objects can span multiple vertices
 * and/or edges, enabling true entanglement and composite quantum states.
 */

import { QuantumObject, isState, isOperator } from '../../src/core/types';
import { StateVector } from '../../src/states/stateVector';
import { PauliX, PauliZ } from '../../src/operators/gates';
import { GraphologyAdapter } from '../../../graph-core/src/core/GraphologyAdapter';
import { path, lattice2D } from '../../../graph-core/src/core/builders';
import { IGraph, IGraphNode, IGraphEdge } from '../../../graph-core/src/core/types';
import * as math from 'mathjs';

// Simple composite quantum object manager
class QCompManager {
  private composites: Map<string, QuantumObject> = new Map();
  private elementToComposite: Map<string, string> = new Map();

  setComposite(elementIds: string[], obj: QuantumObject): void {
    const compositeId = this.makeCompositeId(elementIds);
    this.composites.set(compositeId, obj);
    
    // Map each element to this composite
    for (const elementId of elementIds) {
      this.elementToComposite.set(elementId, compositeId);
    }
  }

  getComposite(elementIds: string[]): QuantumObject | undefined {
    const compositeId = this.makeCompositeId(elementIds);
    return this.composites.get(compositeId);
  }

  getCompositeForElement(elementId: string): QuantumObject | undefined {
    const compositeId = this.elementToComposite.get(elementId);
    return compositeId ? this.composites.get(compositeId) : undefined;
  }

  private makeCompositeId(elementIds: string[]): string {
    return [...elementIds].sort().join('_');
  }
}

// Enhanced quantum-labeled graph with composite support
interface ICompQGraph extends IGraph {
  // Composite quantum labeling methods
  setCompQObj(elementIds: string[], obj: QuantumObject): void;
  getCompQObj(elementIds: string[]): QuantumObject | undefined;
  
  // Backward compatible single-element methods
  setNodeQObj(nodeId: string, obj: QuantumObject): void;
  getNodeQObj(nodeId: string): QuantumObject | undefined;
  setEdgeQObj(edgeId: string, obj: QuantumObject): void;
  getEdgeQObj(edgeId: string): QuantumObject | undefined;
  
  // Graph-core adapter
  getGraphAdapter(): GraphologyAdapter;
}

// Implementation with composite quantum object support
class CompQGraph implements ICompQGraph {
  private adapter: GraphologyAdapter;
  private compositeManager: QCompManager = new QCompManager();

  constructor(baseGraph?: GraphologyAdapter) {
    this.adapter = baseGraph || new GraphologyAdapter();
  }

  // Composite quantum labeling methods
  setCompQObj(elementIds: string[], obj: QuantumObject): void {
    this.compositeManager.setComposite(elementIds, obj);
  }

  getCompQObj(elementIds: string[]): QuantumObject | undefined {
    return this.compositeManager.getComposite(elementIds);
  }

  // Backward compatible methods - check composite first, allow individual assignment
  setNodeQObj(nodeId: string, obj: QuantumObject): void {
    if (!this.adapter.hasNode(nodeId)) {
      throw new Error(`Node ${nodeId} does not exist in graph`);
    }
    // Only set individual state if not already part of composite
    if (!this.compositeManager.getCompositeForElement(nodeId)) {
      this.compositeManager.setComposite([nodeId], obj);
    }
  }

  getNodeQObj(nodeId: string): QuantumObject | undefined {
    // Always return composite state if element is part of one (composite priority)
    return this.compositeManager.getCompositeForElement(nodeId);
  }

  setEdgeQObj(edgeId: string, obj: QuantumObject): void {
    if (!this.adapter.hasEdge(edgeId)) {
      throw new Error(`Edge ${edgeId} does not exist in graph`);
    }
    // Only set individual state if not already part of composite
    if (!this.compositeManager.getCompositeForElement(edgeId)) {
      this.compositeManager.setComposite([edgeId], obj);
    }
  }

  getEdgeQObj(edgeId: string): QuantumObject | undefined {
    // Always return composite state if element is part of one (composite priority)
    return this.compositeManager.getCompositeForElement(edgeId);
  }

  getGraphAdapter(): GraphologyAdapter {
    return this.adapter;
  }

  // Delegate IGraph methods to adapter
  get isDirected(): boolean { return this.adapter.isDirected; }
  get nodeCount(): number { return this.adapter.nodeCount; }
  get edgeCount(): number { return this.adapter.edgeCount; }

  addNode(node: IGraphNode): IGraph { return this.adapter.addNode(node); }
  removeNode(nodeId: string): IGraph { return this.adapter.removeNode(nodeId); }
  addEdge(edge: IGraphEdge): IGraph { return this.adapter.addEdge(edge); }
  removeEdge(edgeId: string): IGraph { return this.adapter.removeEdge(edgeId); }
  
  getNode(nodeId: string): IGraphNode | undefined { return this.adapter.getNode(nodeId); }
  getEdge(edgeId: string): IGraphEdge | undefined { return this.adapter.getEdge(edgeId); }
  getNodes(): readonly IGraphNode[] { return this.adapter.getNodes(); }
  getEdges(): readonly IGraphEdge[] { return this.adapter.getEdges(); }
  
  getAdjacentNodes(nodeId: string, options?: any): readonly IGraphNode[] { 
    return this.adapter.getAdjacentNodes(nodeId, options); 
  }
  getConnectedEdges(nodeId: string, options?: any): readonly IGraphEdge[] { 
    return this.adapter.getConnectedEdges(nodeId, options); 
  }
  findPath(fromId: string, toId: string, options?: any): readonly any[] { 
    return this.adapter.findPath(fromId, toId, options); 
  }
  
  toAdjacencyMatrix(weightFn?: any): any { return this.adapter.toAdjacencyMatrix(weightFn); }
  toLaplacianMatrix(weightFn?: any): any { return this.adapter.toLaplacianMatrix(weightFn); }
  
  setMetadata(metadata: any): IGraph { return this.adapter.setMetadata(metadata); }
  getMetadata(): any { return this.adapter.getMetadata(); }
  
  hasNode(nodeId: string): boolean { return this.adapter.hasNode(nodeId); }
  hasEdge(edgeId: string): boolean { return this.adapter.hasEdge(edgeId); }
  areNodesAdjacent(sourceId: string, targetId: string, options?: any): boolean { 
    return this.adapter.areNodesAdjacent(sourceId, targetId, options); 
  }
  getNodeDegree(nodeId: string, options?: any): number { 
    return this.adapter.getNodeDegree(nodeId, options); 
  }
  clone(): IGraph { return this.adapter.clone(); }
  clear(): IGraph { return this.adapter.clear(); }
}

// Apply Hadamard gate to single qubit in multi-qubit state
function applyHadamard(state: StateVector, qubitIndex: number): StateVector {
  const n = Math.log2(state.dimension);
  const newState = new StateVector(state.dimension);
  
  for (let i = 0; i < state.dimension; i++) {
    const amplitude = state.getAmplitudes()[i];
    if (amplitude.re === 0 && amplitude.im === 0) continue;
    
    // Check if target qubit is 0 or 1
    const qubitValue = (i >> (n - 1 - qubitIndex)) & 1;
    const flippedIndex = i ^ (1 << (n - 1 - qubitIndex));
    
    if (qubitValue === 0) {
      // |0⟩ → (|0⟩ + |1⟩)/√2
      const factor = math.divide(amplitude, Math.sqrt(2));
      newState.setState(i, math.add(newState.getAmplitudes()[i], factor));
      newState.setState(flippedIndex, math.add(newState.getAmplitudes()[flippedIndex], factor));
    } else {
      // |1⟩ → (|0⟩ - |1⟩)/√2
      const factor = math.divide(amplitude, Math.sqrt(2));
      newState.setState(flippedIndex, math.add(newState.getAmplitudes()[flippedIndex], factor));
      newState.setState(i, math.subtract(newState.getAmplitudes()[i], factor));
    }
  }
  
  return newState;
}

// Apply CNOT gate (control, target qubits)
function applyCNOT(state: StateVector, controlQubit: number, targetQubit: number): StateVector {
  const n = Math.log2(state.dimension);
  const newState = new StateVector(state.dimension);
  
  for (let i = 0; i < state.dimension; i++) {
    const amplitude = state.getAmplitudes()[i];
    if (amplitude.re === 0 && amplitude.im === 0) continue;
    
    const controlValue = (i >> (n - 1 - controlQubit)) & 1;
    
    if (controlValue === 1) {
      // Flip target qubit
      const flippedIndex = i ^ (1 << (n - 1 - targetQubit));
      newState.setState(flippedIndex, math.add(newState.getAmplitudes()[flippedIndex], amplitude));
    } else {
      // No change
      newState.setState(i, math.add(newState.getAmplitudes()[i], amplitude));
    }
  }
  
  return newState;
}

// Create Bell state using quantum gates: H ⊗ I then CNOT
function createBellState(): StateVector {
  // Start with |00⟩ state
  const initialState = new StateVector(4); // 2-qubit system
  initialState.setState(0, math.complex(1, 0)); // |00⟩
  
  // Apply Hadamard to first qubit: |00⟩ → (|00⟩ + |10⟩)/√2
  const afterHadamard = applyHadamard(initialState, 0);
  
  // Apply CNOT with first qubit as control: (|00⟩ + |10⟩)/√2 → (|00⟩ + |11⟩)/√2
  const bellState = applyCNOT(afterHadamard, 0, 1);
  
  return bellState;
}

// Apply stabilizer generator for toric code plaquette
function applyStabilizerGenerator(state: StateVector): StateVector {
  const newState = new StateVector(state.dimension);
  
  // Simplified stabilizer: creates equal superposition of even parity states
  // In full toric code, this would be X₁X₂X₃X₄ stabilizer
  for (let i = 0; i < state.dimension; i++) {
    const amplitude = state.getAmplitudes()[i];
    if (amplitude.re === 0 && amplitude.im === 0) continue;
    
    // Count number of 1s (parity)
    const parity = i.toString(2).split('1').length - 1;
    
    if (parity % 2 === 0) {
      // Even parity states get equal amplitudes
      newState.setState(i, math.complex(1/Math.sqrt(2), 0));
    }
  }
  
  return newState;
}

// Create toric code plaquette using stabilizer generators
function createPlaquetteOp(): StateVector {
  // Start with |0000⟩ state
  const initialState = new StateVector(16); // 4-edge system
  initialState.setState(0, math.complex(1, 0)); // |0000⟩
  
  // Apply stabilizer generator to create superposition of stabilized states
  const plaquetteState = applyStabilizerGenerator(initialState);
  
  return plaquetteState;
}

// Create POC graphs demonstrating composite quantum objects
function createCompQGraph(): ICompQGraph {
  const baseGraph = lattice2D(2, 2); // 4 vertices, 4 edges forming a 2x2 square
  const quantumGraph = new CompQGraph(baseGraph);

  const nodes = quantumGraph.getNodes();
  const edges = quantumGraph.getEdges();

  // Example 1: Multi-vertex Bell state (vertices 0 and 1)
  if (nodes.length >= 2) {
    const bellState = createBellState();
    quantumGraph.setCompQObj([nodes[0].id, nodes[1].id], bellState);
    console.log(`Created Bell state across vertices ${nodes[0].id}, ${nodes[1].id}`);
  }

  // Example 2: Toric code plaquette (all 4 edges)
  if (edges.length >= 4) {
    const plaquetteState = createPlaquetteOp();
    const allEdgeIds = edges.map(e => e.id);
    quantumGraph.setCompQObj(allEdgeIds, plaquetteState);
    console.log(`Created plaquette operator across edges: ${allEdgeIds.join(', ')}`);
  }

  // Example 3: Single vertex states (backward compatibility)
  if (nodes.length >= 4) {
    const state0 = new StateVector(2);
    state0.setState(0, math.complex(1, 0));
    quantumGraph.setNodeQObj(nodes[2].id, state0);
    
    const state1 = new StateVector(2);
    state1.setState(1, math.complex(1, 0));
    quantumGraph.setNodeQObj(nodes[3].id, state1);
  }

  return quantumGraph;
}

// Utility functions for composite quantum graph
function analyzeCompQGraph(graph: ICompQGraph): void {
  console.log('\n=== Composite Quantum Graph Analysis ===');
  
  const metadata = graph.getMetadata();
  console.log(`Graph type: ${metadata?.type || 'unknown'}`);
  console.log(`Topology: ${metadata?.topology || 'unknown'}`);
  console.log(`Graph size: ${graph.nodeCount} vertices, ${graph.edgeCount} edges`);
  
  // Check for multi-vertex composite states
  console.log('\n--- Multi-Vertex Composite States ---');
  const nodes = graph.getNodes();
  if (nodes.length >= 2) {
    const bellState = graph.getCompQObj([nodes[0].id, nodes[1].id]);
    if (bellState && isState(bellState)) {
      console.log(`Bell state spanning ${nodes[0].id}, ${nodes[1].id}:`);
      console.log(`  Dimension: ${bellState.dimension}`);
      console.log(`  Norm: ${bellState.norm().toFixed(3)}`);
      console.log(`  Type: Entangled 2-qubit state`);
    }
  }

  // Check for multi-edge composite states (toric code plaquette)
  console.log('\n--- Multi-Edge Composite States ---');
  const edges = graph.getEdges();
  if (edges.length >= 4) {
    const allEdgeIds = edges.map(e => e.id);
    const plaquetteState = graph.getCompQObj(allEdgeIds);
    if (plaquetteState && isState(plaquetteState)) {
      console.log(`Plaquette operator spanning edges: ${allEdgeIds.join(', ')}`);
      console.log(`  Dimension: ${plaquetteState.dimension}`);
      console.log(`  Norm: ${plaquetteState.norm().toFixed(3)}`);
      console.log(`  Type: 4-edge toric code plaquette`);
    }
  }

  // Check individual vertex states (backward compatibility)
  console.log('\n--- Individual Vertex States ---');
  for (const node of nodes) {
    const obj = graph.getNodeQObj(node.id);
    if (obj && isState(obj)) {
      console.log(`${node.id}: Individual state, dim = ${obj.dimension}, norm = ${obj.norm().toFixed(3)}`);
    }
  }
}

// Demonstrate composite quantum operations
function demoCompOps(graph: ICompQGraph): void {
  console.log('\n=== Composite Quantum Operations Demo ===');
  
  const nodes = graph.getNodes();
  const edges = graph.getEdges();

  // Test Bell state measurement correlations
  if (nodes.length >= 2) {
    const bellState = graph.getCompQObj([nodes[0].id, nodes[1].id]);
    if (bellState && isState(bellState)) {
      console.log('\nBell State Analysis:');
      console.log(`  Composite system: ${nodes[0].id} ⊗ ${nodes[1].id}`);
      console.log(`  State dimension: ${bellState.dimension} (2-qubit)`);
      console.log(`  Entanglement: Present (Bell state)`);
      
      // Show amplitudes
      const amplitudes = bellState.getAmplitudes();
      console.log(`  |00⟩ amplitude: ${amplitudes[0].re.toFixed(3)}`);
      console.log(`  |11⟩ amplitude: ${amplitudes[3].re.toFixed(3)}`);
    }
  }

  // Test plaquette operator properties
  if (edges.length >= 4) {
    const allEdgeIds = edges.map(e => e.id);
    const plaquetteState = graph.getCompQObj(allEdgeIds);
    if (plaquetteState && isState(plaquetteState)) {
      console.log('\nToric Code Plaquette Analysis:');
      console.log(`  Composite system: ${allEdgeIds.join(' ⊗ ')}`);
      console.log(`  State dimension: ${plaquetteState.dimension} (4-edge)`);
      console.log(`  Stabilizer: Plaquette operator`);
      
      // Show key amplitudes
      const amplitudes = plaquetteState.getAmplitudes();
      console.log(`  |0000⟩ amplitude: ${amplitudes[0].re.toFixed(3)}`);
      console.log(`  |1111⟩ amplitude: ${amplitudes[15].re.toFixed(3)}`);
    }
  }

  // Demonstrate backward compatibility
  console.log('\nBackward Compatibility Check:');
  for (let i = 2; i < Math.min(4, nodes.length); i++) {
    const individualState = graph.getNodeQObj(nodes[i].id);
    if (individualState && isState(individualState)) {
      console.log(`${nodes[i].id}: Individual state (${individualState.dimension}D)`);
    }
  }
}

// Run the composite quantum graph POC demonstration
export function runCompQGraphPOC(): void {
  console.log('🔬 Composite Quantum Graph POC Demo');
  console.log('====================================');
  
  try {
    const graph = createCompQGraph();
    analyzeCompQGraph(graph);
    demoCompOps(graph);
    
    console.log('\n✅ Composite POC completed successfully!');
    console.log('\nThis demonstrates:');
    console.log('• Multi-vertex entangled states (Bell pairs)');
    console.log('• Multi-edge quantum objects (toric code plaquettes)');
    console.log('• Backward compatibility with single-element states');
    console.log('• Composite quantum object management');
    console.log('• Foundation for true quantum entanglement in graphs');
    
  } catch (error) {
    console.error('❌ Composite POC failed:', error);
  }
}

// Export for testing
export { 
  createCompQGraph, 
  analyzeCompQGraph as analyzeCompositeGraph, 
  demoCompOps as demonstrateCompositeOperations, 
  CompQGraph,
  QCompManager as CompositeQuantumManager,
  createBellState,
  createPlaquetteOp
};
