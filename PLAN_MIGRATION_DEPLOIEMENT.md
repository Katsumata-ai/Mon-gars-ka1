# 🚀 PLAN DE MIGRATION & DÉPLOIEMENT
## Système de Persistance Script - MANGAKA AI

**Date :** 21 Janvier 2025  
**Version :** 1.0  
**Objectif :** Migration sécurisée vers nouveau système de persistance

---

## 📋 STRATÉGIE DE MIGRATION

### 🎯 Objectifs Migration
- **Zéro perte de données** utilisateurs existants
- **Zéro interruption de service** pendant migration
- **Rollback rapide** en cas de problème
- **Validation complète** avant déploiement production

### 📊 Analyse Données Existantes
```sql
-- Audit données actuelles
SELECT 
  COUNT(*) as total_scripts,
  COUNT(DISTINCT user_id) as unique_users,
  COUNT(DISTINCT project_id) as unique_projects,
  AVG(LENGTH(script_data::text)) as avg_size_bytes,
  MAX(updated_at) as last_update
FROM manga_scripts;

-- Identifier doublons potentiels
SELECT project_id, user_id, COUNT(*) as count
FROM manga_scripts 
GROUP BY project_id, user_id 
HAVING COUNT(*) > 1;
```

---

## 🗓️ PLANNING DÉTAILLÉ

### 📅 Phase 1 : Préparation (Jour 1-3)

#### Jour 1 : Backup & Analyse
```bash
# Backup complet base de données
pg_dump -h [host] -U [user] -d [database] > backup_pre_migration_$(date +%Y%m%d).sql

# Backup spécifique table manga_scripts
pg_dump -h [host] -U [user] -d [database] -t manga_scripts > manga_scripts_backup_$(date +%Y%m%d).sql
```

#### Jour 2 : Environnement Test
- Création environnement staging identique production
- Import backup données production
- Tests migration sur données réelles

#### Jour 3 : Scripts Migration
```sql
-- Script migration sécurisée
-- migration_001_add_unique_constraint.sql

BEGIN;

-- 1. Créer table backup
CREATE TABLE manga_scripts_backup_20250121 AS 
SELECT * FROM manga_scripts;

-- 2. Identifier et résoudre doublons
WITH duplicates AS (
  SELECT 
    project_id, 
    user_id,
    array_agg(id ORDER BY updated_at DESC) as ids
  FROM manga_scripts 
  GROUP BY project_id, user_id 
  HAVING COUNT(*) > 1
),
to_delete AS (
  SELECT unnest(ids[2:]) as id_to_delete
  FROM duplicates
)
DELETE FROM manga_scripts 
WHERE id IN (SELECT id_to_delete FROM to_delete);

-- 3. Ajouter contrainte unique
ALTER TABLE manga_scripts 
ADD CONSTRAINT unique_project_user UNIQUE (project_id, user_id);

-- 4. Migrer structure script_data vers nouveau format
UPDATE manga_scripts 
SET script_data = jsonb_build_object(
  'script', COALESCE(script_data->'chapters', '[]'::jsonb),
  'characters', '{"characters": []}'::jsonb,
  'backgrounds', '{"backgrounds": []}'::jsonb,
  'scenes', '{"scenes": []}'::jsonb,
  'assembly', '{"pages": [], "currentPage": 1}'::jsonb,
  'metadata', jsonb_build_object(
    'lastModified', COALESCE(updated_at::text, NOW()::text),
    'version', 1
  )
)
WHERE NOT (script_data ? 'metadata');

-- 5. Validation migration
DO $$
DECLARE
  invalid_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO invalid_count
  FROM manga_scripts 
  WHERE NOT (
    script_data ? 'script' AND
    script_data ? 'characters' AND
    script_data ? 'backgrounds' AND
    script_data ? 'scenes' AND
    script_data ? 'assembly' AND
    script_data ? 'metadata'
  );
  
  IF invalid_count > 0 THEN
    RAISE EXCEPTION 'Migration failed: % invalid records found', invalid_count;
  END IF;
END $$;

COMMIT;
```

### 📅 Phase 2 : Développement (Jour 4-17)

#### Semaine 1 : Store Zustand (Jour 4-10)
```bash
# Installation dépendances
npm install zustand @types/lodash react-hot-toast date-fns

# Développement
Day 4-5: Store principal + types
Day 6-7: Middleware persistance localStorage
Day 8-9: Hooks utilitaires
Day 10: Tests unitaires store
```

#### Semaine 2 : Intégration Composants (Jour 11-17)
```bash
Day 11-12: Migration ScriptEditorPanel
Day 13-14: Bouton Save global
Day 15-16: API endpoints
Day 17: Tests intégration
```

### 📅 Phase 3 : Tests & Validation (Jour 18-21)

#### Tests Automatisés
```typescript
// tests/persistance.test.ts
describe('Système Persistance', () => {
  test('Navigation sans perte données', async () => {
    // Simuler saisie script
    await userEvent.type(scriptEditor, 'PAGE 1: Test')
    
    // Changer onglet
    await userEvent.click(charactersTab)
    await userEvent.click(scriptTab)
    
    // Vérifier persistance
    expect(scriptEditor).toHaveValue('PAGE 1: Test')
  })
  
  test('Sauvegarde globale', async () => {
    // Modifier plusieurs sections
    await modifyScript()
    await modifyCharacters()
    
    // Sauvegarder
    await userEvent.click(saveButton)
    
    // Vérifier API call
    expect(mockSaveAPI).toHaveBeenCalledWith({
      scriptData: expect.any(Object),
      charactersData: expect.any(Object)
    })
  })
  
  test('Récupération après crash', async () => {
    // Simuler données localStorage
    localStorage.setItem('mangaka-project-store', mockData)
    
    // Recharger composant
    render(<ModernUnifiedEditor />)
    
    // Vérifier restauration
    expect(scriptEditor).toHaveValue(mockData.scriptData.content)
  })
})
```

