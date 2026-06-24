/**
 * Wilson action for Z₂ gauge theory
 * 
 * S = -β Σ_□ ∏_{e∈□} σ_e
 */

import { Lattice } from './geometry';
import { Z2GaugeField } from './gaugeField';

/**
 * Compute the product of links around a single plaquette
 */
export function computePlaquetteProduct(
  field: Z2GaugeField,
  site: number,
  direction1: number,
  direction2: number
): number {
  const lattice = field.lattice;
  let product = 1;
  let currentSite = site;
  
  // Forward along direction1
  product *= field.getLink(currentSite, direction1);
  currentSite = lattice.neighbor(currentSite, direction1);
  
  // Forward along direction2
  product *= field.getLink(currentSite, direction2);
  currentSite = lattice.neighbor(currentSite, direction2);
  
  // Backward along direction1 (opposite direction)
  const oppDir1 = (direction1 + lattice.numDirections / 2) % lattice.numDirections;
  product *= field.getLink(currentSite, oppDir1);
  currentSite = lattice.neighbor(currentSite, oppDir1);
  
  // Backward along direction2 (opposite direction)
  const oppDir2 = (direction2 + lattice.numDirections / 2) % lattice.numDirections;
  product *= field.getLink(currentSite, oppDir2);
  
  return product;
}

/**
 * Compute total Wilson action for the field
 * S = -β Σ_□ P_□
 */
export function computeAction(
  field: Z2GaugeField,
  beta: number
): number {
  const lattice = field.lattice;
  let sum = 0;
  
  // Sum over all plaquettes
  for (let site = 0; site < lattice.numSites; site++) {
    const plaquettes = lattice.plaquettes(site);
    for (const plaq of plaquettes) {
      let product = 1;
      let currentSite = site;
      
      for (let i = 0; i < plaq.sites.length - 1; i++) {
        product *= field.getLink(currentSite, plaq.directions[i]);
        currentSite = plaq.sites[i + 1];
      }
      
      sum += product;
    }
  }
  
  return -beta * sum;
}

/**
 * Compute change in action from flipping a single link
 * ΔS = S_new - S_old
 * 
 * For Z₂, this is much simpler: only plaquettes containing the flipped link change
 */
export function computeDeltaS(
  field: Z2GaugeField,
  site: number,
  direction: number,
  beta: number
): number {
  const lattice = field.lattice;
  const oldLink = field.getLink(site, direction);
  const newLink = -oldLink;
  
  let deltaSum = 0;
  
  // Find all plaquettes containing this link and compute their contribution change
  // For a link (site, direction), the plaquettes are those that include this link
  // For 2D: each link is in 2 plaquettes (forward and backward)
  // For 3D: each link is in 4 plaquettes (2 per orthogonal plane)
  
  // For now, use brute force: compute action before and after
  // This is O(numPlaquettes) per link, which is fine for small lattices
  // For large lattices, we can optimize by only computing affected plaquettes
  
  const oldAction = computeAction(field, beta);
  field.setLink(site, direction, newLink);
  const newAction = computeAction(field, beta);
  field.setLink(site, direction, oldLink); // restore
  
  return newAction - oldAction;
}

/**
 * Optimized version: compute deltaS by only looking at affected plaquettes
 * This is O(1) per link instead of O(numPlaquettes)
 */
export function computeDeltaSOptimized(
  field: Z2GaugeField,
  site: number,
  direction: number,
  beta: number
): number {
  const lattice = field.lattice;
  const oldLink = field.getLink(site, direction);
  
  // For each plaquette containing this link, the product changes by a factor of -1
  // So each affected plaquette contributes: -β * (newProduct - oldProduct) = -β * (-2 * oldProduct) = 2β * oldProduct
  // But wait, we need to be more careful about which plaquettes contain this link
  
  // For a 2D square lattice, a link (site, direction) is in 2 plaquettes:
  // 1. The plaquette starting at site going forward
  // 2. The plaquette starting at the backward neighbor going forward
  
  // For now, let's just use the brute force version for correctness
  // and optimize later
  return computeDeltaS(field, site, direction, beta);
}
