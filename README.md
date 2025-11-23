# 🔌 Circuit Solver - Graph Theory & Laplace Transform Analysis

A powerful web-based electrical circuit analyzer that uses **Graph Theory** (Cut Set & Tie Set methods) and **Laplace Transform** analysis to compute voltages and currents across all circuit nodes and branches in both s-domain and time-domain.

![Circuit Solver](https://img.shields.io/badge/Made%20with-React-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js)
![Python](https://img.shields.io/badge/Engine-Python-3776AB?style=for-the-badge&logo=python)

## ✨ Features

### 🎯 Core Capabilities
- **Graph-Based Circuit Representation**: Circuits modeled as graphs for systematic analysis
- **Cut Set & Tie Set Analysis**: Automatic generation of cut set and tie set matrices
- **Laplace Domain Equations**: Symbolic equation formation in the s-domain
- **Time Domain Solutions**: Inverse Laplace transformation for transient analysis
- **Visual Plots**: Automatic generation of voltage/current vs. time graphs

### 🚀 User Experience
- **One-Click Examples**: Pre-loaded RC, RLC, and complex multi-loop circuits
- **Premium Dark UI**: Stunning gradient design with smooth animations
- **Input Validation**: Real-time validation of circuit parameters
- **Interactive Results**: Beautifully formatted equations with LaTeX rendering
- **Responsive Design**: Works on desktop and tablet devices

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|----------|
| **Frontend** | React + Vite | Modern reactive UI |
| **Backend** | Node.js + Express | API server & Python bridge |
| **Engine** | Python | Circuit analysis algorithms |
| **Math Library** | SymPy | Symbolic mathematics & Laplace transforms |
| **Visualization** | Matplotlib | Time-domain plotting |
| **Graph Theory** | NetworkX | Circuit graph operations |
| **Rendering** | KaTeX | LaTeX equation display |

## 📦 Installation

### Prerequisites
- **Node.js** (v16 or higher)
- **Python** (v3.8 or higher)
- **npm** or **yarn**

### Setup Steps

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd circuit
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r engine/requirements.txt
   ```

3. **Install Backend dependencies**
   ```bash
   cd server
   npm install
   cd ..
   ```

4. **Install Frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

## 🚀 Running the Application

You need to run both the backend and frontend servers:

### Terminal 1: Backend Server
```bash
cd server
node server.js
```
Server runs on `http://localhost:3000`

### Terminal 2: Frontend Development Server
```bash
cd client
npm run dev
```
Frontend runs on `http://localhost:5173`

### Access the Application
Open your browser and navigate to `http://localhost:5173`

## 📚 Usage Guide

### Quick Start with Examples
1. Click one of the **Quick Examples** buttons (RC Circuit, RLC Circuit, or Complex)
2. Click **⚡ Analyze Circuit**
3. View the results: equations and plots

### Building Custom Circuits

#### Adding Components
1. **Select Type**: Choose from Resistor (Ω), Inductor (H), Capacitor (F), Voltage Source (V), or Current Source (A)
2. **Define Connections**: Enter the "From" and "To" node identifiers
   - Node `0` is always the reference/ground node
   - Use sequential numbering (1, 2, 3...) for other nodes
3. **Enter Value**: Input the component value (must be positive)
4. **Add Branch**: Click the "➕ Add Branch" button

#### Example: Series RC Circuit
```
V1: 10V source from node 1 to 0
R1: 5Ω resistor from node 1 to 2
C1: 0.1F capacitor from node 2 to 0
```

### Understanding Results

#### ⚙️ Equations (s-domain)
Symbolic expressions for voltages and currents in the Laplace domain

#### 📈 Time Domain Expressions
Inverse Laplace transforms showing how quantities vary over time

#### 📊 Transient Response Plots
Graphical visualization of voltage/current evolution from t=0 to t=10 seconds

## 🧮 Mathematical Background

### Graph Theory Concepts

**Cut Set**: A minimal set of branches whose removal disconnects the graph into two parts. Each cut set corresponds to a KCL (Kirchhoff's Current Law) equation.

**Tie Set**: A loop formed by adding one link (co-tree branch) to the tree. Each tie set corresponds to a KVL (Kirchhoff's Voltage Law) equation.

### Analysis Method

1. **Graph Construction**: Circuit represented as a directed graph
2. **Tree Selection**: Spanning tree chosen (voltage sources preferred in tree)
3. **Matrix Formation**:
   - Cut Set Matrix `Q`: Relates twig currents to link currents
   - Tie Set Matrix `B`: Relates link voltages to twig voltages
4. **Laplace Transform**: All elements converted to s-domain impedances
5. **Equation System**: KCL + KVL + component V-I relations form a linear system
6. **Solution**: SymPy solves the symbolic system
7. **Inverse Transform**: Results converted back to time domain

### Component Models (s-domain)

- **Resistor**: `V = I·R`
- **Inductor**: `V = I·sL` (zero initial conditions)
- **Capacitor**: `V = I/(sC)` (zero initial conditions)
- **Voltage Source**: `V = Vs/s` (step input)
- **Current Source**: `I = Is/s` (step input)

## 📝 API Documentation

### POST /analyze

Analyzes a circuit and returns equations and plots.

**Request Body:**
```json
{
  "nodes": ["0", "1", "2"],
  "branches": [
    {
      "id": "V1",
      "from": "1",
      "to": "0",
      "type": "V",
      "value": 10
    },
    {
      "id": "R1",
      "from": "1",
      "to": "2",
      "type": "R",
      "value": 5
    },
    {
      "id": "C1",
      "from": "2",
      "to": "0",
      "type": "C",
      "value": 0.1
    }
  ]
}
```

**Response:**
```json
{
  "status": "success",
  "equations": {
    "V_V1": "10/s",
    "I_R1": "..."
  },
  "time_domain": {
    "V_V1": "10*Heaviside(t)",
    "I_R1": "..."
  },
  "plots": [
    {
      "name": "V_V1",
      "image": "base64_encoded_png..."
    }
  ]
}
```

## 🎨 Project Structure

```
circuit/
├── client/              # React frontend
│   ├── src/
│   │   ├── App.jsx     # Main application component
│   │   ├── index.css   # Premium dark theme styles
│   │   └── main.jsx    # Entry point
│   └── package.json
├── server/              # Node.js backend
│   ├── server.js       # Express API server
│   └── package.json
├── engine/              # Python solver
│   ├── solver.py       # Core analysis engine
│   └── requirements.txt
└── README.md
```

## 🔧 Troubleshooting

### Server Won't Start
- **Issue**: Port 3000 already in use
- **Solution**: Kill the existing process or change the port in `server/server.js`

### Python Dependencies Missing
- **Issue**: Module not found errors
- **Solution**: Run `pip install -r engine/requirements.txt`

### Blank Frontend Screen
- **Issue**: React app not loading
- **Solution**: Check browser console for errors, ensure backend is running

### Analysis Fails
- **Issue**: Circuit is not connected or invalid
- **Solution**: Ensure all nodes form a connected graph with node '0' as reference

## 🎓 Educational Applications

- **Circuit Theory**: Understanding transient responses in RLC circuits
- **Signals & Systems**: Laplace transform applications
- **Graph Theory**: Practical application in electrical engineering
- **Numerical Methods**: Symbolic computation and equation solving

## 🤝 Contributing

Contributions are welcome! Areas for enhancement:
- Additional component types (dependent sources, op-amps)
- Circuit diagram visualization
- Export results (PDF, CSV)
- Initial condition support
- AC analysis (frequency response)

## 📄 License

MIT License - feel free to use this project for educational purposes.

## 👥 Authors

Created as an educational tool for circuit analysis and graph theory demonstration.

---

**Made with ❤️ using React, Node.js, and Python**
