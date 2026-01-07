/**
 * Simulation controller for quantum random walks
 */

import { 
    QuantumWalk1DData, 
    SimulationState, 
    UIState, 
    QuantumWalkConfig,
    ClassicalWalkConfig,
    QuantumWalkSnapshot,
    SimulationError
} from './core/types.ts';
import { CustomQuantumWalk } from './quantum-walks/custom-walk.ts';
import { SimpleClassicalWalk } from './classical-walks/simple-walk.ts';
import { PersistentClassicalWalk } from './classical-walks/persistent-walk.ts';
import { UIComponents } from './ui-components.ts';
import { debounce, clampValue } from './utils/math-helpers.ts';

export class QuantumWalkController {
    private quantumWalk: CustomQuantumWalk;
    private classicalWalk: SimpleClassicalWalk | PersistentClassicalWalk;
    private uiComponents: UIComponents;
    private container: HTMLElement;
    
    private simulationState: SimulationState;
    private quantumHistory: QuantumWalkSnapshot[];
    private classicalHistory: QuantumWalkSnapshot[];
    
    private animationFrameId: number | null = null;

    constructor(container: HTMLElement) {
        this.container = container;
        this.quantumWalk = new CustomQuantumWalk();
        this.classicalWalk = new SimpleClassicalWalk();
        this.uiComponents = new UIComponents(container);
        
        this.simulationState = {
            isRunning: false,
            isPaused: false,
            currentStep: 0,
            totalSteps: 0,
            animationCancelled: false
        };
        
        this.quantumHistory = [];
        this.classicalHistory = [];
    }

    /**
     * Initialize the controller and UI
     */
    initialize(): void {
        this.setupUI();
        this.bindEvents();
        this.updateUIState();
    }

