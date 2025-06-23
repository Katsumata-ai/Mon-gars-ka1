#!/usr/bin/env node

/**
 * 🎨 MANGAKA AI - Script de démarrage du serveur MCP Stripe
 * 
 * Ce script démarre le serveur MCP Stripe avec la configuration appropriée
 * pour les paiements et checkout de Mangaka AI.
 */

const { spawn } = require('child_process');
const path = require('path');

// Configuration par défaut
const DEFAULT_TOOLS = [
  'customers.create',
  'customers.read',
  'products.create',
  'products.read',
  'prices.create',
  'prices.read',
  'paymentLinks.create',
  'invoices.create',
  'invoices.update',
  'invoiceItems.create',
  'balance.read',
  'refunds.create',
  'paymentIntents.read',
  'subscriptions.read',
  'subscriptions.update',
  'coupons.create',
  'coupons.read'
].join(',');

function startStripeMCP() {
  console.log('🚀 Démarrage du serveur MCP Stripe pour Mangaka AI...\n');

  // Vérifier la clé API Stripe
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    console.error('❌ Erreur: STRIPE_SECRET_KEY non définie dans les variables d\'environnement');
    console.error('💡 Ajoutez votre clé Stripe dans le fichier .env.local\n');
    process.exit(1);
  }

  if (!stripeKey.startsWith('sk_')) {
    console.error('❌ Erreur: La clé API Stripe doit commencer par "sk_"');
    console.error('💡 Vérifiez votre clé dans le fichier .env.local\n');
    process.exit(1);
  }

  // Arguments pour le serveur MCP
  const args = [
    '-y',
    '@stripe/mcp',
    `--tools=${DEFAULT_TOOLS}`,
    `--api-key=${stripeKey}`
  ];

  console.log('📋 Configuration:');
  console.log(`   • Outils: ${DEFAULT_TOOLS.split(',').length} outils Stripe activés`);
  console.log(`   • Clé API: ${stripeKey.substring(0, 12)}...`);
  console.log('');

  // Démarrer le serveur MCP
  const mcpProcess = spawn('npx', args, {
    stdio: 'inherit',
    env: { ...process.env }
  });

  mcpProcess.on('error', (error) => {
    console.error('❌ Erreur lors du démarrage du serveur MCP:', error.message);
    process.exit(1);
  });

  mcpProcess.on('exit', (code) => {
    if (code !== 0) {
      console.error(`❌ Le serveur MCP s'est arrêté avec le code: ${code}`);
      process.exit(code);
    }
  });

  // Gestion propre de l'arrêt
  process.on('SIGINT', () => {
    console.log('\n🛑 Arrêt du serveur MCP Stripe...');
    mcpProcess.kill('SIGINT');
  });

  process.on('SIGTERM', () => {
    console.log('\n🛑 Arrêt du serveur MCP Stripe...');
    mcpProcess.kill('SIGTERM');
  });
}

// Démarrer le serveur si ce script est exécuté directement
if (require.main === module) {
  startStripeMCP();
}

module.exports = { startStripeMCP };
