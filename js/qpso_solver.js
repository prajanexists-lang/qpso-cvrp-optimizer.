/**
 * Quantum-Inspired Particle Swarm Optimization (QPSO) Engine for CVRP
 * Implements:
 * 1. GAQPSO (Gaussian Attractor QPSO)
 * 2. Delta-Well QPSO (Sun et al. Quantum Delta-Potential Well)
 * 3. Classical PSO (Kennedy & Eberhart)
 * with Prins Capacitated Split Algorithm & 2-Opt Local Polishing
 */

import { euclideanDist } from './cvrp_data.js';

export class QPSOFleetSolver {
    constructor(instance, config = {}) {
        this.instance = instance;
        this.nodes = instance.nodes;
        this.depot = instance.depot;
        this.customers = instance.nodes.filter(n => !n.isDepot).map(n => n.id);
        this.numCustomers = this.customers.length;
        
        // Problem Parameters
        this.capacity = config.capacity ?? instance.capacity;
        this.maxVehicles = config.maxVehicles ?? instance.numVehicles;
        
        // Algorithm Hyperparameters
        this.algorithm = config.algorithm ?? 'GAQPSO'; // 'GAQPSO' | 'DELTA_QPSO' | 'CLASSICAL_PSO'
        this.swarmSize = config.swarmSize ?? 40;       // M particles
        this.maxIterations = config.maxIterations ?? 200; // t_max
        this.alphaMax = config.alphaMax ?? 1.0;        // Contraction-expansion upper bound
        this.alphaMin = config.alphaMin ?? 0.45;       // Contraction-expansion lower bound
        this.beta = config.beta ?? 0.15;               // Wavefunction collapse / noise
        
        // Classical PSO weights
        this.w = config.w ?? 0.72;                     // Inertia weight
        this.c1 = config.c1 ?? 1.49;                   // Cognitive parameter
        this.c2 = config.c2 ?? 1.49;                   // Social parameter

        // Precompute Distance Matrix
        this.distMatrix = this._buildDistMatrix();
    }

    _buildDistMatrix() {
        const N = this.nodes.length;
        const matrix = Array.from({ length: N }, () => new Float64Array(N));
        for (let i = 0; i < N; i++) {
            for (let j = 0; j < N; j++) {
                matrix[i][j] = euclideanDist(this.nodes[i], this.nodes[j]);
            }
        }
        return matrix;
    }

    _dist(i, j) {
        return this.distMatrix[i][j];
    }

    /**
     * 2-Opt Intra-Route Polishing
     */
    _twoOpt(route) {
        if (route.length <= 3) return route;
        let best = [...route];
        let improved = true;
        let iter = 0;
        
        while (improved && iter < 50) {
            improved = false;
            iter++;
            for (let i = 1; i < best.length - 2; i++) {
                for (let j = i + 1; j < best.length - 1; j++) {
                    const dCurr = this._dist(best[i - 1], best[i]) + this._dist(best[j], best[j + 1]);
                    const dNew = this._dist(best[i - 1], best[j]) + this._dist(best[i], best[j + 1]);
                    if (dNew < dCurr - 1e-6) {
                        const reversedMiddle = best.slice(i, j + 1).reverse();
                        best = [...best.slice(0, i), ...reversedMiddle, ...best.slice(j + 1)];
                        improved = true;
                        break;
                    }
                }
                if (improved) break;
            }
        }
        return best;
    }

