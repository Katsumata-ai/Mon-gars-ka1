# 🔍 Guide de Debug - Système d'Export Mangaka-AI

## 🎯 Problèmes Identifiés et Solutions

### ❌ Problèmes Actuels
1. **Images des panels manquantes** - Les rectangles s'affichent mais pas les images
2. **Bulles vides** - Les formes des bulles apparaissent mais pas le texte
3. **Textes invisibles** - Les textes libres ne s'affichent pas
4. **Erreur style.color** - `Cannot read properties of undefined (reading 'toString')`

### ✅ Corrections Appliquées
1. **Gestion des styles de texte** - Validation et fallbacks pour les propriétés manquantes
2. **Support des images** - Gestion de `imageUrl` et `imageData.src`
3. **Contenu des éléments** - Support de `text` et `content`
4. **Debug logging** - Ajout de logs détaillés pour diagnostiquer

## 🧪 Tests de Diagnostic

### 1. Test Console Rapide
```javascript
// Dans la console du navigateur
import('/src/utils/debugExport.js').then(module => {
  window.debugPageData = module.debugPageData
  window.debugCanvasRendering = module.debugCanvasRendering
})

// Analyser les données de page
debugPageData('votre-project-id')

// Test de rendu canvas
debugCanvasRendering()
```

### 2. Test via Panneau de Test
1. **Ouvrir l'application** : `/project/[id]/edit`
2. **Cliquer sur l'icône de test** (en bas à droite)
3. **Lancer les tests** et observer les logs dans la console
4. **Vérifier les fichiers téléchargés**

### 3. Diagnostic Étape par Étape

#### Étape 1: Vérifier les Données Supabase
```javascript
// Console navigateur
const exportManager = new (await import('/src/services/ExportManager.js')).ExportManager()
const pages = await exportManager.fetchAllPages('project-id')
console.log('Pages:', pages)
```

#### Étape 2: Analyser la Structure des Éléments
```javascript
// Examiner le premier élément de chaque type
const elements = pages[0].content.stage.children
const panel = elements.find(el => el.type === 'panel')
const bubble = elements.find(el => el.type === 'dialogue')
const text = elements.find(el => el.type === 'text')

console.log('Panel:', panel)
console.log('Bubble:', bubble)
console.log('Text:', text)
```

#### Étape 3: Test de Rendu Isolé
```javascript
// Test de rendu d'un seul élément
const renderer = new (await import('/src/services/HighResolutionCanvasRenderer.js')).HighResolutionCanvasRenderer(400, 300, 1)

// Test panel
if (panel) {
  await renderer.renderPanel(panel)
}
```

## 🔧 Solutions par Type d'Élément

### 📦 Panels (Images manquantes)

**Problème** : Les images ne s'affichent pas dans l'export

**Diagnostic** :
```javascript
// Vérifier la structure des panels
const panel = elements.find(el => el.type === 'panel')
console.log('Panel imageUrl:', panel.imageUrl)
console.log('Panel imageData:', panel.imageData)
```

**Solutions possibles** :
1. **URL manquante** : Vérifier que `imageUrl` ou `imageData.src` existe
2. **CORS bloqué** : Tester le chargement d'image avec `debugImageLoading(url)`
3. **Format d'URL** : Vérifier que l'URL est valide et accessible

### 💬 Bulles (Texte manquant)

**Problème** : Les bulles apparaissent vides

**Diagnostic** :
```javascript
// Vérifier le contenu des bulles
const bubble = elements.find(el => el.type === 'dialogue')
console.log('Bubble text:', bubble.text)
console.log('Bubble content:', bubble.content)
console.log('Bubble style:', bubble.dialogueStyle)
```

**Solutions possibles** :
1. **Propriété text manquante** : Le texte est stocké dans `text` ou `content`
2. **Style invalide** : Vérifier `dialogueStyle.textColor`, `fontSize`, etc.
3. **Contenu TipTap** : Extraire le texte du format TipTap HTML

### 📝 Textes (Invisibles)

**Problème** : Les textes libres ne s'affichent pas

**Diagnostic** :
```javascript
// Vérifier les textes
const text = elements.find(el => el.type === 'text')
console.log('Text content:', text.text)
console.log('Text style:', text.textStyle)
```

**Solutions possibles** :
1. **Couleur transparente** : Vérifier `textStyle.textColor`
2. **Taille de police** : Vérifier `textStyle.fontSize`
3. **Position** : Vérifier `transform.x`, `transform.y`

## 🛠️ Corrections Techniques

### 1. Gestion Robuste des Styles
```typescript
// Avant (erreur)
this.ctx.fillStyle = `#${style.color.toString(16)}`

// Après (robuste)
const textColor = style.textColor || '#000000'
if (typeof textColor === 'string') {
  this.ctx.fillStyle = textColor.startsWith('#') ? textColor : `#${textColor}`
} else {
  this.ctx.fillStyle = `#${textColor.toString(16).padStart(6, '0')}`
}
```

### 2. Support Multi-Format des Images
```typescript
// Support imageUrl ET imageData.src
const imageUrl = panel.imageUrl || panel.imageData?.src
if (imageUrl) {
  const image = await this.imageLoader.loadImage(imageUrl)
  // ... rendu
}
```

### 3. Extraction de Contenu Flexible
```typescript
// Support text ET content
const textContent = text.text || text.content || ''
```

## 📊 Métriques de Debug

### Logs à Surveiller
- `🔍 Debug - Éléments de la page: X` - Nombre d'éléments trouvés
- `🔍 Élément X: { type, hasImageUrl, hasText }` - Structure de chaque élément
- `✅ Image chargée avec succès` - Chargement d'images réussi
- `❌ Erreur rendu` - Erreurs de rendu spécifiques

### Fichiers de Test
- **PNG** : Doit contenir tous les éléments visibles
- **PDF** : Doit avoir la bonne pagination
- **Taille** : Doit correspondre aux estimations

## 🚀 Prochaines Étapes

### Si les corrections fonctionnent :
1. **Supprimer les logs de debug** en production
2. **Optimiser les performances** de rendu
3. **Ajouter plus de formats** d'export
4. **Tests avec différents navigateurs**

### Si des problèmes persistent :
1. **Analyser les logs détaillés** dans la console
2. **Tester avec des données simplifiées**
3. **Vérifier la compatibilité des navigateurs**
4. **Examiner les erreurs réseau** (images CORS)

## 📞 Support

### Commandes de Debug Utiles
```javascript
// État complet de l'application
console.log(useAssemblyStore.getState())

// Test de rendu canvas simple
debugCanvasRendering()

// Analyse d'un élément spécifique
debugElementStructure(element)

// Test de chargement d'image
debugImageLoading('https://example.com/image.jpg')
```

### Logs Importants
- Console navigateur : Erreurs JavaScript
- Onglet Réseau : Échecs de chargement d'images
- Onglet Application : État du localStorage/sessionStorage
