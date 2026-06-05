# 🔌 Circuit Solver: Symbolic Graph-Theoretic Circuit Analyzer

An advanced, high-performance symbolic electrical circuit analyzer that integrates mathematical **Graph Theory** and **Laplace Transform Analysis** with a modern full-stack web interface. The application translates a user-drawn graphical schematic into a directed graph, constructs fundamental topological network matrices (Incidence, Cut Set, and Tie Set), formulates a system of s-domain algebraic equations, and solves them symbolically. Finally, it computes analytical time-domain expressions via Inverse Laplace Transforms ($\mathcal{L}^{-1}$) and plots transient curves.

---

## 📈 System Architectural Overview

The application features a decoupled, multi-tier full-stack architecture. The **Interactive Frontend Canvas** allows users to build circuits dynamically; the stateless **Node.js Express Server Bridge** acts as an API gateway; and the **7-Phase Python Symbolic Engine** serves as the mathematical core.

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
        P7 -->|stdout JSON| E[solver.py: Output formatter]
    end

    class A1,A2,A3,A4 client;
    class B,C server;
    class D,P1,P2,P3,P4,P5,P6,P7,E python;
```

---

## 🧠 Part 1: Core Electronics & Math Backend (60% Concentration)

The backend engine (`engine/`) models electrical networks using **topological circuit theory**, a methodology that abstracts physical components into network graphs. By separating a circuit's topological structure (how elements are connected) from its physical nature (component values and equations), the engine systematically constructs independent sets of Kirchhoff's laws.

### 1. Topological Graph Representation
Let the electrical circuit be represented as a directed multigraph $\mathcal{G} = (\mathcal{V}, \mathcal{E})$, where:
*   $\mathcal{V} = \{v_1, v_2, \ldots, v_n\}$ is the set of $n$ vertices representing electrical nodes.
*   $\mathcal{E} = \{e_1, e_2, \ldots, e_b\}$ is the set of $b$ directed edges representing electrical branches (components).
*   Each edge $e_k$ is defined by a tuple $(u_k, w_k, \text{id}_k, \text{type}_k, \text{val}_k)$ indicating a connection from source node $u_k$ to target node $w_k$, representing the reference polarity for voltage and positive direction for current.

### 2. Weighted Spanning Tree Partitioning
To construct independent equations, the network branches must be partitioned into a **Spanning Tree** (containing tree branches, or **twigs**) and a **Co-tree** (containing co-tree branches, or **links**). 

For a connected graph with $n$ nodes and $b$ branches:
*   The number of twigs is exactly:
    $$n_t = n - 1$$
*   The number of links is:
    $$n_l = b - n_t = b - n + 1$$

To ensure mathematical stability and prevent singular matrices:
*   **Voltage sources (V)** must not form loops (KVL violation) and are preferred as tree branches (twigs) to simplify equation systems.
*   **Current sources (I)** must not form cut sets (KCL violation) and are preferred as co-tree branches (links).

The Spanning Tree is selected using a **Weighted Minimum Spanning Tree (MST) Algorithm** on the network graph. Custom weights are assigned to edges based on component type:
*   $\text{Voltage Source (V)} \implies \text{Weight} = 0$ (highest priority for tree inclusion)
*   $\text{Passive Component (R, L, C)} \implies \text{Weight} = 1$ (normal priority)
*   $\text{Current Source (I)} \implies \text{Weight} = 100$ (lowest priority, forced into co-tree)

Once the MST algorithm runs, edges are split. The branches are re-sorted such that twigs come first, followed by links:
$$\mathbf{I}_{branch} = \begin{bmatrix} \mathbf{I}_{twigs} \\ \mathbf{I}_{links} \end{bmatrix} = \begin{bmatrix} I_1 \\ \vdots \\ I_{n_t} \\ \hline I_{n_t+1} \\ \vdots \\ I_b \end{bmatrix}, \quad \mathbf{V}_{branch} = \begin{bmatrix} \mathbf{V}_{twigs} \\ \mathbf{V}_{links} \end{bmatrix} = \begin{bmatrix} V_1 \\ \vdots \\ V_{n_t} \\ \hline V_{n_t+1} \\ \vdots \\ V_b \end{bmatrix}$$

---

### 3. Formulation of Fundamental Network Matrices
Using the sorted branch list, three fundamental topological matrices are constructed:

```
                  ┌────────────────────────────────────────┐
                  │   Full Incidence Matrix A (n x b)      │
                  └───────────────────┬────────────────────┘
                                      │  Remove Ground Node '0' Row
                                      ▼
                  ┌────────────────────────────────────────┐
                  │ Reduced Incidence Matrix A_red (n-1 x b)│
                  └───────────────────┬────────────────────┘
                                      │  Partition by Tree/Co-tree
                                      ▼
                               [ A_t  │  A_l ]
                                      │
                                      ├────────────────────────────────────────┐
                                      ▼ (Inversion of Twig Submatrix)          ▼
                             -A_t⁻¹ * A_l = Q_l                        B_t = -Q_lᵀ
                                      │                                        │
                                      ▼                                        ▼
                  ┌────────────────────────────────────────┐  ┌────────────────────────────────────────┐
                  │     Cut Set Matrix Q = [I_nt | Q_l]    │  │    Tie Set Matrix B = [B_t | I_nl]     │
                  └────────────────────────────────────────┘  └────────────────────────────────────────┘