    /**
     * Prins Split Algorithm (Capacitated Shortest Path DAG)
     * Transforms continuous permutation of customers into optimal vehicle routes
     */
    splitTour(tour) {
        const n = tour.length;
        const V = new Float64Array(n + 1).fill(Infinity);
        const P = new Int32Array(n + 1);
        V[0] = 0;

        for (let i = 1; i <= n; i++) {
            let load = 0;
            let cost = 0;
            for (let j = i; j <= n; j++) {
                const cust = tour[j - 1];
                load += (this.nodes[cust].demand || 0);
                
                if (load > this.capacity) {
                    break;
                }

                if (i === j) {
                    cost = this._dist(0, cust) + this._dist(cust, 0);
                } else {
                    const prevCust = tour[j - 2];
                    cost = cost - this._dist(prevCust, 0) + this._dist(prevCust, cust) + this._dist(cust, 0);
                }

                if (V[i - 1] + cost < V[j]) {
                    V[j] = V[i - 1] + cost;
                    P[j] = i - 1;
                }
            }
        }

        // Reconstruct individual vehicle routes
        const routes = [];
        let curr = n;
        while (curr > 0) {
            const prev = P[curr];
            let route = [0, ...tour.slice(prev, curr), 0];
            route = this._twoOpt(route);
            routes.unshift(route);
            curr = prev;
        }

        // Calculate total cost and load statistics
        let totalCost = 0;
        const routeStats = routes.map((r, idx) => {
            let d = 0;
            for (let k = 0; k < r.length - 1; k++) {
                d += this._dist(r[k], r[k + 1]);
            }
            totalCost += d;
            const load = r.reduce((sum, id) => sum + (this.nodes[id]?.demand || 0), 0);
            return {
                truckId: idx + 1,
                route: r,
                stops: r.length - 2,
                distance: d,
                load: load,
                capacity: this.capacity,
                utilization: Math.min(100, (load / this.capacity) * 100)
            };
        });

        return {
            routes,
            routeStats,
            totalCost,
            numVehicles: routes.length
        };
    }

    /**
     * Map continuous vector to customer permutation via Largest Order Value (LOV)
     */
    _vectorToPermutation(vec) {
        const order = Array.from({ length: this.numCustomers }, (_, i) => i)
            .sort((a, b) => vec[a] - vec[b]);
        return order.map(idx => this.customers[idx]);
    }

    _evaluateParticle(vec) {
        const tour = this._vectorToPermutation(vec);
        const res = this.splitTour(tour);
        return {
            fitness: res.totalCost,
            routes: res.routes,
            routeStats: res.routeStats,
            numVehicles: res.numVehicles
        };
    }

    /**
     * Standard Gaussian Random Generator (Box-Muller Transform)
     */
    _gaussianRandom(mean = 0, stdev = 1) {
        let u = 1 - Math.random();
        let v = Math.random();
        let z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        return mean + z * stdev;
    }

