/**
 * UI components for quantum random walk visualization
 */

import { QuantumWalk1DData, UIState, ProgressInfo } from './core/types.ts';
import { formatComplex, clampValue } from './utils/math-helpers.ts';

export class UIComponents {
    private container: HTMLElement;

    constructor(container: HTMLElement) {
        this.container = container;
    }

    /**
     * Create unified controls panel
     */
    createControls(): HTMLElement {
        const controls = document.createElement('div');
        controls.className = 'unified-controls';
        controls.innerHTML = `
            <div class="control-group">
                <label>Lattice Size:</label>
                <input type="number" id="latticeSize" value="11" min="5" max="31" step="2">
                <span class="control-hint">(5-31, odd preferred)</span>
            </div>
            <div class="control-group">
                <label>Evolution Steps:</label>
                <input type="number" id="numSteps" value="10" min="1" max="100">
                <span class="control-hint">(1-100)</span>
            </div>
            <div class="control-group">
                <label>Coin Type:</label>
                <select id="coinType">
                    <option value="hadamard">Hadamard (standard)</option>
                    <option value="grover">Grover diffusion (2-state)</option>
                    <option value="rotation">Rotation coin C(θ)</option>
                </select>
            </div>
            <div class="control-group" id="thetaGroup" style="display: none;">
                <label>θ (rotation coin):</label>
                <input type="number" id="coinTheta" value="0.785398" min="0" max="1.570796" step="0.01">
                <span class="control-hint">(radians, default π/4)</span>
            </div>
            <div class="control-group">
                <label>Boundary Conditions:</label>
                <select id="boundaryType">
                    <option value="reflecting">Reflecting (coin flip)</option>
                    <option value="periodic">Periodic/Toroidal</option>
                </select>
            </div>
            <div class="control-group">
                <label>Decoherence p (coin measurement):</label>
                <input type="number" id="decoherenceP" value="0" min="0" max="1" step="0.05">
                <span class="control-hint">(0=unitary, 1=classical limit)</span>
            </div>
            <div class="control-group">
                <label>Ensemble Size:</label>
                <input type="number" id="ensembleSize" value="50" min="1" max="500" step="1">
                <span class="control-hint">(used when p>0)</span>
            </div>
            <div class="control-group">
                <label>Classical Model:</label>
                <select id="classicalModel">
                    <option value="simple">Simple (memoryless)</option>
                    <option value="persistent">Persistent (2-component / telegraph-like)</option>
                </select>
            </div>
            <div class="control-group" id="persistenceGroup" style="display: none;">
                <label>Persistence q:</label>
                <input type="number" id="persistenceQ" value="0.9" min="0" max="1" step="0.05">
                <span class="control-hint">(q→1 ballistic, q→0 diffusive)</span>
            </div>
        `;
        return controls;
    }

    /**
     * Create button controls
     */
    createButtonControls(): HTMLElement {
        const buttonGroup = document.createElement('div');
        buttonGroup.className = 'button-group';
        buttonGroup.innerHTML = `
            <button onclick="runWalk()" id="runBtn">Run Simulation</button>
            <button onclick="togglePause()" id="pauseBtn" style="display: none;">⏸ Pause</button>
            <button onclick="stepWalk()">Step (single)</button>
            <button onclick="resetWalk()">Reset</button>
            <button id="cancelBtn" onclick="cancelAnimation()" style="display: none; background-color: #e74c3c;">Cancel Animation</button>
        `;
        return buttonGroup;
    }

    /**
     * Create timeline slider
     */
    createTimelineSlider(): HTMLElement {
        const timelineContainer = document.createElement('div');
        timelineContainer.className = 'timeline-container';
        timelineContainer.innerHTML = `
            <label class="timeline-label">Timeline:</label>
            <div class="timeline-controls">
                <input type="range" id="timeSlider" min="0" max="0" value="0" class="timeline-slider" onchange="seekToStep(this.value)">
                <span id="timeDisplay" class="timeline-display">0/0</span>
            </div>
        `;
        return timelineContainer;
    }

