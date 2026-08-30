# Mathematical Specification & Algorithmic Formulation
## Quantum-Behaved Swarm Optimization for Capacitated Vehicle Routing

---

### 1. Problem Formulation: Capacitated Vehicle Routing (CVRP)

Let the logistics network be defined as a complete directed graph $G = (V, E)$, where:
* $V = \{0, 1, \dots, n\}$ is the set of nodes. Node $0$ represents the central depot, and $V_C = \{1, \dots, n\}$ denotes the set of $n$ geographically distributed customers.
* $E = \{(i, j) : i, j \in V, i \neq j\}$ is the edge set.
* $C_{ij} \in \mathbb{R}^+$ denotes the travel cost (Euclidean distance or transit time) between node $i$ and node $j$.
* Each customer $i \in V_C$ is characterized by a deterministic demand $d_i > 0$. The depot demand is $d_0 = 0$.
* A homogeneous fleet of $K$ vehicles is available, each with a uniform capacity constraint $Q$, where $\max_{i \in V_C}(d_i) \le Q$.

#### 1.1 Objective Function
Minimize total fleet operational travel cost:

$$\min Z = \sum_{k=1}^{K} \sum_{i \in V} \sum_{j \in V} C_{ij} \cdot x_{ijk}$$

Subject to:

$$\sum_{k=1}^{K} \sum_{j \in V, j \neq i} x_{ijk} = 1, \quad \forall i \in V_C \quad \text{(Exact Single Visit)}$$

$$\sum_{j \in V_C} x_{0jk} = \sum_{j \in V_C} x_{j0k} \le 1, \quad \forall k \in \{1, \dots, K\} \quad \text{(Depot Flow Balance)}$$

$$\sum_{i \in V_C} d_i \sum_{j \in V, j \neq i} x_{ijk} \le Q, \quad \forall k \in \{1, \dots, K\} \quad \text{(Vehicle Capacity Constraint)}$$

$$x_{ijk} \in \{0, 1\}, \quad \forall (i, j) \in E, \; \forall k \in \{1, \dots, K\}$$

---

### 2. Continuous-to-Discrete Mapping: Largest Order Value (LOV)

Standard Quantum-Behaved Particle Swarm Optimization operates over a continuous coordinate space $\mathbb{R}^n$. To evaluate discrete customer permutations, the Largest Order Value (LOV) mapping rule is applied:

1. **Continuous Position Vector:** Particle $i$ in a swarm of size $M$ maintains position vector $X_i = [x_{i,1}, x_{i,2}, \dots, x_{i,n}] \in \mathbb{R}^n$.
2. **Permutation Extraction:** A discrete permutation sequence $\pi_i = (\pi_{i,1}, \pi_{i,2}, \dots, \pi_{i,n})$ is generated via rank ordering:
   $$\pi_i = \text{argsort}(X_i) + 1$$
3. **Greedy Sub-Route Partitioning:** Vehicles are filled sequentially according to sequence $\pi_i$. If appending customer $\pi_{i,j}$ exceeds capacity $Q$, the current route is closed (returning to depot node $0$), and customer $\pi_{i,j}$ initializes route $k+1$.

---

### 3. Delta-Well Potential QPSO Dynamics

Unlike classical PSO which relies on Newtonian velocity vectors, QPSO (Sun et al., 2004) models particles as wave packets $\psi(x, t)$ trapped in a Delta-potential well centered at local attractor $p_{\text{local}}$.

#### 3.1 Swarm Center of Mass (Mean Best)
The collective swarm memory center $m_{\text{best}} \in \mathbb{R}^n$ is computed as the algebraic mean of all individual personal best positions:

$$m_{\text{best}} = \frac{1}{M} \sum_{i=1}^{M} P_i = \left[ \frac{1}{M}\sum_{i=1}^M P_{i,1}, \; \frac{1}{M}\sum_{i=1}^M P_{i,2}, \; \dots, \; \frac{1}{M}\sum_{i=1}^M P_{i,n} \right]$$

#### 3.2 Stochastic Local Attractor
For particle $i$ at dimension $d$, the attractor coordinate $p_{\text{local}, i, d}$ is a convex combination of personal memory $P_{i, d}$ and global swarm leader $G_d$:

$$p_{\text{local}, i, d} = \phi_{i, d} P_{i, d} + (1 - \phi_{i, d}) G_d, \quad \phi_{i, d} \sim \mathcal{U}(0, 1)$$

