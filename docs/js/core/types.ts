/**
 * Core type definitions for quantum random walk simulations
 */

export interface QuantumWalk1DData {
    step: number;
    probabilities: { position: number; probability: number }[];
    centerOfMass: number;
    variance: number;
    totalProbability: number;
    maxProbability: number;
}

export interface VarianceGrowth {
    step: number;
    quantumVariance: number;
    classicalVariance: number;
    advantage: number;
}

export type QuantumWalk1DBoundary = 'reflecting' | 'periodic';
export type QuantumWalk1DCoin = 'hadamard' | 'grover' | 'rotation';

export interface QuantumWalkConfig {
    latticeSize: number;
    numSteps: number;
    coinType: QuantumWalk1DCoin;
    boundaryType: QuantumWalk1DBoundary;
    theta?: number;
    decoherenceP?: number;
    ensembleSize?: number;
    compareClassical?: boolean;
}

export interface ClassicalWalkConfig {
    latticeSize: number;
    numSteps: number;
    model: 'simple' | 'persistent';
    persistenceQ?: number;
}

export interface SimulationState {
    isRunning: boolean;
    isPaused: boolean;
    currentStep: number;
    totalSteps: number;
    animationCancelled: boolean;
}

export interface UIState {
    latticeSize: number;
    numSteps: number;
    coinType: QuantumWalk1DCoin;
    boundaryType: QuantumWalk1DBoundary;
    theta: number;
    decoherenceP: number;
    ensembleSize: number;
    compareClassical: boolean;
    classicalModel: 'simple' | 'persistent';
    persistenceQ: number;
}

export interface AnalysisConfig {
    type: 'variance-growth' | 'distribution-snapshot' | 'classical-limit';
    latticeSize: number;
    maxSteps: number;
}

export interface ProgressInfo {
    percent: number;
    label: string;
    secondsRemaining: number;
}

export interface QuantumWalkSnapshot {
    step: number;
    data: QuantumWalk1DData;
}

export interface SimulationResult {
    final: QuantumWalk1DData;
    history: QuantumWalkSnapshot[];
}

export interface SpreadingComparison {
    quantumRate: number;
    classicalRate: number;
    advantage: number;
}

// Base interface for all quantum walk implementations
export interface IQuantumWalk {
    initialize(latticeSize: number, ...args: any[]): QuantumWalk1DData;
    step(): QuantumWalk1DData;
    reset(): void;
    getState(): QuantumWalk1DData;
    getHistory(): QuantumWalkSnapshot[];
}

// Base interface for classical walk implementations
export interface IClassicalWalk {
    initialize(latticeSize: number, ...args: any[]): QuantumWalk1DData;
    step(): QuantumWalk1DData;
    reset(): void;
    getState(): QuantumWalk1DData;
    getHistory(): QuantumWalkSnapshot[];
}

// Interface for analysis modules
export interface IAnalyzer {
    analyze(quantumHistory: QuantumWalkSnapshot[], classicalHistory?: QuantumWalkSnapshot[]): any;
}

// Interface for visualization components
export interface IVisualizer {
    render(data: QuantumWalk1DData, container: HTMLElement): void;
    update(data: QuantumWalk1DData): void;
    clear(): void;
}

// Interface for UI controllers
export interface IController {
    initialize(): void;
    bindEvents(): void;
    updateUI(): void;
    reset(): void;
}

// Error types
export class QuantumWalkError extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message);
        this.name = 'QuantumWalkError';
    }
}

export class SimulationError extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message);
        this.name = 'SimulationError';
    }
}

export class UIError extends Error {
    constructor(message: string, public readonly code?: string) {
        super(message);
        this.name = 'UIError';
    }
}