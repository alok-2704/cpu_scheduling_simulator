let processes = [];
let algorithm = 'fcfs';
let timeQuantum = null;
let speed = 0;
let paused = false;
let animationId = null;
let allResults = {};
let stopAnimation = false;

document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('generateBtn').addEventListener('click', generateProcessInputs);
    document.getElementById('runBtn').addEventListener('click', runSimulation);
    document.getElementById('runAllBtn').addEventListener('click', runAllSimulations);
    document.getElementById('resetBtn').addEventListener('click', resetGUI);
    document.getElementById('bestBtn').addEventListener('click', showBestAlgorithm);
    document.getElementById('pauseBtn').addEventListener('click', togglePause);
    document.getElementById('speed').addEventListener('input', updateSpeed);
    document.getElementById('themeToggle').addEventListener('click', toggleTheme);
    document.querySelectorAll('input[name="algorithm"]').forEach(radio => {
        radio.addEventListener('change', updateAlgorithm);
    });
    document.getElementById('ganttButtons').addEventListener('click', function(e) {
        if (e.target.classList.contains('ganttBtn')) {
            const algo = e.target.getAttribute('data-algo');
            showGantt(algo);
        }
    });
    document.getElementById('closeError').addEventListener('click', hideError);
});

function generateProcessInputs() {
    let numProcesses = parseInt(document.getElementById('numProcesses').value);
    if (isNaN(numProcesses) || numProcesses < 1) {
        numProcesses = null;
        document.getElementById('numProcesses').value = null;
    }
    const processInputs = document.getElementById('processInputs');
    processInputs.innerHTML = '';

    for (let i = 0; i < numProcesses; i++) {
        const row = document.createElement('div');
        row.className = 'process-row';
        row.innerHTML = `
            <label>P${i+1}</label>
            <label>Arrival: <input type="number" class="arrival" min="0"></label>
            <label>Burst: <input type="number" class="burst" min="1"></label>
            <label class="priority-label" style="display: none;">Priority: <input type="number" class="priority" min="0" disabled></label>
        `;
        processInputs.appendChild(row);
    }
    updateAlgorithm();
}

function updateAlgorithm() {
    const selected = document.querySelector('input[name="algorithm"]:checked');
    algorithm = selected ? selected.value : undefined;
    const timeQuantumInput = document.getElementById('timeQuantum');
    const timeQuantumLabel = document.getElementById('timeQuantumLabel');
    const priorityInputs = document.querySelectorAll('.priority');
    const priorityLabels = document.querySelectorAll('.priority-label');

    if (!selected) {
        timeQuantumInput.disabled = true;
        timeQuantumInput.style.display = 'none';
        timeQuantumLabel.style.display = 'none';
        priorityInputs.forEach(input => input.disabled = true);
        priorityLabels.forEach(label => label.style.display = 'none');
        return;
    }

    if (algorithm === 'rr') {
        timeQuantumInput.disabled = false;
        timeQuantumInput.style.display = 'inline-block';
        timeQuantumLabel.style.display = 'inline-block';
    } else {
        timeQuantumInput.disabled = true;
        timeQuantumInput.style.display = 'none';
        timeQuantumLabel.style.display = 'none';
    }

    if (algorithm === 'priority') {
        priorityInputs.forEach(input => input.disabled = false);
        priorityLabels.forEach(label => label.style.display = 'inline-block');
    } else {
        priorityInputs.forEach(input => input.disabled = true);
        priorityLabels.forEach(label => label.style.display = 'none');
    }
}

function updateSpeed() {
    speed = parseInt(document.getElementById('speed').value);
    document.getElementById('speedValue').textContent = speed;
}

function togglePause() {
    paused = !paused;
    document.getElementById('pauseBtn').textContent = paused ? 'Resume' : 'Pause';
}

function collectProcesses() {
    processes = [];
    const rows = document.querySelectorAll('.process-row');
    for (let index = 0; index < rows.length; index++) {
        const row = rows[index];
        const arrival = parseInt(row.querySelector('.arrival').value);
        const burst = parseInt(row.querySelector('.burst').value);
        const priority = parseInt(row.querySelector('.priority').value);
        if (isNaN(arrival) || arrival < 0) {
            showError(`Invalid arrival time for P${index+1}. Must be a non-negative number.`);
            return false;
        }
        if (isNaN(burst) || burst < 1) {
            showError(`Invalid burst time for P${index+1}. Must be at least 1.`);
            return false;
        }
        if (algorithm === 'priority' && (isNaN(priority) || priority < 0)) {
            showError(`Invalid priority for P${index+1}. Must be a non-negative number.`);
            return false;
        }
        processes.push({
            id: `P${index+1}`,
            arrival: arrival,
            burst: burst,
            priority: priority
        });
    }
    return true;
}

