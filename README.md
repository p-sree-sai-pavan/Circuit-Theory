# 🔌 Circuit Solver: Symbolic Graph-Theoretic Circuit Analyzer

<p align="center">
  A symbolic-numerical hybrid electronic circuit analyzer that translates interactive drag-and-drop schematics into graph representations, solves s-domain circuit equations symbolically, and renders time-domain transient plots.
</p>

<p align="center">
  <img src="assets/designer_ui.png" alt="Circuit Designer Workspace" width="800" style="border-radius: 8px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square" alt="License"/>
  <img src="https://img.shields.io/badge/Python-3.8%2B-blue?style=flat-square&logo=python&logoColor=white" alt="Python Version"/>
  <img src="https://img.shields.io/badge/Node.js-16.0.0%2B-green?style=flat-square&logo=node.js&logoColor=white" alt="Node Version"/>
  <img src="https://img.shields.io/badge/React-19-cyan?style=flat-square&logo=react&logoColor=white" alt="React Version"/>
  <img src="https://img.shields.io/badge/Vite-7-purple?style=flat-square&logo=vite&logoColor=white" alt="Vite Version"/>
  <img src="https://img.shields.io/badge/SymPy-1.12-green?style=flat-square&logo=sympy" alt="SymPy"/>
  <img src="https://img.shields.io/badge/PRs-Welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome"/>
