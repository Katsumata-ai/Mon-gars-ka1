# 🤖 ORCHESTRATEUR IA AUTONOME - MENU ASSEMBLAGE MANGAKA-AI

## 🎯 MISSION AUTONOME ET CONTRAINTES D'INTÉGRATION

**Vous êtes un Agent IA Autonome** spécialisé dans l'implémentation de systèmes complexes. Votre mission est d'implémenter **complètement et parfaitement** le menu assemblage MANGAKA-AI selon ce plan détaillé, de manière **100% autonome** sans intervention humaine.

### 📋 PROTOCOLE D'EXÉCUTION OBLIGATOIRE

**AVANT TOUTE ACTION :**
1. **Analyser l'état actuel** avec `codebase-retrieval` pour comprendre l'infrastructure existante
2. **Valider l'environnement** (Node.js, npm, git, Supabase, MCP tools)
3. **Exécuter les tâches séquentiellement** selon les dépendances définies
4. **Valider chaque critère d'acceptation** avant de passer à la tâche suivante
5. **Gérer les erreurs** avec retry automatique et rollback si nécessaire

### Localisation et Intégration
- **Page cible** : `http://localhost:3001/project/45d5715b-103d-4006-ae58-7d27aa4a5ce0/edit`
- **Menu spécifique** : "Assemblage" uniquement (pas de nouvelle page ou menu, focus toi la bas)
- **Infrastructure existante** : Gestionnaire de pages avec sidebar masquable/affichable déjà implémenté
- **Composants à réutiliser** : `PagesSidebar.tsx` (à améliorer), `ModernUnifiedEditor.tsx`
- **Approche images** : Interface fluide et ergonomique intégrée (PAS de AssetSidebar)
- **Intégration existante** : Respecter header global et navbar gauche
- **Menus adjacents** : Script, Personnage, Décor, Scènes déjà implémentés
- **Design system** : Rouge #ef4444, Noir #0f172a, Orange #f59e0b
### Justification Technique
- **Migration Fabric.js → PixiJS v8** : Performance 60 FPS vs 9 FPS
- **WebGL natif** : Accélération GPU pour 100+ éléments simultanés
- **@pixi/react v8** : Pragma JSX moderne avec TypeScript complet
- **Compatibilité** : React 19 + TypeScript + Tailwind CSS

## 📊 STRUCTURE DU PLAN

Le plan est organisé en **4 phases principales** avec **32 tâches spécifiques** :
- **Phase 1** : Fondations et Migration (8 tâches) - **Complexité réduite** grâce à l'infrastructure existante
- **Phase 2** : Fonctionnalités Core (12 tâches) - Focus sur PixiJS et fonctionnalités avancées
- **Phase 3** : Interface et Intégration (8 tâches) - **Simplifiée** par réutilisation des composants
- **Phase 4** : Optimisation et Finalisation (4 tâches)

### 🔄 **INFRASTRUCTURE EXISTANTE À AMÉLIORER**
- **Gestionnaire de pages** : `PagesSidebar.tsx` à améliorer avec miniatures PixiJS et synchronisation intelligente
- **Système de toggle** : Boutons header pour masquer/afficher le sidebar pages (garder uniquement)
- **Interface responsive** : Desktop/mobile avec drawers automatiques
- **Design system** : MangaButton, couleurs, animations déjà cohérents

### 🎨 **NOUVELLE APPROCHE POUR LES IMAGES**
- **Interface fluide intégrée** : Panneau flottant contextuel + barre d'outils extensible
- **Manipulation ergonomique** : Accès direct aux images sans sidebar fixe
- **Recherche intelligente** : Filtrage en temps réel avec favoris et récents
- **Performance optimisée** : Chargement progressif et cache intelligent

---

## 🏗️ PHASE 1 : FONDATIONS ET MIGRATION PIXIJS

### ✅ 1.1 Installation et Configuration PixiJS v8
**Complexité : 7/10 | Durée : 4h | Priorité : CRITIQUE**

**COMMANDES AUTONOMES À EXÉCUTER :**
```bash
# Installation obligatoire des dépendances PixiJS v8
npm install pixi.js@^8.2.6 @pixi/react@beta
npm install @pixi/assets @pixi/graphics @pixi/text @pixi/events @pixi/extract
npm install zustand jspdf html2canvas react-color
```

**VALIDATION AUTOMATIQUE OBLIGATOIRE :**
```typescript
// Tests de validation à exécuter après installation
const validation = await validateInstallation({
  packages: ['pixi.js', '@pixi/react', '@pixi/assets'],
  versions: { 'pixi.js': '^8.2.6' },
  typescript: true,
  webgl: true
})
if (!validation.success) throw new Error('Installation failed: ' + validation.errors)
```

**Critères d'acceptation :**
- [ ] Installation `pixi.js@^8.2.6` et `@pixi/react@beta` réussie
- [ ] Installation modules PixiJS : `@pixi/assets`, `@pixi/graphics`, `@pixi/text`, `@pixi/events` réussie
- [ ] Configuration TypeScript pour PixiJS v8 fonctionnelle
- [ ] Test de compatibilité WebGL/WebGPU passé avec succès

**Dépendances :** Aucune

### ✅ 1.2 Architecture des Composants PixiJS
**Complexité : 8/10 | Durée : 6h | Priorité : CRITIQUE**

