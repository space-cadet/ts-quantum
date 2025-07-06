import { expect, describe, it } from 'vitest';
import { SpinNetworkBuilder } from '../../../src/graph/builders/spinNetwork';

describe('SpinNetworkBuilder', () => {
  describe('create', () => {
    it('creates an empty builder with default options', () => {
      const network = SpinNetworkBuilder.create().build();
      expect(network).toBeDefined();
      expect(network.getNodes()).toHaveLength(0);
      expect(network.getEdges()).toHaveLength(0);
    });
  });

  describe('addVertex', () => {
    it('adds an intertwiner vertex', () => {
      const network = SpinNetworkBuilder.create()
        .addVertex('v1', { x: 0, y: 0 })
        .build();

      const nodes = network.getNodes();
      expect(nodes).toHaveLength(1);
      expect(nodes[0].id).toBe('v1');
      expect(nodes[0].type).toBe('intertwiner');
      expect(nodes[0].properties.intertwiners).toEqual([]);
      expect(nodes[0].properties.dimension).toBe(0);
    });
  });

  describe('addEdge', () => {
    it('adds a quantum edge with default spin 1/2', () => {
      const network = SpinNetworkBuilder.create()
        .addVertex('v1')
        .addVertex('v2') 
        .addEdge('v1', 'v2')
        .build();

      const edges = network.getEdges();
      expect(edges).toHaveLength(1);
      expect(edges[0].type).toBe('quantum');
      expect(edges[0].properties.spin).toBe(0.5);
      expect(edges[0].properties.dimension).toBe(2);
    });

    it('adds an edge with custom spin', () => {
      const network = SpinNetworkBuilder.create()
        .addVertex('v1')
        .addVertex('v2')
        .addEdge('v1', 'v2', 1)
        .build();

      const edges = network.getEdges();
      expect(edges[0].properties.spin).toBe(1);
      expect(edges[0].properties.dimension).toBe(3);
    });

    it('updates intertwiner spaces when adding edges', () => {
      const network = SpinNetworkBuilder.create()
        .addVertex('v1')
        .addVertex('v2')
        .addVertex('v3')
        .addEdge('v1', 'v2', 0.5)
        .addEdge('v2', 'v3', 1)
        .build();

      const v2 = network.getNode('v2');
      expect(v2?.properties.intertwiners).toBeDefined();
      expect(v2?.properties.dimension).toBeGreaterThan(0);
    });
  });

  describe('createLattice2D', () => {
    it('creates a 2x2 lattice', () => {
      const network = SpinNetworkBuilder.createLattice2D({ rows: 2, cols: 2 });
      
      expect(network.getNodes()).toHaveLength(4);
      // 2 horizontal + 2 vertical edges = 4 edges
      expect(network.getEdges()).toHaveLength(4);
    });

    it('creates a periodic 2x2 lattice', () => {
      const network = SpinNetworkBuilder.createLattice2D({ 
        rows: 2, 
        cols: 2,
        periodic: true 
      });

      // Should have 4 additional edges for periodicity
      expect(network.getEdges()).toHaveLength(8);
    });
  });

  describe('createChain', () => {
    it('creates a linear chain', () => {
      const network = SpinNetworkBuilder.createChain(3, {});
      
      expect(network.getNodes()).toHaveLength(3);
      expect(network.getEdges()).toHaveLength(2);
    });

    it('creates a periodic chain', () => {
      const network = SpinNetworkBuilder.createChain(3, { periodic: true });
      
      expect(network.getNodes()).toHaveLength(3);
      expect(network.getEdges()).toHaveLength(3);
    });
  });
});