```

#### A. Reduced Incidence Matrix ($A_{\text{red}}$)
The full incidence matrix $A$ of size $n \times b$ records connectivity:
$$A_{i, j} = \begin{cases} 
+1 & \text{if branch } j \text{ leaves node } i \\
-1 & \text{if branch } j \text{ enters node } i \\
0 & \text{otherwise}
\end{cases}$$
Because the rows of $A$ are linearly dependent (their sum is zero), one node (usually reference node `'0'`) is removed to form the **Reduced Incidence Matrix** $A_{\text{red}}$ of size $(n-1) \times b$.
Splitting $A_{\text{red}}$ according to the twigs ($t$) and links ($l$) yields:
$$A_{\text{red}} = \begin{bmatrix} A_t & A_l \end{bmatrix}$$

#### B. Fundamental Cut Set Matrix ($Q$)
A fundamental cut set contains exactly one twig and some set of links. The Cut Set Matrix $Q$ of size $n_t \times b$ represents Kirchhoff’s Current Law (KCL) in terms of branch currents:
$$Q \cdot \mathbf{I}_{branch} = 0$$
It is formulated as:
$$Q = \begin{bmatrix} I_{n_t} & Q_l \end{bmatrix}$$
where:
$$Q_l = -A_t^{-1} \cdot A_l$$
Substituting $Q$ into the KCL equation:
$$\begin{bmatrix} I_{n_t} & Q_l \end{bmatrix} \begin{bmatrix} \mathbf{I}_{twigs} \\ \mathbf{I}_{links} \end{bmatrix} = 0 \implies \mathbf{I}_{twigs} + Q_l \mathbf{I}_{links} = 0 \implies \mathbf{I}_{twigs} = -Q_l \mathbf{I}_{links}$$

#### C. Fundamental Tie Set Matrix ($B$)
A fundamental loop (tie set) contains exactly one link and a unique path of twigs. The Tie Set Matrix $B$ of size $n_l \times b$ represents Kirchhoff’s Voltage Law (KVL) in terms of branch voltages:
$$B \cdot \mathbf{V}_{branch} = 0$$
It is formulated as:
$$B = \begin{bmatrix} B_t & I_{n_l} \end{bmatrix}$$
To preserve the orthogonality between loops and cut sets ($Q \cdot B^T = 0$), $B_t$ is derived directly from $Q_l$:
$$B_t = -Q_l^T$$
Thus:
$$B = \begin{bmatrix} -Q_l^T & I_{n_l} \end{bmatrix}$$
Substituting $B$ into KVL:
$$\begin{bmatrix} -Q_l^T & I_{n_l} \end{bmatrix} \begin{bmatrix} \mathbf{V}_{twigs} \\ \mathbf{V}_{links} \end{bmatrix} = 0 \implies -Q_l^T \mathbf{V}_{twigs} + \mathbf{V}_{links} = 0 \implies \mathbf{V}_{links} = Q_l^T \mathbf{V}_{twigs}$$

---

### 4. s-Domain Constitutive Equations
The circuit variables are solved in the frequency domain using **Laplace Transforms** (assuming zero initial conditions). The Heaviside step excitation $u(t)$ transforms into the frequency domain as $1/s$:

| Component | Time-Domain Relationship | s-Domain Impedance ($Z(s)$) | s-Domain Constitutive Algebraic Equation |
| :--- | :--- | :--- | :--- |
| **Resistor (R)** | $v(t) = R \cdot i(t)$ | $R$ | $V_k(s) - R \cdot I_k(s) = 0$ |
| **Inductor (L)** | $v(t) = L \frac{di(t)}{dt}$ | $sL$ | $V_k(s) - sL \cdot I_k(s) = 0$ |
| **Capacitor (C)** | $i(t) = C \frac{dv(t)}{dt}$ | $\frac{1}{sC}$ | $V_k(s) - \frac{1}{sC} \cdot I_k(s) = 0$ |
| **Voltage Source (V)** | $v(t) = V_s \cdot u(t)$ | — | $V_k(s) - \frac{V_s}{s} = 0$ |
| **Current Source (I)** | $i(t) = I_s \cdot u(t)$ | — | $I_k(s) - \frac{I_s}{s} = 0$ |

---

### 5. Formulation of the Complete Linear System
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
*   The bottom $b$ rows represent branch constitutive relations ($\mathbf{M}_v \mathbf{V} + \mathbf{M}_i \mathbf{I} = \mathbf{S}$), holding the impedance coefficients and source terms.

---

### 6. Deep Dive: The 7-Phase Execution Pipeline
The Python solver decomposes the mathematical analysis into seven sequential steps:

#### Phase 1: Graph Construction & Validation (`graph_builder.py`)
Parses the input JSON schema and instantiates a `networkx.MultiGraph`. It validates that the network is connected and contains reference node `'0'`.
```python
def build_graph(circuit_data):
    G = nx.MultiGraph()
    G.add_nodes_from(circuit_data['nodes'])
    for b in circuit_data['branches']:
        G.add_edge(b['from'], b['to'], key=b['id'], type=b['type'], value=b['value'])
    if not nx.is_connected(G):
        return None, {"status": "error", "message": "Circuit is not connected."}
    return G, None
