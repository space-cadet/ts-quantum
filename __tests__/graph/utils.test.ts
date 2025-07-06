/**
 * Tests for quantum graph utility functions
 * Focus: Graph manipulation utilities, path finding, graph analysis
 * Excludes: Quantum-specific utilities
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { QuantumGraph } from '../../src/qgraph/QuantumGraph';

describe('Graph Utility Functions', () => {
  let graph: QuantumGraph;

  beforeEach(() => {
    console.log('\n--- Creating fresh graph for utility tests ---');
    graph = new QuantumGraph();
  });

  describe('Graph Cloning', () => {
    test('should clone graph structure correctly', () => {
      console.log('\n=== Testing Graph Cloning ===');
      
      graph.addNode({ id: 'n1', type: 'vertex', properties: { value: 1 } });
      graph.addNode({ id: 'n2', type: 'vertex', properties: { value: 2 } });
      graph.addEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'edge', directed: false, properties: { weight: 5 } });
      
      console.log('Original graph - Nodes:', graph.nodeCount, 'Edges:', graph.edgeCount);
      
      const cloned = graph.clone() as QuantumGraph;
      console.log('Cloned graph - Nodes:', cloned.nodeCount, 'Edges:', cloned.edgeCount);
      
      expect(cloned.nodeCount).toBe(graph.nodeCount);
      expect(cloned.edgeCount).toBe(graph.edgeCount);
      expect(cloned.getNode('n1')).toEqual(graph.getNode('n1'));
      expect(cloned.getEdge('e1')).toEqual(graph.getEdge('e1'));
      
      // Test independence
      graph.addNode({ id: 'new', type: 'vertex', properties: {} });
      expect(graph.nodeCount).toBe(3);
      expect(cloned.nodeCount).toBe(2);
      console.log('Clone independence verified');
    });
  });

  describe('Path Finding', () => {
    beforeEach(() => {
      console.log('Setting up path graph: A-B-C-D with branch A-E');
      ['A', 'B', 'C', 'D', 'E', 'F'].forEach(id => {
        graph.addNode({ id, type: 'vertex', properties: {} });
      });
      
      graph.addEdge({ id: 'AB', sourceId: 'A', targetId: 'B', type: 'edge', directed: false, properties: {} });
      graph.addEdge({ id: 'BC', sourceId: 'B', targetId: 'C', type: 'edge', directed: false, properties: {} });
      graph.addEdge({ id: 'CD', sourceId: 'C', targetId: 'D', type: 'edge', directed: false, properties: {} });
      graph.addEdge({ id: 'AE', sourceId: 'A', targetId: 'E', type: 'edge', directed: false, properties: {} });
    });

    test('should find paths between connected nodes', () => {
      console.log('Testing path finding A->D');
      const pathAD = graph.findPath('A', 'D');
      expect(pathAD.length).toBeGreaterThan(0);
      console.log('Path found with', pathAD.length, 'edges');
      
      const pathAF = graph.findPath('A', 'F');
      expect(pathAF).toHaveLength(0);
      console.log('No path to isolated node F');
    });
  });

  describe('Matrix Operations', () => {
    beforeEach(() => {
      console.log('Setting up triangle graph for matrix tests');
      ['A', 'B', 'C'].forEach(id => {
        graph.addNode({ id, type: 'vertex', properties: {} });
      });
      
      graph.addEdge({ id: 'AB', sourceId: 'A', targetId: 'B', type: 'edge', directed: false, properties: { weight: 1 } });
      graph.addEdge({ id: 'BC', sourceId: 'B', targetId: 'C', type: 'edge', directed: false, properties: { weight: 2 } });
      graph.addEdge({ id: 'CA', sourceId: 'C', targetId: 'A', type: 'edge', directed: false, properties: { weight: 3 } });
    });

    test('should generate adjacency matrix', () => {
      console.log('Generating adjacency matrix');
      const adjMatrix = graph.toAdjacencyMatrix();
      expect(adjMatrix.size()).toEqual([3, 3]);
      console.log('Matrix dimensions:', adjMatrix.size());
      
      const weighted = graph.toAdjacencyMatrix((edge: any) => edge.properties.weight);
      expect(weighted.size()).toEqual([3, 3]);
      console.log('Weighted matrix generated');
    });

    test('should generate Laplacian matrix', () => {
      console.log('Generating Laplacian matrix');
      const laplacian = graph.toLaplacianMatrix();
      expect(laplacian.size()).toEqual([3, 3]);
      
      // Check Laplacian property: row sums = 0
      const values = laplacian.toArray() as number[][];
      values.forEach((row, i) => {
        const sum = row.reduce((a, b) => a + b, 0);
        expect(Math.abs(sum)).toBeLessThan(0.001); // Account for floating point
      });
      console.log('Laplacian properties verified');
    });
  });
});
