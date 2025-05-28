# 🔍 Diagnostic du Curseur - Éditeur de Script

## 🚨 Problème identifié

Le curseur de saisie (caret) dans l'éditeur de script ne fonctionne pas correctement. Ce n'est pas un problème de couleur mais un dysfonctionnement fondamental.

## 🧪 Page de test créée

**URL de test :** http://localhost:3001/test-cursor

Cette page permet de tester isolément le comportement du curseur avec la même architecture que l'éditeur principal.

## 🔬 Points de diagnostic

### 1. **Position du curseur**
- ✅ Vérifier si le curseur apparaît au bon endroit quand on clique
- ✅ Tester la correspondance entre position de clic et position du curseur

### 2. **Visibilité du curseur**
- ✅ S'assurer que le curseur clignote normalement
- ✅ Vérifier que `caretColor: 'white'` fonctionne
- ✅ Confirmer que le curseur est visible sur fond sombre

### 3. **Déplacement du curseur**
- ✅ Tester les flèches du clavier (←→↑↓)
- ✅ Vérifier Home/End, Page Up/Down
- ✅ Tester Ctrl+flèches pour saut de mots

### 4. **Sélection de texte**
- ✅ Vérifier sélection avec la souris (drag)
- ✅ Tester Shift+flèches
- ✅ Vérifier Ctrl+A (tout sélectionner)
- ✅ Tester double-clic pour sélectionner un mot

### 5. **Insertion de texte**
- ✅ Confirmer que le texte s'insère à la position correcte
- ✅ Tester la suppression (Backspace/Delete)
- ✅ Vérifier le comportement avec les caractères spéciaux

## 🏗️ Architecture actuelle

```typescript
<div className="flex-1 relative">
  {/* Overlay de coloration (arrière-plan) */}
  <div className="absolute inset-0 ... pointer-events-none">
    {/* Contenu coloré */}
  </div>

  {/* Textarea transparent (premier plan) */}
  <textarea 
    className="absolute inset-0 ... bg-transparent text-transparent z-10"
    style={{ caretColor: 'white' }}
  />
</div>
```

## 🔧 Solutions potentielles à tester

### Solution 1 : Problème de z-index
```css
/* Overlay en arrière-plan */
z-index: 1

/* Textarea au premier plan */
z-index: 10
```

### Solution 2 : Problème de pointer-events
```css
/* S'assurer que seul le textarea reçoit les événements */
overlay: pointer-events-none
textarea: pointer-events-auto
```

### Solution 3 : Problème de transparence
```css
/* Tester avec une couleur très légère au lieu de transparent */
color: rgba(255, 255, 255, 0.01)
```

### Solution 4 : Problème de font-family
```css
/* S'assurer que les polices sont identiques */
font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace
```

### Solution 5 : Problème de line-height
```css
/* S'assurer que les hauteurs de ligne sont parfaitement alignées */
line-height: 24px (identique partout)
```

## 📋 Checklist de tests

### Tests de base
- [ ] Le curseur apparaît-il quand on clique dans le textarea ?
- [ ] Le curseur clignote-t-il normalement ?
- [ ] Le curseur est-il visible (blanc sur fond sombre) ?

### Tests de navigation
- [ ] Flèche droite → déplace le curseur d'un caractère
- [ ] Flèche gauche ← déplace le curseur d'un caractère  
- [ ] Flèche haut ↑ déplace le curseur d'une ligne
- [ ] Flèche bas ↓ déplace le curseur d'une ligne
- [ ] Home va au début de la ligne
- [ ] End va à la fin de la ligne
- [ ] Ctrl+Home va au début du document
- [ ] Ctrl+End va à la fin du document

### Tests de sélection
- [ ] Clic + drag sélectionne du texte
- [ ] Shift + flèches étend la sélection
- [ ] Double-clic sélectionne un mot
- [ ] Triple-clic sélectionne une ligne
- [ ] Ctrl+A sélectionne tout

### Tests de saisie
- [ ] Taper du texte l'insère à la position du curseur
- [ ] Backspace supprime le caractère précédent
- [ ] Delete supprime le caractère suivant
- [ ] Entrée crée une nouvelle ligne
- [ ] Tab insère une tabulation

## 🎯 Objectif

Identifier la cause racine du dysfonctionnement et implémenter une solution qui restaure le comportement normal du curseur de saisie dans l'éditeur de script.

## 📝 Notes de test

_Utiliser cette section pour noter les résultats des tests effectués sur la page de diagnostic._

### Résultats observés :
- [ ] Curseur visible : OUI / NON
- [ ] Curseur clignote : OUI / NON  
- [ ] Position correcte au clic : OUI / NON
- [ ] Navigation au clavier : OUI / NON
- [ ] Sélection à la souris : OUI / NON
- [ ] Insertion de texte : OUI / NON

### Problèmes identifiés :
1. 
2. 
3. 

### Solutions appliquées :
1. 
2. 
3.
