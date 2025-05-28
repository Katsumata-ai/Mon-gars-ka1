#!/bin/bash

# MANGAKA AI - Script de démarrage
echo "🚀 Démarrage de MANGAKA AI..."

# Vérifier si nous sommes dans le bon répertoire
if [ ! -d "mangaka-ai" ]; then
    echo "❌ Erreur: Le dossier 'mangaka-ai' n'existe pas dans le répertoire courant."
    echo "📍 Assurez-vous d'être dans le répertoire racine du projet MANGAKA-AI"
    exit 1
fi

# Naviguer vers le dossier du projet Next.js
cd mangaka-ai

# Vérifier si package.json existe
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé dans mangaka-ai/"
    exit 1
fi

# Vérifier si node_modules existe, sinon installer les dépendances
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances..."
    npm install
fi

# Démarrer le serveur de développement
echo "🎨 Lancement du serveur de développement..."
echo "📱 L'application sera disponible sur http://localhost:3000"
echo ""
npm run dev
