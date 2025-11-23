"""Phase 4: Equation Formulation

This module builds the system of equations for circuit analysis:
- KCL equations from Cut Set Matrix
- KVL equations from Tie Set Matrix
- V-I relations for each component in s-domain

Author: Circuit Solver Project
Date: 2025
"""

import sympy


def build_equations(sorted_branches, Q, B, n_twigs, n_links):
    """
    Builds the complete system of equations in the Laplace domain.
    
    Creates symbolic equations for:
    1. KCL (Kirchhoff's Current Law): Q * I = 0
    2. KVL (Kirchhoff's Voltage Law): B * V = 0
    3. V-I Relations for each component:
       - Resistor: V = I·R
       - Inductor: V = I·sL
       - Capacitor: V = I/(sC)
       - Voltage Source: V = Vs/s
       - Current Source: I = Is/s
    
    Args:
        sorted_branches (list): List of branch dicts [twigs + links]
        Q (np.array): Cut set matrix (n_twigs x n_branches)
        B (np.array): Tie set matrix (n_links x n_branches)
        n_twigs (int): Number of tree branches
        n_links (int): Number of co-tree branches
    
    Returns:
        tuple: (equations, unknowns)
            - equations: List of SymPy equations
            - unknowns: List of SymPy symbols (V and I for each branch)
    """
    s = sympy.symbols('s')  # Laplace variable
    
    # Create symbolic variables for branch voltages and currents
    V_sym = [sympy.symbols(f'V_{b["id"]}') for b in sorted_branches]
    I_sym = [sympy.symbols(f'I_{b["id"]}') for b in sorted_branches]
    
    equations = []
    
    # ========== KCL Equations: Q * I = 0 ==========
    for i in range(n_twigs):
        eqn = 0
        for j in range(len(sorted_branches)):
            eqn += Q[i, j] * I_sym[j]
        equations.append(eqn)
    
    # ========== KVL Equations: B * V = 0 ==========
    for i in range(n_links):
        eqn = 0
        for j in range(len(sorted_branches)):
            eqn += B[i, j] * V_sym[j]
        equations.append(eqn)
    
    # ========== V-I Relations (Component Equations) ==========
    for i, b in enumerate(sorted_branches):
        val = b['value']
        type_ = b['type']
        
        if type_ == 'R':
            # Resistor: V = I·R
            equations.append(V_sym[i] - I_sym[i] * val)
            
        elif type_ == 'L':
            # Inductor: V = I·sL (zero initial conditions)
            equations.append(V_sym[i] - I_sym[i] * s * val)
            
        elif type_ == 'C':
            # Capacitor: V = I/(sC)
            equations.append(V_sym[i] - I_sym[i] * (1 / (s * val)))
            
        elif type_ == 'V':
            # Voltage Source: V = Vs/s (step input)
            equations.append(V_sym[i] - val / s)
            
        elif type_ == 'I':
            # Current Source: I = Is/s (step input)
            equations.append(I_sym[i] - val / s)
    
    # Combine all unknowns
    unknowns = V_sym + I_sym
    
    return equations, unknowns
