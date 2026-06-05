const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

// Serve static files from the React frontend production build
app.use(express.static(path.join(__dirname, '../client/dist')));

app.post('/analyze', (req, res) => {
    const circuitData = req.body;
    
    // Spawn Python process (auto-detect OS or use env variable)
    const pythonCmd = process.env.PYTHON_PATH || (process.platform === 'win32' ? 'python' : 'python3');
    const pythonProcess = spawn(pythonCmd, [path.join(__dirname, '../engine/solver.py')]);
    
    let dataString = '';
    let errorString = '';

    // Send data to Python script via stdin
    pythonProcess.stdin.write(JSON.stringify(circuitData));
    pythonProcess.stdin.end();

    pythonProcess.stdout.on('data', (data) => {
        dataString += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
        errorString += data.toString();
    });

    pythonProcess.on('close', (code) => {
        if (code !== 0) {
            console.error(`Python script exited with code ${code}`);
            console.error(errorString);
            return res.status(500).json({ status: 'error', message: 'Solver failed', details: errorString });
        }

        try {
            const result = JSON.parse(dataString);
            res.json(result);
        } catch (e) {
            console.error("Failed to parse JSON from Python:", dataString);
            res.status(500).json({ status: 'error', message: 'Invalid response from solver', raw: dataString });
        }
    });
});

// All other GET requests serve the React frontend index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

