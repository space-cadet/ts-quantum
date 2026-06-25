/**
 * Checkpointing utilities for Monte Carlo simulations
 * 
 * Provides save/resume functionality for long-running lattice simulations.
 * Coarse-grained: tracks completed β values per simulation.
 * Fine-grained: can be extended to save field state mid-simulation.
 */

import * as fs from 'fs';
import * as path from 'path';

export interface SimulationParameters {
  L: number;
  thermalSweeps: number;
  measureSweeps: number;
  measureEvery: number;
  binSize: number;
  seed?: number;
}

export interface BetaResult {
  beta: number;
  meanPlaquette: number;
  errorPlaquette: number;
  numMeasurements: number;
  wallTimeMs: number;
}

export interface CheckpointManifest {
  simulationId: string;
  parameters: SimulationParameters;
  completed: number[];
  results: BetaResult[];
  timestamp: string;
  version: '1.0';
}

const DEFAULT_CHECKPOINT_DIR = './checkpoints';

function getCheckpointDir(): string {
  return process.env.CHECKPOINT_DIR || DEFAULT_CHECKPOINT_DIR;
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Save checkpoint manifest to disk */
export function saveCheckpoint(manifest: CheckpointManifest): void {
  const dir = getCheckpointDir();
  ensureDir(dir);
  const filepath = path.join(dir, `${manifest.simulationId}.json`);
  fs.writeFileSync(filepath, JSON.stringify(manifest, null, 2));
}

/** Load checkpoint manifest from disk */
export function loadCheckpoint(simulationId: string): CheckpointManifest | null {
  const dir = getCheckpointDir();
  const filepath = path.join(dir, `${simulationId}.json`);
  if (!fs.existsSync(filepath)) return null;
  
  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    // Validate structure
    if (!data.simulationId || !data.parameters || !Array.isArray(data.completed)) {
      console.warn(`Checkpoint ${simulationId} has invalid structure`);
      return null;
    }
    return data as CheckpointManifest;
  } catch (e) {
    console.warn(`Failed to load checkpoint ${simulationId}:`, e);
    return null;
  }
}

/** Check if checkpoint exists */
export function hasCheckpoint(simulationId: string): boolean {
  const dir = getCheckpointDir();
  const filepath = path.join(dir, `${simulationId}.json`);
  return fs.existsSync(filepath);
}

/** Get remaining β values not yet completed */
export function getRemainingBetas(
  allBetas: number[],
  manifest: CheckpointManifest | null
): number[] {
  if (!manifest) return [...allBetas];
  const completed = new Set(manifest.completed);
  return allBetas.filter(b => !completed.has(b));
}

/** List all available checkpoints */
export function listCheckpoints(): string[] {
  const dir = getCheckpointDir();
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => f.replace('.json', ''));
}

/** Delete a checkpoint */
export function deleteCheckpoint(simulationId: string): void {
  const dir = getCheckpointDir();
  const filepath = path.join(dir, `${simulationId}.json`);
  if (fs.existsSync(filepath)) {
    fs.unlinkSync(filepath);
  }
}

/** Create a simulation ID from parameters */
export function createSimulationId(
  prefix: string,
  params: SimulationParameters
): string {
  const { L, measureSweeps } = params;
  return `${prefix}-L${L}-N${measureSweeps}-${Date.now()}`;
}
