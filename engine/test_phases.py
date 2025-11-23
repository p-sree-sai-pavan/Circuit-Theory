import json
import sys
sys.path.insert(0, 'c:/Users/pavan/Downloads/circuit - Copy/engine')

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

# Test circuit
circuit_data = {
    "nodes": ["0", "1", "2"],
    "branches": [
        {"id": "V1", "from": "1", "to": "0", "type": "V", "value": 10},
        {"id": "R1", "from": "1", "to": "2", "type": "R", "value": 5},
        {"id": "C1", "from": "2", "to": "0", "type": "C", "value": 0.1}
    ]
}

try:
    # Phase 1
    print("Phase 1: Building graph...")
    graph, error = build_graph(circuit_data)
    if error:
        print(f"ERROR in Phase 1: {error}")
        sys.exit(1)
    print("Phase 1: SUCCESS")
    
    # Phase 2
    print("Phase 2: Selecting tree...")
    twigs, links, sorted_branches = select_tree(graph, circuit_data['branches'])
    print(f"Phase 2: SUCCESS - Twigs: {len(twigs)}, Links: {len(links)}")
    
    # Phase 3
    print("Phase 3: Generating matrices...")
    A_red, A_full, ref_node = get_incidence_matrix(graph, circuit_data['nodes'], sorted_branches)
    print(f"Phase 3a: Incidence matrix SUCCESS - Shape: {A_red.shape}")
    
    Q, error = get_cutset_matrix(A_red, len(twigs), len(links))
    if error:
        print(f"ERROR in Phase 3b: {error}")
        sys.exit(1)
    print(f"Phase 3b: Cut set matrix SUCCESS - Shape: {Q.shape}")
    
    B = get_tieset_matrix(Q[:, len(twigs):], len(twigs), len(links))
    print(f"Phase 3c: Tie set matrix SUCCESS - Shape: {B.shape}")
    
    # Phase 4
    print("Phase 4: Building equations...")
    equations, unknowns = build_equations(sorted_branches, Q, B, len(twigs), len(links))
    print(f"Phase 4: SUCCESS - Equations: {len(equations)}, Unknowns: {len(unknowns)}")
    
    # Phase 5
    print("Phase 5: Solving equations...")
    sol = solve_equations(equations, unknowns)
    print(f"Phase 5: SUCCESS - Solutions: {len(sol)}")
    
    # Phase 6
    print("Phase 6: Converting to time domain...")
    results, plot_data, time_points = convert_to_time_domain(sol)
    print(f"Phase 6: SUCCESS - Results: {len(results)}")
    
    # Phase 7
    print("Phase 7: Generating plots...")
    images = generate_plots(plot_data, time_points)
    print(f"Phase 7: SUCCESS - Images: {len(images)}")
    
    print("\n✅ ALL PHASES COMPLETED SUCCESSFULLY!")
    
except Exception as e:
    import traceback
    print(f"\n❌ ERROR: {str(e)}")
    print("\nTraceback:")
    print(traceback.format_exc())
    sys.exit(1)
