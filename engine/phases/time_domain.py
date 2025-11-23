"""Phase 6: Time Domain Conversion

This module converts s-domain solutions to time-domain using
inverse Laplace transform and evaluates them numerically.

Author: Circuit Solver Project
Date: 2025
"""

import sympy
import numpy as np


def convert_to_time_domain(sol):
    """
    Converts s-domain solutions to time-domain and evaluates numerically.
    
    For each variable in the solution:
    1. Apply inverse Laplace transform
    2. Convert symbolic expression to numerical function
    3. Evaluate over time range [0, 10] seconds
    
    Args:
        sol (dict): Solution dictionary from equation solver
            Keys: SymPy symbols (V_*, I_*)
            Values: s-domain expressions
    
    Returns:
        tuple: (results, plot_data)
            - results: Dict mapping variable names to time-domain expressions (strings)
            - plot_data: Dict mapping variable names to numerical arrays for plotting
    """
    s = sympy.symbols('s')
    t = sympy.symbols('t', positive=True, real=True)
    
    results = {}
    plot_data = {}
    
    # Time points for evaluation (0 to 10 seconds)
    time_points = np.linspace(0, 10, 100)
    
    for var, expr in sol.items():
        var_name = str(var)
        
        # Apply inverse Laplace transform
        try:
            time_expr = sympy.inverse_laplace_transform(expr, s, t)
            results[var_name] = str(time_expr)
            
            # Convert to numerical function for plotting
            try:
                func = sympy.lambdify(t, time_expr, modules=['numpy'])
                
                # Evaluate at time points
                y_vals = func(time_points)
                
                # Handle scalar results (constants)
                if np.isscalar(y_vals):
                    y_vals = np.full_like(time_points, y_vals)
                
                plot_data[var_name] = y_vals.tolist()
                
            except Exception as e:
                plot_data[var_name] = f"Plot error: {str(e)}"
        
        except Exception as e:
            results[var_name] = f"Cannot compute inverse Laplace: {str(e)}"
    
    return results, plot_data, time_points
