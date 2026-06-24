/**
 * Lattice geometry for gauge theory simulations
 * 
 * Supports 2D square, 2D triangular, and 3D cubic lattices
 * with periodic boundary conditions.
 */

export interface Lattice {
  /** Lattice dimension (2 or 3) */
  readonly dimension: number;
  
  /** Linear size L (L^d total sites) */
  readonly L: number;
  
  /** Total number of sites */
  readonly numSites: number;
  
  /** Number of directions per site (2D: 4, 3D: 6) */
  readonly numDirections: number;
  
  /** Get neighbor site index in given direction */
  neighbor(site: number, direction: number): number;
  
  /** Get all plaquettes containing a given site and directions */
  plaquettes(site: number): Plaquette[];
  
  /** Convert site index to coordinates */
  coordinates(site: number): number[];
  
  /** Convert coordinates to site index */
  siteIndex(coords: number[]): number;
}

export interface Plaquette {
  /** Site indices forming the plaquette (in order) */
  sites: number[];
  /** Direction indices for the links (in order) */
  directions: number[];
  /** Orientation: +1 or -1 */
  orientation: number;
}

/**
 * 2D square lattice with periodic boundary conditions
 * 
 * Directions: 0=+x, 1=+y, 2=-x, 3=-y
 */
export class SquareLattice implements Lattice {
  readonly dimension = 2;
  readonly numDirections = 4;
  readonly numSites: number;
  
  constructor(readonly L: number) {
    this.numSites = L * L;
  }
  
  neighbor(site: number, direction: number): number {
    const x = site % this.L;
    const y = Math.floor(site / this.L);
    
    switch (direction) {
      case 0: return ((x + 1) % this.L) + y * this.L;  // +x
      case 1: return x + ((y + 1) % this.L) * this.L;  // +y
      case 2: return ((x - 1 + this.L) % this.L) + y * this.L; // -x
      case 3: return x + ((y - 1 + this.L) % this.L) * this.L; // -y
      default: throw new Error(`Invalid direction: ${direction}`);
    }
  }
  
  plaquettes(site: number): Plaquette[] {
    const x = site % this.L;
    const y = Math.floor(site / this.L);
    
    // Forward plaquette: (x,y) → (x+1,y) → (x+1,y+1) → (x,y+1) → (x,y)
    const s1 = ((x + 1) % this.L) + y * this.L;
    const s2 = ((x + 1) % this.L) + ((y + 1) % this.L) * this.L;
    const s3 = x + ((y + 1) % this.L) * this.L;
    
    return [{
      sites: [site, s1, s2, s3],
      directions: [0, 1, 2, 3],
      orientation: 1
    }];
  }
  
  coordinates(site: number): number[] {
    return [site % this.L, Math.floor(site / this.L)];
  }
  
  siteIndex(coords: number[]): number {
    return (coords[0] + this.L) % this.L + ((coords[1] + this.L) % this.L) * this.L;
  }
}

/**
 * 2D triangular lattice with periodic boundary conditions
 * 
 * Directions: 0=+x, 1=+y (skewed), 2=-x, 3=-y, 4=+x-y, 5=-x+y
 * On a triangular lattice, each site has 6 neighbors
 */
export class TriangularLattice implements Lattice {
  readonly dimension = 2;
  readonly numDirections = 6;
  readonly numSites: number;
  
  constructor(readonly L: number) {
    this.numSites = L * L;
  }
  
  neighbor(site: number, direction: number): number {
    const x = site % this.L;
    const y = Math.floor(site / this.L);
    
    switch (direction) {
      case 0: return ((x + 1) % this.L) + y * this.L;  // +x
      case 1: return x + ((y + 1) % this.L) * this.L;  // +y
      case 2: return ((x - 1 + this.L) % this.L) + y * this.L; // -x
      case 3: return x + ((y - 1 + this.L) % this.L) * this.L; // -y
      case 4: return ((x + 1) % this.L) + ((y - 1 + this.L) % this.L) * this.L; // +x-y
      case 5: return ((x - 1 + this.L) % this.L) + ((y + 1) % this.L) * this.L; // -x+y
      default: throw new Error(`Invalid direction: ${direction}`);
    }
  }
  
