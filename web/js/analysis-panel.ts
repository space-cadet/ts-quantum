/**
 * Analysis panel for quantum random walk analysis
 */

import { 
    AnalysisConfig, 
    ProgressInfo, 
    QuantumWalkSnapshot, 
    IAnalyzer 
} from './core/types.ts';
import { VarianceGrowthAnalyzer } from './analysis/variance-analyzer.ts';
import { DistributionAnalyzer, DistributionAnalysis } from './analysis/distribution-analyzer.ts';
import { CustomQuantumWalk } from './quantum-walks/custom-walk.ts';
import { SimpleClassicalWalk } from './classical-walks/simple-walk.ts';
import { PersistentClassicalWalk } from './classical-walks/persistent-walk.ts';

export class AnalysisPanel {
    private container: HTMLElement;
    private varianceAnalyzer: VarianceGrowthAnalyzer;
    private distributionAnalyzer: DistributionAnalyzer;
    private isRunning: boolean = false;

    constructor(container: HTMLElement) {
        this.container = container;
        this.varianceAnalyzer = new VarianceGrowthAnalyzer();
        this.distributionAnalyzer = new DistributionAnalyzer();
    }

    /**
     * Create analysis panel UI
     */
    createPanel(): HTMLElement {
        const panel = document.createElement('div');
        panel.innerHTML = `
            <div class="control-group" style="margin-bottom: 20px;">
                <label>Analysis Type:</label>
                <select id="analysisType">
                    <option value="variance-growth">Variance Growth (Quantum vs Classical)</option>
                    <option value="distribution-snapshot">Distribution Snapshots</option>
                    <option value="classical-limit">Classical Limit Behavior</option>
                </select>
            </div>

            <button onclick="runAnalysis()" id="analysisBtn">Generate Analysis</button>

            <div id="progressSection" style="display: none; margin-top: 20px;">
                <div class="progress-header">
                    <span id="progressLabel" class="progress-label">Running...</span>
                    <span id="timeEstimate" class="progress-time">—</span>
                </div>
                <div class="progress-bar-bg">
                    <div id="progressBar" class="progress-bar" style="width: 0%;">
                        <span id="progressPercent" class="progress-percent">0%</span>
                    </div>
                </div>
            </div>

            <div id="analysisResults"></div>

            <div class="equation">
                $$\\sigma^2_{\\text{quantum}}(t) \\propto t^2 \\quad \\text{vs} \\quad \\sigma^2_{\\text{classical}}(t) \\propto t$$
            </div>
        `;

        // Make runAnalysis globally accessible
        (window as any).runAnalysis = () => this.runAnalysis();

        return panel;
    }

    /**
     * Run analysis based on selected type
     */
    async runAnalysis(): Promise<void> {
        try {
            if (this.isRunning) return;

            const config = this.getAnalysisConfig();
            this.validateConfig(config);

            this.isRunning = true;
            this.updateButtonStates(true);
            this.showProgress(true);

            const analysisType = document.getElementById('analysisType') as HTMLSelectElement;
            const selectedType = analysisType?.value;

            const startTime = performance.now();

            switch (selectedType) {
                case 'variance-growth':
                    await this.runVarianceGrowthAnalysis(config, startTime);
                    break;
                case 'distribution-snapshot':
                    await this.runDistributionSnapshotAnalysis(config, startTime);
                    break;
                case 'classical-limit':
                    await this.runClassicalLimitAnalysis(config, startTime);
                    break;
                default:
                    throw new Error('Unknown analysis type');
            }

        } catch (error) {
            this.handleError(error);
        } finally {
            this.isRunning = false;
            this.updateButtonStates(false);
            this.showProgress(false);
        }
    }

    /**
     * Run variance growth analysis
     */
    private async runVarianceGrowthAnalysis(config: AnalysisConfig, startTime: number): Promise<void> {
        // Phase 1: Quantum walk
        this.updateProgress(0, 'Quantum Walk Evolution', 0);
        const quantumResult = await this.runQuantumWalkWithProgress(config, 1, 2, startTime);

        // Phase 2: Classical walk
        this.updateProgress(50, 'Classical Walk Evolution', 0);
        const classicalResult = await this.runClassicalWalkWithProgress(config, 2, 2, startTime);

        // Analyze results
        const analysis = this.varianceAnalyzer.analyze(quantumResult.history, classicalResult.history);
        this.displayVarianceGrowthResults(analysis);
    }