function runSimulation() {
    hideError();
    stopAnimation = false; // Reset stopAnimation flag
    const selectedAlgorithm = document.querySelector('input[name="algorithm"]:checked');
    if (!selectedAlgorithm) {
        showError('Please select a scheduling algorithm.');
        return;
    }
    algorithm = selectedAlgorithm.value;
    if (!collectProcesses()) return;
    timeQuantum = parseInt(document.getElementById('timeQuantum').value);
    if (algorithm === 'rr' && (isNaN(timeQuantum) || timeQuantum < 1)) {
        showError('Invalid time quantum. Must be at least 1.');
        return;
    }

    fetch('/simulate', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            processes: processes,
            algorithm: algorithm,
            timeQuantum: timeQuantum
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Server error: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        displayResults(data);
        animateGantt(data.gantt);
    })
    .catch(error => {
        showError('Error running simulation: ' + error.message);
        console.error('Error:', error);
    });
}

function runAllSimulations() {
    hideError();
    // Enable priority and time quantum inputs
    const priorityInputs = document.querySelectorAll('.priority');
    const priorityLabels = document.querySelectorAll('.priority-label');
    priorityInputs.forEach(input => input.disabled = false);
    priorityLabels.forEach(label => label.style.display = 'inline-block');
    const timeQuantumInput = document.getElementById('timeQuantum');
    const timeQuantumLabel = document.getElementById('timeQuantumLabel');
    timeQuantumInput.disabled = false;
    timeQuantumInput.style.display = 'inline-block';
    timeQuantumLabel.style.display = 'inline-block';

    if (!collectProcesses()) return;

    // Check priorities
    let priorityError = false;
    priorityInputs.forEach((input, index) => {
        const priority = parseInt(input.value);
        if (isNaN(priority) || priority < 0) {
            showError(`Invalid priority for P${index+1}. Must be a non-negative number.`);
            priorityError = true;
        }
    });
    if (priorityError) return;

    // Check time quantum
    timeQuantum = parseInt(document.getElementById('timeQuantum').value);
    if (isNaN(timeQuantum) || timeQuantum < 1) {
        showError('Invalid time quantum. Must be at least 1.');
        return;
    }

    fetch('/simulate_all', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            processes: processes,
            timeQuantum: timeQuantum
        })
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Server error: ' + response.status);
        }
        return response.json();
    })
    .then(data => {
        allResults = data.results;
        displayAllResults(data);
        document.getElementById('bestBtn').style.display = 'inline-block';
        document.getElementById('ganttButtons').style.display = 'block';
    })
    .catch(error => {
        showError('Error running all simulations: ' + error.message);
        console.error('Error:', error);
    });
}

function resetGUI() {
    document.getElementById('numProcesses').value = null;
    generateProcessInputs();
    // Clear input values
    const arrivalInputs = document.querySelectorAll('.arrival');
    const burstInputs = document.querySelectorAll('.burst');
    const priorityInputs = document.querySelectorAll('.priority');
    arrivalInputs.forEach(input => input.value = '');
    burstInputs.forEach(input => input.value = '');
    priorityInputs.forEach(input => input.value = '');
    document.querySelectorAll('input[name="algorithm"]').forEach(radio => radio.checked = false);
    updateAlgorithm();
    document.getElementById('timeQuantum').value = '';
    document.getElementById('speed').value = 1;
    speed = 1;
    document.getElementById('speedValue').textContent = '1';
    paused = true; // Stop any ongoing animation
    stopAnimation = true; // Stop any ongoing animation
    document.getElementById('pauseBtn').textContent = 'Pause';
    document.getElementById('pauseBtn').style.display = 'none';
    document.getElementById('output').textContent = '';
    document.getElementById('bestBtn').style.display = 'none';
    document.getElementById('bestLabel').textContent = '';
    document.getElementById('ganttButtons').style.display = 'none';
    const canvas = document.getElementById('ganttCanvas');
    canvas.width = 900;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    allResults = {};
}

function showBestAlgorithm() {
    fetch('/simulate_all', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            processes: processes,
            timeQuantum: timeQuantum
        })
    })
    .then(response => response.json())
    .then(data => {
        const best = data.best;
        const awt = data.awts[best];
        document.getElementById('bestLabel').textContent = `Best Algorithm: ${best.toUpperCase()} (Avg WT = ${awt.toFixed(2)})`;
    })
    .catch(error => console.error('Error:', error));
}