```

#### Phase 2: Spanning Tree Selection (`tree_selector.py`)
Computes the minimum spanning tree by assigning edge weights (V: 0, R/L/C: 1, I: 100), returning sorted twigs and links.
```python
def select_tree(graph, branches):
    for u, v, k, d in graph.edges(keys=True, data=True):
        graph[u][v][k]['weight'] = 0 if d['type'] == 'V' else (100 if d['type'] == 'I' else 1)
    mst_edges = nx.minimum_spanning_edges(graph, keys=True, data=True, weight='weight')
    tree_branch_ids = [e[2] for e in mst_edges]
    twigs = [b for b in branches if b['id'] in tree_branch_ids]
    links = [b for b in branches if b['id'] not in tree_branch_ids]
    return twigs, links, twigs + links
```

#### Phase 3: Matrix Generation (`matrix_generator.py`)
Generates the incidence matrix, removes the ground row, and computes the Cut Set and Tie Set matrices.
```python
def get_cutset_matrix(A_red, n_twigs, n_links):
    A_t = A_red[:, :n_twigs]
    A_l = A_red[:, n_twigs:]
    A_t_inv = np.linalg.inv(A_t) # Throws LinAlgError if tree selection is singular
    Q_l = -np.dot(A_t_inv, A_l)
    return np.hstack((np.eye(n_twigs), Q_l)), None
```

#### Phase 4: Equation Builder (`equation_builder.py`)
Formulates the symbolic equations in Laplace domain using `sympy`.
```python
def build_equations(sorted_branches, Q, B, n_twigs, n_links):
    s = sympy.symbols('s')
    V_sym = [sympy.symbols(f'V_{b["id"]}') for b in sorted_branches]
    I_sym = [sympy.symbols(f'I_{b["id"]}') for b in sorted_branches]
    equations = []
    # KCL equations: Q * I = 0
    for i in range(n_twigs):
        equations.append(sum(Q[i, j] * I_sym[j] for j in range(len(sorted_branches))))
    # KVL equations: B * V = 0
    for i in range(n_links):
        equations.append(sum(B[i, j] * V_sym[j] for j in range(len(sorted_branches))))
    # Component equations
    for i, b in enumerate(sorted_branches):
        val, t = b['value'], b['type']
        if t == 'R': equations.append(V_sym[i] - I_sym[i] * val)
        elif t == 'L': equations.append(V_sym[i] - I_sym[i] * s * val)
        elif t == 'C': equations.append(V_sym[i] - I_sym[i] * (1 / (s * val)))
        elif t == 'V': equations.append(V_sym[i] - val / s)
        elif t == 'I': equations.append(I_sym[i] - val / s)
    return equations, V_sym + I_sym
