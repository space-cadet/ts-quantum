/**
 * Z₂ gauge field on a lattice
 * 
 * Link variables σ_e ∈ {±1} stored efficiently as Int8Array
 */

import { Lattice } from './geometry';

export type FieldInit = 'hot' | 'cold' | 'random';

export class Z2GaugeField {
  /** Flat array of link values (±1) */
  readonly links: Int8Array;
  
  constructor(
    readonly lattice: Lattice,
    init: FieldInit = 'random'
  ) {
    const numLinks = lattice.numSites * lattice.numDirections;
    this.links = new Int8Array(numLinks);
    
    switch (init) {
      case 'hot':
        // All links +1 (ordered)
        this.links.fill(1);
        break;
      case 'cold':
        // All links -1 (anti-ordered) or you could use all +1
        // Actually 'cold' usually means ordered, let me reconsider
        this.links.fill(1);
        break;
      case 'random':
      default:
        // Random ±1
        for (let i = 0; i < numLinks; i++) {
          this.links[i] = Math.random() < 0.5 ? 1 : -1;
        }
    }
  }
  
  /** Get link value at (site, direction) */
  getLink(site: number, direction: number): number {
    return this.links[site * this.lattice.numDirections + direction];
  }
  
  /** Set link value at (site, direction) */
  setLink(site: number, direction: number, value: number): void {
    if (value !== 1 && value !== -1) {
      throw new Error(`Z₂ link must be ±1, got ${value}`);
    }
    this.links[site * this.lattice.numDirections + direction] = value;
  }
  
  /** Flip link at (site, direction) */
  flipLink(site: number, direction: number): void {
    const idx = site * this.lattice.numDirections + direction;
    this.links[idx] *= -1;
  }
  
  /** Serialize to JSON */
  toJSON(): object {
    return {
      lattice: {
        type: this.lattice.constructor.name,
        L: this.lattice.L,
        dimension: this.lattice.dimension
      },
      links: Array.from(this.links)
    };
  }
  
  /** Create from JSON (static factory) */
  static fromJSON(data: any): Z2GaugeField {
    let lattice;
    switch (data.lattice.type) {
      case 'SquareLattice':
        const { createSquareLattice } = require('./geometry');
        lattice = createSquareLattice(data.lattice.L);
        break;
      case 'TriangularLattice':
        const { createTriangularLattice } = require('./geometry');
        lattice = createTriangularLattice(data.lattice.L);
        break;
      case 'CubicLattice':
        const { createCubicLattice } = require('./geometry');
        lattice = createCubicLattice(data.lattice.L);
        break;
      default:
        throw new Error(`Unknown lattice type: ${data.lattice.type}`);
    }
    
    const field = new Z2GaugeField(lattice, 'hot');
    field.links.set(data.links);
    return field;
  }
}