#### 3.3 State Sampling via Wave Equation Solution
Solving the time-independent Schrödinger equation for a Delta-potential well yields a double-exponential (Laplace) probability density function. Sampling this distribution via inverse transform sampling gives the position update:

$$X_{t+1, i, d} = p_{\text{local}, i, d} \pm \alpha \cdot |m_{\text{best}, d} - X_{t, i, d}| \cdot \ln\left(\frac{1}{u_{i, d}}\right)$$

Where:
* $u_{i, d} \sim \mathcal{U}(10^{-12}, 1]$ provides the stochastic basis.
* The sign ($\pm$) is selected with equal probability $P(+) = P(-) = 0.5$.
* $\alpha$ is the contraction-expansion parameter controlled by a linear cooling schedule:
  $$\alpha(t) = \alpha_{\max} - (\alpha_{\max} - \alpha_{\min}) \cdot \left(\frac{t}{t_{\max}}\right)$$

---

### 4. Gaussian-Attractor QPSO (GAQPSO)

To eliminate late-stage oscillation around the derivative discontinuity (sharp cusp) of the Laplace distribution, the Gaussian Attractor variant (Sun et al., 2011) replaces exponential decay sampling with a Normal probability distribution:

$$X_{t+1, i, d} \sim \mathcal{N}\left(\mu = p_{\text{local}, i, d}, \; \sigma_{i, d}^2 = \left(\alpha \cdot |m_{\text{best}, d} - X_{t, i, d}|\right)^2\right)$$

Equivalently evaluated via standard Gaussian perturbation $Z_{i, d} \sim \mathcal{N}(0, 1)$:

$$X_{t+1, i, d} = p_{\text{local}, i, d} + \alpha \cdot |m_{\text{best}, d} - X_{t, i, d}| \cdot Z_{i, d}$$

This ensures smooth asymptotic exploitation during late iterations as $\alpha \to \alpha_{\min}$ and $|m_{\text{best}} - X| \to 0$.

---

### 5. Algorithmic Complexity

* **Time Complexity per Generation:** $\mathcal{O}(M \cdot n \log n + M \cdot n)$, where $M \cdot n \log n$ represents the sorting operation in the LOV decoder and $M \cdot n$ accounts for vectorized quantum sampling across $M$ particles and $n$ dimensions.
* **Space Complexity:** $\mathcal{O}(M \cdot n + n^2)$ to store the swarm population matrices ($X, P, \Phi$) and the $n \times n$ cost matrix.

---


### 6. Academic References & Paper Links

1. **Foundational Delta-Well QPSO Paper:**  
   Sun, J., Feng, B., & Xu, W. (2004). *Particle Swarm Optimization with Particles Having Quantum Behavior.* IEEE Congress on Evolutionary Computation (CEC).  
   🔗 [DOI: 10.1109/CEC.2004.1330875](https://doi.org/10.1109/CEC.2004.1330875) | [Semantic Scholar Record](https://www.semanticscholar.org/paper/Particle-swarm-optimization-with-particles-having-Sun-Feng/15f584ac30e372455a6d164454679b6e8e29ae16)

2. **GAQPSO (Gaussian Attractor) Paper:**  
   Sun, J., Wu, X., Palade, V., Fang, W., Lai, C. H., & Xu, W. (2012). *Quantum-behaved particle swarm optimization with Gaussian distributed local attractor point.* Applied Mathematics and Computation, 218(7), 3763–3775.  
   🔗 [Open Access PDF (Oxford Research Archive)](https://ora.ox.ac.uk/objects/uuid:770f2b6a-c31e-40b6-b043-e8be6dd518df/download_file?safe_filename=AMC.pdf&file_format=application%2Fpdf&type_of_work=Journal+article) | [ScienceDirect Link](https://doi.org/10.1016/j.amc.2011.09.020)

3. **Convergence & Theoretical Analysis:**  
   Sun, J., Fang, W., Wu, X., Xie, V., & Xu, W. (2012). *Quantum-behaved particle swarm optimization: analysis of individual particle behavior and parameter selection.* IEEE Transactions on Evolutionary Computation, 16(1), 74–93.  
   🔗 [DOI: 10.1109/TEVC.2010.2096509](https://doi.org/10.1109/TEVC.2010.2096509) | [ArXiv Open Preprint](https://arxiv.org/pdf/2308.04840)