</p>

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Core Features](#-core-features)
3. [System Architecture](#-system-architecture)
4. [Mathematical Foundations (60% Concentration)](#-mathematical-foundations-60-concentration)
    - [Topological Graph Representation](#1-topological-graph-representation)
    - [Weighted Spanning Tree Partitioning](#2-weighted-spanning-tree-partitioning)
    - [Incidence Matrix Generation](#3-incidence-matrix-generation)
    - [Cut Set Matrix Formulation](#4-cut-set-matrix-formulation)
    - [Tie Set Matrix Formulation](#5-tie-set-matrix-formulation)
    - [s-Domain Branch Models](#6-s-domain-branch-models)
    - [Linear System Equation Formulation](#7-linear-system-equation-formulation)
    - [Execution Phases Code deep-dive](#8-execution-phases-code-deep-dive)
5. [Full-Stack Implementation (40% Concentration)](#-full-stack-implementation-40-concentration)
    - [Tech Stack](#tech-stack)
    - [Interactive SVG Schematic Canvas](#interactive-svg-schematic-canvas)
    - [KaTeX Equation Rendering](#katex-equation-rendering)
    - [Firebase Integration & Firestore Schema](#firebase-integration--firestore-schema)
6. [Folder Structure](#%EF%B8%8F-folder-structure)
7. [Installation & Local Setup](#%EF%B8%8F-installation--local-setup)
8. [Environment Variables](#-environment-variables)
9. [Command-Line Solver Execution](#-command-line-solver-execution)
10. [API Documentation](#-api-documentation)
11. [Performance & Optimization](#-performance--optimization)
12. [Security Practices](#-security-practices)
13. [Deployment](#-deployment)
14. [Roadmap](#-roadmap)
15. [Contributing](#-contributing)
16. [License](#-license)

---

## 🔍 Overview

**Circuit Solver** is a professional-grade, symbolic electrical circuit analyzer. Traditional SPICE circuit simulators are purely numerical, which means they solve circuits for discrete time steps but fail to provide the underlying analytical symbolic equations. When student engineers, researchers, or hardware designers need to know *why* a circuit behaves in a certain way, they must manually calculate transfer functions and s-domain models.

Circuit Solver bridges this gap. By representing electrical schematics as directed graphs, the system utilizes algebraic graph theory to systematically generate independent sets of Kirchhoff’s Current and Voltage laws. It uses Laplace transform models to formulate a square system of linear equations, solves them symbolically using SymPy, performs Inverse Laplace Transforms ($\mathcal{L}^{-1}$) to obtain closed-form analytical time-domain equations, and compiles them into high-speed numerical functions for transient response plotting.

---

## ✨ Core Features

| Feature | Description |
| :--- | :--- |
| **Interactive SVG Designer** | Drag-and-drop electrical components (R, L, C, V, I) onto an SVG grid canvas with node snapping and auto-routing wires. |
| **Algebraic Graph Solver** | Abstract networks into directed graphs, auto-identifying tree/co-tree partitions via weighted Spanning Tree algorithms. |
| **Symbolic s-Domain Analysis** | Calculates exact transfer functions and component response variables in the Laplace variable $s$ instead of raw numbers. |
| **Inverse Laplace Transforms** | Evaluates $\mathcal{L}^{-1}$ of solved s-domain formulas, outputting exact analytical functions of time, $t$. |
| **KaTeX Math Engine** | Renders professional s-domain and time-domain expressions dynamically using high-fidelity LaTeX. |
| **Transient Response Plotting** | Compiles symbolic expressions into vectorised NumPy functions using `lambdify` to plot outputs in real time. |
| **Firebase Cloud Storage** | Supports secure Google/Email authentication and saves custom circuit files to Firestore. |

---

## 🚀 System Architecture

The project features a decoupled, multi-tier full-stack architecture. The user designs the circuit on a React frontend canvas, which produces a structured JSON schema. The Node.js Express server acts as an API gateway that spawns a Python subprocess, executing the mathematical solver.

```mermaid
graph TD
    %% Styling Definitions
    classDef client fill:#eff6ff,stroke:#2563eb,stroke-width:2px;
    classDef server fill:#f0fdf4,stroke:#16a34a,stroke-width:2px;
    classDef python fill:#faf5ff,stroke:#7c3aed,stroke-width:2px;
    
    subgraph Client Layer [Client Application - React + Vite]
        A1[Interactive SVG Canvas] -->|JSON Schema| A2[App State Orchestrator]
        A2 -->|POST /analyze| B
        A3[KaTeX Math Renderer] <--|s & t Expressions| A2
        A4[Transient Response Plotter] <--|Base64 PNG Images| A2
    end
    
    subgraph Server Layer [API Gateway - Express Server]
        B(Express Router) -->|Spawn Subprocess| C(Python Spawn Bridge)
        C -->|stdin: JSON Payload| D
        E -->|stdout: JSON Response| C
        C -->|HTTP JSON Response| A2
    end
    
    subgraph Engine Layer [7-Phase Computational Engine - SymPy & NetworkX]
        D[solver.py: Entry Point] --> P1[Phase 1: Graph Builder]
        P1 --> P2[Phase 2: Tree Selector]
        P2 --> P3[Phase 3: Matrix Generator]
        P3 --> P4[Phase 4: Equation Builder]
        P4 --> P5[Phase 5: Symbolic Solver]
        P5 --> P6[Phase 6: Time-Domain Inverter]
        P6 --> P7[Phase 7: Matplotlib Plotter]
        P7 -->|stdout JSON| E[solver.py: Output Formatter]
    end

    class A1,A2,A3,A4 client;
    class B,C server;
    class D,P1,P2,P3,P4,P5,P6,P7,E python;
```

---

## 🧠 Mathematical Foundations (60% Concentration)

Topological circuit analysis separates the connection properties of a network (its topology) from the component behaviors (constitutive relations). This separation allows systematic formulation of KCL and KVL.

### 1. Topological Graph Representation
Let the electrical circuit be represented as a directed graph $\mathcal{G} = (\mathcal{V}, \mathcal{E})$, where:
*   $\mathcal{V} = \{v_1, v_2, \ldots, v_n\}$ is the set of $n$ vertices representing electrical nodes.
*   $\mathcal{E} = \{e_1, e_2, \ldots, e_b\}$ is the set of $b$ directed edges representing branches (electrical elements).
*   Each edge $e_k$ points from node $u$ (source) to node $w$ (target), defining the reference polarity for voltage and the positive direction of current.

### 2. Weighted Spanning Tree Partitioning
For a connected graph, a **Spanning Tree** is a subgraph connecting all nodes without containing any loops. Branches included in the tree are **twigs**; remaining branches form the **co-tree** and are called **links**.
*   The number of twigs is:
    $$n_t = n - 1$$
*   The number of links is:
    $$n_l = b - n_t = b - n + 1$$

To avoid mathematical singularities:
*   **Voltage sources (V)** must not form loops (KVL violation) and are preferred as tree branches (twigs) to simplify equation systems.
*   **Current sources (I)** must not form cut sets (KCL violation) and are preferred as co-tree branches (links).

The Spanning Tree is selected using a **Weighted Minimum Spanning Tree (MST) Algorithm** on the network graph. Custom weights are assigned to edges based on component type:
*   $\text{Voltage Source (V)} \implies \text{Weight} = 0$ (highest priority for tree inclusion)
*   $\text{Passive Component (R, L, C)} \implies \text{Weight} = 1$ (normal priority)
*   $\text{Current Source (I)} \implies \text{Weight} = 100$ (lowest priority, forced into co-tree)

Once the MST algorithm runs, edges are split. The branches are re-sorted such that twigs come first, followed by links:
$$\mathbf{I}_{branch} = \begin{bmatrix} \mathbf{I}_{twigs} \\ \mathbf{I}_{links} \end{bmatrix} = \begin{bmatrix} I_1 \\ \vdots \\ I_{n_t} \\ \hline I_{n_t+1} \\ \vdots \\ I_b \end{bmatrix}, \quad \mathbf{V}_{branch} = \begin{bmatrix} \mathbf{V}_{twigs} \\ \mathbf{V}_{links} \end{bmatrix} = \begin{bmatrix} V_1 \\ \vdots \\ V_{n_t} \\ \hline V_{n_t+1} \\ \vdots \\ V_b \end{bmatrix}$$

### 3. Incidence Matrix Generation
The full incidence matrix $A$ of size $n \times b$ records connectivity:
$$A_{i, j} = \begin{cases} 
+1 & \text{if branch } j \text{ leaves node } i \\
-1 & \text{if branch } j \text{ enters node } i \\
0 & \text{otherwise}
\end{cases}$$
Because the rows of $A$ are linearly dependent, removing reference ground node row `'0'` yields the **Reduced Incidence Matrix** $A_{\text{red}}$ of size $(n-1) \times b$. Partitioning $A_{\text{red}}$ according to twigs ($t$) and links ($l$) yields:
$$A_{\text{red}} = \begin{bmatrix} A_t & A_l \end{bmatrix}$$

### 4. Cut Set Matrix Formulation
A fundamental cut set contains exactly one twig and some links. The Cut Set Matrix $Q$ of size $n_t \times b$ represents Kirchhoff’s Current Law (KCL) in terms of branch currents:
$$Q \cdot \mathbf{I}_{branch} = 0$$
It is formulated as:
$$Q = \begin{bmatrix} I_{n_t} & Q_l \end{bmatrix}$$
where:
$$Q_l = -A_t^{-1} \cdot A_l$$
Substituting $Q$ into the KCL equation:
$$\mathbf{I}_{twigs} + Q_l \mathbf{I}_{links} = 0 \implies \mathbf{I}_{twigs} = -Q_l \mathbf{I}_{links}$$

### 5. Tie Set Matrix Formulation
Each link added to the spanning tree forms a unique loop (tie set). The Tie Set Matrix $B$ of size $n_l \times b$ represents Kirchhoff’s Voltage Law (KVL) in terms of branch voltages:
$$B \cdot \mathbf{V}_{branch} = 0$$
It is formulated as:
$$B = \begin{bmatrix} B_t & I_{n_l} \end{bmatrix}$$
To preserve the orthogonality between loops and cut sets ($Q \cdot B^T = 0$), $B_t$ is derived directly from $Q_l$:
$$B_t = -Q_l^T \implies B = \begin{bmatrix} -Q_l^T & I_{n_l} \end{bmatrix}$$
Substituting $B$ into KVL:
$$-Q_l^T \mathbf{V}_{twigs} + \mathbf{V}_{links} = 0 \implies \mathbf{V}_{links} = Q_l^T \mathbf{V}_{twigs}$$

### 6. s-Domain Branch Models
The circuit variables are solved in the frequency domain using **Laplace Transforms** (assuming zero initial conditions). The Heaviside step excitation $u(t)$ transforms into the frequency domain as $1/s$:

| Component | Time-Domain Relationship | s-Domain Impedance ($Z(s)$) | s-Domain Constitutive Algebraic Equation |
| :--- | :--- | :--- | :--- |
| **Resistor (R)** | $v(t) = R \cdot i(t)$ | $R$ | $V_k(s) - R \cdot I_k(s) = 0$ |
| **Inductor (L)** | $v(t) = L \frac{di(t)}{dt}$ | $sL$ | $V_k(s) - sL \cdot I_k(s) = 0$ |
| **Capacitor (C)** | $i(t) = C \frac{dv(t)}{dt}$ | $\frac{1}{sC}$ | $V_k(s) - \frac{1}{sC} \cdot I_k(s) = 0$ |
| **Voltage Source (V)** | $v(t) = V_s \cdot u(t)$ | — | $V_k(s) - \frac{V_s}{s} = 0$ |
| **Current Source (I)** | $i(t) = I_s \cdot u(t)$ | — | $I_k(s) - \frac{I_s}{s} = 0$ |

### 7. Linear System Equation Formulation
For a network with $b$ branches, the engine sets up a system of $2b$ algebraic equations in terms of $2b$ variables (voltages $V_1 \dots V_b$ and currents $I_1 \dots I_b$):

$$\begin{bmatrix}
\mathbf{0}_{n_t \times b} & Q_{n_t \times b} \\
B_{n_l \times b} & \mathbf{0}_{n_l \times b} \\
\mathbf{M}_{v} & \mathbf{M}_{i}
\end{bmatrix}
\begin{bmatrix}
\mathbf{V}_{branch} \\
\mathbf{I}_{branch}
\end{bmatrix} =
\begin{bmatrix}
\mathbf{0}_{n_t \times 1} \\
\mathbf{0}_{n_l \times 1} \\
\mathbf{S}_{2b \times 1}
\end{bmatrix}$$

Where:
*   The top $n_t$ rows represent KCL: $Q \cdot \mathbf{I}_{branch} = 0$.
*   The middle $n_l$ rows represent KVL: $B \cdot \mathbf{V}_{branch} = 0$.
*   The bottom $b$ rows represent branch constitutive relations ($\mathbf{M}_v \mathbf{V} + \mathbf{M}_i \mathbf{I} = \mathbf{S}$).

---

### 8. Execution Phases Code Deep-Dive

#### Phase 1: Graph Builder (`graph_builder.py`)
Reads the raw nodes and branches from stdin and uses NetworkX to structure a directed multigraph, validating that it forms a single connected component.
```python
def build_graph(circuit_data):
    nodes = circuit_data['nodes']
    branches = circuit_data['branches']
    G = nx.MultiGraph()
    G.add_nodes_from(nodes)
    for b in branches:
        G.add_edge(b['from'], b['to'], key=b['id'], type=b['type'], value=b['value'])
    if not nx.is_connected(G):
        return None, {
            "status": "error",
            "message": "Circuit is not connected. All nodes must form a connected graph."
        }
    return G, None
```

#### Phase 2: Spanning Tree Selector (`tree_selector.py`)
Applies the weighted MST algorithm to partition the branches into twigs (tree) and links (co-tree).
```python
def select_tree(graph, branches):
    for u, v, k, d in graph.edges(keys=True, data=True):
        if d['type'] == 'V':
            w = 0  # Prefer voltage sources in tree
        elif d['type'] == 'I':
            w = 100  # Push current sources to co-tree
        else:
            w = 1  # Normal passive weight
        graph[u][v][k]['weight'] = w
    mst_edges = nx.minimum_spanning_edges(graph, keys=True, data=True, weight='weight')
    tree_branch_ids = [e[2] for e in mst_edges]
    twigs = [b for b in branches if b['id'] in tree_branch_ids]
    links = [b for b in branches if b['id'] not in tree_branch_ids]
    return twigs, links, twigs + links
```

#### Phase 3: Matrix Generator (`matrix_generator.py`)
Builds incidence matrices, solves for $Q_l$, and constructs $Q$ and $B$.
```python
def get_incidence_matrix(graph, nodes, branches):
    node_map = {n: i for i, n in enumerate(nodes)}
    branch_map = {b['id']: i for i, b in enumerate(branches)}
    A_full = np.zeros((len(nodes), len(branches)))
    for b in branches:
        u_idx, v_idx = node_map[b['from']], node_map[b['to']]
        b_idx = branch_map[b['id']]
        A_full[u_idx, b_idx] = 1
        A_full[v_idx, b_idx] = -1
    ref_node_idx = node_map.get('0', len(nodes) - 1)
    A_reduced = np.delete(A_full, ref_node_idx, axis=0)
    return A_reduced, A_full, ref_node_idx

def get_cutset_matrix(A_red, n_twigs, n_links):
    A_t = A_red[:, :n_twigs]
    A_l = A_red[:, n_twigs:]
    try:
        A_t_inv = np.linalg.inv(A_t)
    except np.linalg.LinAlgError as e:
        return None, {"status": "error", "message": f"Singular matrix error: {str(e)}"}
    Q_l = -np.dot(A_t_inv, A_l)
    return np.hstack((np.eye(n_twigs), Q_l)), None

def get_tieset_matrix(Q_l, n_twigs, n_links):
    B_t = -Q_l.T
    return np.hstack((B_t, np.eye(n_links)))
```

#### Phase 4: Equation Builder (`equation_builder.py`)
Generates symbolic expressions in $s$ for components and network laws using SymPy.
```python
def build_equations(sorted_branches, Q, B, n_twigs, n_links):
    s = sympy.symbols('s')
    V_sym = [sympy.symbols(f'V_{b["id"]}') for b in sorted_branches]
    I_sym = [sympy.symbols(f'I_{b["id"]}') for b in sorted_branches]
    equations = []
    # KCL Equations: Q * I = 0
    for i in range(n_twigs):
        equations.append(sum(Q[i, j] * I_sym[j] for j in range(len(sorted_branches))))
    # KVL Equations: B * V = 0
    for i in range(n_links):
        equations.append(sum(B[i, j] * V_sym[j] for j in range(len(sorted_branches))))
    # Branch constitutive equations
    for i, b in enumerate(sorted_branches):
        val, t = b['value'], b['type']
        if t == 'R': equations.append(V_sym[i] - I_sym[i] * val)
        elif t == 'L': equations.append(V_sym[i] - I_sym[i] * s * val)
        elif t == 'C': equations.append(V_sym[i] - I_sym[i] * (1 / (s * val)))
        elif t == 'V': equations.append(V_sym[i] - val / s)
        elif t == 'I': equations.append(I_sym[i] - val / s)
    return equations, V_sym + I_sym
```

#### Phase 5 & 6: Solver & Time Domain Inversion (`equation_solver.py` & `time_domain.py`)
Solves equations and performs Inverse Laplace Transforms using SymPy's core mathematical logic.
```python
def solve_equations(equations, unknowns):
    return sympy.solve(equations, unknowns)

def convert_to_time_domain(sol):
    s = sympy.symbols('s')
    t = sympy.symbols('t', positive=True, real=True)
    results, plot_data = {}, {}
    time_points = np.linspace(0, 10, 100)
    for var, expr in sol.items():
        var_name = str(var)
        try:
            time_expr = sympy.inverse_laplace_transform(expr, s, t)
            results[var_name] = str(time_expr)
            func = sympy.lambdify(t, time_expr, modules=['numpy'])
            y_vals = func(time_points)
            if np.isscalar(y_vals):
                y_vals = np.full_like(time_points, y_vals)
            plot_data[var_name] = y_vals.tolist()
        except Exception as e:
            results[var_name] = f"Cannot compute inverse Laplace: {str(e)}"
    return results, plot_data, time_points
```

---

## 💻 Full-Stack Implementation (40% Concentration)

### Tech Stack

| Layer | Technology | Key Modules / Libraries |
| :--- | :--- | :--- |
| **Frontend** | React 19, Vite 7, HTML5, Vanilla CSS | `axios` (API client), `katex` (formula renderer), `react-katex` |
| **Backend** | Node.js, Express, Child Process | `body-parser` (JSON parser), `cors` (headers), `dotenv` (env configuration) |
| **Math Engine** | Python 3.8+ | `sympy` (symbolic algebra), `numpy` (numerical matrix math), `networkx` (graph representation), `matplotlib` (plotting) |
| **Database/Auth**| Firebase v12 | Firestore (document persistence), Firebase Auth (OAuth & credential storage) |

### Interactive SVG Schematic Canvas
The core editor client uses standard SVG coordinates mapped to a 700x460 grid. SNAPPING algorithms round mouse positions to the nearest 10px increment. 
*   **Rotational Vector calculation**: When two nodes are selected or connected, the canvas determines the line length $L$ and polar orientation angle $\theta$:
    $$dx = x_2 - x_1, \quad dy = y_2 - y_1$$
    $$L = \sqrt{dx^2 + dy^2}$$
    $$\theta = \text{atan2}(dy, dx) \cdot \frac{180}{\pi}$$
*   **Component Rendering**: Sub-components (resistors, inductors, capacitors) are rendered inside an SVG group transformed at runtime:
    ```jsx
    <g transform={`translate(${x1}, ${y1}) rotate(${theta})`}>
      <path d={symbolPath} stroke={accentColor} strokeWidth="2" />
    </g>
    ```

### KaTeX Equation Rendering
To output equations with presentation-grade clarity, the system integrates a custom `Latex` renderer wrapping standard `katex` libraries:
```jsx
import { useEffect, useRef } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

export const Latex = ({ math }) => {
  const containerRef = useRef(null);
  useEffect(() => {
    if (containerRef.current) {
      katex.render(math, containerRef.current, { throwOnError: false });
    }
  }, [math]);
  return <span ref={containerRef} />;
};
```

### Firebase Integration & Firestore Schema
Dynamic initialization retrieves configuration settings from the server at startup, allowing secure key rotation. Circuits are persisted inside the Firestore database:
*   **Firestore Collection**: `circuits/`
*   **Schema**:
    ```typescript
    interface CircuitDocument {
      userId: string;          // User identity association
      name: string;            // User-assigned label
      nodes: string[];         // List of nodes, e.g. ["0", "1", "2"]
      branches: Array<{        // Branch definitions
        id: string;            // e.g. "R1"
        from: string;          // Origin node label
        to: string;            // Destination node label
        type: "R" | "L" | "C" | "V" | "I";
        value: number;         // Component magnitude value
      }>;
      positions: Record<string, { x: number, y: number }>; // Node layout locations
      createdAt: string;       // ISO Timestamp string
    }
    ```

---

## 📂 Folder Structure

```
CircuitAnalyser/
├── assets/                  # Stored screenshots & high-quality visual assets
│   ├── designer_ui.png      # Circuit canvas designer workspace
│   ├── equations_output.png # Symbolic solver rendering output
│   └── transient_plots.png  # Base64 response-generated plots
├── client/                  # Frontend User Interface (React 19 + Vite 7)
│   ├── src/
│   │   ├── components/      # UI components (Latex, ResultsSlate, Symbols)
│   │   ├── pages/           # Pages (AuthPage, LandingPage, ProfilePage, WorkspacePage)
│   │   ├── App.jsx          # App routing and React state hub
│   │   ├── firebase.js      # Firebase configuration & modular exports
│   │   └── index.css        # Premium custom CSS stylesheets
│   ├── package.json
│   └── vite.config.js
├── server/                  # API Gateway Layer (Node.js Express Bridge)
│   ├── server.js            # Main REST API and subprocess orchestrator
│   └── package.json
└── engine/                  # Core Computational Engine (Python 3)
    ├── solver.py            # Orchestrator running the 7 solver phases
    ├── requirements.txt     # Numeric, algebraic, and graphing dependencies
    └── phases/              # Linear systems formulation and solving modules
        ├── __init__.py
        ├── graph_builder.py
        ├── tree_selector.py
        ├── matrix_generator.py
        ├── equation_builder.py
        ├── equation_solver.py
        ├── time_domain.py
        └── visualizer.py
```

---

## 🛠️ Installation & Local Setup

### Prerequisites
*   **Node.js** (v16.0.0 or higher)
*   **Python** (v3.8 or higher)
*   **npm** (Node Package Manager)

### Step 1: Clone the Repository
```bash
git clone https://github.com/p-sree-sai-pavan/Circuit-Theory.git
cd Circuit-Theory
```

### Step 2: Install Python Dependencies
```bash
pip install -r engine/requirements.txt
```

### Step 3: Configure Server & Environment
Navigate to the server directory, install node packages, and create an environment configuration file:
```bash
cd server
npm install
```

### Step 4: Configure Frontend
Navigate to the client directory and install dependencies:
```bash
cd ../client
npm install
```

---

## 🔑 Environment Variables

To configure Firebase authentication and database operations, create a `.env` file under `client/` containing your API keys:

```env
# Client-side configuration
VITE_API_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6
VITE_FIREBASE_AUTH_DOMAIN=circuit-theory-xxxx.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=circuit-theory-xxxx
VITE_FIREBASE_STORAGE_BUCKET=circuit-theory-xxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:a1b2c3d4e5f6g7h8i9j0k1

# Backend environment configurations
PORT=3000
PYTHON_PATH=python
```

---

## 🚀 Running the Application

### Run Concurrently
From the root workspace directory, run:
```bash
npm run dev
```
The client will be running at `http://localhost:5173` and the Express backend server at `http://localhost:3000`.

---

## 📥 Command-Line Solver Execution

You can run the Python engine directly from the command line using standard I/O redirection without starting the web backend.

### 1. Run default series RLC circuit test case
```bash
# Windows
echo "" | python engine/solver.py

# Linux / macOS
echo "" | python3 engine/solver.py
```

### 2. Solve custom circuit JSON payload
```bash
# Windows
'{"nodes": ["0", "1"], "branches": [{"id": "V1", "from": "1", "to": "0", "type": "V", "value": 12}, {"id": "R1", "from": "1", "to": "0", "type": "R", "value": 10}]}' | python engine/solver.py

# Linux / macOS
echo '{"nodes": ["0", "1"], "branches": [{"id": "V1", "from": "1", "to": "0", "type": "V", "value": 12}, {"id": "R1", "from": "1", "to": "0", "type": "R", "value": 10}]}' | python3 engine/solver.py
```

---

## 📡 API Documentation

### 1. Retrieve Firebase Configuration
*   **Method**: `GET`
*   **Endpoint**: `/config/firebase`
*   **Description**: Exposes public Firebase credentials to the frontend dynamically.
*   **Response**:
    ```json
    {
      "apiKey": "AIzaSy...",
      "authDomain": "circuit-theory.firebaseapp.com",
      "projectId": "circuit-theory",
      "storageBucket": "circuit-theory.appspot.com",
      "messagingSenderId": "123456789",
      "appId": "1:123456789:web:a1b2c3d4"
    }
    ```

### 2. Solve Circuit Scheme
*   **Method**: `POST`
*   **Endpoint**: `/analyze`
*   **Request Body**:
    ```json
    {
      "nodes": ["0", "1", "2"],
      "branches": [
        { "id": "V1", "from": "1", "to": "0", "type": "V", "value": 10 },
        { "id": "R1", "from": "1", "to": "2", "type": "R", "value": 5 },
        { "id": "C1", "from": "2", "to": "0", "type": "C", "value": 0.1 }
      ]
    }
    ```
*   **Response**:
    ```json
    {
      "status": "success",
      "equations": {
        "V_V1": "10/s",
        "I_R1": "2/(s + 2)",
        "V_C1": "10/(s*(s + 2))",
        "I_C1": "2/(s + 2)"
      },
      "time_domain": {
        "V_V1": "10*Heaviside(t)",
        "I_R1": "2*exp(-2*t)",
        "V_C1": "5 - 5*exp(-2*t)",
        "I_C1": "2*exp(-2*t)"
      },
      "plots": [
        {
          "name": "V_C1",
          "image": "iVBORw0KGgoAAAANSUhEUgAAAoAAAAGPCAYAAAD..."
        }
      ]
    }
    ```

---

## 📸 Screenshots

<p align="center">
  <h3>Interactive Circuit Designer Canvas</h3>
  <img src="assets/designer_ui.png" alt="Designer Canvas Interface" width="750"/>
</p>

<p align="center">
  <h3>LaTeX Symbolic Equations Rendered in Real-Time</h3>
  <img src="assets/equations_output.png" alt="LaTeX Equation Output" width="750"/>
</p>

<p align="center">
  <h3>NumPy-Evaluated Transient Response Plots</h3>
  <img src="assets/transient_plots.png" alt="Matplotlib Transient Plots" width="750"/>
</p>

---

## ⚡ Performance & Optimization

*   **Matplotlib Headless Threading**: Matplotlib uses the `Agg` non-interactive backend (`matplotlib.use('Agg')`), which prevents locks on system display ports and enables concurrent request processing.
*   **High-Speed Equation Compilation**: Instead of using loops to evaluate symbolic structures step-by-step, SymPy’s `lambdify` converts expressions directly into optimized, vectorised NumPy execution blocks.
*   **Snap-to-Grid Optimization**: Layout dragging updates SVG state dynamically. Snapping filters out tiny coordinate deltas, reducing rendering updates.

---

## 🔒 Security Practices

*   **Subprocess Shell Ingestion Protection**: The Express router spawns the Python subprocess using `spawn(executable, [script])` with arguments passed as an array. This disables shell context execution, preventing shell injection attacks.
*   **Payload Sanitization**: Incoming client schemas are validated to be valid JSON before being written to the stdin buffer of `solver.py`.
*   **Firebase Credentials dynamic exposure**: Configuration variables are populated from local environment files, keeping secure values out of raw source repositories.

---

## 📦 Deployment

### Deploying the Complete Stack via Docker

You can containerize the entire application (React frontend static build served through the Node.js API server, with Python 3 math packages installed) using the provided `Dockerfile`.

```dockerfile
# Stage 1: Build Frontend React Static Assets
FROM node:18-alpine AS frontend-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm install
COPY client/ ./
RUN npm run build

# Stage 2: Deploy Production Release Server
FROM node:18-alpine
WORKDIR /app

# Install Python & required scientific libraries
RUN apk add --no-cache python3 py3-pip py3-numpy py3-matplotlib
RUN python3 -m venv /venv
ENV PATH="/venv/bin:$PATH"
RUN pip install sympy networkx

# Copy server assets
COPY server/package*.json ./server/
RUN npm install --prefix server --omit=dev

# Copy static frontend build and source scripts
COPY --from=frontend-builder /app/client/dist ./client/dist
COPY server/ ./server/
COPY engine/ ./engine/

# Configure production environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV PYTHON_PATH=python3

EXPOSE 3000
CMD ["node", "server/server.js"]
```

Build and run the Docker container:
```bash
# Build Docker image
docker build -t circuit-solver .

# Run Docker container
docker run -p 3000:3000 --env-file =.env circuit-solver
```

---

## 🗺️ Roadmap

*   [x] Drag-and-drop SVG designer workspace.
*   [x] s-Domain symbolic solving and Inverse Laplace inversion.
*   [x] Matplotlib transient response visualization.
*   [x] Firebase cloud integration for user circuit history.
*   [ ] Dependent Sources: VCVS, VCCS, CCVS, CCCS.
*   [ ] AC Analysis: phasor frequency sweep and Bode magnitude/phase plots.
*   [ ] Non-Zero Initial Conditions: Inductor initial current ($L \cdot i_L(0^-)$) and Capacitor initial voltage ($v_C(0^-)/s$).
*   [ ] Active Components: Op-Amp models utilizing nullor equivalences in graph theory.

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:
1.  Fork the repository.
2.  Create a branch for your feature (`git checkout -b feature/NewSolvingCapability`).
3.  Implement test cases inside `engine/test_phases.py`.
4.  Open a Pull Request detailing your changes.

---

## 📄 License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  If you find this project useful, consider giving it a ⭐.
</p>
