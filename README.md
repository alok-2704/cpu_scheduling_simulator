A Python-based GUI application for simulating various CPU scheduling algorithms including FCFS, SJF, Round Robin, and Priority Scheduling.

## Features

- Simulate FCFS, SJF, Round Robin, and Priority scheduling algorithms
- Visual Gantt chart animation
- Compare all algorithms at once
- Adjustable animation speed and pause/resume functionality
- Input validation and error handling

## Deployment

The project has been packaged into standalone executables for easy deployment:

- `cpu_scheduling_sim.exe`: Main GUI application for CPU scheduling simulation
- `mini.exe`: Password strength checker utility

These executables are located in the `dist/` folder and can run on Windows systems without requiring Python installation.

## Usage

1. Run `cpu_scheduling_sim.exe` to launch the CPU Scheduling Simulator.
2. Enter the number of processes and generate input fields.
3. Select a scheduling algorithm.
4. Enter process details (Arrival Time, Burst Time, Priority if applicable).
5. Click "Run Scheduling" to simulate the selected algorithm or "Run All Algorithms" to compare all.
6. View the results and Gantt chart animation.

For the password strength checker, run `mini.exe` and enter a password when prompted.

## Requirements

- Windows OS (executables are built for Windows)
- No additional dependencies required

## Development

If you want to modify the source code:

- Requires Python 3.x
- Tkinter (included in standard Python installation)
- PyInstaller for building executables

To build your own executables:
```
pip install pyinstaller
pyinstaller --onefile cpu_scheduling_sim.py
pyinstaller --onefile mini.py
```
=======
# CPU Scheduling Simulator

A web-based application for simulating various CPU scheduling algorithms including FCFS, SJF, Round Robin, and Priority Scheduling.

## Features

- Simulate FCFS, SJF, Round Robin, and Priority scheduling algorithms
- Visual Gantt chart visualization
- Compare all algorithms at once
- Input validation and error handling
- Responsive web interface

## Deployment

The application is built as a Flask web app that can be deployed to any web server or cloud platform.

### Local Development

1. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

2. Run the application:
   ```
   python app.py
   ```

3. Open your browser and navigate to `http://localhost:5000`

### Web Deployment

The app can be deployed to platforms like:
- Heroku
- AWS Elastic Beanstalk
- Google App Engine
- DigitalOcean App Platform
- Any VPS with Python/Flask support

For Heroku deployment:
1. Create a `Procfile` with: `web: python app.py`
2. Set environment variable: `FLASK_ENV=production`
3. Deploy using Heroku CLI or Git integration

## Usage

1. Open the web application in your browser
2. Enter the number of processes and generate input fields
3. Select a scheduling algorithm
4. Enter process details (Arrival Time, Burst Time, Priority if applicable)
5. Click "Run Scheduling" to simulate the selected algorithm or "Run All Algorithms" to compare all
6. View the results and Gantt chart visualization

## Requirements

- Python 3.7+
- Flask 2.3.3

## Development

The project structure:
- `app.py`: Flask backend with scheduling algorithms
- `templates/index.html`: Frontend interface
- `requirements.txt`: Python dependencies
- `cpu_scheduling_sim.py`: Original Tkinter version (for reference)
- `mini.py`: Password strength checker (separate utility)
