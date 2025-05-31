const { spawn } = require('child_process');

console.log('🔧 Démarrage du serveur MANGAKA-AI en mode debug...\n');

// Variables d'environnement
process.env.NODE_ENV = 'development';
process.env.NEXT_TELEMETRY_DISABLED = '1';

console.log('📋 Configuration:');
console.log('- Port: 3001');
console.log('- Mode: development');
console.log('- Turbopack: désactivé');
console.log('- Telemetry: désactivé\n');

// Démarrer Next.js avec options de debug
const args = [
  'next',
  'dev',
  '--port', '3001',
  '--no-turbo'
];

console.log(`🚀 Commande: npx ${args.join(' ')}\n`);

const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    DEBUG: 'next:*',
    NODE_OPTIONS: '--max-old-space-size=4096'
  }
});

child.on('error', (error) => {
  console.error('❌ Erreur:', error.message);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.log(`\n🛑 Processus arrêté par signal: ${signal}`);
  } else {
    console.log(`\n🔚 Processus terminé avec code: ${code}`);
  }
  process.exit(code || 0);
});

// Gestion des signaux
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt demandé...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt forcé...');
  child.kill('SIGTERM');
});
