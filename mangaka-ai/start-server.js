#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Démarrage du serveur MANGAKA-AI...\n');

// Vérifier que nous sommes dans le bon répertoire
const currentDir = process.cwd();
console.log(`📁 Répertoire actuel: ${currentDir}`);

// Vérifier les fichiers essentiels
const fs = require('fs');
const essentialFiles = [
  'package.json',
  'next.config.js',
  '.env.local',
  'src/app/layout.tsx'
];

console.log('🔍 Vérification des fichiers essentiels:');
essentialFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MANQUANT`);
  }
});

// Vérifier les variables d'environnement
console.log('\n🔧 Variables d\'environnement:');
const envVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'XAI_API_KEY'
];

envVars.forEach(envVar => {
  if (process.env[envVar]) {
    console.log(`   ✅ ${envVar} = ${process.env[envVar].substring(0, 20)}...`);
  } else {
    console.log(`   ❌ ${envVar} - NON DÉFINIE`);
  }
});

// Démarrer le serveur Next.js
console.log('\n🌐 Démarrage du serveur Next.js...');

const nextProcess = spawn('npx', ['next', 'dev', '--port', '3001'], {
  stdio: 'inherit',
  shell: true,
  env: {
    ...process.env,
    NODE_ENV: 'development'
  }
});

nextProcess.on('error', (error) => {
  console.error('❌ Erreur lors du démarrage du serveur:', error);
  process.exit(1);
});

nextProcess.on('exit', (code) => {
  if (code !== 0) {
    console.error(`❌ Le serveur s'est arrêté avec le code: ${code}`);
    process.exit(code);
  }
});

// Gérer l'arrêt propre
process.on('SIGINT', () => {
  console.log('\n🛑 Arrêt du serveur...');
  nextProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Arrêt du serveur...');
  nextProcess.kill('SIGTERM');
  process.exit(0);
});