function showGantt(algo) {
    if (allResults[algo]) {
        algorithm = algo;
        animateGantt(allResults[algo].gantt);
    }
}

function displayAllResults(data) {
    let output = '';
    const algos = ['fcfs', 'sjf', 'rr', 'priority'];
    algos.forEach(algo => {
        const res = data.results[algo];
        output += `${algo.toUpperCase()}:\n`;
        res.details.forEach(detail => {
            if (algo === 'priority') {
                output += `${detail.pid}: AT=${detail.at}, BT=${detail.bt}, P=${detail.pr}, WT=${detail.wt}, TAT=${detail.tat}\n`;
            } else {
                output += `${detail.pid}: AT=${detail.at}, BT=${detail.bt}, WT=${detail.wt}, TAT=${detail.tat}\n`;
            }
        });
        output += `Avg WT=${res.awt.toFixed(2)}, Avg TAT=${res.att.toFixed(2)}\n\n`;
    });
    document.getElementById('output').textContent = output;
}

function displayResults(data) {
    let output = '';
    data.details.forEach(detail => {
        if (algorithm === 'priority') {
            output += `${detail.pid}: AT=${detail.at}, BT=${detail.bt}, P=${detail.pr}, WT=${detail.wt}, TAT=${detail.tat}\n`;
        } else {
            output += `${detail.pid}: AT=${detail.at}, BT=${detail.bt}, WT=${detail.wt}, TAT=${detail.tat}\n`;
        }
    });
    output += `\nAverage Waiting Time = ${data.awt.toFixed(2)}\n`;
    output += `Average Turnaround Time = ${data.att.toFixed(2)}\n`;
    document.getElementById('output').textContent = output;
}

function animateGantt(gantt) {
    const canvas = document.getElementById('ganttCanvas');
    const ctx = canvas.getContext('2d');

    const scale = 35;
    const y = 50;
    let x = 20;

    // Calculate total time to set canvas width dynamically
    const totalTime = Math.max(...gantt.map(item => item.end));
    canvas.width = totalTime * scale + 40;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Reset paused state for new animation
    paused = false;

    // Show pause button during animation
    document.getElementById('pauseBtn').style.display = 'inline-block';

    const colors = {
        'fcfs': '#5DADE2',
        'sjf': '#58D68D',
        'priority': '#F5B041',
        'rr': '#EC7063'
    };
    const color = colors[algorithm];

    function draw(i) {
        if (i >= gantt.length) return;
        if (paused) {
            setTimeout(() => draw(i), 100);
            return;
        }

        const { pid, start, end } = gantt[i];
        const width = (end - start) * scale;

        ctx.fillStyle = color;
        ctx.fillRect(x, y, 1, 40);

        function grow(currentWidth) {
            if (paused) {
                setTimeout(() => grow(currentWidth), 100);
                return;
            }
            if (currentWidth < width) {
                ctx.fillStyle = color;
                ctx.fillRect(x, y, currentWidth, 40);
                const delay = Math.max(1, 31 - speed);
                setTimeout(() => grow(currentWidth + 4), delay);
            } else {
                // Draw PID statically after animation

                ctx.fillRect(x + width/2 - 15, y + 12, 30, 15);
                ctx.fillStyle = 'black';
                ctx.font = 'bold 12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(pid, x + width/2, y + 22);
                x += width;
                draw(i + 1);
            }
        }
        grow(1);
    }

    draw(0);
}

    // Scheduling algorithms (for client-side if needed, but using server-side for now)
function fcfs(processes) {
    // Implementation similar to Python version
}

function sjf(processes) {
    // Implementation similar to Python version
}

function priorityScheduling(processes) {
    // Implementation similar to Python version
}

function roundRobin(processes, tq) {
    // Implementation similar to Python version
}

function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.style.display = 'block';
}

function hideError() {
    const errorDiv = document.getElementById('errorMessage');
    errorDiv.style.display = 'none';
}

function toggleTheme() {
    const body = document.body;
    const toggleBtn = document.getElementById('themeToggle');
    if (body.classList.contains('light-theme')) {
        body.classList.remove('light-theme');
        toggleBtn.textContent = 'Switch to Light Theme';
    } else {
        body.classList.add('light-theme');
        toggleBtn.textContent = 'Switch to Dark Theme';
    }
}
