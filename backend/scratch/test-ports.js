const net = require('net');

const HOST = '174.138.180.7';
const PORTS = [5432, 22, 3000, 80, 443];

for (const port of PORTS) {
  const socket = new net.Socket();
  socket.setTimeout(3000);
  socket.connect(port, HOST, () => {
    console.log(`✅ Puerto ${port} - ABIERTO`);
    socket.destroy();
  });
  socket.on('error', () => console.log(`❌ Puerto ${port} - CERRADO o bloqueado`));
  socket.on('timeout', () => { console.log(`⏳ Puerto ${port} - TIMEOUT`); socket.destroy(); });
}
