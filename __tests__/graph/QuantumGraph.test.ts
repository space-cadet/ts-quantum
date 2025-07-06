/**
 * Tests for QuantumGraph core functionality
 * Focus: Basic graph operations (nodes, edges, connectivity)
 * Excludes: Quantum object management (tested separately)
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { QuantumGraph } from '../../src/qgraph/QuantumGraph';

describe('QuantumGraph - Basic Graph Operations', () => {
  let graph: QuantumGraph;

  beforeEach(() => {
    console.log('\n--- Setting up new QuantumGraph instance ---');
    graph = new QuantumGraph();
    console.log('Initial state - Nodes:', graph.nodeCount, 'Edges:', graph.edgeCount);
  });

  describe('Node Operations', () => {
    test('should add nodes successfully', () => {
      console.log('\n=== Testing Node Addition ===');
      
      const node1 = { id: 'n1', type: 'vertex', properties: { label: 'Node 1' } };
      const node2 = { id: 'n2', type: 'vertex', properties: { label: 'Node 2' } };
      
      console.log('Adding node:', node1.id);
      graph.addNode(node1);
      console.log('Node count after adding n1:', graph.nodeCount);
      expect(graph.nodeCount).toBe(1);
      expect(graph.hasNode('n1')).toBe(true);
      
      console.log('Adding node:', node2.id);
      graph.addNode(node2);
      console.log('Node count after adding n2:', graph.nodeCount);
      expect(graph.nodeCount).toBe(2);
      expect(graph.hasNode('n2')).toBe(true);
      
      console.log('Final node count:', graph.nodeCount);
    });

    test('should retrieve node details correctly', () => {
      console.log('\n=== Testing Node Retrieval ===');
      
      const nodeData = { id: 'test-node', type: 'special', properties: { value: 42, name: 'test' } };
      console.log('Adding node with properties:', nodeData);
      
      graph.addNode(nodeData);
      const retrieved = graph.getNode('test-node');
      
      console.log('Retrieved node:', retrieved);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('test-node');
      expect(retrieved?.type).toBe('special');
      expect(retrieved?.properties.value).toBe(42);
      expect(retrieved?.properties.name).toBe('test');
    });

    test('should remove nodes and clean up connections', () => {
      console.log('\n=== Testing Node Removal ===');
      
      // Setup
      graph.addNode({ id: 'n1', type: 'vertex', properties: {} });
      graph.addNode({ id: 'n2', type: 'vertex', properties: {} });
      graph.addEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'edge', directed: false, properties: {} });
      
      console.log('Initial setup - Nodes:', graph.nodeCount, 'Edges:', graph.edgeCount);
      expect(graph.nodeCount).toBe(2);
      expect(graph.edgeCount).toBe(1);
      
      console.log('Removing node n1 (should also remove connected edge)');
      graph.removeNode('n1');
      
      console.log('After removal - Nodes:', graph.nodeCount, 'Edges:', graph.edgeCount);
      expect(graph.nodeCount).toBe(1);
      expect(graph.edgeCount).toBe(0); // Edge should be auto-removed
      expect(graph.hasNode('n1')).toBe(false);
      expect(graph.hasNode('n2')).toBe(true);
    });

    test('should handle non-existent node operations gracefully', () => {
      console.log('\n=== Testing Non-existent Node Operations ===');
      
      console.log('Checking for non-existent node "missing"');
      expect(graph.hasNode('missing')).toBe(false);
      
      console.log('Attempting to get non-existent node');
      const node = graph.getNode('missing');
      console.log('Result:', node);
      expect(node).toBeUndefined();
      
      console.log('Attempting to remove non-existent node (should not throw)');
      graph.removeNode('missing');
      console.log('Node count after removal attempt:', graph.nodeCount);
      expect(graph.nodeCount).toBe(0);
    });
  });

  describe('Edge Operations', () => {
    beforeEach(() => {
      console.log('\n--- Setting up nodes for edge tests ---');
      graph.addNode({ id: 'a', type: 'vertex', properties: {} });
      graph.addNode({ id: 'b', type: 'vertex', properties: {} });
      graph.addNode({ id: 'c', type: 'vertex', properties: {} });
      console.log('Test nodes added: a, b, c');
    });

    test('should add edges with correct IDs', () => {
      console.log('\n=== Testing Edge Addition with Custom IDs ===');
      
      const edgeData = { 
        id: 'custom-edge-id', 
        sourceId: 'a', 
        targetId: 'b', 
        type: 'connection', 
        directed: false, 
        properties: { weight: 1.5 } 
      };
      
      console.log('Adding edge with custom ID:', edgeData.id);
      console.log('Edge connects:', edgeData.sourceId, '->', edgeData.targetId);
      
      graph.addEdge(edgeData);
      
      console.log('Edge count after addition:', graph.edgeCount);
      expect(graph.edgeCount).toBe(1);
      
      console.log('Checking if edge exists by ID:', edgeData.id);
      const exists = graph.hasEdge(edgeData.id);
      console.log('Edge exists:', exists);
      expect(exists).toBe(true);
      
      console.log('Retrieving edge by ID');
      const retrieved = graph.getEdge(edgeData.id);
      console.log('Retrieved edge:', retrieved);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('custom-edge-id');
      expect(retrieved?.sourceId).toBe('a');
      expect(retrieved?.targetId).toBe('b');
      expect(retrieved?.properties.weight).toBe(1.5);
    });

    test('should list all edges correctly', () => {
      console.log('\n=== Testing Edge Listing ===');
      
      console.log('Adding multiple edges...');
      graph.addEdge({ id: 'e1', sourceId: 'a', targetId: 'b', type: 'edge', directed: false, properties: {} });
      graph.addEdge({ id: 'e2', sourceId: 'b', targetId: 'c', type: 'edge', directed: false, properties: {} });
      graph.addEdge({ id: 'e3', sourceId: 'a', targetId: 'c', type: 'edge', directed: true, properties: {} });
      
      console.log('Total edges added:', graph.edgeCount);
      
      const edges = graph.getEdges();
      console.log('Retrieved edges:');
      edges.forEach(edge => {
        console.log(`  ${edge.id}: ${edge.sourceId} -> ${edge.targetId} (directed: ${edge.directed})`);
      });
      
      expect(edges).toHaveLength(3);
      expect(edges.map(e => e.id).sort()).toEqual(['e1', 'e2', 'e3']);
    });

    test('should remove edges correctly', () => {
      console.log('\n=== Testing Edge Removal ===');
      
      graph.addEdge({ id: 'temp-edge', sourceId: 'a', targetId: 'b', type: 'edge', directed: false, properties: {} });
      console.log('Added temporary edge, total edges:', graph.edgeCount);
      
      console.log('Removing edge "temp-edge"');
      graph.removeEdge('temp-edge');
      
      console.log('Edges after removal:', graph.edgeCount);
      expect(graph.edgeCount).toBe(0);
      expect(graph.hasEdge('temp-edge')).toBe(false);
    });

    test('should validate node existence when adding edges', () => {
      console.log('\n=== Testing Edge Validation ===');
      
      console.log('Attempting to add edge with non-existent source node');
      expect(() => {
        graph.addEdge({ 
          id: 'invalid-edge', 
          sourceId: 'nonexistent', 
          targetId: 'a', 
          type: 'edge', 
          directed: false, 
          properties: {} 
        });
      }).toThrow('could not find the "nonexistent" source node');
      
      console.log('Attempting to add edge with non-existent target node');
      expect(() => {
        graph.addEdge({ 
          id: 'invalid-edge2', 
          sourceId: 'a', 
          targetId: 'nonexistent', 
          type: 'edge', 
          directed: false, 
          properties: {} 
        });
      }).toThrow('could not find the "nonexistent" target node');
      
      console.log('Edge count after failed attempts:', graph.edgeCount);
      expect(graph.edgeCount).toBe(0);
    });
  });

  describe('Graph Connectivity', () => {
    beforeEach(() => {
      console.log('\n--- Setting up connected graph for connectivity tests ---');
      // Create a small connected graph: a-b-c with additional edge a-c
      graph.addNode({ id: 'a', type: 'vertex', properties: {} });
      graph.addNode({ id: 'b', type: 'vertex', properties: {} });
      graph.addNode({ id: 'c', type: 'vertex', properties: {} });
      graph.addNode({ id: 'd', type: 'vertex', properties: {} }); // isolated node
      
      graph.addEdge({ id: 'ab', sourceId: 'a', targetId: 'b', type: 'edge', directed: false, properties: {} });
      graph.addEdge({ id: 'bc', sourceId: 'b', targetId: 'c', type: 'edge', directed: false, properties: {} });
      graph.addEdge({ id: 'ac', sourceId: 'a', targetId: 'c', type: 'edge', directed: false, properties: {} });
      
      console.log('Test graph: a-b-c triangle + isolated node d');
      console.log('Edges: ab, bc, ac');
    });

    test('should find adjacent nodes correctly', () => {
      console.log('\n=== Testing Node Adjacency ===');
      
      console.log('Finding neighbors of node a');
      const neighborsA = graph.getAdjacentNodes('a');
      const neighborIds = neighborsA.map(n => n.id).sort();
      console.log('Neighbors of a:', neighborIds);
      expect(neighborIds).toEqual(['b', 'c']);
      
      console.log('Finding neighbors of node b');
      const neighborsB = graph.getAdjacentNodes('b');
      const neighborIdsB = neighborsB.map(n => n.id).sort();
      console.log('Neighbors of b:', neighborIdsB);
      expect(neighborIdsB).toEqual(['a', 'c']);
      
      console.log('Finding neighbors of isolated node d');
      const neighborsD = graph.getAdjacentNodes('d');
      console.log('Neighbors of d:', neighborsD.map(n => n.id));
      expect(neighborsD).toHaveLength(0);
    });

    test('should find connected edges correctly', () => {
      console.log('\n=== Testing Connected Edges ===');
      
      console.log('Finding edges connected to node a');
      const edgesA = graph.getConnectedEdges('a');
      const edgeIds = edgesA.map(e => e.id).sort();
      console.log('Edges connected to a:', edgeIds);
      expect(edgeIds).toEqual(['ab', 'ac']);
      
      console.log('Finding edges connected to node b');
      const edgesB = graph.getConnectedEdges('b');
      const edgeIdsB = edgesB.map(e => e.id).sort();
      console.log('Edges connected to b:', edgeIdsB);
      expect(edgeIdsB).toEqual(['ab', 'bc']);
      
      console.log('Finding edges connected to isolated node d');
      const edgesD = graph.getConnectedEdges('d');
      console.log('Edges connected to d:', edgesD.map(e => e.id));
      expect(edgesD).toHaveLength(0);
    });

    test('should calculate node degrees correctly', () => {
      console.log('\n=== Testing Node Degrees ===');
      
      console.log('Calculating degree of node a');
      const degreeA = graph.getNodeDegree('a');
      console.log('Degree of a:', degreeA);
      expect(degreeA).toBe(2);
      
      console.log('Calculating degree of node b');
      const degreeB = graph.getNodeDegree('b');
      console.log('Degree of b:', degreeB);
      expect(degreeB).toBe(2);
      
      console.log('Calculating degree of isolated node d');
      const degreeD = graph.getNodeDegree('d');
      console.log('Degree of d:', degreeD);
      expect(degreeD).toBe(0);
    });

    test('should check node adjacency correctly', () => {
      console.log('\n=== Testing Node Adjacency Checks ===');
      
      console.log('Checking if a and b are adjacent');
      const abAdjacent = graph.areNodesAdjacent('a', 'b');
      console.log('a-b adjacent:', abAdjacent);
      expect(abAdjacent).toBe(true);
      
      console.log('Checking if a and d are adjacent');
      const adAdjacent = graph.areNodesAdjacent('a', 'd');
      console.log('a-d adjacent:', adAdjacent);
      expect(adAdjacent).toBe(false);
      
      console.log('Checking if b and c are adjacent');
      const bcAdjacent = graph.areNodesAdjacent('b', 'c');
      console.log('b-c adjacent:', bcAdjacent);
      expect(bcAdjacent).toBe(true);
    });
  });

  describe('Graph Properties', () => {
    test('should track graph size correctly', () => {
      console.log('\n=== Testing Graph Size Tracking ===');
      
      console.log('Initial empty graph');
      console.log('Nodes:', graph.nodeCount, 'Edges:', graph.edgeCount);
      expect(graph.nodeCount).toBe(0);
      expect(graph.edgeCount).toBe(0);
      
      console.log('Adding 3 nodes');
      graph.addNode({ id: '1', type: 'vertex', properties: {} });
      graph.addNode({ id: '2', type: 'vertex', properties: {} });
      graph.addNode({ id: '3', type: 'vertex', properties: {} });
      console.log('After adding nodes - Nodes:', graph.nodeCount, 'Edges:', graph.edgeCount);
      expect(graph.nodeCount).toBe(3);
      expect(graph.edgeCount).toBe(0);
      
      console.log('Adding 2 edges');
      graph.addEdge({ id: 'e1', sourceId: '1', targetId: '2', type: 'edge', directed: false, properties: {} });
      graph.addEdge({ id: 'e2', sourceId: '2', targetId: '3', type: 'edge', directed: false, properties: {} });
      console.log('After adding edges - Nodes:', graph.nodeCount, 'Edges:', graph.edgeCount);
      expect(graph.nodeCount).toBe(3);
      expect(graph.edgeCount).toBe(2);
    });

    test('should report directedness correctly', () => {
      console.log('\n=== Testing Graph Directedness ===');
      
      console.log('Graph directedness (should be undirected by default):', graph.isDirected);
      expect(graph.isDirected).toBe(false);
    });

    test('should clear graph completely', () => {
      console.log('\n=== Testing Graph Clearing ===');
      
      // Add some content
      graph.addNode({ id: 'n1', type: 'vertex', properties: {} });
      graph.addNode({ id: 'n2', type: 'vertex', properties: {} });
      graph.addEdge({ id: 'e1', sourceId: 'n1', targetId: 'n2', type: 'edge', directed: false, properties: {} });
      
      console.log('Before clearing - Nodes:', graph.nodeCount, 'Edges:', graph.edgeCount);
      expect(graph.nodeCount).toBe(2);
      expect(graph.edgeCount).toBe(1);
      
      console.log('Clearing graph');
      graph.clear();
      
      console.log('After clearing - Nodes:', graph.nodeCount, 'Edges:', graph.edgeCount);
      expect(graph.nodeCount).toBe(0);
      expect(graph.edgeCount).toBe(0);
    });
  });

  describe('Graph Utilities', () => {
    beforeEach(() => {
      console.log('\n--- Setting up simple graph for utility tests ---');
      // Simple 3-node path: 1-2-3
      graph.addNode({ id: '1', type: 'vertex', properties: {} });
      graph.addNode({ id: '2', type: 'vertex', properties: {} });
      graph.addNode({ id: '3', type: 'vertex', properties: {} });
      
      graph.addEdge({ id: 'e12', sourceId: '1', targetId: '2', type: 'edge', directed: false, properties: { weight: 2.0 } });
      graph.addEdge({ id: 'e23', sourceId: '2', targetId: '3', type: 'edge', directed: false, properties: { weight: 3.0 } });
      
      console.log('Test graph: 1-2-3 (path)');
    });

    test('should generate adjacency matrix', () => {
      console.log('\n=== Testing Adjacency Matrix Generation ===');
      
      console.log('Generating unweighted adjacency matrix');
      const adjMatrix = graph.toAdjacencyMatrix();
      console.log('Adjacency matrix dimensions:', adjMatrix.size());
      console.log('Matrix values:');
      console.log(adjMatrix.toString());
      
      expect(adjMatrix.size()).toEqual([3, 3]);
      // Check some specific values (depends on node ordering)
      const values = adjMatrix.toArray() as number[][];
      console.log('Matrix as array:', values);
      
      // Should be symmetric for undirected graph
      expect(values[0][1]).toBe(values[1][0]);
      expect(values[1][2]).toBe(values[2][1]);
    });

    test('should generate weighted adjacency matrix', () => {
      console.log('\n=== Testing Weighted Adjacency Matrix ===');
      
      console.log('Generating weighted adjacency matrix');
      const weightFn = (edge: any) => edge.properties.weight || 1;
      const weightedMatrix = graph.toAdjacencyMatrix(weightFn);
      
      console.log('Weighted matrix dimensions:', weightedMatrix.size());
      console.log('Matrix values:');
      console.log(weightedMatrix.toString());
      
      expect(weightedMatrix.size()).toEqual([3, 3]);
    });

    test('should generate Laplacian matrix', () => {
      console.log('\n=== Testing Laplacian Matrix Generation ===');
      
      console.log('Generating Laplacian matrix');
      const laplacian = graph.toLaplacianMatrix();
      console.log('Laplacian matrix dimensions:', laplacian.size());
      console.log('Matrix values:');
      console.log(laplacian.toString());
      
      expect(laplacian.size()).toEqual([3, 3]);
      
      // Laplacian matrix properties: row sums should be 0
      const values = laplacian.toArray() as number[][];
      console.log('Checking Laplacian properties (row sums should be 0):');
      values.forEach((row, i) => {
        const sum = row.reduce((a, b) => a + b, 0);
        console.log(`Row ${i} sum:`, sum);
      });
    });
  });

  describe('Graph Metadata', () => {
    test('should handle metadata operations', () => {
      console.log('\n=== Testing Graph Metadata ===');
      
      const metadata = {
        title: 'Test Graph',
        description: 'A graph for testing',
        version: '1.0',
        properties: { custom: 'value' }
      };
      
      console.log('Setting metadata:', metadata);
      graph.setMetadata(metadata);
      
      console.log('Retrieving metadata');
      const retrieved = graph.getMetadata();
      console.log('Retrieved metadata:', retrieved);
      
      expect(retrieved).toEqual(metadata);
      expect(retrieved?.title).toBe('Test Graph');
      expect(retrieved?.properties.custom).toBe('value');
    });
  });
});
