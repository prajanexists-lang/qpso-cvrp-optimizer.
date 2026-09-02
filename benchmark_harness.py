import numpy as np
import urllib.request
import pandas as pd
from solver_engine import solve_cvrp

def load_augerat_benchmark():
    """Loads Augerat A-n32-k5 benchmark instance (BKS = 784)."""
    url = "http://vrp.galgos.inf.puc-rio.br/media/com_vrp/instances/A/A-n32-k5.vrp"
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req) as resp:
            lines = [l.decode('utf-8').strip() for l in resp.readlines()]
    except Exception:
        # Static local fallback if offline
        lines = [
            "DIMENSION : 32", "CAPACITY : 100", "NODE_COORD_SECTION",
            "1 82 76", "2 96 44", "3 50 5", "4 49 8", "5 13 7", "6 29 89",
            "7 58 30", "8 84 39", "9 14 24", "10 2 39", "11 3 82", "12 5 10",
            "13 98 52", "14 84 25", "15 61 59", "16 1 65", "17 88 51", "18 91 2",
            "19 19 32", "20 93 3", "21 11 94", "22 5 79", "23 5 59", "24 8 20",
            "25 42 7", "26 61 40", "27 9 4", "28 80 68", "29 57 76", "30 23 76",
            "31 85 76", "32 98 24", "DEMAND_SECTION",
            "1 0", "2 19", "3 21", "4 6", "5 19", "6 7", "7 12", "8 16", "9 6",
            "10 16", "11 8", "12 14", "13 21", "14 16", "15 3", "16 22", "17 18",
            "18 19", "19 1", "20 24", "21 8", "22 12", "23 4", "24 8", "25 24",
            "26 24", "27 2", "28 20", "29 15", "30 2", "31 14", "32 9", "DEPOT_SECTION", "1", "-1"
        ]

    capacity = 100
    coords, demands = {}, {}
    mode = None

    for line in lines:
        if line.startswith("CAPACITY"):
            capacity = int(line.split()[-1])
        elif line.startswith("NODE_COORD_SECTION"):
            mode = "COORD"
        elif line.startswith("DEMAND_SECTION"):
            mode = "DEMAND"
        elif line.startswith("DEPOT_SECTION"):
            mode = "DEPOT"
        elif mode == "COORD" and line and not line.startswith("DEMAND"):
            parts = line.split()
            if len(parts) >= 3:
                coords[int(parts[0])] = (float(parts[1]), float(parts[2]))
        elif mode == "DEMAND" and line and not line.startswith("DEPOT"):
            parts = line.split()
            if len(parts) >= 2:
                demands[int(parts[0])] = int(parts[1])

    N = len(coords)
    cost_matrix = np.zeros((N, N))
    for i in range(1, N + 1):
        for j in range(1, N + 1):
            cost_matrix[i-1, j-1] = np.linalg.norm(np.array(coords[i]) - np.array(coords[j]))

    ordered_demands = [demands[i] for i in range(1, N + 1)]
    return coords, cost_matrix, ordered_demands, capacity, 784.0

def run_30_trial_test():
    coords, cost_mat, demands, capacity, bks = load_augerat_benchmark()
    methods = ["PSO", "DELTA_QPSO", "GAQPSO"]
    trials = 30
    summary = []

    print("=" * 70)
    print(f"BENCHMARK: Augerat A-n32-k5 | BKS: {bks} | Trials per Algo: {trials}")
    print("=" * 70)

    for m in methods:
        print(f"Executing 30 randomized runs for {m}...")
        costs = []
        for _ in range(trials):
            _, cost, _ = solve_cvrp(demands, capacity, cost_mat, method=m, num_particles=40, max_iter=250)
            costs.append(cost)
        
        best = np.min(costs)
        mean = np.mean(costs)
        std = np.std(costs)
        gap = ((mean - bks) / bks) * 100.0
        
        summary.append({
            "Method": m,
            "Best Cost": round(best, 2),
            "Mean Cost (μ)": round(mean, 2),
            "Std Dev (σ)": round(std, 2),
            "Gap to BKS (%)": f"{gap:+.2f}%"
        })

    df = pd.DataFrame(summary)
    print("\n" + df.to_string(index=False))
    print("=" * 70)

if __name__ == "__main__":
    run_30_trial_test()