**CRÉATION AUTOMATIQUE DE FICHIERS :**
```typescript
// Structure de fichiers à créer automatiquement
const fileStructure = {
  'src/components/assembly/': {
    'index.ts': 'export * from "./core/PixiApplication"',
    'core/PixiApplication.tsx': PIXI_APPLICATION_TEMPLATE,
    'ui/ToolBar.tsx': TOOLBAR_TEMPLATE,
    'objects/ResizableSprite.tsx': RESIZABLE_SPRITE_TEMPLATE,
    'managers/StateManager.ts': STATE_MANAGER_TEMPLATE,
    'types/assembly.types.ts': TYPES_TEMPLATE
  }
}
await createFileStructure(fileStructure)
```

**VALIDATION AUTOMATIQUE :**
```typescript
// Vérifier que tous les fichiers sont créés et compilent
await validateFileStructure([
  'src/components/assembly/core/PixiApplication.tsx',
  'src/components/assembly/managers/StateManager.ts',
  'src/components/assembly/types/assembly.types.ts'
])
await validateTypeScriptCompilation('src/components/assembly/')
```

**Critères d'acceptation :**
- [ ] Structure de fichiers dans `src/components/assembly/` créée
- [ ] Composant `PixiAssemblyApp.tsx` principal implémenté
- [ ] Gestionnaire d'état avec Zustand fonctionnel
- [ ] Configuration WebGL optimisée (60 FPS, antialias, resolution)

**Dépendances :** 1.1

### ✅ 1.3 Intégration dans l'Infrastructure Existante
**Complexité : 4/10 | Durée : 2h | Priorité : CRITIQUE**

**MODIFICATIONS AUTOMATIQUES OBLIGATOIRES :**
```typescript
// Modification du ModernUnifiedEditor.tsx
await modifyExistingFile({
  path: 'src/components/ModernUnifiedEditor.tsx',
  modifications: [
    {
      action: 'import',
      content: 'import { PixiAssemblyApp } from "./assembly"'
    },
    {
      action: 'replace',
      target: 'assemblage menu content',
      content: '<PixiAssemblyApp />'
    },
    {
      action: 'remove',
      target: 'AssetSidebar references'
    }
  ]
})

// Suppression des références AssetSidebar
await removeAssetSidebarReferences([
  'toggleAssetSidebar()',
  'assetSidebarVisible',
  'AssetSidebar component imports'
])
```

**VALIDATION INTÉGRATION :**
```typescript
// Tests d'intégration obligatoires
await validateIntegration([
  () => testPageLoad('http://localhost:3001/project/45d5715b-103d-4006-ae58-7d27aa4a5ce0/edit'),
  () => testMenuNavigation(),
  () => testDesignConsistency(),
  () => testPagesSidebarFunctionality()
])
```

**Critères d'acceptation :**
- [ ] Intégration dans le menu "Assemblage" existant de `ModernUnifiedEditor.tsx` réussie
- [ ] Amélioration du `PagesSidebar.tsx` existant pour la gestion des pages
- [ ] Suppression des références à `AssetSidebar.tsx` (nouvelle approche images)
- [ ] Respect du système de toggle du sidebar pages uniquement
- [ ] Modification des boutons header (garder uniquement Pages, supprimer Assets)

**Dépendances :** 1.2

### ✅ 1.4 Canvas PixiJS Principal
**Complexité : 8/10 | Durée : 5h | Priorité : CRITIQUE**

**Critères d'acceptation :**
- [ ] Application PixiJS avec Stage et Container hiérarchiques
- [ ] Couches séparées : background, characters, panels, dialogue, UI
- [ ] Gestion des événements pointer (down, move, up)
- [ ] Grille d'aide et guides visuels

**Dépendances :** 1.3
**Configuration WebGL :**
- Resolution : `window.devicePixelRatio`
- Background : `0xF8F8F8`
- Antialias : `true`
- PowerPreference : `high-performance`

### ✅ 1.5 Gestionnaire d'État Global
**Complexité : 7/10 | Durée : 4h | Priorité : CRITIQUE**

**Critères d'acceptation :**
- [ ] Store Zustand avec état des pages, éléments, sélection
- [ ] Actions CRUD pour éléments (create, update, delete)
- [ ] Historique undo/redo avec sauvegarde d'état
- [ ] Gestion des outils actifs et panneaux UI

**Dépendances :** 1.4
**Types d'éléments :** sprite, panel, dialogue, background

### ✅ 1.6 Système de Sauvegarde Supabase
**Complexité : 6/10 | Durée : 3h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Sérialisation JSON de l'état PixiJS complet
- [ ] Sauvegarde automatique toutes les 30 secondes
- [ ] Utilisation table `pages` existante avec champ JSONB `content`
- [ ] Récupération après crash ou fermeture

**Dépendances :** 1.5
**Structure JSON :**
```json
{
  "pixiState": { "stage": { "children": [...] } },
  "metadata": { "version": "2.0", "pixiVersion": "8.0.0" }
}
```

### ✅ 1.7 Chargement des Textures
**Complexité : 5/10 | Durée : 2h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Intégration avec Assets.load() de PixiJS v8
- [ ] Chargement des images depuis galeries Supabase
- [ ] Cache intelligent des textures
- [ ] Gestion des erreurs de chargement

**Dépendances :** 1.6
**Sources :** Galeries décors, personnages, scènes existantes

### ✅ 1.8 Tests de Performance WebGL
**Complexité : 4/10 | Durée : 2h | Priorité : MOYENNE**

**Critères d'acceptation :**
- [ ] Test avec 100+ éléments simultanés
- [ ] Mesure FPS constant à 60
- [ ] Test de mémoire < 300MB
- [ ] Compatibilité Chrome, Firefox, Safari, Edge