    /**
     * Create comparison checkbox
     */
    createComparisonCheckbox(): HTMLElement {
        const checkboxGroup = document.createElement('div');
        checkboxGroup.className = 'checkbox-group';
        checkboxGroup.innerHTML = `
            <input type="checkbox" id="compareClassical">
            <label for="compareClassical">Compare with Classical Walk</label>
        `;
        return checkboxGroup;
    }

    /**
     * Create statistics grid
     */
    createStatisticsGrid(): HTMLElement {
        const statsGrid = document.createElement('div');
        statsGrid.className = 'stats-grid';
        statsGrid.innerHTML = `
            <div class="stat-item">
                <div class="stat-label">Current Step:</div>
                <div class="stat-value" id="currentStep">0</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Total Probability:</div>
                <div class="stat-value" id="totalProb">1.0000</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Center of Mass:</div>
                <div class="stat-value" id="com">—</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Variance (σ²):</div>
                <div class="stat-value" id="variance">0.0000</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Max Probability:</div>
                <div class="stat-value" id="maxProb">—</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Spread Width:</div>
                <div class="stat-value" id="spread">—</div>
            </div>
            <div class="stat-item">
                <div class="stat-label">Regime:</div>
                <div class="stat-value" id="regime">—</div>
            </div>
        `;
        return statsGrid;
    }

    /**
     * Create comparison statistics grid
     */
    createComparisonStatistics(): HTMLElement {
        const comparisonStats = document.createElement('div');
        comparisonStats.id = 'comparisonSection';
        comparisonStats.style.display = 'none';
        comparisonStats.innerHTML = `
            <h3 style="margin-top: 20px; margin-bottom: 15px;">Classical Walk</h3>
            <div class="visualization" id="classicalVisualization"></div>
            <h3 style="margin-top: 20px; margin-bottom: 10px;">Comparison Statistics</h3>
            <div class="stats-grid">
                <div class="stat-item">
                    <div class="stat-label">Quantum σ² (∝ t²):</div>
                    <div class="stat-value" id="quantumVar">—</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Classical σ² (∝ t):</div>
                    <div class="stat-value" id="classicalVar">—</div>
                </div>
                <div class="stat-item">
                    <div class="stat-label">Quantum Advantage:</div>
                    <div class="stat-value" id="advantage">—</div>
                </div>
            </div>
        `;
        return comparisonStats;
    }

    /**
     * Create progress bar
     */
    createProgressBar(): HTMLElement {
        const progressContainer = document.createElement('div');
        progressContainer.id = 'progressSection';
        progressContainer.style.display = 'none';
        progressContainer.className = 'progress-container';
        progressContainer.innerHTML = `
            <div class="progress-header">
                <span id="progressLabel" class="progress-label">Running...</span>
                <span id="timeEstimate" class="progress-time">—</span>
            </div>
            <div class="progress-bar-bg">
                <div id="progressBar" class="progress-bar" style="width: 0%;">
                    <span id="progressPercent" class="progress-percent">0%</span>
                </div>
            </div>
        `;
        return progressContainer;
    }

    /**
     * Update statistics display
     */
    updateStatistics(data: QuantumWalk1DData, classicalData?: QuantumWalk1DData): void {
        // Update quantum statistics
        this.updateElement('currentStep', data.step.toString());
        this.updateElement('totalProb', data.totalProbability.toFixed(4));
        this.updateElement('com', data.centerOfMass.toFixed(2));
        this.updateElement('variance', data.variance.toFixed(4));
        this.updateElement('maxProb', data.maxProbability.toFixed(4));

        // Calculate and update spread
        const spread = this.calculateSpread(data);
        this.updateElement('spread', spread.toFixed(1));

        // Determine and update regime
        const regime = this.determineRegime(data);
        this.updateElement('regime', regime);

        // Update classical comparison if enabled
        if (classicalData) {
            this.updateElement('quantumVar', data.variance.toFixed(4));
            this.updateElement('classicalVar', classicalData.variance.toFixed(4));
            const advantage = classicalData.variance > 0 ? (data.variance / classicalData.variance) : 0;
            this.updateElement('advantage', advantage.toFixed(2) + 'x');
        }
    }

