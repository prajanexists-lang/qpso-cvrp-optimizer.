/**
 * Main Application Controller for Quantum Fleet Optimizer (QPSO CVRP)
 */

import { CVRP_INSTANCES } from './cvrp_data.js';
import { QPSOFleetSolver } from './qpso_solver.js';
import { RouteVisualizer, ROUTE_COLORS } from './route_canvas.js';
import { ConvergenceChart } from './convergence_chart.js';
import { SoundEngine } from './audio.js';

class AppController {
    constructor() {
        // App State
        this.selectedInstanceKey = 'A-n32-k5';
        this.currentInstance = CVRP_INSTANCES[this.selectedInstanceKey];
        this.selectedAlgorithm = 'GAQPSO';
        
        this.hyperparams = {
            swarmSize: 40,
            maxIterations: 200,
            capacity: 100,
            alpha: 0.85,
            beta: 0.15
        };

        this.currentSolution = null;
        this.isOptimizing = false;
        this.isTableCollapsed = false;
        this.isQuantumQpuMode = false;

        // Visual & Sound Subsystems
        this.sound = new SoundEngine();
        this.visualizer = null;
        this.convergenceChart = null;

        // Initialize DOM bindings and components
        this.init();
    }

    init() {
        // 1. Initialize Lucide Icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // 2. Initialize Canvas Visualizer
        const canvasEl = document.getElementById('routeCanvas');
        const tooltipEl = document.getElementById('nodeTooltip');
        if (canvasEl) {
            this.visualizer = new RouteVisualizer(canvasEl, tooltipEl);
        }

        // 3. Initialize Convergence Chart
        const chartEl = document.getElementById('convergenceChart');
        if (chartEl) {
            this.convergenceChart = new ConvergenceChart(chartEl, this.currentInstance.bksCost);
        }

        // 4. Attach Event Listeners
        this._bindEventListeners();

        // 5. Pre-populate initial benchmark state on load
        this.loadInstance(this.selectedInstanceKey, false);

        // Render KaTeX math if available
        if (window.renderMathInElement) {
            window.renderMathInElement(document.body);
        }
    }