**Dépendances :** 1.7
**Métriques cibles :** 60 FPS, < 300MB RAM, < 2s chargement

---

## 🎨 PHASE 2 : FONCTIONNALITÉS CORE

### ✅ 2.1 Interface Fluide pour les Images
**Complexité : 8/10 | Durée : 6h | Priorité : CRITIQUE**

**Critères d'acceptation :**
- [ ] Panneau flottant contextuel pour sélection d'images
- [ ] Barre d'outils extensible avec galeries intégrées
- [ ] Recherche intelligente avec filtres en temps réel
- [ ] Système de favoris et images récemment utilisées
- [ ] Prévisualisation avec métadonnées (taille, type, tags)
- [ ] Ajout d'images au canvas par clic/double-clic

**Dépendances :** 1.8
**Interface :** Panneau flottant + barre d'outils + overlay modal
**Performance :** Chargement progressif avec virtualisation

### ✅ 2.2 Système de Redimensionnement d'Images
**Complexité : 8/10 | Durée : 6h | Priorité : CRITIQUE**

**Critères d'acceptation :**
- [ ] Handles de resize (8 positions : coins + centres)
- [ ] Maintien proportions avec bouton dédié
- [ ] Curseurs contextuels (nw-resize, ne-resize, etc.)
- [ ] Contraintes minimales (50x50px)

**Dépendances :** 2.1
**Handles :** top-left, top-right, bottom-left, bottom-right, centers
**Curseurs :** nw-resize, ne-resize, sw-resize, se-resize, n-resize, s-resize

### ✅ 2.3 Bulles de Dialogue Éditables
**Complexité : 9/10 | Durée : 10h | Priorité : CRITIQUE**

**Critères d'acceptation :**
- [ ] 5 types : speech, thought, shout, whisper, explosion
- [ ] Éditeur de texte inline avec div HTML contentEditable
- [ ] Personnalisation : couleur fond, contour, texte, pointillés
- [ ] Queue positionnée automatiquement (4 positions)

**Dépendances :** 2.2
**Types de bulles :**
- Speech : Bulle classique avec queue triangulaire
- Thought : Bulle ovale avec petites bulles
- Shout : Contour en zigzag/étoile
- Whisper : Contour en pointillés
- Explosion : Forme irrégulière avec pointes

### ✅ 2.4 Système de Panels/Cases Manga
**Complexité : 8/10 | Durée : 6h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Création panels rectangulaires, circulaires, polygonaux
- [ ] Bordures personnalisables (épaisseur, style, couleur)
- [ ] Templates layouts prédéfinis (1, 2, 3, 4 panels)
- [ ] Snap-to-grid et alignement automatique

**Dépendances :** 2.3
**Formes :** Rectangle, cercle, polygone, formes libres
**Templates :** 1 panel pleine page, 2 panels verticaux/horizontaux, 3 panels, grille 2x2

### ✅ 2.5 Amélioration du Gestionnaire de Pages + Logique Backend Intelligente
**Complexité : 7/10 | Durée : 5h | Priorité : HAUTE**

**IMPLÉMENTATION BACKEND AVEC MCP SUPABASE :**
```typescript
// Création des tables nécessaires avec MCP Supabase
await supabase({
  summary: "Créer les tables pour le système de pages amélioré",
  method: "POST",
  path: "/v1/projects/lqpqfmwfvtxofeaucwqw/database/query",
  data: {
    query: `
      CREATE TABLE IF NOT EXISTS page_drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id UUID NOT NULL,
        user_id UUID NOT NULL,
        content JSONB NOT NULL DEFAULT '{}',
        session_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
      );

      ALTER TABLE pages ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
      ALTER TABLE pages ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft';
    `
  }
})

// Implémentation du système de sauvegarde différée
const saveManager = await implementDeferredSaveSystem({
  localStorage: true,
  autoSave: '10s',
  explicitSave: 'button_only',
  recovery: 'automatic',
  thumbnails: 'pixi_extract'
})
```

**VALIDATION BACKEND :**
```typescript
// Tests du système de sauvegarde
await validateBackendSystem([
  () => testPageSerialization(),
  () => testDeferredSave(),
  () => testThumbnailGeneration(),
  () => testPageRecovery()
])
```

**Critères d'acceptation :**
- [ ] Amélioration du `PagesSidebar.tsx` avec miniatures PixiJS en temps réel
- [ ] Logique backend intelligente pour synchronisation pages/contenu
- [ ] Auto-sauvegarde du contenu PixiJS par page (toutes les 10 secondes)
- [ ] Chargement progressif et cache intelligent des pages
- [ ] Indicateurs de statut des pages (vide, en cours, terminée)
- [ ] Historique undo/redo spécifique par page
- [ ] Templates de pages et duplication intelligente avec contenu
- [ ] Recherche et filtrage des pages par contenu/statut

**Dépendances :** 2.4

### ✅ 2.6 Barre d'Outils Contextuelle
**Complexité : 6/10 | Durée : 3h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Outils : sélection, déplacement, panel, dialogue, texte
- [ ] États visuels actifs/inactifs
- [ ] Tooltips explicatifs
- [ ] Interface tactile optimisée

**Dépendances :** 2.5
**Outils principaux :**
- Select : Sélection et manipulation
- Move : Déplacement libre
- Panel : Création de cases
- Dialogue : Bulles de dialogue
- Text : Texte libre

### ✅ 2.7 Panneau de Propriétés Dynamique
**Complexité : 6/10 | Durée : 3h | Priorité : MOYENNE**

