"""Phase 3: Matrix Formation

This module generates the fundamental circuit matrices:
- Incidence Matrix (A): Node-branch connectivity
- Cut Set Matrix (Q): KCL equations
- Tie Set Matrix (B): KVL equations

Author: Circuit Solver Project
Date: 2025
"""

import numpy as np


def get_incidence_matrix(graph, nodes, branches):
    """
    Generates the reduced incidence matrix for the circuit.
    
    The incidence matrix A shows how branches connect to nodes:
    - A[i][j] = +1 if current flows from node i through branch j
    - A[i][j] = -1 if current flows to node i through branch j
    - A[i][j] = 0 otherwise
    
    The reduced matrix excludes the reference node (usually '0').
    
    Args:
        graph (nx.MultiGraph): Circuit graph
        nodes (list): List of node identifiers
        branches (list): List of branch dictionaries (should be sorted)
    
    Returns:
        tuple: (A_reduced, A_full, ref_node_idx)
            - A_reduced: (n-1) x b matrix
            - A_full: n x b matrix
            - ref_node_idx: Index of reference node that was removed
    """
    node_map = {n: i for i, n in enumerate(nodes)}
    branch_map = {b['id']: i for i, b in enumerate(branches)}
    
    n_nodes = len(nodes)
    n_branches = len(branches)
    
    # Initialize full incidence matrix
    A_full = np.zeros((n_nodes, n_branches))
    
    # Fill matrix based on branch connections
    for b in branches:
        u, v = b['from'], b['to']
        b_idx = branch_map[b['id']]
        u_idx = node_map[u]
        v_idx = node_map[v]
        
        # Current leaves u (+1), enters v (-1)
        A_full[u_idx, b_idx] = 1
        A_full[v_idx, b_idx] = -1
    
    # Remove reference node row (node '0' if present, else last node)
    ref_node_idx = node_map.get('0', n_nodes - 1)
    A_reduced = np.delete(A_full, ref_node_idx, axis=0)
    
    return A_reduced, A_full, ref_node_idx


def get_cutset_matrix(A_red, n_twigs, n_links):
    """
    Generates the Cut Set Matrix from the incidence matrix.
    
    The Cut Set Matrix Q represents KCL equations:
    Q * I = 0 (current conservation at each node)
    
    Formula: Q = [I | Q_l] where Q_l = -(A_t)^(-1) * A_l
    
    Args:
        A_red (np.array): Reduced incidence matrix (n-1) x b
        n_twigs (int): Number of tree branches
        n_links (int): Number of co-tree branches
    
    Returns:
        tuple: (Q, error_dict or None)
            - Q: Cut set matrix (n_twigs x n_branches)
            - error_dict: Error information if matrix is singular, None otherwise
    """
    # Partition incidence matrix: A = [A_t | A_l]
    A_t = A_red[:, :n_twigs]  # Tree branches
    A_l = A_red[:, n_twigs:]  # Link branches
    
    # Invert tree submatrix
    try:
        A_t_inv = np.linalg.inv(A_t)
    except np.linalg.LinAlgError as e:
        return None, {
            "status": "error",
            "message": f"Singular matrix error: Cannot invert tree submatrix. Check circuit topology. Details: {str(e)}"
        }
    
    # Calculate Q_l and construct Q
    Q_l = -np.dot(A_t_inv, A_l)
    Q = np.hstack((np.eye(n_twigs), Q_l))
    
    return Q, None


def get_tieset_matrix(Q_l, n_twigs, n_links):
    """
    Generates the Tie Set Matrix from the Cut Set Matrix.
    
    The Tie Set Matrix B represents KVL equations:
    B * V = 0 (voltage sum around each loop)
    
    Formula: B = [B_t | I] where B_t = -Q_l^T
    
    Args:
        Q_l (np.array): Link portion of cut set matrix
        n_twigs (int): Number of tree branches
        n_links (int): Number of co-tree branches
    
    Returns:
        np.array: Tie set matrix (n_links x n_branches)
    """
    B_t = -Q_l.T
    B = np.hstack((B_t, np.eye(n_links)))
    
    return B