    /**
     * Setup UI components
     */
    private setupUI(): void {
        // Setup sidebar quick controls
        const quickControls = this.uiComponents.createQuickControls();
        const quickControlsContainer = document.getElementById('quickControls');
        if (quickControlsContainer) {
            quickControlsContainer.appendChild(quickControls);
        }

        // Create main content area components
        const controls = this.uiComponents.createControls();
        const comparisonCheckbox = this.uiComponents.createComparisonCheckbox();
        const buttonControls = this.uiComponents.createButtonControls();
        const timelineSlider = this.uiComponents.createTimelineSlider();
        const statsGrid = this.uiComponents.createStatisticsGrid();
        const comparisonStats = this.uiComponents.createComparisonStatistics();
        const progressBar = this.uiComponents.createProgressBar();

        // Add controls to visualization view (below the title)
        const visualizationView = document.getElementById('visualization-view');
        if (visualizationView) {
            // Insert after the h3 title
            const title = visualizationView.querySelector('h3');
            if (title) {
                title.after(timelineSlider);
                timelineSlider.after(controls);
                controls.after(comparisonCheckbox);
                comparisonCheckbox.after(buttonControls);
            }
        }

        // Add comparison and stats after visualization
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.appendChild(comparisonStats);
            mainContent.appendChild(statsGrid);
            mainContent.appendChild(progressBar);
        }
    }

    /**
     * Bind event handlers
     */
    private bindEvents(): void {
        // Coin type change
        const coinTypeSelect = document.getElementById('coinType') as HTMLSelectElement;
        coinTypeSelect?.addEventListener('change', () => {
            this.handleCoinTypeChange();
        });

        // Classical model change
        const classicalModelSelect = document.getElementById('classicalModel') as HTMLSelectElement;
        classicalModelSelect?.addEventListener('change', () => {
            this.handleClassicalModelChange();
        });

        // Make methods globally accessible for onclick handlers
        (window as any).runWalk = () => this.runWalk();
        (window as any).togglePause = () => this.togglePause();
        (window as any).stepWalk = () => this.stepWalk();
        (window as any).resetWalk = () => this.resetWalk();
        (window as any).cancelAnimation = () => this.cancelAnimation();
        (window as any).seekToStep = (step: string) => this.seekToStep(parseInt(step));
    }

    /**
     * Handle coin type change
     */
    private handleCoinTypeChange(): void {
        const coinType = this.getUIState().coinType;
        const thetaGroup = document.getElementById('thetaGroup');
        
        if (thetaGroup) {
            thetaGroup.style.display = coinType === 'rotation' ? 'block' : 'none';
        }
    }

    /**
     * Handle classical model change
     */
    private handleClassicalModelChange(): void {
        const model = this.getUIState().classicalModel;
        const persistenceGroup = document.getElementById('persistenceGroup');
        
        if (persistenceGroup) {
            persistenceGroup.style.display = model === 'persistent' ? 'block' : 'none';
        }
    }

    /**
     * Run complete simulation
     */
    async runWalk(): Promise<void> {
        try {
            if (this.simulationState.isRunning && !this.simulationState.isPaused) {
                this.showError('Animation already running. Click Pause to pause.');
                return;
            }

            const config = this.getQuantumWalkConfig();
            this.validateConfig(config);

            if (this.simulationState.isPaused) {
                this.resumeAnimation();
            } else {
                await this.startNewSimulation(config);
            }

        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Start new simulation
     */
    private async startNewSimulation(config: QuantumWalkConfig): Promise<void> {
        this.simulationState.isRunning = true;
        this.simulationState.isPaused = false;
        this.simulationState.animationCancelled = false;
        this.simulationState.currentStep = 0;
        this.simulationState.totalSteps = config.numSteps;

        this.quantumHistory = [];
        this.classicalHistory = [];

        this.disableControls(true);
        this.updateButtonStates('running');

        // Initialize walks
        this.quantumWalk.initialize(config.latticeSize, config.coinType, config.boundaryType, config.theta);
        this.quantumHistory.push({ 
            step: 0, 
            data: this.quantumWalk.getState() 
        });

        if (config.compareClassical) {
            this.initializeClassicalWalk(config);
        }

        // Run animation
        await this.runAnimation(config);

        this.finishSimulation();
    }

    /**
     * Run animation loop
     */
    private async runAnimation(config: QuantumWalkConfig): Promise<void> {
        for (let step = 0; step < config.numSteps; step++) {
            if (this.simulationState.animationCancelled) break;

            // Handle pause
            while (this.simulationState.isPaused && !this.simulationState.animationCancelled) {
                await this.delay(100);
            }
            
            if (this.simulationState.animationCancelled) break;

            // Step quantum walk
            this.quantumWalk.step();
            this.simulationState.currentStep = step + 1;
            this.quantumHistory.push({ 
                step: this.simulationState.currentStep, 
                data: this.quantumWalk.getState() 
            });

            // Step classical walk if enabled
            if (config.compareClassical) {
                this.classicalWalk.step();
                this.classicalHistory.push({ 
                    step: this.simulationState.currentStep, 
                    data: this.classicalWalk.getState() 
                });
            }

            // Update UI
            this.updateDisplay();
            this.uiComponents.updateTimeline(this.simulationState.currentStep, config.numSteps);

            await this.delay(500); // Animation delay
        }
    }

    /**
     * Initialize classical walk
     */
    private initializeClassicalWalk(config: QuantumWalkConfig): void {
        const uiState = this.getUIState();
        
        if (uiState.classicalModel === 'persistent') {
            this.classicalWalk = new PersistentClassicalWalk();
            (this.classicalWalk as PersistentClassicalWalk).initialize(config.latticeSize, uiState.persistenceQ);
        } else {
            this.classicalWalk = new SimpleClassicalWalk();
            this.classicalWalk.initialize(config.latticeSize);
        }

        this.classicalHistory.push({ 
            step: 0, 
            data: this.classicalWalk.getState() 
        });
    }

    /**
     * Step walk (single step)
     */
    stepWalk(): void {
        try {
            const config = this.getQuantumWalkConfig();
            this.validateConfig(config);

            // Initialize if needed
            if (this.quantumHistory.length === 0) {
                this.quantumWalk.initialize(config.latticeSize, config.coinType, config.boundaryType, config.theta);
                this.quantumHistory.push({ step: 0, data: this.quantumWalk.getState() });

                if (config.compareClassical) {
                    this.initializeClassicalWalk(config);
                }
            }

            // Step walks
            this.quantumWalk.step();
            this.simulationState.currentStep++;
            this.quantumHistory.push({ 
                step: this.simulationState.currentStep, 
                data: this.quantumWalk.getState() 
            });

            if (config.compareClassical) {
                this.classicalWalk.step();
                this.classicalHistory.push({ 
                    step: this.simulationState.currentStep, 
                    data: this.classicalWalk.getState() 
                });
            }

            this.updateDisplay();
            this.uiComponents.updateTimeline(this.simulationState.currentStep, config.numSteps);

        } catch (error) {
            this.handleError(error);
        }
    }

    /**
     * Toggle pause/resume
     */
    togglePause(): void {
        if (!this.simulationState.isRunning) return;

        this.simulationState.isPaused = !this.simulationState.isPaused;
        this.updateButtonStates(this.simulationState.isPaused ? 'paused' : 'running');

        if (!this.simulationState.isPaused) {
            this.resumeAnimation();
        }
    }

    /**
     * Resume animation
     */
    private async resumeAnimation(): Promise<void> {
        const config = this.getQuantumWalkConfig();
        await this.runAnimation(config);
        this.finishSimulation();
    }

    /**
     * Reset walk
     */
    resetWalk(): void {
        this.cancelAnimation();
        
        this.quantumWalk.reset();
        this.classicalWalk.reset();
        
        this.simulationState = {
            isRunning: false,
            isPaused: false,
            currentStep: 0,
            totalSteps: 0,
            animationCancelled: false
        };
        
        this.quantumHistory = [];
        this.classicalHistory = [];

        this.clearDisplay();
        this.disableControls(false);
        this.updateButtonStates('idle');
        this.uiComponents.updateTimeline(0, 0);
    }

    /**
     * Cancel animation
     */
    cancelAnimation(): void {
        this.simulationState.animationCancelled = true;
        this.simulationState.isRunning = false;
        this.simulationState.isPaused = false;
        
        this.disableControls(false);
        this.updateButtonStates('idle');
    }

    /**
     * Seek to specific step
     */
    seekToStep(step: number): void {
        if (step >= 0 && step < this.quantumHistory.length) {
            this.simulationState.currentStep = step;
            this.updateDisplay();
            this.uiComponents.updateTimeline(step, this.quantumHistory.length - 1);
        }
    }

    /**
     * Update display with current data
     */
    private updateDisplay(): void {
        const quantumData = this.quantumHistory[this.simulationState.currentStep]?.data;
        const classicalData = this.classicalHistory[this.simulationState.currentStep]?.data;

        if (quantumData) {
            this.uiComponents.updateStatistics(quantumData, classicalData);
            this.renderVisualization(quantumData, 'visualization');
            
            if (classicalData) {
                this.renderVisualization(classicalData, 'classicalVisualization');
                document.getElementById('comparisonSection')!.style.display = 'block';
            }
        }
    }

    /**
     * Render visualization
     */
    private renderVisualization(data: QuantumWalk1DData, containerId: string): void {
        const container = document.getElementById(containerId);
        if (!container) return;

        const probs = data.probabilities;
        const width = 700, height = 250, marginX = 60, marginY = 40;
        const svgWidth = width + 2 * marginX, svgHeight = height + 2 * marginY;
        const maxProb = Math.max(...probs.map(p => p.probability), 0.1);
        const barWidth = Math.max(2, (width - 20) / probs.length);

        let svg = `<svg width="${svgWidth}" height="${svgHeight}" style="border: 1px solid #ddd; background: white;">`;

        // Axes labels
        svg += `<text x="${marginX + width/2}" y="${svgHeight - 5}" text-anchor="middle" font-size="12" font-weight="bold">Position</text>`;
        svg += `<text x="15" y="${marginY + height/2}" text-anchor="middle" font-size="12" font-weight="bold" transform="rotate(-90 15 ${marginY + height/2})">Probability</text>`;

        // Vertical bars
        for (let i = 0; i < probs.length; i++) {
            const prob = probs[i].probability;
            const barHeight = (prob / maxProb) * height * 0.9;
            const x = marginX + (i * barWidth) + 10;
            const y = marginY + height - barHeight;
            const color = `hsl(${(prob / maxProb) * 240}, 70%, 50%)`;
            svg += `<rect x="${x}" y="${y}" width="${barWidth - 2}" height="${barHeight}" fill="${color}" stroke="none"/>`;
        }

        // X-axis labels
        const labelStep = Math.max(1, Math.floor(probs.length / 10));
        const latticeSize = probs.length;
        const x0 = (latticeSize - 1) / 2;
        
        for (let i = 0; i < probs.length; i += labelStep) {
            const x = marginX + (i * barWidth) + 10 + (barWidth - 2) / 2;
            const y = marginY + height + 15;
            const xLabel = (i - x0);
            svg += `<text x="${x}" y="${y}" text-anchor="middle" font-size="10">${xLabel}</text>`;
        }

        // Axes
        svg += `<line x1="${marginX}" y1="${marginY}" x2="${marginX}" y2="${marginY + height}" stroke="black" stroke-width="1"/>`;
        svg += `<line x1="${marginX}" y1="${marginY + height}" x2="${marginX + width}" y2="${marginY + height}" stroke="black" stroke-width="1"/>`;
        svg += `</svg>`;

        container.innerHTML = svg;
    }

    /**
     * Clear display
     */
    private clearDisplay(): void {
        const visualization = document.getElementById('visualization');
        const classicalVisualization = document.getElementById('classicalVisualization');
        
        if (visualization) visualization.innerHTML = '';
        if (classicalVisualization) classicalVisualization.innerHTML = '';
        
        document.getElementById('comparisonSection')!.style.display = 'none';
        
        // Reset statistics
        this.uiComponents.updateStatistics({
            step: 0,
            probabilities: [],
            centerOfMass: 0,
            variance: 0,
            totalProbability: 1,
            maxProbability: 0
        });
    }

    /**
     * Finish simulation
     */
    private finishSimulation(): void {
        this.simulationState.isRunning = false;
        this.simulationState.isPaused = false;
        this.disableControls(false);
        this.updateButtonStates('idle');
    }

    /**
     * Update button states
     */
    private updateButtonStates(state: 'idle' | 'running' | 'paused'): void {
        const runBtn = document.getElementById('runBtn') as HTMLButtonElement;
        const pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;
        const cancelBtn = document.getElementById('cancelBtn') as HTMLButtonElement;

        if (state === 'running') {
            if (runBtn) runBtn.style.display = 'none';
            if (pauseBtn) {
                pauseBtn.style.display = 'inline-block';
                pauseBtn.textContent = '⏸ Pause';
            }
            if (cancelBtn) cancelBtn.style.display = 'inline-block';
        } else if (state === 'paused') {
            if (pauseBtn) pauseBtn.textContent = '▶ Resume';
        } else {
            if (runBtn) runBtn.style.display = 'inline-block';
            if (pauseBtn) pauseBtn.style.display = 'none';
            if (cancelBtn) cancelBtn.style.display = 'none';
        }
    }

    /**
     * Disable/enable controls
     */
    private disableControls(disabled: boolean): void {
        const controls = ['latticeSize', 'numSteps', 'coinType', 'boundaryType', 'compareClassical'];
        
        controls.forEach(id => {
            const element = document.getElementById(id) as HTMLInputElement;
            if (element) element.disabled = disabled;
        });
    }

    /**
     * Update UI state
     */
    private updateUIState(): void {
        this.handleCoinTypeChange();
        this.handleClassicalModelChange();
    }

    /**
     * Get UI state
     */
    private getUIState(): UIState {
        return this.uiComponents.getUIState();
    }

    /**
     * Get quantum walk configuration
     */
    private getQuantumWalkConfig(): QuantumWalkConfig {
        const uiState = this.getUIState();
        
        return {
            latticeSize: uiState.latticeSize,
            numSteps: uiState.numSteps,
            coinType: uiState.coinType,
            boundaryType: uiState.boundaryType,
            theta: uiState.theta,
            decoherenceP: uiState.decoherenceP,
            ensembleSize: uiState.ensembleSize,
            compareClassical: uiState.compareClassical
        };
    }

    /**
     * Validate configuration
     */
    private validateConfig(config: QuantumWalkConfig): void {
        if (config.latticeSize < 5 || config.latticeSize > 31) {
            throw new SimulationError('Lattice size must be between 5 and 31');
        }
        if (config.numSteps < 1 || config.numSteps > 100) {
            throw new SimulationError('Steps must be between 1 and 100');
        }
    }

    /**
     * Handle errors
     */
    private handleError(error: unknown): void {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        this.showError(message);
        this.cancelAnimation();
    }

    /**
     * Show error message
     */
    private showError(message: string): void {
        alert('Error: ' + message);
    }

    /**
     * Delay utility
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}