#### Tests Manuels
```markdown
## Checklist Tests Manuels

### Navigation
- [ ] Script → Characters → Script (données conservées)
- [ ] Script → Assembly → Script (données conservées)
- [ ] Rechargement page (restauration localStorage)
- [ ] Fermeture/réouverture navigateur

### Bouton Save
- [ ] Indicateur changements non sauvegardés
- [ ] Sauvegarde réussie (toast + timestamp)
- [ ] Gestion erreur réseau
- [ ] Raccourci Ctrl+S

### Performance
- [ ] Navigation < 200ms
- [ ] Sauvegarde locale < 100ms
- [ ] Sauvegarde DB < 2s
- [ ] Chargement initial < 1s

### Edge Cases
- [ ] Déconnexion réseau pendant sauvegarde
- [ ] Données corrompues localStorage
- [ ] Conflit données simultanées
- [ ] Projet sans script existant
```

### 📅 Phase 4 : Déploiement (Jour 22-24)

#### Jour 22 : Staging Deployment
```bash
# Déploiement staging
git checkout -b feature/persistance-system
git push origin feature/persistance-system

# Vercel staging deployment
vercel --prod --scope staging

# Tests staging complets
npm run test:e2e:staging
```

#### Jour 23 : Production Deployment
```bash
# Feature flags activation
export FEATURE_NEW_PERSISTANCE=true

# Migration DB production
psql -h [prod-host] -U [user] -d [database] -f migration_001_add_unique_constraint.sql

# Deployment production
git checkout main
git merge feature/persistance-system
git push origin main

# Vercel production deployment
vercel --prod
```

#### Jour 24 : Monitoring & Validation
```bash
# Monitoring métriques
- Temps réponse API save-all
- Taux erreur sauvegarde
- Utilisation localStorage
- Satisfaction utilisateur

# Rollback plan si nécessaire
git revert [commit-hash]
vercel --prod
```

---

## 🛡️ STRATÉGIE ROLLBACK

### 🚨 Triggers Rollback
- Taux erreur > 5%
- Temps réponse > 5 secondes
- Perte données rapportée
- Satisfaction < 70%

### 🔄 Procédure Rollback
```bash
# 1. Rollback code
git revert [commit-hash]
git push origin main

# 2. Rollback database
psql -h [host] -U [user] -d [database] << EOF
BEGIN;
DROP CONSTRAINT IF EXISTS unique_project_user;
-- Restaurer structure originale si nécessaire
COMMIT;
EOF

# 3. Redéploiement
vercel --prod

# 4. Validation rollback
npm run test:smoke
```

---

## 📊 MONITORING & MÉTRIQUES

### 🎯 KPIs Techniques
```typescript
// Métriques à surveiller
interface PersistanceMetrics {
  // Performance
  saveLocalTime: number        // < 100ms
  saveDbTime: number          // < 2000ms
  loadTime: number            // < 1000ms
  navigationTime: number      // < 200ms
  
  // Fiabilité
  saveSuccessRate: number     // > 99%
  dataLossIncidents: number   // = 0
  rollbackCount: number       // = 0
  
  // Utilisation
  dailyActiveUsers: number
  savesPerUser: number
  navigationPerSession: number
  
  // Erreurs
  apiErrorRate: number        // < 1%
  localStorageErrors: number  // < 0.1%
  migrationErrors: number     // = 0
}
```

### 📈 Dashboard Monitoring
```typescript
// Intégration monitoring (ex: Vercel Analytics)
import { track } from '@vercel/analytics'

// Dans store Zustand
saveToDatabase: async () => {
  const startTime = Date.now()
  
  try {
    await fetch('/api/save-all', {...})
    
    track('save_success', {
      duration: Date.now() - startTime,
      dataSize: JSON.stringify(state).length
    })
    
  } catch (error) {
    track('save_error', {
      error: error.message,
      duration: Date.now() - startTime
    })
  }
}
```

---

## ✅ CRITÈRES DE SUCCÈS

### 🎯 Validation Technique
- [ ] Migration 100% utilisateurs sans perte données
- [ ] Contrainte unique DB respectée
- [ ] Performance cibles atteintes
- [ ] Tests automatisés passent à 100%

### 👥 Validation Utilisateur
- [ ] Aucun ticket support perte données
- [ ] Satisfaction bouton Save > 90%
- [ ] Temps navigation réduit
- [ ] Workflow créatif ininterrompu

### 📊 Validation Business
- [ ] Réduction abandons éditeur
- [ ] Augmentation temps session
- [ ] Amélioration NPS produit
- [ ] ROI développement positif

---

## 🎉 POST-DÉPLOIEMENT

### 📝 Documentation
- Guide utilisateur nouveau bouton Save
- Documentation technique pour équipe
- Runbook incidents et résolution
- Métriques baseline établies

### 🔄 Améliorations Futures
- Collaboration temps réel (Phase 2)
- Versioning avancé scripts
- Sync multi-device
- Backup automatique cloud

**Ce plan garantit une migration sécurisée et un déploiement réussi du nouveau système de persistance.**
