const express = require('express');
const { createServer } = require('http');
const next = require('next');
const path = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = 3001;

console.log('🚀 Démarrage du serveur MANGAKA-AI...');
console.log(`📍 Mode: ${dev ? 'development' : 'production'}`);
console.log(`🌐 URL: http://${hostname}:${port}`);

// Créer l'application Next.js
const app = next({ 
  dev, 
  hostname, 
  port,
  dir: __dirname,
  conf: {
    // Configuration minimale
    reactStrictMode: false,
    images: {
      remotePatterns: [
        {
          protocol: 'https',
          hostname: '**',
        },
      ],
    },
  }
});

const handle = app.getRequestHandler();

async function startServer() {
  try {
    console.log('⚙️  Préparation de l\'application Next.js...');
    await app.prepare();
    
    console.log('🔧 Création du serveur Express...');
    const server = express();
    
    // Middleware pour les logs
    server.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
      next();
    });
    
    // Servir les fichiers statiques
    server.use('/static', express.static(path.join(__dirname, '.next/static')));
    
    // Route de santé
    server.get('/health', (req, res) => {
      res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        message: 'Serveur MANGAKA-AI fonctionnel'
      });
    });
    
    // Toutes les autres routes vers Next.js
    server.all('*', (req, res) => {
      return handle(req, res);
    });
    
    // Créer le serveur HTTP
    const httpServer = createServer(server);
    
    // Démarrer le serveur
    httpServer.listen(port, hostname, (err) => {
      if (err) {
        console.error('❌ Erreur lors du démarrage:', err);
        process.exit(1);
      }
      
      console.log('\n🎉 SERVEUR DÉMARRÉ AVEC SUCCÈS !');
      console.log('=' .repeat(50));
      console.log(`🌐 Application: http://${hostname}:${port}`);
      console.log(`❤️  Santé: http://${hostname}:${port}/health`);
      console.log(`🎨 Interface personnages: http://${hostname}:${port}/project/[id]/edit`);
      console.log('=' .repeat(50));
      console.log('\n✅ Votre nouvelle interface MANGAKA-AI est prête !');
      console.log('📋 Fonctionnalités disponibles:');
      console.log('   - Interface structurée (non-chatbot)');
      console.log('   - Branding MANGAKA-AI respecté');
      console.log('   - Générations illimitées');
      console.log('   - Formulaires ergonomiques');
      console.log('   - Galerie avec favoris');
      console.log('\n🎯 Accédez à un projet et cliquez sur "Personnages" !');
    });
    
    // Gestion des erreurs
    httpServer.on('error', (err) => {
      console.error('❌ Erreur serveur:', err);
      if (err.code === 'EADDRINUSE') {
        console.log(`⚠️  Le port ${port} est occupé. Essayez un autre port.`);
      }
      process.exit(1);
    });
    
    // Gestion de l'arrêt propre
    process.on('SIGINT', () => {
      console.log('\n🛑 Arrêt du serveur...');
      httpServer.close(() => {
        console.log('✅ Serveur arrêté proprement');
        process.exit(0);
      });
    });
    
    process.on('SIGTERM', () => {
      console.log('\n🛑 Arrêt forcé du serveur...');
      httpServer.close(() => {
        console.log('✅ Serveur arrêté');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Erreur fatale:', error);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer().catch((error) => {
  console.error('❌ Impossible de démarrer le serveur:', error);
  process.exit(1);
});
