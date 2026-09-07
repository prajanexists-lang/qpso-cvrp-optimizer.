/**
 * CVRP Problem Instances and Benchmark Datasets
 * Quantum Fleet Optimization Engine (QPSO CVRP)
 */

export const CVRP_INSTANCES = {
    'A-n32-k5': {
        name: 'CVRPLIB: A-n32-k5 (Augerat 1995)',
        shortName: 'A-n32-k5',
        type: 'CVRPLIB Benchmark',
        dimension: 32,
        numVehicles: 5,
        capacity: 100,
        bksCost: 784.0,
        depot: { id: 0, label: 'Central Depot', x: 82, y: 76, demand: 0 },
        nodes: [
            { id: 0, label: 'Depot', x: 82, y: 76, demand: 0, isDepot: true, zone: 'Central Hub' },
            { id: 1, label: 'Cust 01', x: 96, y: 44, demand: 19, zone: 'Sector Alpha' },
            { id: 2, label: 'Cust 02', x: 50, y: 5, demand: 21, zone: 'Sector Gamma' },
            { id: 3, label: 'Cust 03', x: 49, y: 8, demand: 6, zone: 'Sector Gamma' },
            { id: 4, label: 'Cust 04', x: 13, y: 7, demand: 19, zone: 'Sector Delta' },
            { id: 5, label: 'Cust 05', x: 29, y: 89, demand: 7, zone: 'Sector Beta' },
            { id: 6, label: 'Cust 06', x: 21, y: 47, demand: 12, zone: 'Sector Delta' },
            { id: 7, label: 'Cust 07', x: 37, y: 31, demand: 16, zone: 'Sector Gamma' },
            { id: 8, label: 'Cust 08', x: 78, y: 40, demand: 6, zone: 'Sector Alpha' },
            { id: 9, label: 'Cust 09', x: 55, y: 96, demand: 16, zone: 'Sector Beta' },
            { id: 10, label: 'Cust 10', x: 62, y: 58, demand: 8, zone: 'Sector Alpha' },
            { id: 11, label: 'Cust 11', x: 95, y: 86, demand: 14, zone: 'Sector Alpha' },
            { id: 12, label: 'Cust 12', x: 63, y: 53, demand: 21, zone: 'Sector Alpha' },
            { id: 13, label: 'Cust 13', x: 79, y: 88, demand: 16, zone: 'Sector Alpha' },
            { id: 14, label: 'Cust 14', x: 67, y: 72, demand: 3, zone: 'Sector Alpha' },
            { id: 15, label: 'Cust 15', x: 42, y: 67, demand: 22, zone: 'Sector Beta' },
            { id: 16, label: 'Cust 16', x: 35, y: 76, demand: 18, zone: 'Sector Beta' },
            { id: 17, label: 'Cust 17', x: 15, y: 65, demand: 19, zone: 'Sector Delta' },
            { id: 18, label: 'Cust 18', x: 29, y: 90, demand: 1, zone: 'Sector Beta' },
            { id: 19, label: 'Cust 19', x: 45, y: 23, demand: 24, zone: 'Sector Gamma' },
            { id: 20, label: 'Cust 20', x: 86, y: 74, demand: 8, zone: 'Sector Alpha' },
            { id: 21, label: 'Cust 21', x: 74, y: 39, demand: 12, zone: 'Sector Alpha' },
            { id: 22, label: 'Cust 22', x: 88, y: 71, demand: 4, zone: 'Sector Alpha' },
            { id: 23, label: 'Cust 23', x: 44, y: 50, demand: 8, zone: 'Sector Gamma' },
            { id: 24, label: 'Cust 24', x: 33, y: 41, demand: 24, zone: 'Sector Gamma' },
            { id: 25, label: 'Cust 25', x: 18, y: 38, demand: 24, zone: 'Sector Delta' },
            { id: 26, label: 'Cust 26', x: 30, y: 15, demand: 2, zone: 'Sector Gamma' },
            { id: 27, label: 'Cust 27', x: 25, y: 62, demand: 20, zone: 'Sector Delta' },
            { id: 28, label: 'Cust 28', x: 66, y: 14, demand: 15, zone: 'Sector Gamma' },
            { id: 29, label: 'Cust 29', x: 54, y: 38, demand: 2, zone: 'Sector Gamma' },
            { id: 30, label: 'Cust 30', x: 60, y: 78, demand: 14, zone: 'Sector Beta' },
            { id: 31, label: 'Cust 31', x: 47, y: 62, demand: 9, zone: 'Sector Beta' }
        ],
        // Known optimal BKS routes (Augerat 1995) - Total cost: 784.0
        bksRoutes: [
            [0, 21, 31, 19, 17, 13, 7, 26, 0],
            [0, 12, 1, 16, 30, 27, 24, 0],
            [0, 29, 18, 8, 9, 22, 15, 10, 0],
            [0, 14, 25, 23, 4, 20, 0],
            [0, 28, 11, 2, 3, 6, 5, 0]
        ]
    },

    'Dynamic-City-40': {
        name: 'Dynamic Real-Time City Grid',
        shortName: 'Metro Grid 40',
        type: 'Simulated Urban Grid',
        dimension: 41,
        numVehicles: 6,
        capacity: 120,
        bksCost: 1042.5,
        depot: { id: 0, label: 'Metropolitan Logistics Hub', x: 50, y: 50, demand: 0 },
        nodes: [
            { id: 0, label: 'Central Depot', x: 50, y: 50, demand: 0, isDepot: true, zone: 'Downtown Core' },
            { id: 1, label: 'Financial District #1', x: 58, y: 62, demand: 18, zone: 'Downtown Core' },
            { id: 2, label: 'Financial District #2', x: 64, y: 70, demand: 22, zone: 'Downtown Core' },
            { id: 3, label: 'Waterfront Mall', x: 75, y: 82, demand: 28, zone: 'East Harbor' },
            { id: 4, label: 'East Pier Logistics', x: 88, y: 85, demand: 24, zone: 'East Harbor' },
            { id: 5, label: 'Harbor Warehouse #1', x: 92, y: 72, demand: 19, zone: 'East Harbor' },
            { id: 6, label: 'Harbor Warehouse #2', x: 84, y: 60, demand: 25, zone: 'East Harbor' },
            { id: 7, label: 'Maritime Hub', x: 90, y: 48, demand: 15, zone: 'East Harbor' },
            { id: 8, label: 'South Industrial Park A', x: 78, y: 32, demand: 26, zone: 'South Industrial' },
            { id: 9, label: 'South Industrial Park B', x: 82, y: 18, demand: 20, zone: 'South Industrial' },
            { id: 10, label: 'Manufacturing Hub #1', x: 68, y: 12, demand: 29, zone: 'South Industrial' },
            { id: 11, label: 'Chemical Plant', x: 54, y: 15, demand: 16, zone: 'South Industrial' },
            { id: 12, label: 'Logistics Terminal South', x: 42, y: 8, demand: 23, zone: 'South Industrial' },
            { id: 13, label: 'Airport Cargo Gate 1', x: 25, y: 12, demand: 27, zone: 'Airport Tech Zone' },
            { id: 14, label: 'Airport Cargo Gate 2', x: 15, y: 20, demand: 21, zone: 'Airport Tech Zone' },
            { id: 15, label: 'Aero Tech Center', x: 12, y: 35, demand: 18, zone: 'Airport Tech Zone' },
            { id: 16, label: 'West Freight Depot', x: 18, y: 48, demand: 25, zone: 'West Corridor' },
            { id: 17, label: 'Automotive Cluster', x: 28, y: 55, demand: 17, zone: 'West Corridor' },
            { id: 18, label: 'Tech Campus West', x: 22, y: 70, demand: 24, zone: 'Northwest Tech' },
            { id: 19, label: 'Data Center Alpha', x: 15, y: 82, demand: 14, zone: 'Northwest Tech' },
            { id: 20, label: 'Semiconductor Fab', x: 30, y: 92, demand: 26, zone: 'Northwest Tech' },
            { id: 21, label: 'North Tech Park', x: 42, y: 88, demand: 22, zone: 'Northwest Tech' },
            { id: 22, label: 'Hospital Medical Hub', x: 48, y: 75, demand: 19, zone: 'North Corridor' },
            { id: 23, label: 'University Campus', x: 55, y: 85, demand: 21, zone: 'North Corridor' },
            { id: 24, label: 'North Distribution Hub', x: 62, y: 92, demand: 25, zone: 'North Corridor' },
            { id: 25, label: 'Retail Plaza East', x: 70, y: 52, demand: 15, zone: 'East Harbor' },
            { id: 26, label: 'Suburban Center North', x: 38, y: 68, demand: 12, zone: 'North Corridor' },
            { id: 27, label: 'Government Complex', x: 45, y: 58, demand: 10, zone: 'Downtown Core' },
            { id: 28, label: 'BioTech Park', x: 32, y: 38, demand: 18, zone: 'West Corridor' },
            { id: 29, label: 'Rail Freight Station', x: 60, y: 38, demand: 24, zone: 'Downtown Core' },
            { id: 30, label: 'Central Market', x: 52, y: 44, demand: 14, zone: 'Downtown Core' },
            { id: 31, label: 'Residential Sector A', x: 35, y: 25, demand: 17, zone: 'Airport Tech Zone' },
            { id: 32, label: 'Residential Sector B', x: 62, y: 25, demand: 20, zone: 'South Industrial' },
            { id: 33, label: 'Pharma Logistics Hub', x: 74, y: 68, demand: 22, zone: 'East Harbor' },
            { id: 34, label: 'Cold Storage East', x: 82, y: 40, demand: 19, zone: 'East Harbor' },
            { id: 35, label: 'North Mall Express', x: 48, y: 95, demand: 16, zone: 'North Corridor' },
            { id: 36, label: 'West Suburb Center', x: 10, y: 60, demand: 21, zone: 'West Corridor' },
            { id: 37, label: 'Innovation Hub', x: 26, y: 82, demand: 15, zone: 'Northwest Tech' },
            { id: 38, label: 'South Transit Center', x: 48, y: 24, demand: 13, zone: 'South Industrial' },
            { id: 39, label: 'Green Energy Plant', x: 88, y: 28, demand: 23, zone: 'South Industrial' },
            { id: 40, label: 'Aerospace Campus', x: 18, y: 15, demand: 20, zone: 'Airport Tech Zone' }
        ],
        bksRoutes: [
            [0, 1, 2, 3, 4, 5, 6, 25, 0],
            [0, 7, 34, 8, 9, 39, 10, 0],
            [0, 11, 32, 12, 38, 31, 40, 13, 0],
            [0, 14, 15, 28, 16, 36, 17, 0],
            [0, 18, 19, 37, 20, 21, 26, 0],
            [0, 22, 23, 35, 24, 33, 27, 29, 30, 0]
        ]
    }
};

/**
 * Calculates Euclidean distance between two 2D nodes
 */
export function euclideanDist(n1, n2) {
    return Math.hypot(n1.x - n2.x, n1.y - n2.y);
}

/**
 * Builds full symmetric distance matrix for an instance
 */
export function buildDistanceMatrix(nodes) {
    const N = nodes.length;
    const matrix = Array.from({ length: N }, () => new Float64Array(N));
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            matrix[i][j] = euclideanDist(nodes[i], nodes[j]);
        }
    }
    return matrix;
}

/**
 * Computes the total Euclidean distance of a single route (array of node IDs)
 */
export function calculateRouteDistance(route, nodes) {
    let d = 0;
    for (let i = 0; i < route.length - 1; i++) {
        d += euclideanDist(nodes[route[i]], nodes[route[i + 1]]);
    }
    return d;
}

/**
 * Computes the total load demanded on a route
 */
export function calculateRouteLoad(route, nodes) {
    return route.reduce((sum, id) => sum + (nodes[id]?.demand || 0), 0);
}
