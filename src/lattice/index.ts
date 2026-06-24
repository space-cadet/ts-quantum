/**
 * Lattice gauge theory module for Z₂ gauge theory
 * 
 * Exports:
 * - geometry: Lattice types (Square, Triangular, Cubic)
 * - gaugeField: Z₂GaugeField class
 * - action: Wilson action computation
 * - monteCarlo: Metropolis algorithm
 * - observables: Physical measurements
 */

export * from './geometry';
export * from './gaugeField';
export * from './action';
export * from './monteCarlo';
export * from './observables';
