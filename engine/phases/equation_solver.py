"""Phase 5: Symbolic Equation Solving

This module solves the system of equations using SymPy's
symbolic solver to obtain s-domain solutions.

Author: Circuit Solver Project
Date: 2025
"""

import sympy


def solve_equations(equations, unknowns):
    """
    Solves the system of symbolic equations in the Laplace domain.
    
    Uses SymPy's solve() function to find symbolic expressions
    for all voltages and currents in terms of s.
    
    Args:
        equations (list): List of SymPy equations
        unknowns (list): List of SymPy symbols to solve for
    
    Returns:
        dict: Solution dictionary mapping symbols to s-domain expressions
            Example: {V_R1: 10/(s*(s+2)), I_R1: 2/(s+2), ...}
    """
    # Solve the system symbolically
    sol = sympy.solve(equations, unknowns)
    
    return sol