**Critères d'acceptation :**
- [ ] Adaptation selon élément sélectionné
- [ ] Contrôles : position, taille, rotation, opacité
- [ ] Color pickers pour couleurs
- [ ] Sliders pour valeurs numériques

**Dépendances :** 2.6
**Propriétés par type :**
- Sprite : x, y, width, height, rotation, alpha, filters
- Graphics : bordures, couleurs, styles
- Text : police, taille, couleurs, alignement

### ✅ 2.8 Système de Couches (Layers)
**Complexité : 6/10 | Durée : 3h | Priorité : MOYENNE**

**Critères d'acceptation :**
- [ ] Panneau hiérarchique des Container PixiJS
- [ ] Réorganisation par drag-and-drop
- [ ] Verrouillage/déverrouillage des couches
- [ ] Visibilité on/off avec Container.visible

**Dépendances :** 2.7
**Couches par défaut :**
- Background (zIndex: 0)
- Characters (zIndex: 10)
- Panels (zIndex: 20)
- Dialogue (zIndex: 30)
- UI (zIndex: 40)

### ✅ 2.9 Export PNG/PDF
**Complexité : 7/10 | Durée : 4h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Export PNG haute résolution avec PixiJS extract.canvas()
- [ ] Export PDF avec jsPDF pour pages multiples
- [ ] Options : pages sélectionnées ou manga complet
- [ ] Qualité configurable (web, print, haute résolution)

**Dépendances :** 2.8
**Formats :**
- PNG : 300 DPI pour impression, 72 DPI pour web
- PDF : A4, B5, format personnalisé
- Batch : Export de toutes les pages en ZIP

### ✅ 2.10 Preview du Manga
**Complexité : 5/10 | Durée : 2h | Priorité : MOYENNE**

**Critères d'acceptation :**
- [ ] Mode lecture avec navigation séquentielle
- [ ] Miniatures de toutes les pages
- [ ] Zoom et navigation dans les pages
- [ ] Mode plein écran

**Dépendances :** 2.9
**Navigation :** Flèches gauche/droite, molette pour zoom
**Affichage :** Page simple ou double page

### ✅ 2.11 Optimisation des Performances
**Complexité : 8/10 | Durée : 5h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Sprite batching automatique PixiJS
- [ ] Cache intelligent avec RenderTexture
- [ ] Debouncing des sauvegardes (500ms)
- [ ] Gestion mémoire avec destroy() automatique

**Dépendances :** 2.10
**Optimisations :**
- TexturePacker pour atlas d'images
- EventSystem optimisé pour drag
- Container.sortableChildren pour z-index
- Graphics.context réutilisable

---

## 🎨 PHASE 3 : INTERFACE ET INTÉGRATION

### ✅ 3.1 Design System Cohérent
**Complexité : 6/10 | Durée : 3h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Couleurs MANGAKA-AI : Rouge #ef4444, Noir #0f172a, Orange #f59e0b
- [ ] Composants réutilisés : MangaButton, AssetCard
- [ ] Typographie cohérente avec fonts système
- [ ] Animations Tailwind CSS + PixiJS Ticker

**Dépendances :** 2.11
**Composants :** Réutiliser les composants existants des autres menus

### ✅ 3.2 Optimisation de l'Interface Images Fluide
**Complexité : 6/10 | Durée : 4h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Finalisation du panneau flottant contextuel
- [ ] Optimisation des performances de chargement d'images
- [ ] Intégration des animations fluides et transitions
- [ ] Tests d'ergonomie et ajustements UX
- [ ] Responsive design pour mobile/tablet

**Dépendances :** 3.1
**Fonctionnalités à optimiser :**
- Panneau flottant avec recherche intelligente
- Barre d'outils extensible
- Système de favoris et récents
- Prévisualisation avec métadonnées
**Performance :** Virtualisation, lazy loading, cache intelligent

### ✅ 3.3 Interface Responsive et Adaptation Mobile
**Complexité : 5/10 | Durée : 3h | Priorité : MOYENNE**

**Critères d'acceptation :**
- [ ] Desktop (1920x1080+) : Interface complète avec panneau flottant
- [ ] Laptop (1366x768) : Barre d'outils compacte
- [ ] Tablet (1024x768) : Interface tactile optimisée
- [ ] Mobile (375x667) : Modal plein écran pour sélection d'images

**Dépendances :** 3.2
**Breakpoints :** Tailwind CSS responsive classes
**Canvas :** Adaptation automatique avec resizeTo
**Images :** Interface adaptative selon la taille d'écran

### ✅ 3.4 Micro-interactions et Animations
**Complexité : 5/10 | Durée : 2h | Priorité : MOYENNE**

**Critères d'acceptation :**
- [ ] Animations d'entrée/sortie du panneau flottant (slide, fade)
- [ ] Hover effects subtils sur éléments et images
- [ ] Feedback visuel lors de l'ajout d'images au canvas
- [ ] Transitions fluides entre outils et modes
- [ ] Animations des miniatures de pages en temps réel

**Dépendances :** 3.3
**Timing :** 200-300ms pour transitions, 100ms pour feedback
**Respect :** prefers-reduced-motion pour accessibilité

### ✅ 3.5 Accessibilité Complète
**Complexité : 6/10 | Durée : 3h | Priorité : MOYENNE**

**Critères d'acceptation :**
- [ ] Navigation tactile et souris complète
- [ ] Descriptions ARIA pour éléments PixiJS et panneau flottant
- [ ] Support screen readers avec instructions contextuelles
- [ ] Mode contraste élevé et tailles ajustables
- [ ] Alternatives tactiles pour sélection d'images

