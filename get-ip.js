const os = require('os');

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (interface.family === 'IPv4' && !interface.internal) {
        // Prefer WiFi over other interfaces
        if (name.toLowerCase().includes('wi-fi') || name.toLowerCase().includes('wlan')) {
          return interface.address;
        }
      }
    }
  }
  
  // Fallback to first non-internal IPv4 address
  for (const name of Object.keys(interfaces)) {
    for (const interface of interfaces[name]) {
      if (interface.family === 'IPv4' && !interface.internal) {
        return interface.address;
      }
    }
  }
  
  return 'localhost';
}

const ip = getLocalIP();
console.log(`\n🌐 Network Access Information:`);
console.log(`Frontend: http://${ip}:3000`);
console.log(`Backend:  http://${ip}:8080`);
console.log(`\n📱 To access from mobile device:`);
console.log(`1. Make sure your phone is on the same WiFi network`);
console.log(`2. Open browser and go to: http://${ip}:3000`);
console.log(`3. For camera recording, you may need to use localhost:3000`);
console.log(`\n💡 Note: IP address may change if you switch WiFi networks\n`); 