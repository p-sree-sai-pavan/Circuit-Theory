"""Phase 2: Spanning Tree Selection

This module selects a spanning tree from the circuit graph using
a weighted minimum spanning tree algorithm. Voltage sources are
preferred in the tree, current sources in the co-tree.

Author: Circuit Solver Project
Date: 2025
"""

import networkx as nx


def select_tree(graph, branches):
    """
    Selects a spanning tree and partitions branches into twigs and links.
    
    Strategy:
    - Voltage sources are assigned weight 0 (preferred in tree)
    - Current sources are assigned weight 100 (preferred in co-tree)
    - Other components are assigned weight 1
    
    Args:
        graph (nx.MultiGraph): NetworkX graph of the circuit
        branches (list): List of branch dictionaries
    
    Returns:
        tuple: (twigs, links, sorted_branches)
            - twigs: List of branch dicts in the spanning tree
            - links: List of branch dicts in the co-tree
            - sorted_branches: Combined list [twigs + links]
    """
    # Assign weights based on component type
    for u, v, k, d in graph.edges(keys=True, data=True):
        w = 1  # Default weight
        if d['type'] == 'V':
            w = 0  # Voltage sources preferred in tree
        elif d['type'] == 'I':
            w = 100  # Current sources preferred in co-tree
        graph[u][v][k]['weight'] = w
    
    # Find minimum spanning tree
    mst_edges = nx.minimum_spanning_edges(graph, keys=True, data=True, weight='weight')
    tree_branch_ids = [e[2] for e in mst_edges]  # e[2] is the key (branch ID)
    
    # Partition branches
    twigs = [b for b in branches if b['id'] in tree_branch_ids]
    links = [b for b in branches if b['id'] not in tree_branch_ids]
    
    # Combine: [Twigs first, Links second]
    sorted_branches = twigs + links
    
    return twigs, links, sorted_branches
