const { execSync, spawn } = require('node:child_process');

const ports = [3000, 24678];

function killPort(port) {
  try {
    const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'ignore'] });
    const pids = new Set();

    output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach((line) => {
        const parts = line.split(/\s+/);
        const pid = parts[parts.length - 1];
        if (/^\d+$/.test(pid) && pid !== '0') {
          pids.add(pid);
        }
      });

    for (const pid of pids) {
      try {
        execSync(`taskkill /PID ${pid} /F`, { stdio: 'ignore' });
        console.log(`Stopped process ${pid} on port ${port}`);
      } catch {
        // ignore taskkill errors
      }
    }
  } catch {
    // no process on this port
  }
}

for (const port of ports) {
  killPort(port);
}

console.log('Starting dev server...');
const child = spawn('npm', ['run', 'dev'], { stdio: 'inherit', shell: true });
child.on('exit', (code) => process.exit(code || 0));
