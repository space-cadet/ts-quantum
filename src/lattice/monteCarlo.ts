/**
 * Metropolis Monte Carlo algorithm for Z₂ gauge theory
 */

import { Z2GaugeField } from './gaugeField';
import { computeDeltaS } from './action';

/**
 * Perform one Metropolis sweep: attempt to flip each link once
 * 
 * @param field - The gauge field to update
 * @param beta - Inverse coupling β = 1/g²
 * @returns Acceptance rate (fraction of accepted flips)
 */
export function metropolisSweep(field: Z2GaugeField, beta: number): number {
  const lattice = field.lattice;
  let accepted = 0;
  let total = 0;
  
  // Iterate over all sites and directions
  for (let site = 0; site < lattice.numSites; site++) {
    for (let direction = 0; direction < lattice.numDirections; direction++) {
      const deltaS = computeDeltaS(field, site, direction, beta);
      
      // Metropolis acceptance criterion
      if (deltaS <= 0 || Math.random() < Math.exp(-deltaS)) {
        // Accept the flip
        field.flipLink(site, direction);
        accepted++;
      }
      total++;
    }
  }
  
  return accepted / total;
}

/**
 * Thermalize the gauge field at given β
 * 
 * @param field - The gauge field
 * @param beta - Inverse coupling
 * @param sweeps - Number of sweeps to thermalize
 * @returns Array of acceptance rates per sweep
 */
export function thermalize(field: Z2GaugeField, beta: number, sweeps: number): number[] {
  const rates: number[] = [];
  
  for (let s = 0; s < sweeps; s++) {
    const rate = metropolisSweep(field, beta);
    rates.push(rate);
  }
  
  return rates;
}

/**
 * Run a measurement sweep: thermalize, then measure observables
 * 
 * @param field - The gauge field
 * @param beta - Inverse coupling
 * @param thermalSweeps - Number of sweeps to thermalize
 * @param measureSweeps - Number of sweeps to measure
 * @param measureEvery - Measure every N sweeps
 * @param measureFn - Function to call for each measurement
 * @returns Array of measurement results
 */
export function measure<T>(
  field: Z2GaugeField,
  beta: number,
  thermalSweeps: number,
  measureSweeps: number,
  measureEvery: number,
  measureFn: (field: Z2GaugeField) => T
): T[] {
  // Thermalize
  thermalize(field, beta, thermalSweeps);
  
  // Measure
  const results: T[] = [];
  for (let s = 0; s < measureSweeps; s++) {
    metropolisSweep(field, beta);
    if (s % measureEvery === 0) {
      results.push(measureFn(field));
    }
  }
  
  return results;
}

/**
 * Run a simulation with multiple β values (parameter sweep)
 * 
 * @param lattice - The lattice to simulate on
 * @param betaValues - Array of β values to simulate
 * @param config - Simulation configuration
 * @returns Results for each β
 */
export interface SimulationConfig {
  L: number;
  thermalSweeps: number;
  measureSweeps: number;
  measureEvery: number;
  init?: 'hot' | 'cold' | 'random';
}

export interface SimulationResult {
  beta: number;
  measurements: number[];
  mean: number;
  error: number;
  acceptanceRate: number;
}

// Type re-exports for convenience
export { Z2GaugeField } from './gaugeField';
