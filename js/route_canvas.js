/**
 * Interactive 2D Coordinate & Route Visualizer for Quantum Fleet Optimizer
 * Supports high-DPI canvas, route rendering, glowing particles, zoom/pan, and node tooltips
 */

export const ROUTE_COLORS = [
    { stroke: '#06b6d4', glow: 'rgba(6, 182, 212, 0.4)', name: 'Cyan', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/40' },
    { stroke: '#10b981', glow: 'rgba(16, 185, 129, 0.4)', name: 'Emerald', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/40' },
    { stroke: '#a855f7', glow: 'rgba(168, 85, 247, 0.4)', name: 'Violet', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/40' },
    { stroke: '#f59e0b', glow: 'rgba(245, 158, 11, 0.4)', name: 'Amber', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40' },
    { stroke: '#f43f5e', glow: 'rgba(244, 63, 94, 0.4)', name: 'Rose', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/40' },
    { stroke: '#3b82f6', glow: 'rgba(59, 130, 246, 0.4)', name: 'Sapphire', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/40' },
    { stroke: '#eab308', glow: 'rgba(234, 179, 8, 0.4)', name: 'Gold', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/40' },
    { stroke: '#14b8a6', glow: 'rgba(20, 184, 166, 0.4)', name: 'Teal', bg: 'bg-teal-500/20', text: 'text-teal-400', border: 'border-teal-500/40' }
];

export class RouteVisualizer {
    constructor(canvasElement, tooltipElement) {
        this.canvas = canvasElement;
        this.ctx = canvasElement.getContext('2d');
        this.tooltip = tooltipElement;

        this.nodes = [];
        this.routes = [];
        this.activeFilter = null;
        this.hoveredNode = null;
        
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.isDragging = false;
        this.startX = 0;
        this.startY = 0;

        this.showDemandRings = true;
        this.showNodeLabels = true;
        this.showDirectionArrows = true;
        this.animateVehicles = true;

        this.truckProgress = [0, 0.2, 0.4, 0.6, 0.8, 0.3];
        this.animationFrameId = null;
        this.radarAngle = 0;

        this._setupCanvas();
        this._attachEventListeners();
        this._startAnimationLoop();
    }

    _setupCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        this.canvas.width = (rect.width || 600) * dpr;
        this.canvas.height = (rect.height || 360) * dpr;
        this.ctx.scale(dpr, dpr);
        this.width = rect.width || 600;
        this.height = rect.height || 360;
    }

    _attachEventListeners() {
        window.addEventListener('resize', () => {
            this._setupCanvas();
            this.render();
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.startX = e.clientX - this.panX;
            this.startY = e.clientY - this.panY;
            this.canvas.style.cursor = 'grabbing';
        });

        window.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.panX = e.clientX - this.startX;
                this.panY = e.clientY - this.startY;
                this.render();
            } else {
                this._handleHover(e);
            }
        });

        window.addEventListener('mouseup', () => {
            this.isDragging = false;
            this.canvas.style.cursor = 'grab';
        });

        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
            const newScale = Math.max(0.6, Math.min(4.0, this.scale * zoomFactor));
            
            const rect = this.canvas.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const mouseY = e.clientY - rect.top;

            this.panX = mouseX - (mouseX - this.panX) * (newScale / this.scale);
            this.panY = mouseY - (mouseY - this.panY) * (newScale / this.scale);
            this.scale = newScale;

            this.render();
        }, { passive: false });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredNode = null;
            if (this.tooltip) {
                this.tooltip.classList.add('opacity-0', 'pointer-events-none');
            }
            this.render();
        });
    }

    setData(nodes, routes = []) {
        this.nodes = nodes || [];
        this.routes = routes || [];
        this.resetTransform();
        this.render();
    }

    setRoutes(routes) {
        this.routes = routes || [];
        this.render();
    }

    setFilter(vehicleIdx) {
        this.activeFilter = vehicleIdx;
        this.render();
    }

    resetTransform() {
        this.scale = 1;
        this.panX = 0;
        this.panY = 0;
        this.render();
    }

    _coordToCanvas(x, y) {
        const padding = 55;
        const availableW = this.width - padding * 2;
        const availableH = this.height - padding * 2;
        
        let minX = 0, maxX = 100, minY = 0, maxY = 100;
        if (this.nodes.length > 0) {
            const xs = this.nodes.map(n => n.x);
            const ys = this.nodes.map(n => n.y);
            minX = Math.min(...xs);
            maxX = Math.max(...xs);
            minY = Math.min(...ys);
            maxY = Math.max(...ys);
        }

        const rangeX = Math.max(1, maxX - minX);
        const rangeY = Math.max(1, maxY - minY);

        const normX = (x - minX) / rangeX;
        const normY = (y - minY) / rangeY;

        const baseCanvasX = padding + normX * availableW;
        const baseCanvasY = padding + (1 - normY) * availableH;

        const centerX = this.width / 2;
        const centerY = this.height / 2;

        const canvasX = centerX + (baseCanvasX - centerX) * this.scale + this.panX;
        const canvasY = centerY + (baseCanvasY - centerY) * this.scale + this.panY;

        return { x: canvasX, y: canvasY };
    }

    _handleHover(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        let closestNode = null;
        let minDist = 18;

        for (const node of this.nodes) {
            const { x, y } = this._coordToCanvas(node.x, node.y);
            const d = Math.hypot(mouseX - x, mouseY - y);
            if (d < minDist) {
                closestNode = node;
                minDist = d;
            }
        }

        if (closestNode !== this.hoveredNode) {
            this.hoveredNode = closestNode;
            this.render();

            if (this.hoveredNode && this.tooltip) {
                this._updateTooltip(mouseX, mouseY, this.hoveredNode);
            } else if (this.tooltip) {
                this.tooltip.classList.add('opacity-0', 'pointer-events-none');
            }
        }
    }

    _updateTooltip(mouseX, mouseY, node) {
        let assignedVehicle = 'Unassigned';
        let routeIdx = -1;
        let stopNumber = -1;

        if (this.routes) {
            for (let r = 0; r < this.routes.length; r++) {
                const idx = this.routes[r].indexOf(node.id);
                if (idx !== -1) {
                    assignedVehicle = `Vehicle #${r + 1} (${ROUTE_COLORS[r % ROUTE_COLORS.length].name})`;
                    routeIdx = r;
                    stopNumber = idx;
                    break;
                }
            }
        }

        const colorMeta = routeIdx >= 0 ? ROUTE_COLORS[routeIdx % ROUTE_COLORS.length] : { stroke: '#94a3b8' };

        this.tooltip.innerHTML = `
            <div class="flex items-center justify-between border-b border-slate-700/60 pb-1.5 mb-2">
                <div class="flex items-center space-x-2">
                    <span class="w-2.5 h-2.5 rounded-full" style="background-color: ${node.isDepot ? '#06b6d4' : colorMeta.stroke}"></span>
                    <span class="font-bold text-slate-100 text-xs tracking-wide">${node.isDepot ? 'MAIN DEPOT' : `NODE #${node.id}`}</span>
                </div>
                <span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">${node.zone || 'Zone 1'}</span>
            </div>
            <div class="space-y-1 text-xs text-slate-300 font-mono">
                <div class="flex justify-between">
                    <span class="text-slate-400">Position:</span>
                    <span class="text-slate-200">(${node.x}, ${node.y})</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">Demand:</span>
                    <span class="font-semibold ${node.demand > 18 ? 'text-amber-400' : 'text-emerald-400'}">${node.demand} units</span>
                </div>
                ${!node.isDepot ? `
                <div class="flex justify-between pt-1 border-t border-slate-800/80">
                    <span class="text-slate-400">Assigned:</span>
                    <span class="font-semibold" style="color: ${colorMeta.stroke}">${assignedVehicle}</span>
                </div>
                <div class="flex justify-between">
                    <span class="text-slate-400">Stop Order:</span>
                    <span class="text-slate-300">Stop #${stopNumber} of Route</span>
                </div>
                ` : '<div class="text-[11px] text-cyan-300">Central Fleet Departure & Return Base</div>'}
            </div>
        `;

        const tooltipW = 210;
        const tooltipH = 130;
        let left = mouseX + 15;
        let top = mouseY - 20;

        if (left + tooltipW > this.width) left = mouseX - tooltipW - 15;
        if (top + tooltipH > this.height) top = this.height - tooltipH - 10;
        if (top < 10) top = 10;

        this.tooltip.style.left = `${left}px`;
        this.tooltip.style.top = `${top}px`;
        this.tooltip.classList.remove('opacity-0', 'pointer-events-none');
    }

    _startAnimationLoop() {
        const loop = () => {
            this.radarAngle = (this.radarAngle + 0.02) % (Math.PI * 2);
            for (let i = 0; i < this.truckProgress.length; i++) {
                this.truckProgress[i] = (this.truckProgress[i] + 0.0025) % 1;
            }
            this.render();
            this.animationFrameId = requestAnimationFrame(loop);
        };
        this.animationFrameId = requestAnimationFrame(loop);
    }

    render() {
        if (!this.ctx) return;
        const ctx = this.ctx;
        ctx.clearRect(0, 0, this.width, this.height);

        this._drawGrid(ctx);
        this._drawRoutes(ctx);
        this._drawDepotRadar(ctx);
        this._drawNodes(ctx);

        if (this.animateVehicles) {
            this._drawAnimatedTrucks(ctx);
        }
    }

    _drawGrid(ctx) {
        ctx.save();
        ctx.strokeStyle = 'rgba(51, 65, 85, 0.25)';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 4]);

        const step = 40 * this.scale;
        const offsetX = (this.width / 2 + this.panX) % step;
        const offsetY = (this.height / 2 + this.panY) % step;

        for (let x = offsetX; x < this.width; x += step) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, this.height);
            ctx.stroke();
        }

        for (let y = offsetY; y < this.height; y += step) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(this.width, y);
            ctx.stroke();
        }

        ctx.restore();
    }

    _drawDepotRadar(ctx) {
        const depotNode = this.nodes.find(n => n.isDepot) || this.nodes[0];
        if (!depotNode) return;
        const { x, y } = this._coordToCanvas(depotNode.x, depotNode.y);

        ctx.save();
        const rings = [18, 36, 56];
        rings.forEach((r, idx) => {
            ctx.beginPath();
            ctx.arc(x, y, r * this.scale, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(6, 182, 212, ${0.18 / (idx + 1)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
        });

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.arc(x, y, 60 * this.scale, this.radarAngle, this.radarAngle + 0.5);
        ctx.closePath();
        const sweepGrad = ctx.createRadialGradient(x, y, 0, x, y, 60 * this.scale);
        sweepGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
        sweepGrad.addColorStop(1, 'rgba(6, 182, 212, 0.0)');
        ctx.fillStyle = sweepGrad;
        ctx.fill();

        ctx.restore();
    }

    _drawRoutes(ctx) {
        if (!this.routes || this.routes.length === 0) return;

        this.routes.forEach((route, idx) => {
            if (this.activeFilter !== null && this.activeFilter !== idx) {
                this._drawSingleRoute(ctx, route, idx, 0.12, false);
            } else {
                this._drawSingleRoute(ctx, route, idx, 0.85, true);
            }
        });
    }

    _drawSingleRoute(ctx, route, routeIdx, opacity, isHighlighted) {
        if (route.length < 2) return;
        const colorMeta = ROUTE_COLORS[routeIdx % ROUTE_COLORS.length];
        
        ctx.save();
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';

        if (isHighlighted) {
            ctx.beginPath();
            for (let i = 0; i < route.length; i++) {
                const node = this.nodes[route[i]];
                if (!node) continue;
                const { x, y } = this._coordToCanvas(node.x, node.y);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.strokeStyle = colorMeta.glow;
            ctx.lineWidth = 6 * this.scale;
            ctx.stroke();
        }

        ctx.beginPath();
        for (let i = 0; i < route.length; i++) {
            const node = this.nodes[route[i]];
            if (!node) continue;
            const { x, y } = this._coordToCanvas(node.x, node.y);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.strokeStyle = colorMeta.stroke;
        ctx.globalAlpha = opacity;
        ctx.lineWidth = isHighlighted ? 2.5 * this.scale : 1.5 * this.scale;
        ctx.stroke();

        if (this.showDirectionArrows && isHighlighted) {
            for (let i = 0; i < route.length - 1; i++) {
                const n1 = this.nodes[route[i]];
                const n2 = this.nodes[route[i + 1]];
                if (!n1 || !n2) continue;
                const p1 = this._coordToCanvas(n1.x, n1.y);
                const p2 = this._coordToCanvas(n2.x, n2.y);
                this._drawChevron(ctx, p1, p2, colorMeta.stroke);
            }
        }

        ctx.restore();
    }

    _drawChevron(ctx, p1, p2, color) {
        const midX = (p1.x + p2.x) / 2;
        const midY = (p1.y + p2.y) / 2;
        const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
        const arrowSize = 6 * this.scale;

        ctx.save();
        ctx.translate(midX, midY);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(-arrowSize, -arrowSize * 0.7);
        ctx.lineTo(0, 0);
        ctx.lineTo(-arrowSize, arrowSize * 0.7);
        ctx.strokeStyle = color;
        ctx.lineWidth = 2 * this.scale;
        ctx.stroke();
        ctx.restore();
    }

    _drawAnimatedTrucks(ctx) {
        if (!this.routes || this.routes.length === 0) return;

        this.routes.forEach((route, idx) => {
            if (this.activeFilter !== null && this.activeFilter !== idx) return;
            if (route.length < 2) return;

            const progress = (this.truckProgress[idx % this.truckProgress.length] + idx * 0.15) % 1;
            const colorMeta = ROUTE_COLORS[idx % ROUTE_COLORS.length];

            let totalLen = 0;
            const segLens = [];
            for (let i = 0; i < route.length - 1; i++) {
                const n1 = this.nodes[route[i]];
                const n2 = this.nodes[route[i + 1]];
                if (!n1 || !n2) continue;
                const p1 = this._coordToCanvas(n1.x, n1.y);
                const p2 = this._coordToCanvas(n2.x, n2.y);
                const d = Math.hypot(p2.x - p1.x, p2.y - p1.y);
                segLens.push(d);
                totalLen += d;
            }

            if (totalLen <= 0) return;

            const targetDist = progress * totalLen;
            let accum = 0;
            let truckX = 0, truckY = 0, heading = 0;

            for (let i = 0; i < segLens.length; i++) {
                if (accum + segLens[i] >= targetDist || i === segLens.length - 1) {
                    const segProg = segLens[i] > 0 ? (targetDist - accum) / segLens[i] : 0;
                    const n1 = this.nodes[route[i]];
                    const n2 = this.nodes[route[i + 1]];
                    const p1 = this._coordToCanvas(n1.x, n1.y);
                    const p2 = this._coordToCanvas(n2.x, n2.y);
                    truckX = p1.x + (p2.x - p1.x) * segProg;
                    truckY = p1.y + (p2.y - p1.y) * segProg;
                    heading = Math.atan2(p2.y - p1.y, p2.x - p1.x);
                    break;
                }
                accum += segLens[i];
            }

            ctx.save();
            ctx.translate(truckX, truckY);
            ctx.rotate(heading);

            ctx.beginPath();
            ctx.arc(0, 0, 8 * this.scale, 0, Math.PI * 2);
            ctx.fillStyle = colorMeta.glow;
            ctx.fill();

            ctx.beginPath();
            ctx.roundRect(-6 * this.scale, -4 * this.scale, 12 * this.scale, 8 * this.scale, 2);
            ctx.fillStyle = '#0f172a';
            ctx.fill();
            ctx.strokeStyle = colorMeta.stroke;
            ctx.lineWidth = 1.5 * this.scale;
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(6 * this.scale, -2 * this.scale);
            ctx.lineTo(14 * this.scale, -5 * this.scale);
            ctx.moveTo(6 * this.scale, 2 * this.scale);
            ctx.lineTo(14 * this.scale, 5 * this.scale);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        });
    }

    _drawNodes(ctx) {
        this.nodes.forEach((node) => {
            const { x, y } = this._coordToCanvas(node.x, node.y);
            const isHovered = this.hoveredNode && this.hoveredNode.id === node.id;

            if (node.isDepot) {
                ctx.save();
                ctx.translate(x, y);

                ctx.beginPath();
                const dSize = (isHovered ? 14 : 11) * this.scale;
                ctx.moveTo(0, -dSize);
                ctx.lineTo(dSize, 0);
                ctx.lineTo(0, dSize);
                ctx.lineTo(-dSize, 0);
                ctx.closePath();
                ctx.fillStyle = '#083344';
                ctx.fill();
                ctx.strokeStyle = '#22d3ee';
                ctx.lineWidth = 2.5 * this.scale;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(0, 0, 3.5 * this.scale, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                ctx.fillStyle = '#22d3ee';
                ctx.font = `bold ${Math.max(10, 11 * this.scale)}px 'JetBrains Mono', monospace`;
                ctx.textAlign = 'center';
                ctx.textBaseline = 'bottom';
                ctx.fillText('DEPOT (0)', 0, -dSize - 4);

                ctx.restore();
            } else {
                ctx.save();
                ctx.translate(x, y);

                const baseRadius = (isHovered ? 10 : 7.5) * this.scale;

                if (this.showDemandRings) {
                    const demandRatio = Math.min(1, (node.demand || 5) / 25);
                    ctx.beginPath();
                    ctx.arc(0, 0, baseRadius + 3.5 * this.scale * demandRatio, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(148, 163, 184, 0.25)`;
                    ctx.lineWidth = 1;
                    ctx.stroke();
                }

                ctx.beginPath();
                ctx.arc(0, 0, baseRadius, 0, Math.PI * 2);
                ctx.fillStyle = isHovered ? '#1e293b' : '#0f172a';
                ctx.fill();
                ctx.strokeStyle = isHovered ? '#38bdf8' : '#64748b';
                ctx.lineWidth = (isHovered ? 2 : 1.2) * this.scale;
                ctx.stroke();

                if (this.showNodeLabels) {
                    ctx.fillStyle = isHovered ? '#ffffff' : '#cbd5e1';
                    ctx.font = `600 ${Math.max(8, 9 * this.scale)}px 'JetBrains Mono', monospace`;
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText(node.id, 0, 0.5);
                }

                ctx.restore();
            }
        });
    }
}
