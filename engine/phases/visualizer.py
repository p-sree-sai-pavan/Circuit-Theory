"""Phase 7: Visualization

This module generates matplotlib plots for time-domain responses
and encodes them as base64 images for web display.

Author: Circuit Solver Project
Date: 2025
"""

import matplotlib
matplotlib.use('Agg')  # Non-interactive backend
import matplotlib.pyplot as plt
import io
import base64


def generate_plots(plot_data, time_points):
    """
    Generates time-domain plots and encodes them as base64 images.
    
    Creates a separate plot for each variable showing its variation
    over time. Images are encoded in base64 format for embedding
    in JSON responses.
    
    Args:
        plot_data (dict): Mapping of variable names to numerical arrays
        time_points (np.array): Time values for x-axis
    
    Returns:
        list: List of dictionaries with keys:
            - name: Variable name
            - image: Base64-encoded PNG image
    """
    images = []
    
    for var_name, y_vals in plot_data.items():
        # Skip if there was an error computing values
        if isinstance(y_vals, str):
            continue
        
        # Create plot
        plt.figure(figsize=(8, 5))
        plt.plot(time_points, y_vals, linewidth=2)
        plt.title(f"{var_name} vs Time", fontsize=14, fontweight='bold')
        plt.xlabel("Time (s)", fontsize=12)
        plt.ylabel(var_name, fontsize=12)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        # Encode as base64
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100)
        buf.seek(0)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        
        images.append({
            "name": var_name,
            "image": img_base64
        })
        
        plt.close()
    
    return images