    /**
     * Run distribution snapshot analysis
     */
    private async runDistributionSnapshotAnalysis(config: AnalysisConfig, startTime: number): Promise<void> {
        this.updateProgress(0, 'Distribution Analysis', 0);
        const quantumResult = await this.runQuantumWalkWithProgress(config, 1, 1, startTime);

        const analysis = this.distributionAnalyzer.analyze(quantumResult.history);
        this.displayDistributionSnapshotResults(analysis);
    }

    /**
     * Run classical limit analysis
     */
    private async runClassicalLimitAnalysis(config: AnalysisConfig, startTime: number): Promise<void> {
        // Phase 1: Quantum walk
        this.updateProgress(0, 'Quantum Walk Evolution', 0);
        const quantumResult = await this.runQuantumWalkWithProgress(config, 1, 2, startTime);

        // Phase 2: Classical walk
        this.updateProgress(50, 'Classical Walk Evolution', 0);
        const classicalResult = await this.runClassicalWalkWithProgress(config, 2, 2, startTime);

        this.displayClassicalLimitResults(quantumResult.history, classicalResult.history);
    }

    /**
     * Run quantum walk with progress updates
     */
    private async runQuantumWalkWithProgress(
        config: AnalysisConfig, 
        phase: number, 
        totalPhases: number, 
        startTime: number
    ): Promise<{ final: any; history: QuantumWalkSnapshot[] }> {
        const quantumWalk = new CustomQuantumWalk();
        quantumWalk.initialize(config.latticeSize, 'hadamard', 'reflecting', Math.PI / 4);
        
        const history: QuantumWalkSnapshot[] = [];
        history.push({ step: 0, data: quantumWalk.getState() });

        for (let i = 0; i < config.maxSteps; i++) {
            quantumWalk.step();
            history.push({ step: i + 1, data: quantumWalk.getState() });

            // Update progress
            const totalStepsSoFar = (phase - 1) * config.maxSteps + (i + 1);
            const totalStepsNeeded = totalPhases * config.maxSteps;
            const progress = (totalStepsSoFar / totalStepsNeeded) * 100;

            const elapsed = (performance.now() - startTime) / 1000;
            const rate = totalStepsSoFar > 0 ? totalStepsSoFar / elapsed : 0;
            const remaining = rate > 0 ? (totalStepsNeeded - totalStepsSoFar) / rate : 0;

            this.updateProgress(progress, `Quantum Walk (${i + 1}/${config.maxSteps})`, remaining);
            await this.delay(0); // Allow UI to update
        }

        return { final: history[history.length - 1].data, history };
    }

    /**
     * Run classical walk with progress updates
     */
    private async runClassicalWalkWithProgress(
        config: AnalysisConfig, 
        phase: number, 
        totalPhases: number, 
        startTime: number
    ): Promise<{ final: any; history: QuantumWalkSnapshot[] }> {
        const classicalWalk = new SimpleClassicalWalk();
        classicalWalk.initialize(config.latticeSize);
        
        const history: QuantumWalkSnapshot[] = [];
        history.push({ step: 0, data: classicalWalk.getState() });

        for (let i = 0; i < config.maxSteps; i++) {
            classicalWalk.step();
            history.push({ step: i + 1, data: classicalWalk.getState() });

            // Update progress
            const totalStepsSoFar = (phase - 1) * config.maxSteps + (i + 1);
            const totalStepsNeeded = totalPhases * config.maxSteps;
            const progress = (totalStepsSoFar / totalStepsNeeded) * 100;

            const elapsed = (performance.now() - startTime) / 1000;
            const rate = totalStepsSoFar > 0 ? totalStepsSoFar / elapsed : 0;
            const remaining = rate > 0 ? (totalStepsNeeded - totalStepsSoFar) / rate : 0;

            this.updateProgress(progress, `Classical Walk (${i + 1}/${config.maxSteps})`, remaining);
            await this.delay(0); // Allow UI to update
        }

        return { final: history[history.length - 1].data, history };
    }

