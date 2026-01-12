from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

# ================= SCHEDULING ALGORITHMS =================

def fcfs(processes):
    p = sorted(processes, key=lambda x: x['arrival'])
    time = 0
    gantt, details = [], []
    tw = tt = 0
    for proc in p:
        pid = proc['id']
        at = proc['arrival']
        bt = proc['burst']
        time = max(time, at)
        wt = time - at
        tat = wt + bt
        gantt.append({'pid': pid, 'start': time, 'end': time + bt})
        time += bt
        tw += wt
        tt += tat
        details.append({'pid': pid, 'at': at, 'bt': bt, 'wt': wt, 'tat': tat})
    return gantt, details, tw/len(p), tt/len(p)

def sjf(processes):
    p = processes.copy()
    used = [False]*len(p)
    time = done = 0
    gantt, details = [], []
    tw = tt = 0
    while done < len(p):
        idx, mn = -1, 10**9
        for i, proc in enumerate(p):
            if proc['arrival'] <= time and not used[i] and proc['burst'] < mn:
                mn, idx = proc['burst'], i
        if idx == -1:
            time += 1
            continue
        pid = p[idx]['id']
        at = p[idx]['arrival']
        bt = p[idx]['burst']
        wt = time - at
        tat = wt + bt
        gantt.append({'pid': pid, 'start': time, 'end': time + bt})
        time += bt
        used[idx] = True
        done += 1
        tw += wt
        tt += tat
        details.append({'pid': pid, 'at': at, 'bt': bt, 'wt': wt, 'tat': tat})
    return gantt, details, tw/len(p), tt/len(p)

def priority_scheduling(processes):
    p = processes.copy()
    used = [False]*len(p)
    time = done = 0
    gantt, details = [], []
    tw = tt = 0
    while done < len(p):
        idx, best = -1, 10**9
        for i, proc in enumerate(p):
            if proc['arrival'] <= time and not used[i] and proc['priority'] < best:
                best, idx = proc['priority'], i
        if idx == -1:
            time += 1
            continue
        pid = p[idx]['id']
        at = p[idx]['arrival']
        bt = p[idx]['burst']
        pr = p[idx]['priority']
        wt = time - at
        tat = wt + bt
        gantt.append({'pid': pid, 'start': time, 'end': time + bt})
        time += bt
        used[idx] = True
        done += 1
        tw += wt
        tt += tat
        details.append({'pid': pid, 'at': at, 'bt': bt, 'pr': pr, 'wt': wt, 'tat': tat})
    return gantt, details, tw/len(p), tt/len(p)

def round_robin(processes, tq):
    p = processes.copy()
    rem = [proc['burst'] for proc in p]
    time = 0
    gantt = []
    wt = [0]*len(p)
    while any(r > 0 for r in rem):
        done = True
        for i, proc in enumerate(p):
            if rem[i] > 0 and proc['arrival'] <= time:
                done = False
                start = time
                if rem[i] > tq:
                    time += tq
                    rem[i] -= tq
                else:
                    time += rem[i]
                    wt[i] = time - proc['arrival'] - proc['burst']
                    rem[i] = 0
                gantt.append({'pid': proc['id'], 'start': start, 'end': time})
        if done:
            # Advance time to next arrival
            next_arrivals = [proc['arrival'] for i, proc in enumerate(p) if rem[i] > 0]
            if next_arrivals:
                time = max(time, min(next_arrivals))
            else:
                break
    details = []
    tt = 0
    for i, proc in enumerate(p):
        tat = wt[i] + proc['burst']
        tt += tat
        details.append({'pid': proc['id'], 'at': proc['arrival'], 'bt': proc['burst'], 'wt': wt[i], 'tat': tat})
    return gantt, details, sum(wt)/len(p), tt/len(p)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/simulate', methods=['POST'])
def simulate():
    data = request.json
    processes = data['processes']
    algorithm = data['algorithm']
    tq = data.get('timeQuantum', 0)

    if algorithm == 'fcfs':
        gantt, details, awt, att = fcfs(processes)
    elif algorithm == 'sjf':
        gantt, details, awt, att = sjf(processes)
    elif algorithm == 'priority':
        gantt, details, awt, att = priority_scheduling(processes)
    elif algorithm == 'rr':
        gantt, details, awt, att = round_robin(processes, tq)
    else:
        return jsonify({'error': 'Invalid algorithm'}), 400

    return jsonify({
        'gantt': gantt,
        'details': details,
        'awt': awt,
        'att': att
    })

@app.route('/simulate_all', methods=['POST'])
def simulate_all():
    data = request.json
    processes = data['processes']
    tq = data.get('timeQuantum', 2)

    g1, d1, aw1, at1 = fcfs(processes)
    g2, d2, aw2, at2 = sjf(processes)
    g3, d3, aw3, at3 = round_robin(processes, tq)
    g4, d4, aw4, at4 = priority_scheduling(processes)

    results = {
        'fcfs': {'gantt': g1, 'details': d1, 'awt': aw1, 'att': at1},
        'sjf': {'gantt': g2, 'details': d2, 'awt': aw2, 'att': at2},
        'rr': {'gantt': g3, 'details': d3, 'awt': aw3, 'att': at3},
        'priority': {'gantt': g4, 'details': d4, 'awt': aw4, 'att': at4}
    }

    awts = {k: v['awt'] for k, v in results.items()}
    best = min(awts, key=awts.get)

    return jsonify({
        'results': results,
        'best': best,
        'awts': awts
    })

if __name__ == '__main__':
    import os
    port = int(os.environ.get("PORT", 10000))
    app.run(host='0.0.0.0', port=port)
