/**
 * Physical observables for Z₂ gauge theory
 */

import { Z2GaugeField } from './gaugeField';
import { Lattice, Plaquette } from './geometry';

/**
 * Compute average plaquette value ⟨P⟩ = ⟨∏_□ σ_e⟩
 * This is the standard order parameter for gauge theories
 */
export function averagePlaquette(field: Z2GaugeField): number {
  const lattice = field.lattice;
  let sum = 0;
  let count = 0;
  
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
      count++;
    }
  }
  
  return sum / count;
}

/**
 * Compute specific heat: C_V = (⟨S²⟩ - ⟨S⟩²) / V
 * where S is the action and V is the volume (number of sites)
 */
export function specificHeat(
  actionValues: number[],
  beta: number,
  volume: number
): number {
  const meanS = actionValues.reduce((a, b) => a + b, 0) / actionValues.length;
  const meanS2 = actionValues.reduce((a, b) => a + b * b, 0) / actionValues.length;
  
  return (meanS2 - meanS * meanS) / volume;
}

/**
 * Compute Wilson loop W(C) = ⟨∏_C σ_e⟩ for a rectangular loop
 * 
 * @param field - The gauge field
 * @param startSite - Starting site of the loop
 * @param dir1 - First direction (loop width)
 * @param dir2 - Second direction (loop height)
 * @param width - Loop width in lattice units
 * @param height - Loop height in lattice units
 * @returns Loop value (product of links around the loop)
 */
export function wilsonLoop(
  field: Z2GaugeField,
  startSite: number,
  dir1: number,
  dir2: number,
  width: number,
  height: number
): number {
  const lattice = field.lattice;
  let product = 1;
  let currentSite = startSite;
  
  // Go width steps in dir1
  for (let i = 0; i < width; i++) {
    product *= field.getLink(currentSite, dir1);
    currentSite = lattice.neighbor(currentSite, dir1);
  }
  
  // Go height steps in dir2
  for (let i = 0; i < height; i++) {
    product *= field.getLink(currentSite, dir2);
    currentSite = lattice.neighbor(currentSite, dir2);
  }
  
  // Go width steps back in -dir1
  const oppDir1 = (dir1 + lattice.numDirections / 2) % lattice.numDirections;
  for (let i = 0; i < width; i++) {
    product *= field.getLink(currentSite, oppDir1);
    currentSite = lattice.neighbor(currentSite, oppDir1);
  }
  
  // Go height steps back in -dir2
  const oppDir2 = (dir2 + lattice.numDirections / 2) % lattice.numDirections;
  for (let i = 0; i < height; i++) {
    product *= field.getLink(currentSite, oppDir2);
    currentSite = lattice.neighbor(currentSite, oppDir2);
  }
  
  return product;
}

/**
 * Compute average Wilson loop over all starting positions
 */
export function averageWilsonLoop(
  field: Z2GaugeField,
  dir1: number,
  dir2: number,
  width: number,
  height: number
): number {
  const lattice = field.lattice;
  let sum = 0;
  
  for (let site = 0; site < lattice.numSites; site++) {
    sum += wilsonLoop(field, site, dir1, dir2, width, height);
  }
  
  return sum / lattice.numSites;
}

/**
 * Jackknife error estimate for a set of measurements
 */
export function jackknifeError(values: number[]): number {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  
  let variance = 0;
  for (let i = 0; i < n; i++) {
    // Leave-one-out mean
    const leaveOneOut = (values.reduce((a, b) => a + b, 0) - values[i]) / (n - 1);
    variance += Math.pow(leaveOneOut - mean, 2);
  }
  
  return Math.sqrt((n - 1) / n * variance);
}

/**
 * Bin data to reduce autocorrelation
 */
export function binData(values: number[], binSize: number): number[] {
  const binned: number[] = [];
  
  for (let i = 0; i < values.length; i += binSize) {
    const bin = values.slice(i, i + binSize);
    const binMean = bin.reduce((a, b) => a + b, 0) / bin.length;
    binned.push(binMean);
  }
  
  return binned;
}

/**
 * Compute Binder cumulant: U = 1 - ⟨P⁴⟩/(3⟨P²⟩²)
 * Useful for locating critical points via crossing
 */
export function binderCumulant(plaquetteValues: number[]): number {
  const meanP2 = plaquetteValues.reduce((a, b) => a + b * b, 0) / plaquetteValues.length;
  const meanP4 = plaquetteValues.reduce((a, b) => a + b * b * b * b, 0) / plaquetteValues.length;
  
  return 1 - meanP4 / (3 * meanP2 * meanP2);
}

/**
 * Autocorrelation time estimation (simple exponential fit)
 */
export function autocorrelationTime(values: number[]): number {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  
  // Compute autocorrelation function C(t) = ⟨(x_i - μ)(x_{i+t} - μ)⟩
  const maxLag = Math.min(n / 4, 100);
  const autocorr: number[] = [];
  
  for (let lag = 0; lag < maxLag; lag++) {
    let sum = 0;
    for (let i = 0; i < n - lag; i++) {
      sum += (values[i] - mean) * (values[i + lag] - mean);
    }
    autocorr.push(sum / (n - lag));
  }
  
  // Normalize by C(0)
  const C0 = autocorr[0];
  for (let i = 0; i < autocorr.length; i++) {
    autocorr[i] /= C0;
  }
  
  // Exponential fit: C(t) ~ exp(-t/τ)
  // Find where C(t) drops to 1/e
  const target = 1 / Math.E;
  for (let i = 0; i < autocorr.length; i++) {
    if (autocorr[i] < target) {
      return i; // τ ≈ lag where C(t) ≈ 1/e
    }
  }
  
  return autocorr.length; // Upper bound if not converged
}