```

#### Phase 5: Equation Solver (`equation_solver.py`)
Calls SymPy's core system solver:
```python
def solve_equations(equations, unknowns):
    return sympy.solve(equations, unknowns)
```

#### Phase 6: Time-Domain Conversion (`time_domain.py`)
Calculates the Inverse Laplace Transform using the residue-based inversion algorithm in SymPy, then compiles the expressions to NumPy arrays using `lambdify`.
```python
def convert_to_time_domain(sol):
    s, t = sympy.symbols('s'), sympy.symbols('t', positive=True, real=True)
    results, plot_data = {}, {}
    time_points = np.linspace(0, 10, 100)
    for var, expr in sol.items():
        time_expr = sympy.inverse_laplace_transform(expr, s, t)
        results[str(var)] = str(time_expr)
        func = sympy.lambdify(t, time_expr, modules=['numpy'])
        y_vals = func(time_points)
        if np.isscalar(y_vals):
            y_vals = np.full_like(time_points, y_vals)
        plot_data[str(var)] = y_vals.tolist()
    return results, plot_data, time_points
```

#### Phase 7: Visualizer (`visualizer.py`)
Renders the NumPy arrays to a headless Matplotlib instance and encodes the binary PNGs as Base64 strings.
```python
def generate_plots(plot_data, time_points):
    images = []
    for var_name, y_vals in plot_data.items():
        if isinstance(y_vals, str): continue
        plt.figure(figsize=(8, 5))
        plt.plot(time_points, y_vals, linewidth=2, color='#7c3aed')
        plt.title(f"{var_name} vs Time", fontsize=12, fontweight='bold')
        plt.grid(True, alpha=0.3)
        buf = io.BytesIO()
        plt.savefig(buf, format='png', dpi=100)
        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        images.append({"name": var_name, "image": img_base64})
        plt.close()
    return images
```

---

## 💻 Part 2: Full-Stack Architecture & Integration (40% Concentration)

The application provides a modern, responsive user experience backed by a Node.js runtime and Firebase services.

### 1. REST API Specification: `POST /analyze`
The React client submits the schematic definition, and the backend returns symbolic expressions, time-domain equations, and transient plots.

*   **Endpoint URL**: `/analyze`
*   **Method**: `POST`
*   **Headers**: `Content-Type: application/json`
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
*   **Response Body**:
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

### 2. Node.js Express API Server Bridge (`server/server.js`)
The server acts as a gateway that spawns the Python solver as a subprocess, piping JSON strings via standard I/O.
```javascript
app.post('/analyze', (req, res) => {
    const circuitData = req.body;
    const pythonCmd = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
    const pythonProcess = spawn(pythonCmd, [path.join(__dirname, '../engine/solver.py')]);
    
    let dataString = '';
    let errorString = '';

    // Pipe JSON to Python process stdin
    pythonProcess.stdin.write(JSON.stringify(circuitData));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => dataString += data.toString());
    pythonProcess.stderr.on('data', (data) => errorString += data.toString());

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            return res.status(500).json({ status: 'error', message: 'Solver failed', details: errorString });
        }
        try {
            res.json(JSON.parse(dataString));
        } catch (e) {
            res.status(500).json({ status: 'error', message: 'Invalid response from solver', raw: dataString });
        }
    });
});
```

---

### 3. Interactive React Frontend (Vite + React 19)
The user interface features three primary modules:

#### A. Interactive SVG Schematic Canvas
The canvas is implemented as a responsive SVG viewport. Users can select component tools (`R`, `L`, `C`, `V`, `I`), set value magnitudes using a visual range slider, and drag connections directly on the grid canvas.
*   **Coordinate Synchronization**: The canvas converts mouse positions to local SVG units (700x460 grid) and snaps them to a 10px grid.
*   **Node Dragging**: Users can drag nodes to reorganize layout structures. Components scale and rotate automatically to match node positions.
*   **Branch Vectors**: The SVG calculates the distance ($L$) and rotation angle ($\theta$) between the coordinates of two nodes ($x_1, y_1$) and ($x_2, y_2$):
    $$\theta = \arctan2(y_2 - y_1, x_2 - x_1) \cdot \frac{180}{\pi}$$
    Components are rendered inside a `<g transform="translate(x1, y1) rotate(theta)">` container.

#### B. KaTeX Formula Rendering
To display raw equations professionally, the client imports `katex` stylesheets and wraps symbols dynamically. The `Latex` component renders mathematical expressions in real time using the LaTeX format:
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

#### C. Firebase Authentication & Firestore History Integration
The client features authentication controls for saving circuit configurations:
*   **Dynamic Client Initialization**: The client fetches the Firebase config dynamically from the server at startup, allowing secure key provisioning.
*   **Firestore Database**: Saves circuit state records containing node configurations, branch models, and coordinate maps under the `circuits` collection, keyed by the authenticated user's `uid`.

---

## 🛠️ Installation & Local Setup

Follow these steps to configure your local development environment:

### Prerequisites
*   **Node.js** (v16.0.0 or higher)
*   **Python** (v3.8 or higher)
*   **pip** (Python package installer)

### 1. Clone the Repository
```bash
git clone <repository-url>
cd CircuitAnalyser
```

### 2. Configure Python Environment
Install the scientific libraries required by the solver engine:
```bash
# Verify Python version
python --version

