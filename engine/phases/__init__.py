"""Circuit Solver - Phase-based Modules

This package contains the 7 distinct phases of circuit analysis:
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

from .graph_builder import build_graph
from .tree_selector import select_tree
from .matrix_generator import get_incidence_matrix, get_cutset_matrix, get_tieset_matrix
from .equation_builder import build_equations
from .equation_solver import solve_equations
from .time_domain import convert_to_time_domain
from .visualizer import generate_plots

__all__ = [
    'build_graph',
    'select_tree',
    'get_incidence_matrix',
    'get_cutset_matrix',
    'get_tieset_matrix',
    'build_equations',
    'solve_equations',
    'convert_to_time_domain',
    'generate_plots'
]
