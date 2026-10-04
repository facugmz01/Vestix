const net = require('net');
const { execSync } = require('child_process');

function getWslIp() {
  try {
    const out = execSync('wsl -d podman-machine-default ip -4 addr show eth0', { encoding: 'utf-8' });
    const match = out.match(/inet\s+(\d+\.\d+\.\d+\.\d+)/);
    if (match) return match[1];
  } catch (err) {
    console.error('Error getting WSL IP:', err.message);
  }
  return '172.25.90.60';
}

const TARGET_IP = getWslIp();
const TARGET_PORT = 80;

function createProxy(port) {
  const server = net.createServer((clientSocket) => {
    const targetSocket = net.connect(TARGET_PORT, TARGET_IP, () => {
      clientSocket.pipe(targetSocket);
      targetSocket.pipe(clientSocket);
    });

    targetSocket.on('error', (err) => {
      clientSocket.destroy();
    });

    clientSocket.on('error', (err) => {
      targetSocket.destroy();
    });
  });

  server.on('error', (err) => {
    console.error(`Port ${port} error:`, err.message);
  });

  server.listen(port, '0.0.0.0', () => {
    console.log(`Proxy listening on 0.0.0.0:${port} -> ${TARGET_IP}:${TARGET_PORT}`);
  });

  return server;
}

console.log(`Starting proxy to WSL (${TARGET_IP}:${TARGET_PORT})...`);
createProxy(80);
createProxy(3000);
