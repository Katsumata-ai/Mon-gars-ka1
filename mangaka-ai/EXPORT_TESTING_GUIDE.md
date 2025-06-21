# Guide de Test - Système d'Export Mangaka-AI

## 🎯 Objectif
Valider le système d'export PNG/PDF nouvellement implémenté pour l'application mangaka-ai.

## 📋 Prérequis
1. Application mangaka-ai démarrée (`npm run dev`)
2. Projet avec au moins une page contenant des éléments
3. Navigateur avec console développeur accessible

## 🧪 Tests à Effectuer

### Test 1: Interface Utilisateur
1. **Accéder à l'assemblage** : `/project/[id]/edit`
2. **Vérifier le bouton d'export** dans la toolbar gauche (icône Download)
3. **Cliquer sur le bouton d'export** → Modal doit s'ouvrir
4. **Vérifier les options du modal** :
   - Sélection format PNG/PDF
   - Liste des pages disponibles
   - Curseurs qualité/résolution
   - Informations d'export

### Test 2: Export PNG
1. **Ouvrir le modal d'export**
2. **Sélectionner format PNG**
3. **Sélectionner une seule page**
4. **Configurer** :
   - Qualité: 90%
   - Résolution: 2x
5. **Cliquer "Exporter PNG"**
6. **Vérifier** :
   - Indicateur de progression
   - Téléchargement automatique
   - Fichier PNG généré

### Test 3: Export PDF
1. **Ouvrir le modal d'export**
2. **Sélectionner format PDF**
3. **Sélectionner plusieurs pages** (si disponibles)
4. **Configurer** :
   - Qualité: 80%
   - Résolution: 2x
5. **Cliquer "Exporter PDF"**
6. **Vérifier** :
   - Progression par page
   - Téléchargement automatique
   - Fichier PDF multi-pages

### Test 4: Test Console (Avancé)
1. **Ouvrir la console développeur** (F12)
2. **Importer le module de test** :
   ```javascript
   import('/src/utils/exportTest.js').then(module => {
     window.testExport = module.testExport
     window.runExportTest = module.runExportTest
   })
   ```
3. **Lancer le test automatique** :
   ```javascript
   runExportTest()
   ```
4. **Ou tester manuellement** :
   ```javascript
   testExport('votre-project-id')
   ```

## ✅ Critères de Validation

### Interface Utilisateur
- [ ] Bouton d'export visible dans la toolbar
- [ ] Modal s'ouvre correctement
- [ ] Toutes les options sont fonctionnelles
- [ ] Design cohérent avec l'application

### Fonctionnalité Export PNG
- [ ] Export d'une page unique
- [ ] Qualité d'image correcte
- [ ] Résolution configurable
- [ ] Téléchargement automatique
- [ ] Nom de fichier approprié

### Fonctionnalité Export PDF
- [ ] Export multi-pages
- [ ] Pagination correcte
- [ ] Qualité d'image maintenue
- [ ] Métadonnées PDF présentes
- [ ] Téléchargement automatique

### Performance
- [ ] Export PNG < 5 secondes par page
- [ ] Export PDF < 15 secondes pour 5 pages
- [ ] Indicateur de progression fonctionnel
- [ ] Pas de fuite mémoire

### Gestion d'Erreurs
- [ ] Messages d'erreur clairs
- [ ] Récupération gracieuse
- [ ] Validation des entrées
- [ ] Gestion des images manquantes

## 🐛 Problèmes Connus à Vérifier

### Images Cross-Origin
- Vérifier que les images des panels s'exportent correctement
- Tester avec des images externes (URLs)
- Valider les placeholders pour images manquantes

### Rendu TipTap
- Vérifier que le texte des bulles apparaît dans l'export
- Tester différents types de bulles (speech, thought, shout)
- Valider le formatage du texte

### Synchronisation Canvas
- Vérifier que les transformations (zoom, pan) n'affectent pas l'export
- Tester avec différents niveaux de zoom
- Valider les coordonnées des éléments

## 📊 Métriques de Performance

### Temps d'Export Attendus
- **PNG 1x** : 1-2 secondes
- **PNG 2x** : 2-3 secondes
- **PNG 3x** : 3-5 secondes
- **PDF 5 pages 2x** : 8-15 secondes

### Tailles de Fichier Attendues
- **PNG 1x** : 200-500 KB
- **PNG 2x** : 800-2 MB
- **PNG 3x** : 1.5-4 MB
- **PDF 5 pages 2x** : 3-10 MB

## 🔧 Dépannage

### Erreurs Communes
1. **"Aucune page à exporter"** → Vérifier que le projet a des pages
2. **"Erreur récupération pages"** → Vérifier la connexion Supabase
3. **"Impossible de générer le PNG"** → Vérifier les permissions canvas
4. **Images manquantes** → Vérifier les URLs et CORS

### Debug Console
```javascript
// Activer les logs détaillés
localStorage.setItem('debug', 'export:*')

// Vérifier l'état du store
console.log(useAssemblyStore.getState())

// Tester la récupération des pages
import { ExportManager } from '/src/services/ExportManager.js'
const manager = new ExportManager()
manager.fetchAllPages('project-id').then(console.log)
```

## 📝 Rapport de Test

### Template de Rapport
```
Date: ___________
Testeur: ___________
Version: ___________

✅ Tests Réussis:
- [ ] Interface utilisateur
- [ ] Export PNG
- [ ] Export PDF
- [ ] Performance
- [ ] Gestion d'erreurs

❌ Problèmes Identifiés:
1. ___________
2. ___________

📊 Métriques:
- Temps export PNG: _____ secondes
- Temps export PDF: _____ secondes
- Taille PNG: _____ MB
- Taille PDF: _____ MB

💡 Recommandations:
___________
```

## 🚀 Prochaines Étapes

Après validation complète :
1. **Optimisations performance** si nécessaire
2. **Tests avec différents navigateurs**
3. **Tests avec gros volumes de données**
4. **Documentation utilisateur finale**
5. **Déploiement en production**