    /**
     * Display variance growth results
     */
    private displayVarianceGrowthResults(analysis: any[]): void {
        const resultsDiv = document.getElementById('analysisResults');
        if (!resultsDiv) return;

        let html = `
            <h3 style="margin-top: 20px; margin-bottom: 15px;">Variance Growth Analysis</h3>
            <table class="analysis-table">
                <thead>
                    <tr>
                        <th>Step</th>
                        <th>Quantum σ² (∝ t²)</th>
                        <th>Classical σ² (∝ t)</th>
                        <th>Advantage Factor</th>
                        <th>Scaling Regime</th>
                    </tr>
                </thead>
                <tbody>
        `;

        // Sample results for display (show every 10th or max 10 entries)
        const sampleSize = Math.min(10, analysis.length);
        const stepSize = Math.max(1, Math.floor(analysis.length / sampleSize));

        for (let i = 0; i < analysis.length; i += stepSize) {
            const a = analysis[i];
            const regime = this.varianceAnalyzer.determineScalingRegime(a.step, analysis.length);

            html += `
                <tr>
                    <td>${a.step}</td>
                    <td>${a.quantumVariance.toFixed(4)}</td>
                    <td>${a.classicalVariance.toFixed(4)}</td>
                    <td>${a.advantage.toFixed(3)}x</td>
                    <td>${regime}</td>
                </tr>
            `;
        }

        html += `
                </tbody>
            </table>
            <div class="legend">
                <div class="legend-item"><span class="legend-term">σ²</span> = variance (spread width squared)</div>
                <div class="legend-item"><span class="legend-term">∝ t²</span> = proportional to time squared (quantum walks)</div>
                <div class="legend-item"><span class="legend-term">∝ t</span> = proportional to time (classical walks)</div>
                <div class="legend-item"><span class="legend-term">Advantage Factor</span> = quantum variance ÷ classical variance</div>
                <div class="legend-item"><span class="legend-term">Scaling Regime</span> = which physical regime applies at this step</div>
            </div>
        `;

        resultsDiv.innerHTML = html;
    }

    /**
     * Display distribution snapshot results
     */
    private displayDistributionSnapshotResults(analysis: DistributionAnalysis): void {
        const resultsDiv = document.getElementById('analysisResults');
        if (!resultsDiv) return;

        let html = '<h3 style="margin-top: 20px; margin-bottom: 15px;">Distribution Snapshots</h3>';

        for (const snapshot of analysis.snapshots) {
            const maxProb = snapshot.maxProbability;

            html += `
                <div style="margin-bottom: 20px; padding: 15px; background: var(--bg-secondary); border-radius: 4px;">
                    <h4 style="margin-bottom: 10px;">Step ${snapshot.step} (COM: ${snapshot.centerOfMass.toFixed(2)}, σ²: ${snapshot.variance.toFixed(4)})</h4>
            `;

            for (let i = 0; i < snapshot.distribution.length; i++) {
                const prob = snapshot.distribution[i].probability;
                if (prob > 0.01) {
                    const barLen = Math.round((prob / maxProb) * 40);
                    html += `<div>Pos ${i.toString().padStart(2)}: ${'█'.repeat(barLen)} ${prob.toFixed(4)}</div>`;
                }
            }

            html += `</div>`;
        }

        resultsDiv.innerHTML = html;
    }

