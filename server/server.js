const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.post('/analyze', (req, res) => {
    const circuitData = req.body;
    
    // Spawn Python process
    const pythonProcess = spawn('python', [path.join(__dirname, '../engine/solver.py')]);
    
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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
