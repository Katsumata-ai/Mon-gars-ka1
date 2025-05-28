# 🧭 Guide de Navigation - MANGAKA AI

## 🚨 Problème fréquent : "Missing script: dev"

### Pourquoi cela arrive-t-il ?

1. **Répertoires multiples** : Le projet a 2 `package.json`
   - 📁 `/workspace/MANGAKA-AI/package.json` (workspace)
   - 📁 `/workspace/MANGAKA-AI/mangaka-ai/package.json` (app Next.js)

2. **Navigation automatique** : Les terminaux s'ouvrent parfois dans :
   - `/home/gitpod/.npm/_npx/[random-id]` (répertoire temporaire)
   - `/workspace/MANGAKA-AI` (racine)
   - Ou ailleurs...

3. **Commandes npx** : Créent des répertoires temporaires

## ✅ Solutions permanentes

### 🎯 **Méthode 1 : Utiliser le workspace (RECOMMANDÉ)**
```bash
# Depuis N'IMPORTE OÙ dans le terminal :
cd /workspace/MANGAKA-AI && npm run dev
```

### 🎯 **Méthode 2 : Script de démarrage**
```bash
# Depuis la racine du projet :
./start.sh
```

### 🎯 **Méthode 3 : Alias (après configuration)**
```bash
# Après avoir exécuté setup-aliases.sh :
mangaka-dev    # Lance le serveur
mangaka        # Va à la racine
mangaka-app    # Va dans l'app
```

## 🔧 Configuration des alias

1. **Exécuter une seule fois :**
```bash
cd /workspace/MANGAKA-AI && ./setup-aliases.sh
```

2. **Recharger le terminal :**
```bash
source ~/.bashrc
```

## 📍 Comment vérifier où vous êtes

```bash
pwd                    # Affiche le répertoire actuel
ls -la                 # Liste les fichiers
cat package.json       # Vérifie le contenu du package.json
```

## 🎯 Répertoires importants

- **Racine projet** : `/workspace/MANGAKA-AI/`
- **App Next.js** : `/workspace/MANGAKA-AI/mangaka-ai/`
- **Scripts** : `/workspace/MANGAKA-AI/scripts/`
- **Framework** : `/workspace/MANGAKA-AI/Agentic-Coding-Framework/`

## 🚀 Commandes rapides

```bash
# Démarrage rapide (depuis n'importe où)
cd /workspace/MANGAKA-AI && npm run dev

# Navigation rapide
cd /workspace/MANGAKA-AI                    # Racine
cd /workspace/MANGAKA-AI/mangaka-ai         # App

# Vérification
pwd && ls -la package.json                 # Où suis-je ?
```

## ⚠️ À éviter

- ❌ `npm run dev` depuis un répertoire aléatoire
- ❌ Oublier de vérifier `pwd` avant les commandes
- ❌ Utiliser `npx` sans comprendre où cela vous emmène

## 🎉 Bonnes pratiques

- ✅ Toujours vérifier `pwd` en cas de doute
- ✅ Utiliser les alias configurés
- ✅ Utiliser le script `./start.sh` depuis la racine
- ✅ Utiliser `cd /workspace/MANGAKA-AI && npm run dev` en cas de doute