# Install dependencies globally or in a virtual environment
pip install -r engine/requirements.txt
```
> [!NOTE]
> Ensure that python is mapped in your system environment PATH.

### 3. Configure API Server & Environment Variables
Navigate to the `server/` directory and install the Node.js packages:
```bash
cd server
npm install
```
To run the server with Firebase features, copy `client/.env.example` to `client/.env` and supply your Firebase credentials:
```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Configure Client Frontend
Navigate to the `client/` directory and install dependencies:
```bash
cd ../client
npm install
```

---

## 🚀 Running the Application

You can run the frontend and backend servers together using the workspace orchestrator:

### Run Client & Server Concurrently
From the root workspace directory, run:
```bash
npm run dev
```
This script runs the Express API server on `http://localhost:3000` and the Vite dev server on `http://localhost:5173`. Open the Vite address in your browser to design and solve circuits.

---

## 📥 Command-Line Solver Execution

You can run the Python engine directly from the command line using standard I/O redirection.

### 1. Run the Default Series RLC Circuit
Pipe an empty line to trigger the default solver demo:
```bash
# Windows PowerShell
echo "" | python engine/solver.py

# macOS / Linux Bash
echo "" | python3 engine/solver.py
```

### 2. Solve a Custom Circuit JSON Payload
Pipe a JSON string directly to `solver.py`:
```bash
# Windows PowerShell
'{"nodes": ["0", "1"], "branches": [{"id": "V1", "from": "1", "to": "0", "type": "V", "value": 12}, {"id": "R1", "from": "1", "to": "0", "type": "R", "value": 10}]}' | python engine/solver.py
```

---

## 🔍 Troubleshooting & Verification

*   **Singular Matrix Errors**: If the solver returns a `Singular matrix error`, the graph contains a node without a reference path, a voltage source loop, or a node isolated by current sources. Verify that all nodes are connected and that ground node `0` is present.
*   **Python Command Resolution**: On some platforms, the server might fail to resolve the default `'python'` shell command. Define a `PYTHON_PATH` environment variable in your `.env` (e.g., `PYTHON_PATH=python3` or pointing to a virtual environment executable) to resolve this.
*   **Disconnected Canvas**: All components must share nodes. If a component is drawn floating in space, the backend will reject the schema.

---

## 🤝 Project Contributions & Extensions

Contributions are welcome! If you would like to expand the backend engine's capabilities, consider implementing these extensions:
1.  **Non-Zero Initial Conditions**: Add support for initial inductor current ($L \cdot i_L(0^-)$ voltage source) and initial capacitor voltage ($v_C(0^-)/s$ voltage source) s-domain equivalents.
2.  **AC Frequency Sweep Analysis**: Support steady-state AC analysis by substituting $s = j\omega$ and plotting frequency magnitude and phase response (Bode plots).
3.  **Active Elements**: Add Op-Amp models using nullor models in graph theory to allow active filter simulations.
4.  **Dependent Sources**: Integrate VCVS, CCVS, VCCS, and CCCS controlled sources into the incidence matrix solver formulas.

---

## 📄 License
This project is licensed under the MIT License. Feel free to use and distribute it for academic or personal projects.