    /**
     * Update progress bar
     */
    updateProgress(progress: ProgressInfo): void {
        const progressBar = this.getElement('progressBar');
        const progressPercent = this.getElement('progressPercent');
        const progressLabel = this.getElement('progressLabel');
        const timeEstimate = this.getElement('timeEstimate');

        if (progressBar) {
            const clampedProgress = clampValue(progress.percent, 0, 100);
            progressBar.style.width = clampedProgress + '%';
        }
        
        if (progressPercent) {
            progressPercent.textContent = Math.round(clampValue(progress.percent, 0, 100)) + '%';
        }
        
        if (progressLabel) {
            progressLabel.textContent = progress.label;
        }

        if (timeEstimate && progress.secondsRemaining > 0) {
            let timeStr: string;
            if (progress.secondsRemaining < 60) {
                timeStr = `~${Math.round(progress.secondsRemaining)}s remaining`;
            } else {
                const mins = Math.floor(progress.secondsRemaining / 60);
                const secs = Math.round(progress.secondsRemaining % 60);
                timeStr = `~${mins}m ${secs}s remaining`;
            }
            timeEstimate.textContent = timeStr;
        }
    }

    /**
     * Update timeline slider
     */
    updateTimeline(currentStep: number, maxStep: number): void {
        const slider = this.getElement('timeSlider') as HTMLInputElement;
        const display = this.getElement('timeDisplay');

        if (slider) {
            slider.max = maxStep.toString();
            slider.value = currentStep.toString();
        }
        
        if (display) {
            display.textContent = `${currentStep}/${maxStep}`;
        }
    }

    /**
     * Get current UI state
     */
    getUIState(): UIState {
        return {
            latticeSize: parseInt(this.getInputValue('latticeSize') || '11'),
            numSteps: parseInt(this.getInputValue('numSteps') || '10'),
            coinType: (this.getInputValue('coinType') || 'hadamard') as any,
            boundaryType: (this.getInputValue('boundaryType') || 'reflecting') as any,
            theta: parseFloat(this.getInputValue('coinTheta') || '0.785398'),
            decoherenceP: parseFloat(this.getInputValue('decoherenceP') || '0'),
            ensembleSize: parseInt(this.getInputValue('ensembleSize') || '50'),
            compareClassical: this.getCheckboxValue('compareClassical'),
            classicalModel: (this.getInputValue('classicalModel') || 'simple') as any,
            persistenceQ: parseFloat(this.getInputValue('persistenceQ') || '0.9')
        };
    }

    /**
     * Helper methods
     */
    private updateElement(id: string, value: string): void {
        const element = this.getElement(id);
        if (element) element.textContent = value;
    }

    private getElement(id: string): HTMLElement | null {
        return this.container.querySelector(`#${id}`) || document.getElementById(id);
    }

    private getInputValue(id: string): string | null {
        const element = this.getElement(id) as HTMLInputElement;
        return element?.value || null;
    }

    private getCheckboxValue(id: string): boolean {
        const element = this.getElement(id) as HTMLInputElement;
        return element?.checked || false;
    }

    private calculateSpread(data: QuantumWalk1DData): number {
        const threshold = data.maxProbability * 0.1;
        let minSpread = data.centerOfMass;
        let maxSpread = data.centerOfMass;
        const latticeSize = data.probabilities.length;
        const x0 = (latticeSize - 1) / 2;

        for (let i = 0; i < latticeSize; i++) {
            if (data.probabilities[i].probability > threshold) {
                const x = i - x0;
                minSpread = Math.min(minSpread, x);
                maxSpread = Math.max(maxSpread, x);
            }
        }

        return maxSpread - minSpread;
    }

    private determineRegime(data: QuantumWalk1DData): string {
        const latticeSize = data.probabilities.length;
        const tBoundary = (latticeSize - 1) / 2;
        
        // This would need boundary type information for accurate determination
        // For now, using simple step-based logic
        if (data.step >= tBoundary) {
            return 'Boundary effects';
        } else if (data.step > tBoundary / 2) {
            return 'Mixed';
        } else {
            return 'Bulk';
        }
    }
}