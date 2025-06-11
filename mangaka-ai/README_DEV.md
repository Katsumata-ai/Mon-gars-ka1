# MANGAKA AI - Guide de Développement

## 🚀 Démarrage Rapide

### Prérequis
- Node.js 18+ 
- npm ou yarn

### Installation et Démarrage

1. **Installation des dépendances** (déjà fait) :
```bash
npm install
```

2. **Démarrage du serveur de développement** :
```bash
npm run dev
```

Le serveur sera accessible sur : **http://localhost:3001**

### Configuration Environnement

Le fichier `.env.local` est déjà configuré avec :
- ✅ Supabase (Base de données)
- ✅ XAI Grok 2 API (IA)
- ✅ Configuration de l'application

### Scripts Disponibles

- `npm run dev` - Serveur de développement (port 3001)
- `npm run dev:turbo` - Serveur avec Turbopack (plus rapide)
- `npm run build` - Build de production
- `npm run start` - Serveur de production
- `npm run lint` - Vérification du code

### Structure du Projet

```
mangaka-ai/
├── src/
│   ├── app/           # Pages Next.js 13+ (App Router)
│   ├── components/    # Composants React réutilisables
│   └── lib/          # Utilitaires et configurations
├── public/           # Fichiers statiques
├── .env.local       # Variables d'environnement (configuré)
└── package.json     # Dépendances et scripts
```

### Technologies Utilisées

- **Next.js 15.3.2** - Framework React
- **React 19** - Interface utilisateur
- **Supabase** - Base de données et authentification
- **XAI Grok 2** - Intelligence artificielle
- **Tailwind CSS** - Styles
- **TypeScript** - Typage statique

### État du Projet

✅ **PRÊT POUR LE DÉVELOPPEMENT**
- Serveur fonctionnel sur http://localhost:3001
- Toutes les dépendances installées
- Configuration environnement complète
- Aucune erreur de compilation

### Prochaines Étapes

1. Ouvrir http://localhost:3001 dans votre navigateur
2. Commencer le développement de nouvelles fonctionnalités
3. Les modifications sont automatiquement rechargées (Hot Reload)

---

**Bon développement ! 🎨**
