"""Circuit Solver - Main Orchestrator

This module orchestrates the 7 phases of circuit analysis:
1. Graph Builder - Circuit to graph conversion & validation
2. Tree Selector - Spanning tree selection
3. Matrix Generator - Incidence, Cut Set, and Tie Set matrices
4. Equation Builder - KCL, KVL, and V-I equation formulation
5. Equation Solver - Symbolic solution in s-domain
6. Time Domain - Inverse Laplace transform
7. Visualizer - Plot generation

Author: Circuit Solver Project
Date: 2025
"""

import sys
import json

# Import all phase modules
from phases import (
    build_graph,
    select_tree,
    get_incidence_matrix,
    get_cutset_matrix,
    get_tieset_matrix,
    build_equations,
    solve_equations,
    convert_to_time_domain,
    generate_plots
)


def solve_circuit(circuit_data):
    """
    Main orchestrator function that executes all 7 phases of circuit analysis.
    
    Args:
        circuit_data (dict): Circuit specification with 'nodes' and 'branches'
    
    Returns:
        dict: Analysis results containing:
            - status: 'success' or 'error'
            - equations: s-domain symbolic solutions
            - time_domain: Time-domain expressions
            - plots: Base64-encoded plot images
            - message: Error message (if status is 'error')
    """
    nodes = circuit_data['nodes']
    branches = circuit_data['branches']
    
    # ========== PHASE 1: Graph Construction & Validation ==========
    graph, error = build_graph(circuit_data)
    if error:
        return error
    
    # ========== PHASE 2: Spanning Tree Selection ==========
    twigs, links, sorted_branches = select_tree(graph, branches)
    n_twigs = len(twigs)
    n_links = len(links)
    
    # ========== PHASE 3: Matrix Formation ==========
    # 3a. Incidence Matrix
    A_red, A_full, ref_node = get_incidence_matrix(graph, nodes, sorted_branches)
    
    # 3b. Cut Set Matrix (KCL)
    Q, error = get_cutset_matrix(A_red, n_twigs, n_links)
    if error:
        return error
    
    # 3c. Tie Set Matrix (KVL)
    B = get_tieset_matrix(Q[:, n_twigs:], n_twigs, n_links)
    
    # ========== PHASE 4: Equation Formulation ==========
    equations, unknowns = build_equations(sorted_branches, Q, B, n_twigs, n_links)
    
    # ========== PHASE 5: Symbolic Solving ==========
    sol = solve_equations(equations, unknowns)
    
    # ========== PHASE 6: Time Domain Conversion ==========
    results, plot_data, time_points = convert_to_time_domain(sol)
    
    # ========== PHASE 7: Visualization ==========
    images = generate_plots(plot_data, time_points)
    
    # ========== Return Results ==========
    return {
        "status": "success",
        "equations": {str(k): str(v) for k, v in sol.items()},
        "time_domain": results,
        "plots": images
    }


if __name__ == "__main__":
    # Read input from stdin
    try:
        input_data = sys.stdin.read().strip()
        if not input_data:
            # Test Case: Series RLC
            circuit_data = {
                "nodes": ["0", "1", "2"],
                "branches": [
                    {"id": "V1", "from": "1", "to": "0", "type": "V", "value": 10},
                    {"id": "R1", "from": "1", "to": "2", "type": "R", "value": 5},
                    {"id": "C1", "from": "2", "to": "0", "type": "C", "value": 0.1}
                ]
            }
        else:
            circuit_data = json.loads(input_data)
        
        result = solve_circuit(circuit_data)
        print(json.dumps(result))
    except json.JSONDecodeError as e:
        print(json.dumps({"status": "error", "message": f"Invalid JSON input: {str(e)}"}), file=sys.stderr)
    except KeyError as e:
        print(json.dumps({"status": "error", "message": f"Missing required field: {str(e)}"}), file=sys.stderr)
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(json.dumps({
            "status": "error", 
            "message": f"Unexpected error: {str(e)}",
            "details": error_details
        }), file=sys.stderr)
