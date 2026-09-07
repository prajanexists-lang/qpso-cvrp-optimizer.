/**
 * Real-Time Convergence Curve & Telemetry Chart (Chart.js)
 * Visualizes Best Fitness f(G_best), Swarm Mean f_mean, and Known BKS Target
 */

export class ConvergenceChart {
    constructor(canvasElement, initialBks = 784.0) {
        this.canvas = canvasElement;
        this.bks = initialBks;
        this.chart = null;
        this._initChart();
    }

    _initChart() {
        if (!window.Chart) return;
        const ctx = this.canvas.getContext('2d');

        const violetGrad = ctx.createLinearGradient(0, 0, 0, 260);
        violetGrad.addColorStop(0, 'rgba(168, 85, 247, 0.35)');
        violetGrad.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

        this.chart = new window.Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: 'G_best (Global Optimal)',
                        data: [],
                        borderColor: '#a855f7',
                        backgroundColor: violetGrad,
                        borderWidth: 2.5,
                        fill: true,
                        tension: 0.15,
                        pointRadius: 0,
                        pointHoverRadius: 4,
                        pointHoverBackgroundColor: '#c084fc',
                        pointHoverBorderColor: '#ffffff'
                    },
                    {
                        label: 'Swarm Mean (f_mean)',
                        data: [],
                        borderColor: '#06b6d4',
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderDash: [3, 3],
                        fill: false,
                        tension: 0.15,
                        pointRadius: 0
                    },
                    {
                        label: `BKS Benchmark (${this.bks.toFixed(1)})`,
                        data: [],
                        borderColor: '#10b981',
                        backgroundColor: 'transparent',
                        borderWidth: 1.5,
                        borderDash: [6, 6],
                        fill: false,
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                animation: {
                    duration: 200
                },
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        align: 'end',
                        labels: {
                            color: '#94a3b8',
                            font: {
                                family: "'JetBrains Mono', monospace",
                                size: 10
                            },
                            boxWidth: 12,
                            boxHeight: 2,
                            padding: 10
                        }
                    },
                    tooltip: {
                        backgroundColor: '#0f172a',
                        titleColor: '#f8fafc',
                        bodyColor: '#cbd5e1',
                        borderColor: '#334155',
                        borderWidth: 1,
                        padding: 10,
                        boxPadding: 4,
                        bodyFont: {
                            family: "'JetBrains Mono', monospace",
                            size: 11
                        },
                        titleFont: {
                            family: "'JetBrains Mono', monospace",
                            size: 11,
                            weight: 'bold'
                        },
                        callbacks: {
                            title: (items) => `Iteration: ${items[0].label}`,
                            label: (context) => {
                                const val = Number(context.parsed.y).toFixed(2);
                                if (context.datasetIndex === 0) {
                                    const gap = (((context.parsed.y - this.bks) / this.bks) * 100).toFixed(2);
                                    return ` G_best: ${val} km (Gap: +${gap}%)`;
                                } else if (context.datasetIndex === 1) {
                                    return ` Swarm Mean: ${val} km`;
                                } else {
                                    return ` BKS Baseline: ${val} km`;
                                }
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(51, 65, 85, 0.25)',
                            tickColor: 'transparent'
                        },
                        ticks: {
                            color: '#64748b',
                            font: { family: "'JetBrains Mono', monospace", size: 10 },
                            maxTicksLimit: 8
                        },
                        title: {
                            display: true,
                            text: 'Optimization Iterations (t)',
                            color: '#64748b',
                            font: { family: "'JetBrains Mono', monospace", size: 10 }
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(51, 65, 85, 0.25)',
                            tickColor: 'transparent'
                        },
                        ticks: {
                            color: '#64748b',
                            font: { family: "'JetBrains Mono', monospace", size: 10 }
                        },
                        title: {
                            display: true,
                            text: 'Total Fleet Distance (km)',
                            color: '#64748b',
                            font: { family: "'JetBrains Mono', monospace", size: 10 }
                        }
                    }
                }
            }
        });
    }

    setBKS(bksValue) {
        this.bks = bksValue;
        if (this.chart) {
            this.chart.data.datasets[2].label = `BKS Benchmark (${this.bks.toFixed(1)})`;
            const len = this.chart.data.labels.length;
            this.chart.data.datasets[2].data = new Array(len).fill(this.bks);
            this.chart.update('none');
        }
    }

    updateData(history, bksValue = null) {
        if (bksValue !== null) this.bks = bksValue;
        if (!this.chart) this._initChart();
        if (!this.chart) return;

        const labels = history.map(h => h.iteration);
        const gbestData = history.map(h => h.gbestFit);
        const meanData = history.map(h => h.meanFit);
        const bksData = new Array(history.length).fill(this.bks);

        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = gbestData;
        this.chart.data.datasets[1].data = meanData;
        this.chart.data.datasets[2].data = bksData;
        this.chart.data.datasets[2].label = `BKS Benchmark (${this.bks.toFixed(1)})`;

        this.chart.update();
    }

    populateDefaultProfile(bks = 784.0, finalCost = 788.42, iters = 200) {
        this.bks = bks;
        const history = [];
        let curr = bks * 1.38;
        for (let i = 0; i <= iters; i += 4) {
            curr = bks + (curr - bks) * 0.94 + (Math.random() - 0.5) * 4;
            if (curr < finalCost && i < iters) curr = finalCost + 2;
            if (i === iters) curr = finalCost;
            
            history.push({
                iteration: i,
                gbestFit: curr,
                meanFit: curr + 35 * Math.exp(-i / 80) + Math.random() * 8,
                tunnelingEvents: Math.floor(i / 15)
            });
        }
        this.updateData(history, bks);
    }
}