    /**
     * Run Optimization with step-by-step telemetry
     */
    async solve(onProgress = null) {
        const startTime = performance.now();
        const D = this.numCustomers;
        const M = this.swarmSize;
        const T = this.maxIterations;

        // Initialize Swarm Positions & Velocities
        const particles = Array.from({ length: M }, () => 
            Array.from({ length: D }, () => (Math.random() - 0.5) * 10)
        );
        const velocities = Array.from({ length: M }, () => 
            Array.from({ length: D }, () => (Math.random() - 0.5) * 2)
        );

        const pbestPos = particles.map(p => [...p]);
        const pbestEval = particles.map(p => this._evaluateParticle(p));
        const pbestFit = pbestEval.map(e => e.fitness);

        let gbestIdx = 0;
        let gbestFit = pbestFit[0];
        for (let i = 1; i < M; i++) {
            if (pbestFit[i] < gbestFit) {
                gbestFit = pbestFit[i];
                gbestIdx = i;
            }
        }

        let gbestPos = [...pbestPos[gbestIdx]];
        let gbestSol = pbestEval[gbestIdx];

        const history = [];
        let tunnelingEvents = 0;
        let prevBest = gbestFit;

        // Initial snapshot
        history.push({
            iteration: 0,
            gbestFit: gbestFit,
            meanFit: pbestFit.reduce((a, b) => a + b, 0) / M,
            alpha: this.alphaMax,
            tunnelingEvents: 0
        });

        const batchSize = Math.max(1, Math.floor(T / 50));

        for (let iter = 1; iter <= T; iter++) {
            // Contraction-Expansion Cooling Factor
            const alpha = this.alphaMax - (iter / T) * (this.alphaMax - this.alphaMin);

            // Compute Mean Best Position (mbest) for QPSO models
            const mbest = new Float64Array(D);
            for (let d = 0; d < D; d++) {
                let sum = 0;
                for (let i = 0; i < M; i++) {
                    sum += pbestPos[i][d];
                }
                mbest[d] = sum / M;
            }

            // Update each particle in the swarm
            for (let i = 0; i < M; i++) {
                if (this.algorithm === 'GAQPSO') {
                    // Gaussian Attractor QPSO
                    for (let d = 0; d < D; d++) {
                        const phi = Math.random();
                        const pLocal = phi * pbestPos[i][d] + (1 - phi) * gbestPos[d];
                        const sigma = Math.abs(gbestPos[d] - pbestPos[i][d]) + 1e-4;
                        const gAttractor = this._gaussianRandom(pLocal, sigma * this.beta);
                        
                        const u = Math.max(1e-12, Math.random());
                        const sign = Math.random() < 0.5 ? 1 : -1;
                        const delta = alpha * Math.abs(mbest[d] - particles[i][d]) * Math.log(1 / u);
                        particles[i][d] = gAttractor + sign * delta;
                    }
                } else if (this.algorithm === 'DELTA_QPSO') {
                    // Standard Quantum Delta-Potential Well QPSO
                    for (let d = 0; d < D; d++) {
                        const phi = Math.random();
                        const pLocal = phi * pbestPos[i][d] + (1 - phi) * gbestPos[d];
                        const u = Math.max(1e-12, Math.random());
                        const sign = Math.random() < 0.5 ? 1 : -1;
                        const delta = alpha * Math.abs(mbest[d] - particles[i][d]) * Math.log(1 / u);
                        particles[i][d] = pLocal + sign * delta;
                    }
                } else {
                    // Classical PSO (Velocity & Position)
                    for (let d = 0; d < D; d++) {
                        const r1 = Math.random();
                        const r2 = Math.random();
                        velocities[i][d] = this.w * velocities[i][d] +
                            this.c1 * r1 * (pbestPos[i][d] - particles[i][d]) +
                            this.c2 * r2 * (gbestPos[d] - particles[i][d]);
                        particles[i][d] += velocities[i][d];
                    }
                }

                // Evaluate new particle configuration
                const sol = this._evaluateParticle(particles[i]);
                const fit = sol.fitness;

                if (fit < pbestFit[i]) {
                    pbestFit[i] = fit;
                    pbestPos[i] = [...particles[i]];

                    if (fit < gbestFit) {
                        // Check if quantum tunneling jump occurred
                        if (Math.abs(gbestFit - fit) > 5.0) {
                            tunnelingEvents++;
                        }
                        gbestFit = fit;
                        gbestPos = [...particles[i]];
                        gbestSol = sol;
                    }
                }
            }

            const meanFit = pbestFit.reduce((a, b) => a + b, 0) / M;
            history.push({
                iteration: iter,
                gbestFit: gbestFit,
                meanFit: meanFit,
                alpha: alpha,
                tunnelingEvents: tunnelingEvents
            });

            // Send periodic progress updates for live UI streaming
            if (onProgress && (iter % batchSize === 0 || iter === T)) {
                await onProgress({
                    iteration: iter,
                    maxIterations: T,
                    progress: Math.min(100, Math.round((iter / T) * 100)),
                    currentBestFit: gbestFit,
                    meanFit: meanFit,
                    alpha: alpha,
                    currentSolution: gbestSol,
                    tunnelingEvents: tunnelingEvents,
                    history: history
                });
            }
        }

        const endTime = performance.now();
        const executionTimeMs = Math.round(endTime - startTime);

        return {
            instance: this.instance.name,
            algorithm: this.algorithm,
            swarmSize: M,
            maxIterations: T,
            capacity: this.capacity,
            bestDistance: gbestFit,
            bksCost: this.instance.bksCost,
            optimalityGap: ((gbestFit - this.instance.bksCost) / this.instance.bksCost) * 100,
            vehiclesDispatched: gbestSol.numVehicles,
            routes: gbestSol.routes,
            routeStats: gbestSol.routeStats,
            executionTimeMs: executionTimeMs,
            tunnelingEvents: tunnelingEvents,
            history: history
        };
    }
}