  plaquettes(site: number): Plaquette[] {
    const x = site % this.L;
    const y = Math.floor(site / this.L);
    
    // Triangular plaquettes (3-site loops)
    const s1 = ((x + 1) % this.L) + y * this.L;
    const s2 = x + ((y + 1) % this.L) * this.L;
    
    return [{
      sites: [site, s1, s2],
      directions: [0, 1, 5], // +x, +y, -x+y (closing the triangle)
      orientation: 1
    }];
  }
  
  coordinates(site: number): number[] {
    return [site % this.L, Math.floor(site / this.L)];
  }
  
  siteIndex(coords: number[]): number {
    return (coords[0] + this.L) % this.L + ((coords[1] + this.L) % this.L) * this.L;
  }
}

/**
 * 3D cubic lattice with periodic boundary conditions
 * 
 * Directions: 0=+x, 1=+y, 2=+z, 3=-x, 4=-y, 5=-z
 */
export class CubicLattice implements Lattice {
  readonly dimension = 3;
  readonly numDirections = 6;
  readonly numSites: number;
  readonly L2: number;
  
  constructor(readonly L: number) {
    this.L2 = L * L;
    this.numSites = L * L * L;
  }
  
  neighbor(site: number, direction: number): number {
    const x = site % this.L;
    const y = Math.floor(site / this.L) % this.L;
    const z = Math.floor(site / this.L2);
    
    switch (direction) {
      case 0: return ((x + 1) % this.L) + y * this.L + z * this.L2;
      case 1: return x + ((y + 1) % this.L) * this.L + z * this.L2;
      case 2: return x + y * this.L + ((z + 1) % this.L) * this.L2;
      case 3: return ((x - 1 + this.L) % this.L) + y * this.L + z * this.L2;
      case 4: return x + ((y - 1 + this.L) % this.L) * this.L + z * this.L2;
      case 5: return x + y * this.L + ((z - 1 + this.L) % this.L) * this.L2;
      default: throw new Error(`Invalid direction: ${direction}`);
    }
  }
  
  plaquettes(site: number): Plaquette[] {
    const x = site % this.L;
    const y = Math.floor(site / this.L) % this.L;
    const z = Math.floor(site / this.L2);
    
    const result: Plaquette[] = [];
    
    // xy-plane plaquette
    const s1_xy = ((x + 1) % this.L) + y * this.L + z * this.L2;
    const s2_xy = ((x + 1) % this.L) + ((y + 1) % this.L) * this.L + z * this.L2;
    const s3_xy = x + ((y + 1) % this.L) * this.L + z * this.L2;
    result.push({
      sites: [site, s1_xy, s2_xy, s3_xy],
      directions: [0, 1, 3, 4],
      orientation: 1
    });
    
    // yz-plane plaquette
    const s1_yz = x + ((y + 1) % this.L) * this.L + z * this.L2;
    const s2_yz = x + ((y + 1) % this.L) * this.L + ((z + 1) % this.L) * this.L2;
    const s3_yz = x + y * this.L + ((z + 1) % this.L) * this.L2;
    result.push({
      sites: [site, s1_yz, s2_yz, s3_yz],
      directions: [1, 2, 4, 5],
      orientation: 1
    });
    
    // zx-plane plaquette
    const s1_zx = x + y * this.L + ((z + 1) % this.L) * this.L2;
    const s2_zx = ((x + 1) % this.L) + y * this.L + ((z + 1) % this.L) * this.L2;
    const s3_zx = ((x + 1) % this.L) + y * this.L + z * this.L2;
    result.push({
      sites: [site, s1_zx, s2_zx, s3_zx],
      directions: [2, 0, 5, 3],
      orientation: 1
    });
    
    return result;
  }
  
  coordinates(site: number): number[] {
    return [
      site % this.L,
      Math.floor(site / this.L) % this.L,
      Math.floor(site / this.L2)
    ];
  }
  
  siteIndex(coords: number[]): number {
    return (coords[0] + this.L) % this.L + 
           ((coords[1] + this.L) % this.L) * this.L + 
           ((coords[2] + this.L) % this.L) * this.L2;
  }
}

/** Factory functions */
export function createSquareLattice(L: number): SquareLattice {
  return new SquareLattice(L);
}

export function createTriangularLattice(L: number): TriangularLattice {
  return new TriangularLattice(L);
}

export function createCubicLattice(L: number): CubicLattice {
  return new CubicLattice(L);
}