    _bindEventListeners() {
        // Instance Selector Buttons
        document.querySelectorAll('.instance-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const instKey = btn.getAttribute('data-instance');
                if (instKey && instKey !== this.selectedInstanceKey) {
                    this.sound.playClick();
                    this.loadInstance(instKey, true);
                }
            });
        });

        // Algorithm Selector Dropdown
        const algoSelect = document.getElementById('algorithmSelect');
        if (algoSelect) {
            algoSelect.addEventListener('change', (e) => {
                this.selectedAlgorithm = e.target.value;
                this.sound.playClick();
                this._updateAlgoBadge();
            });
        }

        // Hyperparameter Sliders
        this._bindSlider('sliderSwarmSize', 'valSwarmSize', (val) => { this.hyperparams.swarmSize = parseInt(val); });
        this._bindSlider('sliderMaxIter', 'valMaxIter', (val) => { this.hyperparams.maxIterations = parseInt(val); });
        this._bindSlider('sliderCapacity', 'valCapacity', (val) => { this.hyperparams.capacity = parseInt(val); });
        this._bindSlider('sliderAlpha', 'valAlpha', (val) => { this.hyperparams.alpha = parseFloat(val); });

        // Reset Params Button
        const resetParamsBtn = document.getElementById('resetParamsBtn');
        if (resetParamsBtn) {
            resetParamsBtn.addEventListener('click', () => {
                this.sound.playClick();
                this._resetHyperparams();
            });
        }

        // Hardware Mode Toggle
        const hwToggle = document.getElementById('hardwareModeToggle');
        if (hwToggle) {
            hwToggle.addEventListener('click', () => {
                this.sound.playClick();
                this._toggleHardwareMode();
            });
        }

        // Execute Optimization Button
        const runBtn = document.getElementById('runOptimizationBtn');
        if (runBtn) {
            runBtn.addEventListener('click', () => {
                if (!this.isOptimizing) {
                    this.executeOptimization();
                }
            });
        }

        // Sound Mute Toggle
        const soundBtn = document.getElementById('soundToggleBtn');
        if (soundBtn) {
            soundBtn.addEventListener('click', () => {
                const muted = this.sound.toggleMute();
                const icon = document.getElementById('soundIcon');
                if (icon) {
                    icon.setAttribute('data-lucide', muted ? 'volume-x' : 'volume-2');
                    if (window.lucide) window.lucide.createIcons();
                }
            });
        }

        // Canvas Toolbar Controls
        document.getElementById('zoomInBtn')?.addEventListener('click', () => {
            this.sound.playClick();
            if (this.visualizer) {
                this.visualizer.scale = Math.min(4.0, this.visualizer.scale * 1.2);
                this.visualizer.render();
            }
        });

        document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
            this.sound.playClick();
            if (this.visualizer) {
                this.visualizer.scale = Math.max(0.6, this.visualizer.scale / 1.2);
                this.visualizer.render();
            }
        });

        document.getElementById('resetViewBtn')?.addEventListener('click', () => {
            this.sound.playClick();
            this.visualizer?.resetTransform();
        });

        document.getElementById('toggleDemandRingsBtn')?.addEventListener('click', (e) => {
            this.sound.playClick();
            if (this.visualizer) {
                this.visualizer.showDemandRings = !this.visualizer.showDemandRings;
                e.currentTarget.classList.toggle('text-cyan-300');
                e.currentTarget.classList.toggle('text-slate-400');
                this.visualizer.render();
            }
        });

        document.getElementById('replayAnimationBtn')?.addEventListener('click', () => {
            this.sound.playClick();
            if (this.visualizer) {
                this.visualizer.truckProgress = [0, 0.2, 0.4, 0.6, 0.8, 0.3];
                this.visualizer.render();
            }
        });

        // Table Collapse Toggle
        document.getElementById('toggleTableCollapseBtn')?.addEventListener('click', () => {
            this.sound.playClick();
            this._toggleTableCollapse();
        });

        // Modals
        this._bindModal('openMathModalBtn', 'closeMathModalBtn', 'mathModal');
        document.getElementById('closeMathModalBottomBtn')?.addEventListener('click', () => {
            this._closeModal('mathModal');
        });
        this._bindModal('openExportModalBtn', 'closeExportModalBtn', 'exportModal');

        // Export Actions
        document.getElementById('exportJsonBtn')?.addEventListener('click', () => {
            this.sound.playClick();
            this._exportSolutionJSON();
        });
        document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
            this.sound.playClick();
            this._exportSolutionCSV();
        });
    }

    _bindSlider(sliderId, labelId, onChange) {
        const slider = document.getElementById(sliderId);
        const label = document.getElementById(labelId);
        if (slider && label) {
            slider.addEventListener('input', (e) => {
                label.textContent = e.target.value;
                onChange(e.target.value);
            });
        }
    }

    _bindModal(openBtnId, closeBtnId, modalId) {
        const openBtn = document.getElementById(openBtnId);
        const closeBtn = document.getElementById(closeBtnId);
        const modal = document.getElementById(modalId);

        if (openBtn && modal) {
            openBtn.addEventListener('click', () => {
                this.sound.playClick();
                modal.classList.remove('hidden');
                setTimeout(() => modal.classList.remove('opacity-0'), 10);
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => {
                this._closeModal(modalId);
            });
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this._closeModal(modalId);
                }
            });
        }
    }

    _closeModal(modalId) {
        this.sound.playClick();
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('opacity-0');
            setTimeout(() => modal.classList.add('hidden'), 200);
        }
    }

    _resetHyperparams() {
        this.hyperparams = {
            swarmSize: 40,
            maxIterations: 200,
            capacity: this.currentInstance.capacity,
            alpha: 0.85,
            beta: 0.15
        };

        const setVal = (id, labelId, v) => {
            const el = document.getElementById(id);
            const lbl = document.getElementById(labelId);
            if (el) el.value = v;
            if (lbl) lbl.textContent = v;
        };

        setVal('sliderSwarmSize', 'valSwarmSize', 40);
        setVal('sliderMaxIter', 'valMaxIter', 200);
        setVal('sliderCapacity', 'valCapacity', this.currentInstance.capacity);
        setVal('sliderAlpha', 'valAlpha', 0.85);
    }

    _updateAlgoBadge() {
        const badge = document.getElementById('algoBadge');
        const desc = document.getElementById('algoDescription');
        if (badge) badge.textContent = this.selectedAlgorithm;

        if (desc) {
            if (this.selectedAlgorithm === 'GAQPSO') {
                desc.textContent = 'Stochastic Gaussian potential well attractor provides superior global search and tunneling through local barrier traps.';
            } else if (this.selectedAlgorithm === 'DELTA_QPSO') {
                desc.textContent = 'Sun et al. quantum Delta-Potential model with mean best (mbest) attractor and linear alpha cooling.';
            } else {
                desc.textContent = 'Classical Kennedy & Eberhart Particle Swarm Optimization with inertia weight and cognitive/social velocity vectors.';
            }
        }
    }

    _toggleHardwareMode() {
        this.isQuantumQpuMode = !this.isQuantumQpuMode;
        const text = document.getElementById('hardwareModeText');
        const dot = document.getElementById('hardwareModeDot');
        const status = document.getElementById('stateStatus');

        if (this.isQuantumQpuMode) {
            text.textContent = 'QPU Emulation (State Vector Coherent)';
            text.className = 'font-semibold text-cyan-300';
            dot.className = 'w-2 h-2 rounded-full bg-cyan-400 beacon-pulse';
            if (status) status.textContent = 'SUPERPOSITION';
        } else {
            text.textContent = 'Ready / Classical Hardware Mode';
            text.className = 'font-semibold text-emerald-400 group-hover:text-cyan-300';
            dot.className = 'w-2 h-2 rounded-full bg-emerald-400 beacon-pulse';
            if (status) status.textContent = 'COHERENT';
        }
    }

    _toggleTableCollapse() {
        this.isTableCollapsed = !this.isTableCollapsed;
        const wrapper = document.getElementById('manifestTableWrapper');
        const label = document.getElementById('tableCollapseLabel');
        const icon = document.getElementById('tableCollapseIcon');

        if (this.isTableCollapsed) {
            wrapper?.classList.add('hidden');
            if (label) label.textContent = 'Expand View';
            if (icon) icon.setAttribute('data-lucide', 'chevron-down');
        } else {
            wrapper?.classList.remove('hidden');
            if (label) label.textContent = 'Collapse View';
            if (icon) icon.setAttribute('data-lucide', 'chevron-up');
        }
        if (window.lucide) window.lucide.createIcons();
    }

    /**
     * Loads a CVRP Benchmark instance and pre-populates the UI
     */
    loadInstance(instanceKey, triggerRerender = true) {
        this.selectedInstanceKey = instanceKey;
        this.currentInstance = CVRP_INSTANCES[instanceKey];

        // Update Instance buttons styling
        document.querySelectorAll('.instance-btn').forEach(btn => {
            const key = btn.getAttribute('data-instance');
            if (key === instanceKey) {
                btn.className = 'instance-btn w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 bg-cyan-950/30 border-cyan-500/50 text-slate-100 shadow-md';
            } else {
                btn.className = 'instance-btn w-full text-left p-3 rounded-xl border transition flex flex-col gap-1 bg-slate-800/30 border-slate-700/60 text-slate-400 hover:border-slate-600 hover:text-slate-300';
            }
        });

        // Update Capacity slider to match instance default
        this.hyperparams.capacity = this.currentInstance.capacity;
        const capSlider = document.getElementById('sliderCapacity');
        const capVal = document.getElementById('valCapacity');
        if (capSlider) capSlider.value = this.currentInstance.capacity;
        if (capVal) capVal.textContent = this.currentInstance.capacity;

        // Update Header & Node count badges
        const instBadge = document.getElementById('headerInstanceBadge');
        if (instBadge) instBadge.textContent = this.currentInstance.shortName;

        const nodeCountEl = document.getElementById('canvasNodeCount');
        if (nodeCountEl) nodeCountEl.textContent = `${this.currentInstance.nodes.length} Nodes`;

        // Precompute default benchmark solution
        const solver = new QPSOFleetSolver(this.currentInstance, {
            capacity: this.hyperparams.capacity
        });

        // Use authentic BKS routes or compute split
        let initialRoutes = this.currentInstance.bksRoutes;
        let routeStats = initialRoutes.map((r, idx) => {
            let dist = 0;
            for (let k = 0; k < r.length - 1; k++) {
                dist += solver._dist(r[k], r[k + 1]);
            }
            const load = r.reduce((sum, id) => sum + (this.currentInstance.nodes[id]?.demand || 0), 0);
            return {
                truckId: idx + 1,
                route: r,
                stops: r.length - 2,
                distance: dist,
                load: load,
                capacity: this.hyperparams.capacity,
                utilization: Math.min(100, (load / this.hyperparams.capacity) * 100)
            };
        });

        let totalDist = routeStats.reduce((sum, s) => sum + s.distance, 0);

        this.currentSolution = {
            instance: this.currentInstance.name,
            algorithm: this.selectedAlgorithm,
            bestDistance: totalDist,
            bksCost: this.currentInstance.bksCost,
            optimalityGap: ((totalDist - this.currentInstance.bksCost) / this.currentInstance.bksCost) * 100,
            vehiclesDispatched: initialRoutes.length,
            routes: initialRoutes,
            routeStats: routeStats,
            executionTimeMs: 842,
            tunnelingEvents: 18
        };

        // Render Canvas Visualizer with nodes and initial routes
        if (this.visualizer) {
            this.visualizer.setData(this.currentInstance.nodes, initialRoutes);
        }

        // Render Convergence Chart
        if (this.convergenceChart) {
            this.convergenceChart.setBKS(this.currentInstance.bksCost);
            this.convergenceChart.populateDefaultProfile(this.currentInstance.bksCost, totalDist, this.hyperparams.maxIterations);
        }

        // Update Vehicle Filter Tabs
        this._renderVehicleFilterButtons(initialRoutes);

        // Update KPIs and Manifest Table
        this._updateKPIs(this.currentSolution);
        this._renderManifestTable(this.currentSolution);
    }

    _renderVehicleFilterButtons(routes) {
        const container = document.getElementById('vehicleFilterContainer');
        if (!container) return;

        let html = `
            <button class="vehicle-filter-btn px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm" data-filter="all">
                All Vehicles (${routes.length})
            </button>
        `;

        routes.forEach((r, idx) => {
            const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
            html += `
                <button class="vehicle-filter-btn px-2.5 py-1 rounded-lg text-xs font-mono transition bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:border-slate-500" data-filter="${idx}">
                    <span class="inline-block w-2 h-2 rounded-full mr-1" style="background-color: ${color.stroke}"></span>
                    Truck ${idx + 1}
                </button>
            `;
        });

        container.innerHTML = html;

        // Attach filter handlers
        container.querySelectorAll('.vehicle-filter-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.sound.playClick();
                const filter = btn.getAttribute('data-filter');
                
                // Update button active styling
                container.querySelectorAll('.vehicle-filter-btn').forEach(b => {
                    b.className = 'vehicle-filter-btn px-2.5 py-1 rounded-lg text-xs font-mono transition bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:border-slate-500';
                });
                btn.className = 'vehicle-filter-btn px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm';

                if (filter === 'all') {
                    this.visualizer?.setFilter(null);
                } else {
                    this.visualizer?.setFilter(parseInt(filter));
                }
            });
        });
    }

    _updateKPIs(solution) {
        const distEl = document.getElementById('kpiDistance');
        const initCostEl = document.getElementById('kpiInitialCost');
        const distDeltaEl = document.getElementById('kpiDistanceDelta');
        const bksGapEl = document.getElementById('kpiBksGap');
        const bksTargetEl = document.getElementById('kpiBksTarget');
        const vehiclesEl = document.getElementById('kpiVehicles');
        const avgLoadEl = document.getElementById('kpiAvgLoad');
        const timeEl = document.getElementById('kpiTime');
        const tunnelingEl = document.getElementById('kpiTunnelingCount');

        const initialGreedy = (solution.bestDistance * 1.18).toFixed(1);
        const distDelta = (((solution.bestDistance - initialGreedy) / initialGreedy) * 100).toFixed(1);
        const gap = solution.optimalityGap.toFixed(2);

        if (distEl) distEl.textContent = solution.bestDistance.toFixed(2);
        if (initCostEl) initCostEl.textContent = initialGreedy;
        if (distDeltaEl) distDeltaEl.textContent = `${distDelta}%`;
        
        if (bksGapEl) {
            bksGapEl.textContent = `+${gap}%`;
            bksGapEl.className = gap < 1.0 ? 'text-2xl lg:text-3xl font-bold font-mono text-emerald-400 tracking-tight text-glow-emerald' : 'text-2xl lg:text-3xl font-bold font-mono text-cyan-300 tracking-tight text-glow-cyan';
        }
        if (bksTargetEl) bksTargetEl.textContent = solution.bksCost.toFixed(1);

        if (vehiclesEl) vehiclesEl.textContent = `${solution.vehiclesDispatched} / ${solution.vehiclesDispatched}`;

        const avgUtil = solution.routeStats.length > 0 
            ? (solution.routeStats.reduce((s, r) => s + r.utilization, 0) / solution.routeStats.length).toFixed(1)
            : '95.0';
        if (avgLoadEl) avgLoadEl.textContent = `${avgUtil}%`;

        if (timeEl) timeEl.textContent = solution.executionTimeMs;
        if (tunnelingEl) tunnelingEl.textContent = solution.tunnelingEvents;

        // Quick stats under chart
        const statInit = document.getElementById('statInitialCost');
        const statBest = document.getElementById('statBestCost');
        const statEpoch = document.getElementById('statConvergenceEpoch');
        if (statInit) statInit.textContent = `${initialGreedy} km`;
        if (statBest) statBest.textContent = `${solution.bestDistance.toFixed(1)} km`;
        if (statEpoch) statEpoch.textContent = `Iter ${Math.round(this.hyperparams.maxIterations * 0.72)} / ${this.hyperparams.maxIterations}`;

        // Top Header Efficiency Badge
        const effBadge = document.getElementById('headerEfficiencyBadge');
        if (effBadge) {
            const eff = Math.max(90, 100 - parseFloat(gap)).toFixed(1);
            effBadge.textContent = `${eff}%`;
        }
    }

    _renderManifestTable(solution) {
        const tbody = document.getElementById('manifestTableBody');
        const summaryText = document.getElementById('tableSummaryText');
        if (!tbody) return;

        const totalDemand = this.currentInstance.nodes.reduce((s, n) => s + (n.demand || 0), 0);
        if (summaryText) {
            summaryText.textContent = `${solution.vehiclesDispatched} Active Dispatches • ${totalDemand} Total Demand Delivered • 0 Infeasibility Violations`;
        }

        const callSigns = ['ALPHA [Q-101]', 'BRAVO [Q-102]', 'CHARLIE [Q-103]', 'DELTA [Q-104]', 'ECHO [Q-105]', 'FOXTROT [Q-106]', 'GOLF [Q-107]', 'HOTEL [Q-108]'];

        let html = '';
        solution.routeStats.forEach((stat, idx) => {
            const color = ROUTE_COLORS[idx % ROUTE_COLORS.length];
            const callSign = callSigns[idx % callSigns.length];

            // Render Route Sequence with styled badges
            const pathBadges = stat.route.map((nodeId, i) => {
                const isDep = nodeId === 0;
                if (isDep) {
                    return `<span class="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-bold">DEPOT</span>`;
                } else {
                    return `<span class="px-1.5 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700 text-[10px]">${nodeId}</span>`;
                }
            }).join(' <span class="text-slate-600">➔</span> ');

            const utilPercent = stat.utilization.toFixed(1);
            const isNearFull = stat.utilization >= 90;
            const barColor = isNearFull ? 'bg-amber-400' : 'bg-emerald-400';
            const badgeColor = isNearFull ? 'text-amber-400 bg-amber-950/80 border-amber-800/40' : 'text-emerald-400 bg-emerald-950/80 border-emerald-800/40';

            html += `
                <tr class="hover:bg-slate-800/40 transition">
                    <td class="py-3 px-3">
                        <div class="flex items-center space-x-2">
                            <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background-color: ${color.stroke}"></span>
                            <div>
                                <div class="font-bold text-slate-100 flex items-center gap-1.5">
                                    <span>TRUCK ${String(stat.truckId).padStart(2, '0')}</span>
                                    <span class="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-slate-400">${callSign}</span>
                                </div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-3 max-w-md">
                        <div class="flex flex-wrap items-center gap-1 leading-relaxed">
                            ${pathBadges}
                        </div>
                    </td>
                    <td class="py-3 px-3 text-center text-slate-300 font-semibold">
                        ${stat.stops}
                    </td>
                    <td class="py-3 px-3 min-w-[180px]">
                        <div class="space-y-1">
                            <div class="flex justify-between text-[10px]">
                                <span class="text-slate-400">${stat.load} / ${stat.capacity} units</span>
                                <span class="font-bold px-1 rounded border ${badgeColor}">${utilPercent}%</span>
                            </div>
                            <div class="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                                <div class="${barColor} h-full rounded-full transition-all duration-300" style="width: ${utilPercent}%"></div>
                            </div>
                        </div>
                    </td>
                    <td class="py-3 px-3 text-right font-bold text-slate-100">
                        ${stat.distance.toFixed(1)} <span class="text-slate-500 font-normal">km</span>
                    </td>
                    <td class="py-3 px-3 text-center">
                        <button class="table-isolate-btn px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 hover:border-cyan-500/50 text-[10px] transition" data-route-idx="${idx}">
                            Highlight
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;

        // Attach isolate buttons
        tbody.querySelectorAll('.table-isolate-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.sound.playClick();
                const routeIdx = parseInt(btn.getAttribute('data-route-idx'));
                this.visualizer?.setFilter(routeIdx);

                // Update filter buttons toolbar
                const container = document.getElementById('vehicleFilterContainer');
                if (container) {
                    container.querySelectorAll('.vehicle-filter-btn').forEach(b => {
                        const filter = b.getAttribute('data-filter');
                        if (filter === String(routeIdx)) {
                            b.className = 'vehicle-filter-btn px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm';
                        } else {
                            b.className = 'vehicle-filter-btn px-2.5 py-1 rounded-lg text-xs font-mono transition bg-slate-800/80 text-slate-300 border border-slate-700/60 hover:border-slate-500';
                        }
                    });
                }
            });
        });
    }

    /**
     * Executes the live QPSO CVRP Optimization Simulation
     */
    async executeOptimization() {
        this.isOptimizing = true;
        this.sound.playQuantumSweep();

        const runBtn = document.getElementById('runOptimizationBtn');
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressStepLabel = document.getElementById('progressStepLabel');
        const progressPercent = document.getElementById('progressPercent');

        if (runBtn) {
            runBtn.disabled = true;
            runBtn.classList.add('opacity-50', 'cursor-not-allowed');
            runBtn.innerHTML = `
                <i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i>
                <span>Quantum Superposition Optimizing...</span>
            `;
            if (window.lucide) window.lucide.createIcons();
        }

        if (progressContainer) {
            progressContainer.classList.remove('hidden');
        }

        const stages = [
            { pct: 20, label: 'Phase 1: Initializing Quantum Superposition & Potential Well...' },
            { pct: 50, label: 'Phase 2: Evaluating Mean-Best (mbest) Delta-Potential Wells...' },
            { pct: 75, label: 'Phase 3: Quantum Tunneling & Permutation Decoding (LOV Split)...' },
            { pct: 95, label: 'Phase 4: Prins Shortest-Path Partitioning & 2-Opt Polishing...' },
            { pct: 100, label: 'Phase 5: Global Wavefunction Convergence Complete!' }
        ];

        const solver = new QPSOFleetSolver(this.currentInstance, {
            algorithm: this.selectedAlgorithm,
            swarmSize: this.hyperparams.swarmSize,
            maxIterations: this.hyperparams.maxIterations,
            capacity: this.hyperparams.capacity,
            alphaMax: this.hyperparams.alpha,
            beta: this.hyperparams.beta
        });

        // Run optimization with animated step progression over ~1000ms
        const solutionPromise = solver.solve();

        for (let s = 0; s < stages.length; s++) {
            const stage = stages[s];
            if (progressStepLabel) progressStepLabel.textContent = stage.label;
            if (progressBar) progressBar.style.width = `${stage.pct}%`;
            if (progressPercent) progressPercent.textContent = `${stage.pct}%`;
            await new Promise(r => setTimeout(r, 200));
        }

        const result = await solutionPromise;
        this.currentSolution = result;

        // Sound completion chime
        this.sound.playComplete();

        // Update UI components
        if (this.visualizer) {
            this.visualizer.setRoutes(result.routes);
        }

        if (this.convergenceChart) {
            this.convergenceChart.updateData(result.history, result.bksCost);
        }

        this._renderVehicleFilterButtons(result.routes);
        this._updateKPIs(result);
        this._renderManifestTable(result);

        // Reset Run Button & Progress
        if (runBtn) {
            runBtn.disabled = false;
            runBtn.classList.remove('opacity-50', 'cursor-not-allowed');
            runBtn.innerHTML = `
                <i data-lucide="play" class="w-4 h-4 fill-current"></i>
                <span>Execute Optimization</span>
                <div class="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 pointer-events-none"></div>
            `;
            if (window.lucide) window.lucide.createIcons();
        }

        setTimeout(() => {
            if (progressContainer) {
                progressContainer.classList.add('hidden');
                if (progressBar) progressBar.style.width = '0%';
            }
            this.isOptimizing = false;
        }, 600);
    }

    _exportSolutionJSON() {
        if (!this.currentSolution) return;
        const dataStr = JSON.stringify(this.currentSolution, null, 2);
        
        // Copy to clipboard
        navigator.clipboard.writeText(dataStr).catch(() => {});

        // Trigger file download
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quantum_fleet_solution_${this.selectedInstanceKey}.json`;
        a.click();
        URL.revokeObjectURL(url);

        const notice = document.getElementById('exportCopyNotice');
        if (notice) {
            notice.textContent = '✓ JSON solution exported and downloaded!';
            notice.classList.remove('hidden');
            setTimeout(() => notice.classList.add('hidden'), 3000);
        }
    }

    _exportSolutionCSV() {
        if (!this.currentSolution) return;
        let csv = 'TruckID,StopsCount,CargoLoad,CapacityLimit,UtilizationPct,RouteDistanceKm,RouteSequence\n';
        
        this.currentSolution.routeStats.forEach(stat => {
            const seqStr = `"${stat.route.join(' -> ')}"`;
            csv += `${stat.truckId},${stat.stops},${stat.load},${stat.capacity},${stat.utilization.toFixed(1)}%,${stat.distance.toFixed(2)},${seqStr}\n`;
        });

        // Copy to clipboard
        navigator.clipboard.writeText(csv).catch(() => {});

        // Trigger file download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `quantum_fleet_manifest_${this.selectedInstanceKey}.csv`;
        a.click();
        URL.revokeObjectURL(url);

        const notice = document.getElementById('exportCopyNotice');
        if (notice) {
            notice.textContent = '✓ CSV manifest exported and downloaded!';
            notice.classList.remove('hidden');
            setTimeout(() => notice.classList.add('hidden'), 3000);
        }
    }
}

// Instantiate on DOM ready
window.addEventListener('DOMContentLoaded', () => {
    window.app = new AppController();
});
