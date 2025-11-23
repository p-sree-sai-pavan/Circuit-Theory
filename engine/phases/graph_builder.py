"""Phase 1: Graph Construction & Validation

This module converts circuit data into a NetworkX graph representation
and validates connectivity.

Author: Circuit Solver Project
Date: 2025
"""

import networkx as nx


def build_graph(circuit_data):
    """
    Builds a NetworkX graph from circuit data and validates connectivity.
    
    Args:
        circuit_data (dict): Dictionary containing 'nodes' and 'branches'
            - nodes: List of node identifiers (strings)
            - branches: List of branch dictionaries with keys:
                - id: Branch identifier
                - from: Source node
                - to: Destination node
                - type: Component type (R, L, C, V, I)
                - value: Component value (numeric)
    
    Returns:
        tuple: (graph, error_dict or None)
            - graph: NetworkX MultiGraph object (or None if error)
            - error_dict: Error information if validation fails, None otherwise
    
    Raises:
        None (returns error dict instead)
    """
    nodes = circuit_data['nodes']
    branches = circuit_data['branches']
    
    # Create MultiGraph (allows multiple edges between same nodes)
    G = nx.MultiGraph()
    G.add_nodes_from(nodes)
    
    # Add branches as edges
    for b in branches:
        G.add_edge(
            b['from'], 
            b['to'], 
            key=b['id'], 
            type=b['type'], 
            value=b['value']
        )
    
    # Validate connectivity
    if not nx.is_connected(G):
        return None, {
            "status": "error",
            "message": "Circuit is not connected. All nodes must form a connected graph with node '0' as reference."
        }
    
    return G, None
