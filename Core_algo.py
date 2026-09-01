import numpy as np

def generate_synthetic_instance(num_nodes=20, capacity=70, seed=None):
    if seed is not None:
        np.random.seed(seed)
    
    depot = [250.0, 250.0]
    customers = np.random.uniform(50.0, 450.0, size=(num_nodes - 1, 2))
    coords = np.vstack([depot, customers])
    
    diff = coords[:, None, :] - coords[None, :, :]
    base_dist = np.linalg.norm(diff, axis=-1)
    
    traffic = np.random.uniform(1.0, 1.8, size=(num_nodes, num_nodes))
    np.fill_diagonal(traffic, 1.0)
    cost_matrix = base_dist * traffic
    
    demands = np.hstack([[0], np.random.randint(10, 25, size=num_nodes - 1)])
    return coords, cost_matrix, demands, capacity


def decode_and_evaluate(position, demands, capacity, cost_matrix, return_routes=False):
    # Largest Order Value (LOV) continuous-to-discrete permutation mapping
    customer_order = np.argsort(position) + 1
    
    routes = []
    current_route = []
    current_load = 0
    
    for customer_id in customer_order:
        d = demands[customer_id]
        if current_load + d <= capacity:
            current_route.append(customer_id)
            current_load += d
        else:
            routes.append(current_route)
            current_route = [customer_id]
            current_load = d
            
    if current_route:
        routes.append(current_route)
        
    total_cost = 0.0
    for route in routes:
        total_cost += cost_matrix[0, route[0]]
        for i in range(len(route) - 1):
            total_cost += cost_matrix[route[i], route[i + 1]]
        total_cost += cost_matrix[route[-1], 0]
        
    if return_routes:
        return routes, total_cost
    return total_cost


def solve_cvrp(demands, capacity, cost_matrix, method="GAQPSO", num_particles=40, max_iter=200):
    dim = len(demands) - 1
    M = num_particles
    
    X = np.random.uniform(-5.0, 5.0, size=(M, dim))
    P = X.copy()
    P_fit = np.array([decode_and_evaluate(P[i], demands, capacity, cost_matrix) for i in range(M)])
    
    g_idx = np.argmin(P_fit)
    G = P[g_idx].copy()
    G_fit = P_fit[g_idx]
    
    if method == "PSO":
        V = np.random.uniform(-1.0, 1.0, size=(M, dim))
        w, c1, c2 = 0.729, 1.494, 1.494

    convergence = [G_fit]
    
    for t in range(1, max_iter + 1):
        if method == "PSO":
            r1 = np.random.rand(M, dim)
            r2 = np.random.rand(M, dim)
            V = w * V + c1 * r1 * (P - X) + c2 * r2 * (G - X)
            V = np.clip(V, -3.0, 3.0)
            X = X + V
        else:
            # Contraction-Expansion coefficient alpha(t)
            alpha = 1.0 - 0.6 * (t / max_iter)
            mbest = np.mean(P, axis=0)
            phi = np.random.uniform(0.0, 1.0, size=(M, dim))
            p_local = (phi * P) + ((1.0 - phi) * G)
            
            if method == "DELTA_QPSO":
                # Inverse Transform Sampling: x = p ± alpha * |mbest - X| * ln(1/u)
                u = np.random.uniform(1e-12, 1.0, size=(M, dim))
                signs = np.where(np.random.rand(M, dim) < 0.5, 1.0, -1.0)
                step = alpha * np.abs(mbest - X) * np.log(1.0 / u)
                X = p_local + (signs * step)
            elif method == "GAQPSO":
                # Gaussian Wave-Packet: x ~ N(p_local, alpha * |mbest - X|)
                sigma = alpha * np.abs(mbest - X)
                X = np.random.normal(loc=p_local, scale=sigma + 1e-9)
        
        for i in range(M):
            fitness = decode_and_evaluate(X[i], demands, capacity, cost_matrix)
            if fitness < P_fit[i]:
                P_fit[i] = fitness
                P[i] = X[i].copy()
                if fitness < G_fit:
                    G_fit = fitness
                    G = X[i].copy()
                    
        convergence.append(G_fit)
        
    best_routes, best_cost = decode_and_evaluate(G, demands, capacity, cost_matrix, return_routes=True)
    return best_routes, best_cost, convergence