**Dépendances :** 3.4
**Standards :** WCAG AA compliance
**Alternatives :** Menus contextuels pour toutes les actions

### ✅ 3.6 Personnalisation Interface
**Complexité : 6/10 | Durée : 3h | Priorité : BASSE**

**Critères d'acceptation :**
- [ ] Position et taille du panneau flottant sauvegardables
- [ ] Thèmes mode sombre/clair
- [ ] Préférences d'affichage des images (grille, liste)
- [ ] Favoris et récents personnalisés par utilisateur

**Dépendances :** 3.5
**Sauvegarde :** Table user_preferences avec JSONB

### ✅ 3.7 Système de Feedback
**Complexité : 5/10 | Durée : 2h | Priorité : MOYENNE**

**Critères d'acceptation :**
- [ ] Notifications toast pour actions (sauvegarde, export)
- [ ] Indicateurs de progression pour opérations longues
- [ ] Sons subtils pour feedback (optionnel)
- [ ] États de chargement avec spinners PixiJS

**Dépendances :** 3.6
**Notifications :** Position top-right, auto-dismiss 3s
**Sons :** Clic, drop réussi, erreur (désactivables)

### ✅ 3.8 Tests d'Intégration
**Complexité : 7/10 | Durée : 4h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Tests navigation entre menus existants
- [ ] Tests cohérence visuelle avec design system
- [ ] Tests performance avec données réelles
- [ ] Tests compatibilité navigateurs

**Dépendances :** 3.7
**Navigateurs :** Chrome, Firefox, Safari, Edge
**Données :** Projets existants avec images réelles

---

## 🚀 PHASE 4 : OPTIMISATION ET FINALISATION

### ✅ 4.1 Tests de Performance Avancés
**Complexité : 7/10 | Durée : 4h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Tests de charge avec 200+ éléments
- [ ] Profiling mémoire et détection de fuites
- [ ] Tests de stress drag-and-drop continu
- [ ] Benchmarks comparatifs Fabric.js vs PixiJS

**Dépendances :** 3.8
**Métriques :** 60 FPS constant, < 300MB RAM, < 2s chargement
**Outils :** Chrome DevTools, PixiJS DevTools

### ✅ 4.2 Documentation Technique
**Complexité : 4/10 | Durée : 3h | Priorité : MOYENNE**

**Critères d'acceptation :**
- [ ] Guide d'utilisation avec captures d'écran
- [ ] Documentation API pour développeurs
- [ ] Guide de déploiement et maintenance
- [ ] FAQ et résolution de problèmes

**Dépendances :** 4.1
**Format :** Markdown avec exemples de code
**Audience :** Utilisateurs finaux et développeurs

### ✅ 4.3 Validation Utilisateur
**Complexité : 6/10 | Durée : 5h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Tests d'utilisabilité avec tâches réelles
- [ ] Mesure temps de completion et taux d'erreur
- [ ] Feedback qualitatif sur expérience utilisateur
- [ ] Itérations basées sur retours utilisateurs

**Dépendances :** 4.2
**Tâches test :** Créer page manga complète en < 10 minutes
**Métriques :** Taux d'erreur < 3%, satisfaction > 9/10

### ✅ 4.4 Déploiement et Monitoring
**Complexité : 5/10 | Durée : 2h | Priorité : HAUTE**

**Critères d'acceptation :**
- [ ] Déploiement en production avec feature flags
- [ ] Monitoring des performances en temps réel
- [ ] Analytics d'utilisation des fonctionnalités
- [ ] Plan de rollback en cas de problème

**Dépendances :** 4.3
**Monitoring :** Temps de chargement, erreurs JavaScript, usage fonctionnalités
**Rollback :** Possibilité de revenir à l'interface précédente

---

## 📊 MÉTRIQUES DE SUCCÈS

### Performance Technique
- **FPS constant** : 60 FPS avec 100+ éléments
- **Mémoire** : < 300MB pour session normale
- **Chargement** : < 2 secondes pour page avec 50 éléments
- **Compatibilité** : 100% sur Chrome, Firefox, Safari, Edge

### Expérience Utilisateur
- **Apprentissage** : Utilisateur productif en < 10 minutes
- **Erreurs** : Taux < 3% d'actions non intentionnelles
- **Satisfaction** : Score NPS > 9/10
- **Completion** : Page manga complète en < 5 minutes

### Intégration Technique
- **Cohérence** : 100% respect du design system MANGAKA-AI
- **Navigation** : Transitions fluides entre tous les menus
- **Sauvegarde** : 100% fiabilité avec récupération automatique
- **Export** : Support PNG/PDF haute qualité

---

## 🔧 CONSIDÉRATIONS TECHNIQUES SPÉCIALES

### Optimisations PixiJS v8
- **GraphicsContext** réutilisable pour formes identiques
- **Sprite batching** automatique pour performance
- **Assets.load()** avec cache intelligent
- **Container.sortableChildren** pour gestion z-index

### Intégration Supabase avec MCP Tools
- **Tables optimisées** : `pages`, `page_drafts`, `page_elements`
- **Sérialisation complète** de l'état PixiJS avec métadonnées
- **Sauvegarde différée** comme le menu script (bouton obligatoire)
- **Cache intelligent** avec localStorage + état temporaire
- **MCP Supabase** : Utilisation des tools pour CRUD operations

### Compatibilité et Fallbacks
- **WebGL** natif avec fallback Canvas 2D
- **Support** des anciens navigateurs avec polyfills
- **Gestion d'erreurs** gracieuse pour textures manquantes
- **Mode dégradé** si WebGL indisponible

