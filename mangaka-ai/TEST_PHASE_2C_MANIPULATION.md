# 🧪 TEST PHASE 2C - MANIPULATION ET REDIMENSIONNEMENT

## ✅ **TESTS À EFFECTUER**

### **1. Test Création et Sélection**
- [ ] Créer une bulle HTML (outil B → forme → clic)
- [ ] Vérifier que la bulle apparaît exactement où on clique
- [ ] Cliquer sur la bulle pour la sélectionner
- [ ] Vérifier que le cadre bleu avec 8 handles apparaît

### **2. Test Redimensionnement par les Coins**
- [ ] **Coin Nord-Ouest (NW)** : Glisser vers l'intérieur/extérieur
  - [ ] Vérifier que la bulle se redimensionne depuis le coin NW
  - [ ] Vérifier que la position et la taille changent correctement
- [ ] **Coin Nord-Est (NE)** : Glisser vers l'intérieur/extérieur
- [ ] **Coin Sud-Ouest (SW)** : Glisser vers l'intérieur/extérieur  
- [ ] **Coin Sud-Est (SE)** : Glisser vers l'intérieur/extérieur

### **3. Test Redimensionnement par les Bords**
- [ ] **Bord Nord (N)** : Glisser vers le haut/bas
  - [ ] Vérifier que seule la hauteur change
- [ ] **Bord Sud (S)** : Glisser vers le haut/bas
- [ ] **Bord Ouest (W)** : Glisser vers la gauche/droite
  - [ ] Vérifier que seule la largeur change
- [ ] **Bord Est (E)** : Glisser vers la gauche/droite

### **4. Test Contraintes de Taille**
- [ ] Essayer de redimensionner en dessous de 80px de largeur
  - [ ] Vérifier que la taille minimale est respectée
- [ ] Essayer de redimensionner en dessous de 40px de hauteur
  - [ ] Vérifier que la taille minimale est respectée

### **5. Test Déplacement**
- [ ] Cliquer et glisser sur le corps de la bulle (pas sur les handles)
- [ ] Vérifier que la bulle se déplace en suivant la souris
- [ ] Vérifier que la position finale est correcte

### **6. Test Curseurs**
- [ ] Survol des handles de coin : curseurs `nw-resize`, `ne-resize`, etc.
- [ ] Survol des handles de bord : curseurs `n-resize`, `e-resize`, etc.
- [ ] Survol du corps de la bulle : curseur `move` (si pas en édition)

### **7. Test Désélection**
- [ ] Cliquer sur une zone vide du canvas
- [ ] Vérifier que la bulle se désélectionne (cadre disparaît)
- [ ] Vérifier dans les logs : `🖱️ Clic sur zone vide - désélection`

### **8. Test Édition vs Manipulation**
- [ ] Double-cliquer sur une bulle pour entrer en mode édition
- [ ] Vérifier que les handles de manipulation disparaissent
- [ ] Vérifier que le déplacement est désactivé en mode édition
- [ ] Appuyer sur Escape pour sortir de l'édition
- [ ] Vérifier que les handles réapparaissent

### **9. Test UX Identique aux Panels**
- [ ] Créer un panel et une bulle côte à côte
- [ ] Comparer l'expérience de manipulation
- [ ] Vérifier que les curseurs sont identiques
- [ ] Vérifier que le comportement de redimensionnement est identique

## 🔍 **LOGS ATTENDUS**

### **Démarrage Manipulation :**
```
🔧 Démarrage manipulation HTML: {elementId: 'bubble_xxx', handleType: 'CORNER_SE', position: {...}}
✅ Manipulation démarrée: resize
```

### **Pendant Manipulation :**
```
🔧 Manipulation en cours: {deltaX: 10, deltaY: 15, newSize: {...}}
```

### **Fin Manipulation :**
```
✅ Manipulation terminée pour: bubble_xxx
```

### **Désélection :**
```
🖱️ Clic sur zone vide - désélection
```

## ⚠️ **PROBLÈMES POTENTIELS**

### **Si les handles ne répondent pas :**
- Vérifier que `pointer-events: auto` est bien sur les handles
- Vérifier que les gestionnaires d'événements sont bien attachés
- Vérifier les z-index des handles

### **Si le redimensionnement ne marche pas :**
- Vérifier que `BubbleManipulationHandler` est bien initialisé
- Vérifier que `onUpdate` est bien appelé
- Vérifier les calculs de position/taille dans `handleResize`

### **Si le déplacement ne marche pas :**
- Vérifier que `handleBubbleMouseDown` est bien attaché
- Vérifier que `HandleType.MOVE` est bien géré
- Vérifier que l'événement ne se propage pas aux handles

### **Si les curseurs ne changent pas :**
- Vérifier les classes CSS `cursor-*`
- Vérifier que `getHandleCursor` retourne les bonnes valeurs
- Vérifier que les styles ne sont pas surchargés

## 🎯 **CRITÈRES DE SUCCÈS**

✅ **PHASE 2C RÉUSSIE SI :**
1. **Redimensionnement fluide** par tous les handles (8 directions)
2. **Déplacement fluide** en cliquant sur le corps de la bulle
3. **Contraintes de taille** respectées (min 80x40px)
4. **Curseurs appropriés** pour chaque type de manipulation
5. **Désélection** en cliquant sur zone vide
6. **Isolation édition/manipulation** - pas de conflit entre les modes
7. **UX identique aux panels** - même feeling, même précision
8. **Performance fluide** - pas de lag pendant la manipulation

## 🚀 **PROCHAINE ÉTAPE**

Une fois PHASE 2C validée → **Queue 360°** et **TipTap avancé**
