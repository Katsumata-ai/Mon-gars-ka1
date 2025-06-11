# 🧪 TEST PHASE 2A - CONNEXION SYSTÈME EXISTANT

## ✅ **TESTS À EFFECTUER**

### **1. Test Modal de Sélection de Forme**
- [ ] Activer l'outil bulle (B)
- [ ] Vérifier que le modal BubbleTypeModal s'ouvre
- [ ] Sélectionner une forme (speech, thought, etc.)
- [ ] Vérifier que le mode placement s'active

### **2. Test Création de Bulle**
- [ ] En mode placement, cliquer sur le canvas
- [ ] Vérifier que la bulle apparaît EXACTEMENT où on clique
- [ ] Vérifier que la bulle a la bonne forme CSS
- [ ] Vérifier que le mode placement se désactive

### **3. Test Système de Sélection**
- [ ] Cliquer sur une bulle HTML créée
- [ ] Vérifier dans les logs : `🎯 Bubble selected: [ID]`
- [ ] Vérifier que `selectedElementIds` contient l'ID de la bulle
- [ ] Vérifier que le cadre de sélection bleu apparaît

### **4. Test Cadre de Sélection**
- [ ] Bulle sélectionnée doit avoir :
  - [ ] Cadre bleu avec animation pulse
  - [ ] 8 handles de redimensionnement (4 coins + 4 bords)
  - [ ] Handle orange pour la queue
  - [ ] Curseurs appropriés au survol des handles

### **5. Test Priorité de Sélection**
- [ ] Créer un panel et une bulle qui se chevauchent
- [ ] Cliquer sur la zone de chevauchement
- [ ] Vérifier que la bulle HTML est sélectionnée (priorité)
- [ ] Vérifier dans les logs SelectTool : bulles filtrées

### **6. Test Édition TipTap**
- [ ] Double-cliquer sur une bulle
- [ ] Vérifier que l'édition TipTap s'active
- [ ] Taper du texte
- [ ] Vérifier que le texte se met à jour en temps réel
- [ ] Appuyer sur Escape pour sortir de l'édition

## 🔍 **LOGS ATTENDUS**

### **Création de Bulle :**
```
🔥 CLIC HTML PUR - Mode placement bulle actif
🎯 POSITION HTML PURE - DIRECTE: {clic: {...}, bulle: {...}}
💬 placeBubbleAtPosition appelé: {x: ..., y: ..., bubbleType: ...}
```

### **Sélection de Bulle :**
```
🎯 Bubble selected: bubble_xxx
🎯 CanvasContext selectElement appelé: {id: 'bubble_xxx', ...}
```

### **SelectTool (doit ignorer les bulles) :**
```
🔍 SelectTool - éléments PixiJS disponibles: {elementsCount: X, elements: [...]}
// Pas de bulles dans la liste !
```

## ⚠️ **PROBLÈMES POTENTIELS**

### **Si les bulles n'apparaissent pas :**
- Vérifier que BubbleLayer a `pointerEvents: 'auto'` en mode placement
- Vérifier que handleLayerClick est bien appelé
- Vérifier les coordonnées dans les logs

### **Si la sélection ne marche pas :**
- Vérifier que handleBubbleSelect appelle bien selectElement()
- Vérifier que selectedElementIds est mis à jour
- Vérifier que isSelected est bien passé à HtmlBubble

### **Si le cadre ne s'affiche pas :**
- Vérifier que HtmlBubble.css est bien importé
- Vérifier l'animation CSS pulse
- Vérifier les z-index des handles

## 🎯 **CRITÈRES DE SUCCÈS**

✅ **PHASE 2A RÉUSSIE SI :**
1. Les bulles apparaissent exactement où on clique
2. Le système de sélection fonctionne parfaitement
3. Le cadre de sélection est identique au système PixiJS
4. Les bulles ont la priorité sur les panels
5. L'édition TipTap fonctionne en double-clic
6. Aucun conflit avec le système PixiJS existant

## 🚀 **PROCHAINE ÉTAPE**

Une fois PHASE 2A validée → **PHASE 2B** : Nettoyage des anciens composants