---

## 🗄️ **ARCHITECTURE BACKEND DÉTAILLÉE - IMPLÉMENTATION AUTONOME**

### 📊 **STRUCTURE DE DONNÉES PIXIJS SÉRIALISÉE**

**IMPLÉMENTATION AUTOMATIQUE DE LA SÉRIALISATION :**
```typescript
// Classe de sérialisation automatique à implémenter
class PixiStateSerializer {
  static serialize(pixiApp: Application): SerializedState {
    return {
      pageId: generateUUID(),
      projectId: "45d5715b-103d-4006-ae58-7d27aa4a5ce0",
      content: this.serializeStage(pixiApp.stage),
      metadata: {
        version: "1.0",
        pixiVersion: "8.0.0",
        timestamp: Date.now()
      }
    }
  }

  static deserialize(data: SerializedState, pixiApp: Application): void {
    pixiApp.stage.removeChildren()
    this.reconstructStage(data.content, pixiApp.stage)
  }
}
```

**Format JSON complet pour sauvegarder l'état PixiJS :**

```json
{
  "pageId": "uuid-v4",
  "projectId": "45d5715b-103d-4006-ae58-7d27aa4a5ce0",
  "pageNumber": 1,
  "metadata": {
    "name": "Page 1",
    "width": 1200,
    "height": 1600,
    "format": "A4",
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-01-01T12:00:00Z",
    "version": "1.0",
    "pixiVersion": "8.0.0"
  },
  "content": {
    "stage": {
      "width": 1200,
      "height": 1600,
      "backgroundColor": 0xFFFFFF,
      "children": [
        {
          "type": "sprite",
          "id": "element_uuid_1",
          "layerType": "characters",
          "texture": {
            "url": "https://supabase-url/storage/characters/image1.jpg",
            "originalWidth": 500,
            "originalHeight": 600
          },
          "transform": {
            "x": 100,
            "y": 200,
            "width": 300,
            "height": 400,
            "rotation": 0.5,
            "scaleX": 1.2,
            "scaleY": 1.2,
            "alpha": 1,
            "zIndex": 10
          },
          "properties": {
            "name": "Personnage principal",
            "locked": false,
            "visible": true,
            "blendMode": "normal",
            "filters": []
          },
          "metadata": {
            "sourceType": "character",
            "sourceId": "char_uuid",
            "addedAt": "2024-01-01T10:00:00Z"
          }
        },
        {
          "type": "dialogue",
          "id": "bubble_uuid_1",
          "layerType": "dialogue",
          "text": "Bonjour le monde !",
          "transform": {
            "x": 500,
            "y": 300,
            "width": 200,
            "height": 100,
            "rotation": 0,
            "alpha": 1,
            "zIndex": 30
          },
          "bubbleStyle": {
            "type": "speech",
            "backgroundColor": 0xFFFFFF,
            "outlineColor": 0x000000,
            "textColor": 0x000000,
            "dashedOutline": false,
            "tailPosition": "bottom-left",
            "fontSize": 16,
            "fontFamily": "Arial Black",
            "textAlign": "center"
          },
          "properties": {
            "name": "Dialogue 1",
            "locked": false,
            "visible": true
          }
        },
        {
          "type": "panel",
          "id": "panel_uuid_1",
          "layerType": "panels",
          "transform": {
            "x": 50,
            "y": 50,
            "width": 1100,
            "height": 800,
            "rotation": 0,
            "alpha": 1,
            "zIndex": 20
          },
          "panelStyle": {
            "shape": "rectangle",
            "borderWidth": 3,
            "borderColor": 0x000000,
            "borderStyle": "solid",
            "cornerRadius": 10,
            "fillColor": null,
            "fillAlpha": 0
          },
          "properties": {
            "name": "Case principale",
            "locked": false,
            "visible": true
          }
        }
      ]
    }
  },
  "state": {
    "isDirty": false,
    "lastSaved": "2024-01-01T12:00:00Z",
    "lastModified": "2024-01-01T12:05:00Z",
    "autoSaveEnabled": true,
    "version": 1
  }
}
```

### 🗃️ **TABLES SUPABASE DÉTAILLÉES**

**Table `pages` (sauvegarde définitive) :**
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id),
  page_number INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT 'Page',
  content JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  thumbnail_url TEXT,
  status VARCHAR(50) DEFAULT 'draft', -- draft, in_progress, completed
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, page_number)
);
```

**Table `page_drafts` (état temporaire) :**
```sql
CREATE TABLE page_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  content JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  session_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
  UNIQUE(page_id, user_id, session_id)
);
```

**Table `page_elements` (normalisation optionnelle) :**
```sql
CREATE TABLE page_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES pages(id),
  element_id VARCHAR(255) NOT NULL,
  element_type VARCHAR(50) NOT NULL, -- sprite, dialogue, panel
  layer_type VARCHAR(50) NOT NULL, -- background, characters, panels, dialogue
  transform JSONB NOT NULL DEFAULT '{}',
  properties JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  z_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(page_id, element_id)
);
```

### 💾 **SYSTÈME DE SAUVEGARDE DIFFÉRÉE (comme menu script)**

**IMPLÉMENTATION AUTONOME OBLIGATOIRE :**

**Logique de fonctionnement :**
1. **État temporaire en mémoire** : Toutes les modifications sont stockées dans le state Zustand
2. **Cache localStorage** : Backup automatique local toutes les 30 secondes
3. **Sauvegarde différée** : Uniquement avec bouton "Sauvegarder" explicite
4. **Récupération** : Si abandon, rechargement de la dernière version sauvée

**Implémentation automatique avec MCP Supabase :**

```typescript
// Gestionnaire de sauvegarde différée
class DeferredSaveManager {
  private isDirty = false
  private lastSavedState: any = null
  private currentState: any = null
  private sessionId = generateSessionId()

