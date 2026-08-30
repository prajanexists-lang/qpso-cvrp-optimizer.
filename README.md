# Quantum-Behaved Swarm Optimization for Capacitated Vehicle Routing (CVRP)

An implementation of Quantum-Behaved Particle Swarm Optimization (QPSO) and Gaussian Attractor QPSO (GAQPSO) applied to the NP-hard Capacitated Vehicle Routing Problem.

## Mathematical Formulation

### 1. Continuous-to-Discrete Mapping (LOV Rule)
To apply continuous quantum wave-packet mechanics to discrete combinatorial permutations, we utilize the **Largest Order Value (LOV)** rule:
1. Particles maintain continuous priority coordinates: $X_i \in \mathbb{R}^D$.
2. Customer visit priority is determined by $\text{argsort}(X_i)$.
3. Vehicle routes are greedily partitioned subject to vehicle capacity $Q$:
   $$\sum_{j \in \text{Route}_k} d_j \le Q$$

### 2. Quantum Potential Well Dynamics (Delta-Well QPSO)
Particles sample position states based on a Schrödinger Delta potential well probability distribution:
$$X_{t+1} = p_{\text{local}} \pm \alpha \cdot |m_{\text{best}} - X_t| \cdot \ln\left(\frac{1}{u}\right), \quad u \sim \mathcal{U}(0, 1]$$

Where:
- $m_{\text{best}} = \frac{1}{M}\sum_{i=1}^M P_i$ (Center of mass of swarm memory)
- $p_{\text{local}} = \phi P_i + (1 - \phi) G$ (Local attractor point)
- $\alpha = 1.0 - 0.6 \cdot \frac{t}{t_{\text{max}}}$ (Contraction-Expansion coefficient)

### 3. Gaussian Attractor Variant (GAQPSO)
To mitigate late-stage oscillations around the sharp peak of the Laplace distribution, the Gaussian Attractor variant samples directly from a Normal distribution:
$$X_{t+1} \sim \mathcal{N}\left(\mu = p_{\text{local}},\, \sigma^2 = (\alpha \cdot |m_{\text{best}} - X_t|)^2\right)$$

---

## Quickstart & Execution

```bash
# Clone the repository
git clone [https://github.com/](https://github.com/)<your-username>/qpso-cvrp.git
cd qpso-cvrp

# Install dependencies
pip install numpy matplotlib

# Run solver benchmark
python solver.py
