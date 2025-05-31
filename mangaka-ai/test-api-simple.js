#!/usr/bin/env node

/**
 * Test simple de l'API de génération d'images
 */

const fetch = require('node-fetch');

async function testAPI() {
  console.log('🧪 Test simple de l\'API de génération d\'images');
  
  try {
    const response = await fetch('http://localhost:3001/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: 'test manga character',
        type: 'character',
        optimizePrompt: true
      })
    });

    console.log('📡 Statut de la réponse:', response.status);
    
    const result = await response.json();
    console.log('📋 Réponse complète:', JSON.stringify(result, null, 2));

    if (response.status === 401) {
      console.log('✅ API fonctionne - Authentification requise (normal)');
    } else if (response.status === 500) {
      console.log('❌ Erreur 500 - Problème serveur');
      console.log('🔍 Détails:', result);
    } else {
      console.log('📊 Statut inattendu:', response.status);
    }

  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('🔧 Le serveur n\'est pas accessible sur le port 3001');
    }
  }
}

testAPI();