  // Marquer comme modifié
  markDirty() {
    this.isDirty = true
    this.autoSaveToLocalStorage()
  }

  // Sauvegarde automatique locale (backup)
  private autoSaveToLocalStorage() {
    const state = useAssemblyStore.getState()
    localStorage.setItem(`assembly_draft_${this.sessionId}`, JSON.stringify({
      content: this.serializePixiState(state),
      timestamp: Date.now(),
      pageId: state.currentPageId
    }))
  }

  // Sauvegarde définitive avec MCP Supabase
  async saveToDatabase() {
    const state = useAssemblyStore.getState()
    const serializedContent = this.serializePixiState(state)

    try {
      // Utilisation du MCP tool Supabase
      await supabase({
        summary: "Sauvegarder le contenu de la page d'assemblage",
        method: "POST",
        path: `/v1/projects/${projectId}/database/query`,
        data: {
          query: `
            UPDATE pages
            SET content = $1,
                metadata = $2,
                updated_at = NOW(),
                status = $3
            WHERE id = $4 AND project_id = $5
          `,
          params: [
            serializedContent,
            { version: "1.0", pixiVersion: "8.0.0" },
            this.determinePageStatus(serializedContent),
            state.currentPageId,
            projectId
          ]
        }
      })

      // Générer et sauvegarder la miniature
      await this.generateAndSaveThumbnail(state.currentPageId)

      // Nettoyer le draft temporaire
      await this.cleanupDraft(state.currentPageId)

      this.isDirty = false
      this.lastSavedState = serializedContent

    } catch (error) {
      console.error('Erreur sauvegarde:', error)
      throw error
    }
  }

  // Charger la dernière version sauvée
  async loadLastSavedVersion(pageId: string) {
    try {
      const { data } = await supabase({
        summary: "Charger la dernière version sauvée de la page",
        method: "GET",
        path: `/v1/projects/${projectId}/database/query`,
        data: {
          query: "SELECT content, metadata FROM pages WHERE id = $1",
          params: [pageId]
        }
      })

      if (data && data.length > 0) {
        const content = data[0].content
        this.deserializeAndLoadPixiState(content)
        this.lastSavedState = content
        this.isDirty = false
      }

    } catch (error) {
      console.error('Erreur chargement:', error)
    }
  }

  // Récupérer draft temporaire si existe
  async loadDraftIfExists(pageId: string) {
    try {
      const { data } = await supabase({
        summary: "Vérifier s'il existe un draft temporaire",
        method: "GET",
        path: `/v1/projects/${projectId}/database/query`,
        data: {
          query: `
            SELECT content, metadata, updated_at
            FROM page_drafts
            WHERE page_id = $1 AND user_id = $2 AND session_id = $3
            AND expires_at > NOW()
          `,
          params: [pageId, userId, this.sessionId]
        }
      })

      if (data && data.length > 0) {
        // Proposer de récupérer le draft
        const shouldRecover = confirm('Un brouillon non sauvegardé a été trouvé. Voulez-vous le récupérer ?')
        if (shouldRecover) {
          this.deserializeAndLoadPixiState(data[0].content)
          this.isDirty = true
        }
      }

    } catch (error) {
      console.error('Erreur récupération draft:', error)
    }
  }

  // Sérialiser l'état PixiJS complet
  private serializePixiState(state: AssemblyState): any {
    const app = state.pixiApp
    if (!app) return {}

    return {
      stage: {
        width: app.screen.width,
        height: app.screen.height,
        backgroundColor: app.renderer.background.color,
        children: this.serializeContainer(app.stage)
      },
      metadata: {
        version: "1.0",
        pixiVersion: "8.0.0",
        timestamp: Date.now()
      }
    }
  }

  // Sérialiser un Container PixiJS
  private serializeContainer(container: Container): any[] {
    return container.children.map(child => {
      const baseData = {
        id: child.name || generateId(),
        transform: {
          x: child.x,
          y: child.y,
          rotation: child.rotation,
          alpha: child.alpha,
          visible: child.visible,
          zIndex: child.zIndex
        }
      }

      if (child instanceof Sprite) {
        return {
          ...baseData,
          type: 'sprite',
          texture: {
            url: child.texture.source?.resource?.src || '',
            width: child.texture.width,
            height: child.texture.height
          },
          transform: {
            ...baseData.transform,
            width: child.width,
            height: child.height,
            scaleX: child.scale.x,
            scaleY: child.scale.y
          }
        }
      }

      if (child instanceof Graphics) {
        return {
          ...baseData,
          type: 'graphics',
          // Sérialiser les commandes Graphics
          geometry: this.serializeGraphics(child)
        }
      }

      if (child instanceof Text) {
        return {
          ...baseData,
          type: 'text',
          text: child.text,
          style: child.style
        }
      }

      return baseData
    })
  }

  // Désérialiser et reconstruire l'état PixiJS
  private deserializeAndLoadPixiState(serializedData: any) {
    const state = useAssemblyStore.getState()
    const app = state.pixiApp
    if (!app || !serializedData.stage) return

    // Nettoyer le stage actuel
    app.stage.removeChildren()

    // Reconstruire les éléments
    serializedData.stage.children.forEach((elementData: any) => {
      const element = this.deserializeElement(elementData)
      if (element) {
        app.stage.addChild(element)
      }
    })

    // Mettre à jour l'état
    state.setCurrentPageContent(serializedData)
  }

