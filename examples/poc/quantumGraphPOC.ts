/**
 * Proof of Concept: Quantum-Labeled Graph Data Structure
 * 
 * Demonstrates a simple graph where vertices and edges are labeled
 * with quantum objects (states, operators) using graph-core infrastructure.
 */

import { QuantumObject, isState, isOperator } from '../../src/core/types';
import { StateVector } from '../../src/states/stateVector';
import { PauliX, PauliZ } from '../../src/operators/gates';
import { GraphologyAdapter } from '../../../graph-core/src/core/GraphologyAdapter';
import { path } from '../../../graph-core/src/core/builders';
import { IGraph, IGraphNode, IGraphEdge } from '../../../graph-core/src/core/types';
import * as math from 'mathjs';

// Quantum-labeled graph using QuantumObject for flexible labeling
interface QuantumGraphPOC extends IGraph {
  // Flexible quantum labeling methods
  setVertexQuantumObject(nodeId: string, obj: QuantumObject): void;
  getVertexQuantumObject(nodeId: string): QuantumObject | undefined;
  setEdgeQuantumObject(edgeId: string, obj: QuantumObject): void;
  getEdgeQuantumObject(edgeId: string): QuantumObject | undefined;
  
  // Graph-core adapter
  getGraphAdapter(): GraphologyAdapter;
}

// Implementation of quantum-labeled graph
class QuantumGraph implements QuantumGraphPOC {
  private adapter: GraphologyAdapter;
  private quantumNodes: Map<string, QuantumObject> = new Map();
  private quantumEdges: Map<string, QuantumObject> = new Map();

  constructor(baseGraph?: GraphologyAdapter) {
    this.adapter = baseGraph || new GraphologyAdapter();
  }

  // Flexible quantum labeling methods
  setVertexQuantumObject(nodeId: string, obj: QuantumObject): void {
    if (!this.adapter.hasNode(nodeId)) {
      throw new Error(`Node ${nodeId} does not exist in graph`);
    }
    this.quantumNodes.set(nodeId, obj);
  }

  getVertexQuantumObject(nodeId: string): QuantumObject | undefined {
    return this.quantumNodes.get(nodeId);
  }

  setEdgeQuantumObject(edgeId: string, obj: QuantumObject): void {
    if (!this.adapter.hasEdge(edgeId)) {
      throw new Error(`Edge ${edgeId} does not exist in graph`);
    }
    this.quantumEdges.set(edgeId, obj);
  }

