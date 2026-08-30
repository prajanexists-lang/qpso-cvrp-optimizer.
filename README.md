# Quantum-Behaved Particle Swarm Optimization for CVRP

A metaheuristic optimization engine applying Quantum-Behaved Particle Swarm Optimization (QPSO) and Gaussian Attractor QPSO (GAQPSO) to the Capacitated Vehicle Routing Problem (CVRP).

---

## Overview

The Capacitated Vehicle Routing Problem (CVRP) is an NP-hard combinatorial optimization problem where a fleet of delivery vehicles with uniform capacity must service a set of customers with known demands from a central depot at minimum operational travel cost.

This implementation adapts continuous quantum-behaved swarm mechanics to discrete permutation spaces using priority-based rank decoding.

---

## Key Components

- **Continuous-to-Discrete Mapping:** Uses the Largest Order Value (LOV) rule (`np.argsort`) to transform continuous particle coordinates into discrete customer visitation sequences.
- **Greedy Capacity Partitioning:** Partitions the decoded customer sequence into valid sub-routes subject to vehicle capacity constraints.
- **Delta-Well QPSO:** Position sampling based on the wave function solution of the Schrödinger equation with a delta potential well (Laplace distribution sampling via $\ln(1/u)$).
- **Gaussian Attractor Variant (GAQPSO):** Normal distribution sampling centered at the local attractor $p_{\text{local}}$ to eliminate late-stage oscillation around sharp distribution peaks.

---

## Project Structure

- `solver.py`: Complete implementation containing the `QPSOSolver` class, LOV decoder, test instance generator, and benchmarking execution.
- `TECHNICAL_SPEC.md`: Formal mathematical definitions, objective functions, quantum wave mechanics, and derivations.

---

## Quickstart

### Requirements
- Python 3.8+
- NumPy
- Matplotlib

### Installation
```bash
pip install numpy matplotlib
