# 🤖 XAI Grok Workflow - MANGAKA AI

## 📋 Configuration des Clés API

### Variables d'Environnement
```bash
# Clé pour génération d'images (Grok-2-Image-1212)
XAI_API_KEY=xai-Mhz6iRKoie3nsp1qHyyZf0PplT2NMDSVksQxctZYs3r1NmQWAx4u6jyEi4hlCX34ZPvdfwQOakPVTIUw

# Clé pour analyse d'images (Grok-2-Vision-1212)  
XAI_VISION_API_KEY=xai-IuiWdJow59SVn25Uhu2jYNffXw7dDW1vTkuHzzUvZ8qZssVcK62flXGPYe0s3NlYXzyhmxWO5vu1CqOK
```

## 🔄 Workflows de Génération

### 1. **Personnages & Décors** (Génération Simple)
```
Prompt Utilisateur → Grok-2-Image-1212 → Image Générée
```

**Fichiers concernés :**
- `src/app/api/generate-image/route.ts`
- Utilise : `XAI_API_KEY` (génération)
- Modèle : `grok-2-image-1212`

**Processus :**
1. L'utilisateur saisit un prompt
2. Le prompt est optimisé avec les templates manga
3. Envoi direct à Grok-2-Image-1212
4. Image générée et stockée

### 2. **Scènes** (Génération Sophistiquée Ultra-Fidèle)
```
Input Utilisateur (texte + 4 images max)
    ↓
Grok-2-Vision-1212 : Analyse Sophistiquée
    ↓
• Analyse détaillée de chaque personnage (apparence, style, traits)
• Analyse complète du décor (environnement, ambiance, détails)
• Récupération des prompts originaux des images
• Intégration du prompt utilisateur + options additionnelles
    ↓
Création d'un Mega-Prompt Ultra-Détaillé (250-300 mots)
    ↓
Grok-2-Image-1212 : Génération Fidèle
```

**Fichiers concernés :**
- `src/app/api/combine-scene/route.ts`
- Utilise : `XAI_VISION_API_KEY` (analyse) + `XAI_API_KEY` (génération)
- Modèles : `grok-2-vision-1212` + `grok-2-image-1212`

**Processus Sophistiqué :**
1. **Analyse Ultra-Détaillée** : Grok-2-Vision-1212 analyse avec précision photographique
   - Chaque personnage : visage, cheveux, vêtements, posture, style manga
   - Décor : architecture, couleurs, ambiance, détails
   - Intégration des prompts originaux des images
2. **Mega-Prompt** : Création d'un prompt de 250-300 mots ultra-précis
3. **Génération Fidèle** : Grok-2-Image-1212 génère avec fidélité maximale
4. Image générée et stockée

## 🔧 Modèles Utilisés

### Grok-2-Vision-1212
- **Usage** : Analyse d'images pour les scènes
- **Endpoint** : `/v1/chat/completions`
- **Clé** : `XAI_VISION_API_KEY`
- **Permissions** : Vision + Chat

### Grok-2-Image-1212  
- **Usage** : Génération d'images (personnages, décors, scènes)
- **Endpoint** : `/v1/images/generations`
- **Clé** : `XAI_API_KEY`
- **Permissions** : Image Generation

## 🚨 Sécurité

### Problème Résolu
- **Fuite précédente** : Clé API hardcodée dans `combine-scene/route.ts`
- **Solution** : Utilisation des variables d'environnement
- **Clés bloquées** : Remplacées par de nouvelles clés avec permissions appropriées

### Bonnes Pratiques
- ✅ Toujours utiliser `process.env.VARIABLE_NAME`
- ✅ Ne jamais hardcoder les clés dans le code
- ✅ Masquer les clés dans les logs
- ✅ Séparer les clés par fonction (vision vs génération)

## 📊 Logs et Monitoring

### Logs de Scènes
```
🚀 Début de la génération de scène orchestrée...
📋 Workflow: Grok-2-Vision-1212 (analyse) → Grok-2-Image-1212 (génération)
🔍 Étape 1: Analyse des images avec Grok-2-Vision-1212...
✅ Étape 1 terminée - Prompt optimisé généré
🎨 Étape 2: Génération de l'image avec Grok-2-Image-1212...
✅ Étape 2 terminée - Image générée avec succès
```

### Logs de Personnages/Décors
```
🎨 Image generation with prompt: [prompt...]
🔑 Using API key: xai-Mhz6...TIUw
🔗 X.AI API call with grok-2-image-1212 model...
✅ Image générée avec succès via xAI
```

## 🔍 Debugging

### Vérifier les Clés API
```bash
# Test Grok-2-Vision-1212
curl -s https://api.x.ai/v1/chat/completions \
  -H "Authorization: Bearer $XAI_VISION_API_KEY" \
  -d '{"model": "grok-2-vision-1212", "messages": [...]}'

# Test Grok-2-Image-1212  
curl -s https://api.x.ai/v1/images/generations \
  -H "Authorization: Bearer $XAI_API_KEY" \
  -d '{"model": "grok-2-image-1212", "prompt": "test"}'
```

### Erreurs Communes
- **403 Blocked** : Clé API bloquée ou permissions insuffisantes
- **401 Unauthorized** : Clé API invalide ou expirée
- **404 Not Found** : Modèle non disponible pour cette clé