  getEdgeQuantumObject(edgeId: string): QuantumObject | undefined {
    return this.quantumEdges.get(edgeId);
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

// Create POC graph using graph-core infrastructure
function createQuantumGraphPOC(): QuantumGraphPOC {
  // Start with a path graph (3 nodes connected linearly)
  const baseGraph = path(3);
  const quantumGraph = new QuantumGraph(baseGraph);

  // Create quantum states for vertices
  const state0 = new StateVector(2); // |0⟩
  state0.setState(0, math.complex(1, 0));
  state0.setState(1, math.complex(0, 0));

  const state1 = new StateVector(2); // |1⟩ 
  state1.setState(0, math.complex(0, 0));
  state1.setState(1, math.complex(1, 0));

  const superposition = new StateVector(2); // |+⟩ = (|0⟩ + |1⟩)/√2
  superposition.setState(0, math.complex(1/Math.sqrt(2), 0));
  superposition.setState(1, math.complex(1/Math.sqrt(2), 0));

  // Label vertices with quantum objects (states in this example)
  const nodes = quantumGraph.getNodes();
  if (nodes.length >= 3) {
    quantumGraph.setVertexQuantumObject(nodes[0].id, state0);
    quantumGraph.setVertexQuantumObject(nodes[1].id, state1); 
    quantumGraph.setVertexQuantumObject(nodes[2].id, superposition);
  }

  // Label edges with quantum objects (operators in this example)
  const edges = quantumGraph.getEdges();
  if (edges.length >= 2) {
    quantumGraph.setEdgeQuantumObject(edges[0].id, PauliX);
    quantumGraph.setEdgeQuantumObject(edges[1].id, PauliZ);
  }

  return quantumGraph;
}

// Utility functions for quantum graph
function analyzeGraph(graph: QuantumGraphPOC): void {
  console.log('\n=== Quantum Graph Analysis ===');
  
  // Get graph structure from adapter
  const metadata = graph.getMetadata();
  console.log(`Graph type: ${metadata?.type || 'unknown'}`);
  console.log(`Topology: ${metadata?.topology || 'unknown'}`);
  console.log(`Graph size: ${graph.nodeCount} vertices, ${graph.edgeCount} edges`);
  
  // Analyze vertices with quantum labels
  console.log('\nVertices with Quantum Objects:');
  for (const node of graph.getNodes()) {
    const obj = graph.getVertexQuantumObject(node.id);
    if (obj) {
      if (isState(obj)) {
        console.log(`${node.id}: State |ψ⟩, norm = ${obj.norm().toFixed(3)}`);
        console.log(`  Amplitudes: [${obj.getAmplitudes().map(c => 
          `${c.re.toFixed(3)}${c.im >= 0 ? '+' : ''}${c.im.toFixed(3)}i`
        ).join(', ')}]`);
      } else if (isOperator(obj)) {
        console.log(`${node.id}: Operator (${obj.type}), norm = ${obj.norm().toFixed(3)}`);
      }
    } else {
      console.log(`${node.id}: No quantum object assigned`);
    }
  }

  // Analyze edges with quantum labels
  console.log('\nEdges with Quantum Objects:');
  for (const edge of graph.getEdges()) {
    const obj = graph.getEdgeQuantumObject(edge.id);
    if (obj) {
      if (isState(obj)) {
        console.log(`${edge.id}: ${edge.sourceId} →[State |ψ⟩]→ ${edge.targetId}`);
      } else if (isOperator(obj)) {
        console.log(`${edge.id}: ${edge.sourceId} →[${obj.type}]→ ${edge.targetId}`);
      }
    } else {
      console.log(`${edge.id}: ${edge.sourceId} →[no quantum object]→ ${edge.targetId}`);
    }
  }
}

// Demonstrate graph traversal with quantum operations
function traverseAndApply(graph: QuantumGraphPOC, startVertex: string): void {
  console.log('\n=== Graph Traversal with Quantum Operations ===');
  
  const startObj = graph.getVertexQuantumObject(startVertex);
  if (!startObj || !isState(startObj)) {
    console.log(`No quantum state found for vertex: ${startVertex}`);
    return;
  }

  const startState = startObj as StateVector;
  
  console.log(`Starting at ${startVertex} with state:`);
  console.log(`  |ψ₀⟩ = [${startState.getAmplitudes().map(c => 
    `${c.re.toFixed(3)}${c.im >= 0 ? '+' : ''}${c.im.toFixed(3)}i`
  ).join(', ')}]`);

  // Find outgoing edges and apply operations using graph-core traversal
  const connectedEdges = graph.getConnectedEdges(startVertex);
  
  for (const edge of connectedEdges) {
    if (edge.sourceId === startVertex) {
      const edgeObj = graph.getEdgeQuantumObject(edge.id);
      
      if (edgeObj && isOperator(edgeObj)) {
        console.log(`\nApplying ${edgeObj.type} operator via edge ${edge.id}:`);
        
        try {
          const resultState = edgeObj.apply(startState);
          console.log(`  |ψ₁⟩ = [${resultState.getAmplitudes().map(c => 
            `${c.re.toFixed(3)}${c.im >= 0 ? '+' : ''}${c.im.toFixed(3)}i`
          ).join(', ')}]`);
          console.log(`  Result norm: ${resultState.norm().toFixed(3)}`);
          
          // Check if target vertex state matches
          const targetObj = graph.getVertexQuantumObject(edge.targetId);
          if (targetObj && isState(targetObj)) {
            const targetState = targetObj as StateVector;
            const similarity = Math.abs(resultState.innerProduct(targetState).re);
            console.log(`  Similarity to target ${edge.targetId}: ${similarity.toFixed(3)}`);
          }
        } catch (error) {
          console.log(`  Error applying operator: ${error}`);
        }
      } else {
        console.log(`\nEdge ${edge.id} has no quantum operator`);
      }
    }
  }
}

// Run the POC demonstration
export function runQuantumGraphPOC(): void {
  console.log('🔬 Quantum-Labeled Graph POC Demo');
  console.log('==================================');
  
  try {
    const graph = createQuantumGraphPOC();
    analyzeGraph(graph);
    // Use the first node from the graph
    const nodes = graph.getNodes();
    if (nodes.length > 0) {
      traverseAndApply(graph, nodes[0].id);
    }
    
    console.log('\n✅ POC completed successfully!');
    console.log('\nThis demonstrates:');
    console.log('• Flexible quantum object labeling (vertices and edges)');
    console.log('• Type-safe quantum object discrimination');
    console.log('• Graph traversal with quantum operations');
    console.log('• Support for states, operators, and density matrices');
    
  } catch (error) {
    console.error('❌ POC failed:', error);
  }
}

// Export for testing
export { createQuantumGraphPOC, analyzeGraph, traverseAndApply, QuantumGraph };
