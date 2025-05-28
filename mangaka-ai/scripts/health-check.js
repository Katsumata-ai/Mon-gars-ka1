#!/usr/bin/env node

const http = require('http');

function checkHealth() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Application is running successfully');
        console.log(`📊 Status: ${res.statusCode}`);
        console.log(`🔗 URL: http://localhost:3000`);
        resolve(true);
      } else {
        console.log(`❌ Application returned status: ${res.statusCode}`);
        reject(false);
      }
    });

    req.on('error', (err) => {
      console.log('❌ Application is not running');
      console.log(`Error: ${err.message}`);
      reject(false);
    });

    req.setTimeout(5000, () => {
      console.log('❌ Request timeout - Application may be slow to respond');
      req.destroy();
      reject(false);
    });
  });
}

async function main() {
  console.log('🔍 Checking application health...\n');
  
  try {
    await checkHealth();
    console.log('\n🎉 All systems operational!');
    process.exit(0);
  } catch (error) {
    console.log('\n💥 Health check failed');
    process.exit(1);
  }
}

main();
