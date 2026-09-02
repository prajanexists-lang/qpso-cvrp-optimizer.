# app.py
import streamlit as st
import matplotlib.pyplot as plt
from solver_engine import solve_cvrp, generate_synthetic_instance
from benchmark_harness import load_augerat_benchmark

st.set_page_config(page_title="Quantum Swarm CVRP", layout="wide")
st.title("🚚 Quantum-Behaved Swarm CVRP Optimizer")

# Sidebar Configuration
st.sidebar.header("Instance Configuration")
data_source = st.sidebar.radio("Data Source", ["CVRPLIB Benchmark (A-n32-k5)", "Dynamic Traffic Simulation"])
method = st.sidebar.selectbox("Optimization Algorithm", ["GAQPSO", "DELTA_QPSO", "PSO"])
particles = st.sidebar.slider("Particles (M)", 20, 80, 40, 10)
iterations = st.sidebar.slider("Iterations (t_max)", 50, 400, 200, 25)

if data_source == "CVRPLIB Benchmark (A-n32-k5)":
    coords, cost_mat, demands, capacity, bks = load_augerat_benchmark()
    is_benchmark = True
else:
    coords, cost_mat, demands, capacity = generate_synthetic_instance(num_nodes=20, capacity=70, seed=None)
    bks = None
    is_benchmark = False

if st.button("Execute Swarm Optimization"):
    with st.spinner("Simulating quantum swarm dynamics..."):
        routes, best_cost, history = solve_cvrp(
            demands, capacity, cost_mat, method=method, num_particles=particles, max_iter=iterations
        )

    col1, col2 = st.columns([1, 1])

    with col1:
        st.subheader("Route Topology")
        if is_benchmark:
            gap = ((best_cost - bks) / bks) * 100.0
            st.metric("Total Fleet Cost", f"{best_cost:.2f}", delta=f"{gap:+.2f}% vs BKS ({bks})", delta_color="inverse")
        else:
            st.metric("Total Fleet Cost (Dist × Traffic)", f"{best_cost:.2f}")

        fig, ax = plt.subplots(figsize=(6, 6))
        # Plot Depot
        if isinstance(coords, dict):
            depot_xy = coords[1]
            cust_x = [coords[i][0] for i in range(2, len(coords) + 1)]
            cust_y = [coords[i][1] for i in range(2, len(coords) + 1)]
        else:
            depot_xy = coords[0]
            cust_x = coords[1:, 0]
            cust_y = coords[1:, 1]

        ax.scatter([depot_xy[0]], [depot_xy[1]], c='red', s=160, marker='s', label='Depot (0)')
        ax.scatter(cust_x, cust_y, c='blue', s=45, alpha=0.7, label='Customers')

        colors = plt.cm.tab10.colors
        for r_idx, route in enumerate(routes):
            full_tour = [0] + route + [0]
            if isinstance(coords, dict):
                rx = [coords[node + 1][0] for node in full_tour]
                ry = [coords[node + 1][1] for node in full_tour]
            else:
                rx = [coords[node][0] for node in full_tour]
                ry = [coords[node][1] for node in full_tour]
            ax.plot(rx, ry, marker='o', color=colors[r_idx % len(colors)], linewidth=1.8, label=f"Truck {r_idx+1}")

        ax.legend(loc="upper right", fontsize=8)
        st.pyplot(fig)

    with col2:
        st.subheader("Convergence History")
        fig2, ax2 = plt.subplots(figsize=(6, 3.5))
        ax2.plot(history, color='purple', linewidth=2, label=f"{method} Convergence")
        if bks:
            ax2.axhline(bks, color='green', linestyle='--', label=f'BKS Target ({bks})')
        ax2.set_xlabel("Iteration")
        ax2.set_ylabel("Global Best Cost")
        ax2.legend()
        ax2.grid(True, linestyle=":", alpha=0.5)
        st.pyplot(fig2)

        st.subheader("Dispatch Manifest")
        for i, r in enumerate(routes, 1):
            load = sum(demands[node] for node in r)
            st.write(f"**Truck {i}** `[Load {load}/{capacity}]`: `0 -> {' -> '.join(map(str, r))} -> 0`")