  // Générer miniature avec PixiJS extract
  private async generateAndSaveThumbnail(pageId: string) {
    const state = useAssemblyStore.getState()
    const app = state.pixiApp
    if (!app) return

    try {
      // Générer la miniature avec PixiJS extract
      const canvas = app.renderer.extract.canvas(app.stage)
      const thumbnailCanvas = document.createElement('canvas')
      thumbnailCanvas.width = 150
      thumbnailCanvas.height = 200

      const ctx = thumbnailCanvas.getContext('2d')
      ctx?.drawImage(canvas, 0, 0, 150, 200)

      // Convertir en blob
      const blob = await new Promise<Blob>((resolve) => {
        thumbnailCanvas.toBlob(resolve as any, 'image/jpeg', 0.8)
      })

      if (blob) {
        // Upload vers Supabase Storage
        const fileName = `page_${pageId}_thumbnail.jpg`
        await supabase({
          summary: "Upload de la miniature de page",
          method: "POST",
          path: `/v1/projects/${projectId}/storage/upload`,
          data: {
            bucket: 'page-thumbnails',
            fileName,
            file: blob
          }
        })

        // Mettre à jour l'URL de la miniature
        await supabase({
          summary: "Mettre à jour l'URL de la miniature",
          method: "POST",
          path: `/v1/projects/${projectId}/database/query`,
          data: {
            query: "UPDATE pages SET thumbnail_url = $1 WHERE id = $2",
            params: [`/storage/page-thumbnails/${fileName}`, pageId]
          }
        })
      }

    } catch (error) {
      console.error('Erreur génération miniature:', error)
    }
  }
}
```

### 🔄 **WORKFLOW DE SAUVEGARDE COMPLET**

**1. Chargement initial :**
- Charger la dernière version sauvée depuis `pages`
- Vérifier s'il existe un draft temporaire dans `page_drafts`
- Proposer récupération du draft si trouvé

**2. Modifications en cours :**
- Toutes les modifications en mémoire (Zustand)
- Backup automatique localStorage toutes les 30s
- Indicateur visuel "modifications non sauvées"

**3. Navigation entre menus :**
- État conservé en mémoire
- Possibilité de revenir sans perdre les modifications
- Warning si tentative de quitter sans sauvegarder

**4. Sauvegarde explicite :**
- Bouton "Sauvegarder" obligatoire
- Sérialisation complète de l'état PixiJS
- Génération automatique de la miniature
- Nettoyage des drafts temporaires

**5. Abandon des modifications :**
- Rechargement de la dernière version sauvée
- Nettoyage du cache localStorage
- Reset de l'état "dirty"

---

## 🚀 **EXÉCUTION AUTONOME FINALE**

### **COMMANDE D'EXÉCUTION PRINCIPALE**
```typescript
// POINT D'ENTRÉE POUR L'AGENT IA AUTONOME
async function executeAutonomousImplementation() {
  const orchestrator = new AutonomousAIOrchestrator()

  try {
    // Phase 1: Fondations et Migration PixiJS
    await orchestrator.executePhase1()
    await orchestrator.validatePhase1()

    // Phase 2: Fonctionnalités Core
    await orchestrator.executePhase2()
    await orchestrator.validatePhase2()

    // Phase 3: Interface et Intégration
    await orchestrator.executePhase3()
    await orchestrator.validatePhase3()

    // Phase 4: Optimisation et Finalisation
    await orchestrator.executePhase4()
    await orchestrator.validateFinal()

    return {
      status: 'IMPLEMENTATION_COMPLETE',
      message: 'Menu assemblage MANGAKA-AI implémenté avec succès',
      metrics: await orchestrator.getFinalMetrics()
    }
  } catch (error) {
    await orchestrator.handleCriticalError(error)
    throw error
  }
}

// DÉMARRAGE AUTOMATIQUE
executeAutonomousImplementation()
```

### **VALIDATION FINALE OBLIGATOIRE**
```typescript
// Tests de validation finale automatiques
const FINAL_VALIDATION = {
  performance: {
    fps: { target: 60, tolerance: 5 },
    memory: { target: 300, unit: 'MB', max: 400 },
    loadTime: { target: 2, unit: 'seconds', max: 3 }
  },
  functionality: {
    pixiIntegration: 'working',
    imageManipulation: 'working',
    pageManagement: 'working',
    saveSystem: 'working'
  },
  ui: {
    responsiveness: 'all_breakpoints',
    accessibility: 'wcag_aa',
    consistency: 'design_system_compliant'
  }
}

async function validateFinalSuccess() {
  const results = await runComprehensiveTests(FINAL_VALIDATION)

  if (results.overall !== 'PASS') {
    throw new Error(`Implementation incomplete: ${results.failures}`)
  }

  return {
    status: 'IMPLEMENTATION_COMPLETE',
    metrics: results,
    timestamp: new Date().toISOString()
  }
}
```

**🎯 OBJECTIF FINAL :** Implémenter complètement le menu assemblage MANGAKA-AI avec PixiJS v8, interface fluide, système de sauvegarde intelligent, et performance 60 FPS, de manière **100% autonome** et **parfaitement fonctionnelle**.

Ce plan d'implémentation détaillé fournit une roadmap complète pour qu'un **Agent IA Autonome** puisse créer un menu d'assemblage MANGAKA-AI de niveau professionnel avec PixiJS v8, tout en respectant les contraintes d'intégration et les exigences de performance.
