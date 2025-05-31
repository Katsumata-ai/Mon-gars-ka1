# 🗄️ Migration des Tables d'Images - Guide d'Exécution

## 📋 **OBJECTIF DE LA MIGRATION**

Séparer la gestion des images de personnages et des décors en créant deux tables spécialisées :
- `character_images` pour les personnages
- `decor_images` pour les décors/backgrounds

## 🚀 **ÉTAPES D'EXÉCUTION**

### **1. Préparation**

```bash
# Naviguer vers le dossier de migration
cd mangaka-ai/database

# Installer les dépendances
npm install

# Vérifier les variables d'environnement
# Assurez-vous que ces variables sont définies dans ../.env.local :
# - NEXT_PUBLIC_SUPABASE_URL
# - SUPABASE_SERVICE_ROLE_KEY
```

### **2. Test de Faisabilité**

```bash
# Exécuter le test de migration
npm run test-migration
```

**Ce test vérifie :**
- ✅ Connexion à Supabase
- ✅ Analyse des données existantes
- ✅ Intégrité des données
- ✅ État des tables existantes
- ✅ Recommandations de migration

### **3. Exécution de la Migration**

```bash
# Lancer la migration complète
npm run migrate
```

**La migration effectue :**
1. 🏗️ Création des nouvelles tables avec contraintes et index
2. 🔒 Configuration des politiques RLS (Row Level Security)
3. 🔄 Migration des données existantes
4. ✅ Vérification de l'intégrité post-migration
5. 📊 Rapport détaillé des résultats

## 📊 **STRUCTURE DES NOUVELLES TABLES**

### **Table `character_images`**
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, NOT NULL, FK vers auth.users)
- project_id (UUID, NOT NULL)
- original_prompt (TEXT)
- optimized_prompt (TEXT)
- image_url (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### **Table `decor_images`**
```sql
- id (UUID, PRIMARY KEY)
- user_id (UUID, NOT NULL, FK vers auth.users)
- project_id (UUID, NOT NULL)
- original_prompt (TEXT)
- optimized_prompt (TEXT)
- image_url (TEXT)
- metadata (JSONB)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

## 🔒 **SÉCURITÉ ET CONTRAINTES**

### **Row Level Security (RLS)**
- ✅ Activé sur les deux tables
- ✅ Politiques pour SELECT, INSERT, UPDATE, DELETE
- ✅ Filtrage par `user_id` automatique

### **Index de Performance**
- ✅ Index sur `user_id`, `project_id`, `created_at`
- ✅ Index composite `(user_id, project_id)`
- ✅ Index GIN sur les métadonnées JSONB

### **Triggers**
- ✅ Mise à jour automatique de `updated_at`

## 📈 **MIGRATION DES DONNÉES**

### **Règles de Migration**
```sql
-- Personnages
generated_images WHERE image_type = 'character' → character_images

-- Décors
generated_images WHERE image_type = 'background' → decor_images
```

### **Préservation des Données**
- ✅ Tous les champs sont préservés
- ✅ Métadonnées JSONB intactes
- ✅ URLs d'images conservées
- ✅ Timestamps originaux maintenus
- ✅ Relations utilisateur/projet préservées

## 🔧 **MISE À JOUR DES APIs**

### **APIs Modifiées**
- ✅ `/api/projects/[id]/characters/*` → utilise `character_images`
- ✅ `/api/projects/[id]/decors/*` → utilise `decor_images`
- ✅ `/api/generate-image` → sauvegarde dans les bonnes tables
- ✅ Suppression des filtres `image_type` obsolètes

### **Changements Techniques**
```typescript
// Avant
.from('generated_images')
.eq('image_type', 'character')

// Après
.from('character_images')
// Plus besoin de filtrer par image_type
```

## ⚠️ **POINTS D'ATTENTION**

### **Avant Migration**
- 🔍 Vérifier la connexion Supabase
- 📊 Analyser les données existantes
- 🔒 Confirmer les permissions service role
- 💾 Optionnel : Backup de `generated_images`

### **Pendant Migration**
- ⏱️ La migration peut prendre quelques minutes selon le volume
- 🔄 Les APIs continuent de fonctionner (pas d'interruption)
- 📝 Logs détaillés pour suivi en temps réel

### **Après Migration**
- ✅ Tester les fonctionnalités personnages et décors
- ✅ Vérifier l'affichage des galeries
- ✅ Tester la génération de nouvelles images
- ✅ Confirmer la suppression d'images

## 🧪 **TESTS DE VALIDATION**

### **Tests Fonctionnels**
1. **Génération d'images**
   - Créer un nouveau personnage
   - Créer un nouveau décor
   - Vérifier la sauvegarde dans les bonnes tables

2. **Affichage des galeries**
   - Vérifier que les personnages existants s'affichent
   - Vérifier que les décors existants s'affichent
   - Tester la recherche et le tri

3. **Suppression d'images**
   - Supprimer un personnage
   - Supprimer un décor
   - Vérifier la suppression en base

## 🗂️ **FICHIERS DE MIGRATION**

```
database/
├── migrations/
│   ├── 001_create_specialized_image_tables.sql
│   └── 002_migrate_existing_data.sql
├── run_migration.js
├── test_migration.js
├── package.json
└── README_MIGRATION.md
```

## 🆘 **DÉPANNAGE**

### **Erreurs Communes**
- **Connexion échouée** : Vérifier les variables d'environnement
- **Permissions insuffisantes** : Utiliser la clé service role
- **Tables déjà existantes** : La migration gère les conflits automatiquement
- **Données incomplètes** : Le test préalable identifie les problèmes

### **Rollback (si nécessaire)**
La table `generated_images` est conservée comme backup. En cas de problème :
1. Restaurer les APIs vers `generated_images`
2. Supprimer les nouvelles tables si nécessaire
3. Analyser les logs d'erreur

## ✅ **VALIDATION FINALE**

Après migration réussie :
- ✅ Nouvelles images sauvegardées dans les bonnes tables
- ✅ Anciennes images accessibles et fonctionnelles
- ✅ Performance améliorée (pas de filtrage par `image_type`)
- ✅ Architecture plus claire et maintenable
- ✅ Sécurité RLS optimisée par table
