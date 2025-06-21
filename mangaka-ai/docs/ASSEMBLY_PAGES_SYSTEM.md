# Système de Gestion des Pages - Assemblage Mangaka AI

## Vue d'ensemble

Le système de gestion des pages permet aux utilisateurs de créer, modifier, organiser et supprimer des pages dans leurs projets de manga. Il inclut la persistance de l'état canvas entre les changements de menu et une sauvegarde automatique robuste.

## Architecture

### Composants principaux

1. **StateManager** (`/src/components/assembly/managers/StateManager.ts`)
   - Gestion centralisée de l'état assemblage
   - Actions CRUD pour les pages
   - Persistance de l'état canvas

2. **ProjectStore** (`/src/stores/projectStore.ts`)
   - Store global pour la persistance entre menus
   - Sauvegarde localStorage et Supabase
   - Intégration avec le système de sauvegarde global

3. **API Routes** (`/src/app/api/projects/[id]/pages/`)
   - `POST /duplicate` - Duplication de page
   - `DELETE /[pageId]` - Suppression avec renumérotation
   - `PUT /reorder` - Réorganisation des pages

4. **Hooks de persistance** (`/src/hooks/useAssemblyPersistence.ts`)
   - Gestion automatique de la persistance entre menus
   - Sauvegarde/restauration de l'état canvas

## Fonctionnalités

### Gestion des pages

#### Création de page
```typescript
const { addPage } = useAssemblyStore()
const newPageId = await addPage(projectId, 'Titre de la page')
```

#### Suppression de page
```typescript
const { deletePage } = useAssemblyStore()
const deletedPageNumber = await deletePage(projectId, pageId)
```

#### Duplication de page
```typescript
const { duplicatePage } = useAssemblyStore()
const newPageId = await duplicatePage(projectId, sourcePageId)
```

#### Réorganisation des pages
```typescript
const { reorderPages } = useAssemblyStore()
await reorderPages(projectId, [
  { pageId: 'page-1', newPageNumber: 2 },
  { pageId: 'page-2', newPageNumber: 1 }
])
```

### Persistance de l'état canvas

L'état du canvas (position, zoom, page courante, outils) est automatiquement sauvegardé et restauré lors des changements de menu.

#### Utilisation automatique
```tsx
import { AssemblyPersistenceProvider } from '@/components/assembly/providers/AssemblyPersistenceProvider'

function AssemblyPage({ projectId, isActive }) {
  return (
    <AssemblyPersistenceProvider projectId={projectId} isAssemblyActive={isActive}>
      <AssemblyCanvas />
    </AssemblyPersistenceProvider>
  )
}
```

#### Utilisation manuelle
```typescript
const { saveCanvasState, restoreCanvasState } = useAssemblyStore()

// Sauvegarder
saveCanvasState({
  position: { x: 100, y: 200 },
  zoom: 50,
  currentPageId: 'page-1'
})

// Restaurer
const restoredState = restoreCanvasState(projectId)
```

### Optimisation des performances

Le système inclut un optimiseur de performance pour les changements de page :

```tsx
import { PageChangeOptimizerProvider } from '@/components/assembly/performance/PageChangeOptimizer'

function AssemblyApp() {
  return (
    <PageChangeOptimizerProvider preloadAdjacentPages={true} maxCacheSize={10}>
      <AssemblyInterface />
    </PageChangeOptimizerProvider>
  )
}
```

## Base de données

### Table `pages`
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES manga_projects(id) ON DELETE CASCADE,
  page_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  metadata JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(project_id, page_number)
);
```

### Fonctions SQL

#### Renumérotation après suppression
```sql
SELECT renumber_pages_after_deletion('project-id', 2);
```

#### Réorganisation en transaction
```sql
SELECT reorder_pages_transaction('project-id', '[
  {"id": "page-1", "page_number": 2},
  {"id": "page-2", "page_number": 1}
]'::jsonb);
```

#### Validation de la numérotation
```sql
SELECT validate_page_numbering('project-id');
```

## Gestion des erreurs

### Error Boundary
```tsx
import { AssemblyErrorBoundary } from '@/components/assembly/error/ErrorBoundary'

function App() {
  return (
    <AssemblyErrorBoundary>
      <AssemblyInterface />
    </AssemblyErrorBoundary>
  )
}
```

### Gestion programmatique des erreurs
```typescript
import { useErrorHandler } from '@/components/assembly/error/ErrorBoundary'

function MyComponent() {
  const { reportError } = useErrorHandler()
  
  const handleOperation = async () => {
    try {
      await riskyOperation()
    } catch (error) {
      reportError(error, 'Operation context')
    }
  }
}
```

## Tests

### Tests unitaires
```bash
npm test src/__tests__/api/pages.test.ts
npm test src/__tests__/integration/projectStore.test.ts
```

### Tests d'intégration
```bash
npm test src/__tests__/integration/frontend.test.tsx
```

### Tests E2E
```bash
npx playwright test src/__tests__/e2e/pages-workflow.test.ts
```

## Métriques de performance

### Objectifs
- Changement de page : < 200ms
- Taux de succès sauvegarde : > 99.9%
- Disponibilité : 99.9%

### Monitoring
```typescript
const { getPageChangeMetrics } = usePageChangeOptimizer()
const metrics = getPageChangeMetrics()

console.log(`Temps moyen: ${metrics.averageChangeTime}ms`)
console.log(`Taux de cache: ${metrics.cacheHitRate}%`)
```

## Migration

### Script de migration
```bash
npm run migrate:assembly-data
```

### Validation post-migration
```bash
npm run validate:assembly-migration
```

## Déploiement

### Prérequis
1. Migration de base de données appliquée
2. Variables d'environnement configurées
3. Tests passés

### Étapes
1. Déployer les API routes
2. Déployer le frontend
3. Valider en staging
4. Déploiement production progressif

### Rollback
En cas de problème, utiliser le plan de rollback :
1. Revenir à la version précédente
2. Restaurer les données depuis backup
3. Valider la cohérence

## Support et maintenance

### Logs importants
- Opérations CRUD pages
- Erreurs de sauvegarde
- Métriques de performance
- Conflits de données

### Alertes
- Taux d'erreur > 1%
- Latence > 500ms
- Échecs de sauvegarde répétés

### Maintenance préventive
- Nettoyage des miniatures anciennes
- Optimisation des index DB
- Mise à jour des dépendances

## Évolutions futures

### Fonctionnalités prévues
- Collaboration temps réel
- Historique des versions
- Templates de pages
- Export batch

### Améliorations techniques
- WebWorkers pour miniatures
- IndexedDB pour cache avancé
- WebSockets pour sync temps réel
