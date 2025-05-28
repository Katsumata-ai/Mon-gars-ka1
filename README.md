# 🎨 MANGAKA AI

Plateforme SaaS de création de manga avec IA - Transformez vos idées en histoires manga professionnelles.

## 🚀 Démarrage Rapide

### Option 1 : Depuis la racine (Recommandé)
```bash
# Depuis /workspace/MANGAKA-AI
npm run dev
```

### Option 2 : Script de démarrage
```bash
# Depuis /workspace/MANGAKA-AI
./start.sh
```

### Option 3 : Navigation manuelle
```bash
# Naviguer vers le projet Next.js
cd mangaka-ai
npm run dev
```

## 📁 Structure du Projet

```
MANGAKA-AI/
├── mangaka-ai/                 # Application Next.js principale
│   ├── src/
│   │   ├── app/               # Pages et API routes
│   │   ├── components/        # Composants React
│   │   └── lib/              # Utilitaires et configuration
│   ├── package.json          # Dépendances Next.js
│   └── ...
├── Agentic-Coding-Framework/  # Framework de développement IA
├── package.json              # Scripts de workspace
├── start.sh                  # Script de démarrage
└── README.md                 # Ce fichier
```

## 🎯 Fonctionnalités

- ✅ **Générateur d'Images IA** - Créez personnages, décors et scènes
- ✅ **Créateur de Scènes** - Combinez vos assets en scènes cohérentes  
- ✅ **Éditeur de Pages** - Canvas avancé pour assembler vos pages manga
- ✅ **Script Editor** - Organisez votre histoire en chapitres et scènes
- ✅ **Gestion des Crédits** - Système freemium/pro intégré

## 🛠️ Technologies

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS avec thème manga
- **Backend**: Supabase (Auth + Database)
- **Canvas**: Fabric.js pour l'éditeur de pages
- **IA**: Simulation Xai Grok 2 API

## 🔗 URLs Importantes

- **Application**: http://localhost:3000
- **Dashboard**: http://localhost:3000/dashboard
- **Générateur**: http://localhost:3000/generate
- **Créateur de Scènes**: http://localhost:3000/scene-creator
- **Éditeur de Pages**: http://localhost:3000/page-editor
- **Script Editor**: http://localhost:3000/script-editor

## ⚠️ Résolution des Erreurs Communes

### Erreur "package.json not found"
```bash
# ❌ Incorrect (depuis la racine)
npm run dev

# ✅ Correct (depuis la racine)
npm run dev  # Utilise le script workspace

# ✅ Ou naviguer vers le projet
cd mangaka-ai && npm run dev
```

### Erreur "node_modules not found"
```bash
cd mangaka-ai
npm install
npm run dev
```

## 🎨 Design System

- **Couleurs**: Palette noir/rouge manga authentique
- **Thème**: Dark mode avec accents primaires
- **Responsive**: Adaptation mobile/desktop
- **Animations**: Micro-interactions satisfaisantes

## 📱 Navigation

1. **Landing Page** → Présentation du produit
2. **Authentification** → Connexion/Inscription
3. **Dashboard** → Vue d'ensemble des projets
4. **Workflow Créatif**:
   - Générer des images IA
   - Créer des scènes combinées
   - Assembler en pages manga
   - Organiser avec le script editor

---

**Développé avec ❤️ par l'équipe MANGAKA AI**