    /**
     * Display classical limit results
     */
    private displayClassicalLimitResults(quantumHistory: QuantumWalkSnapshot[], classicalHistory: QuantumWalkSnapshot[]): void {
        const resultsDiv = document.getElementById('analysisResults');
        if (!resultsDiv) return;

        const finalQ = quantumHistory[quantumHistory.length - 1].data;
        const finalC = classicalHistory[classicalHistory.length - 1].data;

        let html = `
            <h3 style="margin-top: 20px; margin-bottom: 15px;">Classical Limit Behavior Analysis</h3>
            <table class="analysis-table">
                <thead>
                    <tr>
                        <th>Parameter</th>
                        <th>Quantum Walk</th>
                        <th>Classical Walk</th>
                        <th>Ratio (Q/C)</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Center of Mass</strong></td>
                        <td>${finalQ.centerOfMass.toFixed(4)}</td>
                        <td>${finalC.centerOfMass.toFixed(4)}</td>
                        <td>${(finalQ.centerOfMass / finalC.centerOfMass).toFixed(4)}</td>
                    </tr>
                    <tr>
                        <td><strong>Variance (σ²)</strong></td>
                        <td>${finalQ.variance.toFixed(4)}</td>
                        <td>${finalC.variance.toFixed(4)}</td>
                        <td>${(finalQ.variance / finalC.variance).toFixed(4)}</td>
                    </tr>
                    <tr>
                        <td><strong>Max Probability</strong></td>
                        <td>${finalQ.maxProbability.toFixed(4)}</td>
                        <td>${finalC.maxProbability.toFixed(4)}</td>
                        <td>${(finalQ.maxProbability / finalC.maxProbability).toFixed(4)}</td>
                    </tr>
                </tbody>
            </table>
            <div class="legend">
                <div class="legend-item"><span class="legend-term">Center of Mass</span> = average position of the wave packet</div>
                <div class="legend-item"><span class="legend-term">Variance (σ²)</span> = width of distribution (quantum ∝ t², classical ∝ t)</div>
                <div class="legend-item"><span class="legend-term">Max Probability</span> = peak probability value in distribution</div>
                <div class="legend-item"><span class="legend-term">Ratio</span> = quantum value divided by classical value (>1 = quantum advantage)</div>
            </div>
        `;

        resultsDiv.innerHTML = html;
    }

    /**
     * Update progress display
     */
    private updateProgress(percent: number, label: string, secondsRemaining: number): void {
        const progressBar = document.getElementById('progressBar') as HTMLElement;
        const progressPercent = document.getElementById('progressPercent') as HTMLElement;
        const progressLabel = document.getElementById('progressLabel') as HTMLElement;
        const timeEstimate = document.getElementById('timeEstimate') as HTMLElement;

        if (progressBar) {
            progressBar.style.width = Math.min(100, Math.max(0, percent)) + '%';
        }
        
        if (progressPercent) {
            progressPercent.textContent = Math.round(Math.min(100, Math.max(0, percent))) + '%';
        }
        
        if (progressLabel) {
            progressLabel.textContent = label;
        }

        if (timeEstimate && secondsRemaining > 0) {
            let timeStr: string;
            if (secondsRemaining < 60) {
                timeStr = `~${Math.round(secondsRemaining)}s remaining`;
            } else {
                const mins = Math.floor(secondsRemaining / 60);
                const secs = Math.round(secondsRemaining % 60);
                timeStr = `~${mins}m ${secs}s remaining`;
            }
            timeEstimate.textContent = timeStr;
        }
    }

    /**
     * Show/hide progress section
     */
    private showProgress(show: boolean): void {
        const progressSection = document.getElementById('progressSection');
        if (progressSection) {
            progressSection.style.display = show ? 'block' : 'none';
        }
    }

    /**
     * Update button states
     */
    private updateButtonStates(disabled: boolean): void {
        const analysisBtn = document.getElementById('analysisBtn') as HTMLButtonElement;
        if (analysisBtn) {
            analysisBtn.disabled = disabled;
        }
    }

    /**
     * Get analysis configuration
     */
    private getAnalysisConfig(): AnalysisConfig {
        const analysisType = document.getElementById('analysisType') as HTMLSelectElement;
        const latticeSize = parseInt((document.getElementById('latticeSize') as HTMLInputElement)?.value || '11');
        const maxSteps = parseInt((document.getElementById('numSteps') as HTMLInputElement)?.value || '10');

        return {
            type: (analysisType?.value || 'variance-growth') as any,
            latticeSize,
            maxSteps
        };
    }

    /**
     * Validate configuration
     */
    private validateConfig(config: AnalysisConfig): void {
        if (config.latticeSize < 5 || config.latticeSize > 31) {
            throw new Error('Lattice size must be between 5 and 31');
        }
        if (config.maxSteps < 1 || config.maxSteps > 100) {
            throw new Error('Steps must be between 1 and 100');
        }
    }

    /**
     * Handle errors
     */
    private handleError(error: unknown): void {
        const message = error instanceof Error ? error.message : 'Unknown error occurred';
        alert('Analysis Error: ' + message);
    }

    /**
     * Delay utility
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}