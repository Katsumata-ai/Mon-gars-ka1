import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadImageWithRetry } from '@/lib/storage/imageUpload'

// Fonction pour valider et corriger les URLs d'images
async function validateAndFixImageUrl(url: string): Promise<string | null> {
  const possibleUrls = [
    url, // URL originale
    url.startsWith('/') ? `https://lqpqfmwfvtxofeaucwqw.supabase.co${url}` : url,
    !url.startsWith('http') ? `https://${url}` : url,
    // Essayer avec différents formats
    url.replace('/storage/v1/object/public/', '/storage/v1/object/public/'),
    url.replace('supabase.co/', 'supabase.co/storage/v1/object/public/')
  ]

  for (const testUrl of possibleUrls) {
    try {
      const response = await fetch(testUrl, { method: 'HEAD' })
      if (response.ok) {
        console.log(`✅ URL valide trouvée: ${testUrl}`)
        return testUrl
      }
    } catch (error) {
      // Continuer avec l'URL suivante
    }
  }

  console.error(`❌ Aucune URL valide trouvée pour: ${url}`)
  return null
}

// Fonction pour télécharger l'image depuis Supabase et la convertir en base64
async function downloadAndConvertToBase64(imageUrl: string, supabase: any): Promise<string | null> {
  try {
    console.log('🔄 Téléchargement depuis Supabase:', imageUrl)

    // Extraire le chemin de l'image depuis l'URL
    const urlParts = imageUrl.split('/storage/v1/object/public/images/')
    if (urlParts.length !== 2) {
      throw new Error('Format d\'URL invalide')
    }

    const imagePath = urlParts[1]
    console.log('📁 Chemin extrait:', imagePath)

    // Télécharger l'image depuis Supabase Storage
    const { data, error } = await supabase.storage
      .from('images')
      .download(imagePath)

    if (error) {
      console.error('❌ Erreur téléchargement Supabase:', error)
      throw error
    }

    if (!data) {
      throw new Error('Aucune donnée reçue')
    }

    console.log('✅ Image téléchargée, taille:', data.size, 'bytes')

    // Convertir en ArrayBuffer puis en base64
    const arrayBuffer = await data.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')

    // Déterminer le type MIME
    const mimeType = data.type || 'image/png'
    const dataUrl = `data:${mimeType};base64,${base64}`

    console.log('✅ Conversion base64 réussie, taille:', dataUrl.length, 'caractères')
    return dataUrl

  } catch (error) {
    console.error('❌ Échec téléchargement/conversion:', error)
    return null
  }
}

// Fonction alternative : convertir l'image en base64 pour Grok-2-Vision (conservée pour compatibilité)
async function convertImageToBase64(url: string): Promise<string | null> {
  try {
    console.log('🔄 Conversion en base64 pour:', url)
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const arrayBuffer = await response.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mimeType = response.headers.get('content-type') || 'image/png'

    const dataUrl = `data:${mimeType};base64,${base64}`
    console.log('✅ Conversion base64 réussie')
    return dataUrl
  } catch (error) {
    console.error('❌ Échec conversion base64:', error)
    return null
  }
}

interface CombineSceneRequest {
  selectedCharacters: string[]  // IDs des personnages (max 3)
  selectedDecor: string         // ID du décor
  sceneDescription: string      // Description de la scène
  cameraAngle: string          // Plan de caméra
  lighting: string             // Éclairage
  mood: string                 // Ambiance
  additionalDetails?: string   // Détails supplémentaires
  projectId?: string           // ID du projet
}

interface SceneResult {
  sceneId: string
  imageUrl: string
  originalPrompt: string
  optimizedPrompt: string
  analysisPrompt: string
  combinedAssets: {
    characters: any[]
    decor: any
  }
  generationTimeMs: number
  creditsUsed: number
}

// Templates pour l'optimisation des prompts
const CAMERA_ANGLE_TEMPLATES = {
  'close-up': 'close-up shot, detailed facial expressions, intimate framing',
  'medium': 'medium shot, waist-up view, balanced composition',
  'wide': 'wide shot, full scene view, environmental context',
  'bird-eye': 'bird\'s eye view, aerial perspective, top-down angle',
  'low-angle': 'low angle shot, dramatic perspective, looking up',
  'high-angle': 'high angle shot, looking down, dominant perspective'
}

const LIGHTING_TEMPLATES = {
  'natural': 'natural lighting, soft daylight, realistic illumination',
  'dramatic': 'dramatic lighting, strong shadows, high contrast',
  'soft': 'soft lighting, diffused light, gentle shadows',
  'golden': 'golden hour lighting, warm tones, cinematic glow',
  'night': 'night lighting, moonlight, atmospheric darkness',
  'studio': 'studio lighting, professional setup, even illumination'
}

const MOOD_TEMPLATES = {
  'action': 'dynamic action scene, intense movement, energy',
  'romantic': 'romantic atmosphere, tender moment, emotional connection',
  'dramatic': 'dramatic tension, emotional intensity, powerful moment',
  'peaceful': 'peaceful scene, calm atmosphere, serene mood',
  'mysterious': 'mysterious atmosphere, enigmatic mood, suspenseful',
  'comedic': 'comedic scene, lighthearted mood, humorous situation'
}

// Fonction pour analyser les images avec Grok-2-Vision (version sophistiquée)
async function analyzeImagesWithVision(
  characterImages: string[],
  decorImage: string,
  sceneDescription: string,
  cameraAngle: string,
  lighting: string,
  mood: string,
  characterData: any[],
  decorData: any,
  additionalDetails?: string,
  supabase?: any
): Promise<string> {
  // Utiliser la clé spécifique pour l'analyse vision
  const XAI_VISION_API_KEY = process.env.XAI_VISION_API_KEY

  console.log('🔍 Analyse des images avec Grok-2-Vision-1212...')

  if (!XAI_VISION_API_KEY) {
    console.error('❌ XAI_VISION_API_KEY not configured for vision analysis')
    throw new Error('XAI_VISION_API_KEY not configured')
  }

  // Télécharger et convertir les images en base64 pour Grok-2-Vision
  console.log('🔄 Téléchargement des images depuis Supabase...')

  const base64CharacterImages: string[] = []
  for (let i = 0; i < characterImages.length; i++) {
    console.log(`📥 Téléchargement personnage ${i + 1}:`, characterImages[i])
    const base64Data = await downloadAndConvertToBase64(characterImages[i], supabase)
    if (base64Data) {
      base64CharacterImages.push(base64Data)
      console.log(`✅ Personnage ${i + 1}: Converti en base64`)
    } else {
      console.error(`❌ Personnage ${i + 1}: Échec téléchargement - ${characterImages[i]}`)
      throw new Error(`Impossible de télécharger l'image du personnage ${i + 1}`)
    }
  }

  console.log(`📥 Téléchargement décor:`, decorImage)
  const base64DecorImage = await downloadAndConvertToBase64(decorImage, supabase)
  if (!base64DecorImage) {
    console.error(`❌ Décor: Échec téléchargement - ${decorImage}`)
    throw new Error('Impossible de télécharger l\'image du décor')
  }
  console.log('✅ Décor: Converti en base64')

  const analysisPrompt = `Tu es un expert en création de manga et storyboard. Tu dois analyser ces images avec une précision extrême et créer un mega-prompt ultra-détaillé pour garantir une fidélité maximale.

🎯 MISSION CRITIQUE: Créer un prompt de 250-300 mots qui reproduit fidèlement chaque détail visuel.

📋 ÉLÉMENTS À ANALYSER:
- ${characterImages.length} personnage(s) à décrire avec précision photographique
- 1 décor à analyser en détail complet
- Action demandée: "${sceneDescription}"
- Détails additionnels: ${additionalDetails || 'Aucun'}
- Plan caméra: ${cameraAngle} | Éclairage: ${lighting} | Ambiance: ${mood}

📝 PROMPTS ORIGINAUX DES IMAGES:
PERSONNAGES:
${characterData.map((char, index) => `- Personnage ${index + 1}: "${char.original_prompt}"`).join('\n')}

DÉCOR:
- Décor: "${decorData.original_prompt}"

🧠 COMPRÉHENSION DES RÉFÉRENCES:
IMPORTANT: Dans l'action "${sceneDescription}", les références comme "il", "elle", "le personnage", ou un nom spécifique font référence au personnage principal (Personnage 1).
- Si l'action dit "il marche" → c'est le Personnage 1 qui marche
- Si l'action dit "elle dort" → c'est le Personnage 1 qui dort
- Si l'action mentionne un nom → c'est le nom du Personnage 1
- Toujours identifier clairement QUI fait QUOI dans la scène

🔍 ANALYSE ULTRA-DÉTAILLÉE REQUISE:

POUR CHAQUE PERSONNAGE:
- Visage: forme, traits, expression exacte, couleur des yeux, sourcils
- Cheveux: couleur précise, coiffure, texture, longueur, mèches
- Vêtements: chaque pièce, couleurs exactes, motifs, accessoires, chaussures
- Corpulence: taille, build, posture, gestuelle
- Style manga: shonen/shoujo/seinen, proportions, design character
- Traits uniques: cicatrices, bijoux, armes, objets personnels

POUR LE DÉCOR:
- Architecture/Nature: structures, matériaux, végétation, objets
- Couleurs: palette exacte, nuances, contrastes
- Ambiance: luminosité, météo, heure, saison
- Détails: textures, éléments décoratifs, arrière-plan
- Style artistique: réalisme, fantastique, urbain, rural

INTÉGRATION SCÈNE:
- Positionnement des personnages dans l'espace
- Actions spécifiques: "${sceneDescription}"
- Interactions entre personnages et environnement
- Mouvement, dynamisme, émotion
- Cohérence avec plan caméra (${cameraAngle})
- Éclairage approprié (${lighting})
- Ambiance générale (${mood})

🎨 CRÉER UN MEGA-PROMPT FINAL:
Un seul paragraphe de 250-300 mots décrivant la scène complète avec tous les détails visuels. Le prompt doit:
- Commencer par "manga style scene"
- Décrire chaque personnage avec fidélité absolue (utilise les prompts originaux comme référence)
- Intégrer le décor avec précision (utilise le prompt original comme référence)
- Inclure l'action demandée: "${sceneDescription}" en identifiant clairement quel personnage fait l'action
- FIDÉLITÉ MAXIMALE: Chaque détail visuel des images doit être reproduit (couleurs, formes, accessoires, expressions)
- COHÉRENCE: Le personnage qui fait l'action doit correspondre exactement à l'image analysée
- Respecter les paramètres: ${cameraAngle}, ${lighting}, ${mood}
- Finir par "high quality, detailed, professional manga artwork, consistent art style, vibrant colors"

RÉPONDS UNIQUEMENT avec le mega-prompt final, sans explication.`

  // Préparer les images base64 pour Grok-2-Vision
  console.log('🎨 Préparation des images base64 pour Grok-2-Vision...')
  const processedImages = []

  // Ajouter les personnages en base64
  for (let i = 0; i < base64CharacterImages.length; i++) {
    processedImages.push({
      type: "image_url",
      image_url: {
        url: base64CharacterImages[i],
        detail: "high"
      }
    })
    console.log(`✅ Personnage ${i + 1} ajouté en base64`)
  }

  // Ajouter le décor en base64
  processedImages.push({
    type: "image_url",
    image_url: {
      url: base64DecorImage,
      detail: "high"
    }
  })
  console.log('✅ Décor ajouté en base64')

  console.log(`📊 Envoi de ${processedImages.length} images à Grok-2-Vision`)

  try {

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_VISION_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-vision-1212',
        messages: [
          {
            role: 'user',
            content: [
              { type: "text", text: analysisPrompt },
              ...processedImages
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Erreur Grok-2-Vision:', response.status, errorText)
      throw new Error(`Grok-2-Vision API error: ${response.status}`)
    }

    const result = await response.json()
    const optimizedPrompt = result.choices[0]?.message?.content?.trim()

    if (!optimizedPrompt) {
      throw new Error('Réponse vide de Grok-2-Vision')
    }

    console.log('✅ Analyse terminée avec Grok-2-Vision')
    return optimizedPrompt

  } catch (error) {
    console.error('⚠️ Erreur lors de l\'analyse:', error)
    // Fallback: créer un prompt basique
    return createFallbackPrompt(sceneDescription, cameraAngle, lighting, mood)
  }
}

// Fonction de fallback intelligent basée sur les prompts originaux
function createIntelligentFallbackPrompt(
  characters: any[],
  decor: any,
  sceneDescription: string,
  cameraAngle: string,
  lighting: string,
  mood: string,
  additionalDetails?: string
): string {
  console.log('🧠 Création du mega-prompt intelligent sans analyse visuelle...')

  const cameraTemplate = CAMERA_ANGLE_TEMPLATES[cameraAngle as keyof typeof CAMERA_ANGLE_TEMPLATES] || 'medium shot'
  const lightingTemplate = LIGHTING_TEMPLATES[lighting as keyof typeof LIGHTING_TEMPLATES] || 'natural lighting'
  const moodTemplate = MOOD_TEMPLATES[mood as keyof typeof MOOD_TEMPLATES] || 'balanced mood'

  // Construire les descriptions détaillées des personnages
  const characterDescriptions = characters.map((char, index) => {
    const originalPrompt = char.original_prompt || 'personnage manga'
    const metadata = char.metadata || {}

    return `personnage ${index + 1}: ${originalPrompt}${metadata.style ? `, style ${metadata.style}` : ''}${metadata.archetype ? `, ${metadata.archetype}` : ''}`
  }).join(', ')

  // Description détaillée du décor
  const decorDescription = decor.original_prompt || 'décor manga'
  const decorMetadata = decor.metadata || {}
  const decorDetails = `${decorDescription}${decorMetadata.style ? `, style ${decorMetadata.style}` : ''}${decorMetadata.mood ? `, ambiance ${decorMetadata.mood}` : ''}`

  // Créer le mega-prompt intelligent
  const megaPrompt = `manga style scene, ${characterDescriptions} dans ${decorDetails}, ${sceneDescription}${additionalDetails ? `, ${additionalDetails}` : ''}, ${cameraTemplate}, ${lightingTemplate}, ${moodTemplate}, high quality, detailed, professional manga artwork, consistent art style, vibrant colors, faithful character representation, detailed environment`

  console.log('📝 Mega-prompt intelligent créé:', megaPrompt.length, 'caractères')
  return megaPrompt
}

// Fonction de fallback basique (conservée pour compatibilité)
function createFallbackPrompt(
  sceneDescription: string,
  cameraAngle: string,
  lighting: string,
  mood: string
): string {
  const cameraTemplate = CAMERA_ANGLE_TEMPLATES[cameraAngle as keyof typeof CAMERA_ANGLE_TEMPLATES] || 'medium shot'
  const lightingTemplate = LIGHTING_TEMPLATES[lighting as keyof typeof LIGHTING_TEMPLATES] || 'natural lighting'
  const moodTemplate = MOOD_TEMPLATES[mood as keyof typeof MOOD_TEMPLATES] || 'balanced mood'

  return `manga style scene, ${sceneDescription}, ${cameraTemplate}, ${lightingTemplate}, ${moodTemplate}, high quality, detailed, professional manga artwork, consistent art style, vibrant colors`
}

// Fonction pour limiter le prompt à 1000 caractères SANS optimisation destructrice
function limitPromptLength(prompt: string): string {
  const MAX_LENGTH = 1000

  if (prompt.length <= MAX_LENGTH) {
    console.log(`✅ Prompt dans la limite: ${prompt.length}/${MAX_LENGTH} caractères`)
    return prompt
  }

  console.log(`⚠️ Prompt trop long: ${prompt.length}/${MAX_LENGTH} caractères - Troncature à 1000`)

  // Troncature intelligente à la dernière virgule complète
  const truncateAt = prompt.lastIndexOf(',', MAX_LENGTH - 10)
  const finalPrompt = truncateAt > MAX_LENGTH / 2
    ? prompt.substring(0, truncateAt).trim()
    : prompt.substring(0, MAX_LENGTH - 3).trim() + '...'

  console.log(`✅ Prompt limité: ${finalPrompt.length}/${MAX_LENGTH} caractères`)
  return finalPrompt
}

// Fonction pour générer l'image avec Grok-2-Image-1212 (utilise la clé de génération)
async function generateSceneImage(optimizedPrompt: string): Promise<string> {
  // Utiliser la clé spécifique pour la génération d'images
  const XAI_API_KEY = process.env.XAI_API_KEY

  console.log('🎨 Génération de l\'image avec Grok-2-Image-1212...')

  if (!XAI_API_KEY) {
    console.error('❌ XAI_API_KEY not configured for image generation')
    throw new Error('XAI_API_KEY not configured')
  }

  // Limiter le prompt à 1000 caractères sans optimisation destructrice
  const finalPrompt = limitPromptLength(optimizedPrompt)

  try {
    // Tentative d'appel à l'API xAI avec timeout (même logique que generate-image)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 secondes timeout

    console.log('🔗 Appel API X.AI avec modèle grok-2-image-1212...')

    const response = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-image-1212',
        prompt: finalPrompt
      }),
      signal: controller.signal
    })

    clearTimeout(timeoutId)

    console.log('📡 Statut de la réponse X.AI:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ xAI API error:', response.status, errorText)
      throw new Error(`xAI API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('📋 Réponse X.AI reçue:', result)

    if (result.data && result.data[0] && result.data[0].url) {
      console.log('✅ Image générée avec succès via xAI:', result.data[0].url)
      return result.data[0].url
    } else {
      console.error('❌ Format de réponse invalide:', result)
      throw new Error('Invalid response format from xAI API')
    }
  } catch (error) {
    console.error('⚠️ Erreur lors de l\'appel à l\'API xAI:', error)
    throw error // Re-throw l'erreur pour la gestion en amont
  }
}

export async function POST(request: NextRequest) {
  console.log('🚀 API /api/combine-scene appelée')

  try {
    const supabase = await createClient()
    console.log('✅ Client Supabase créé')

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('🔍 Vérification authentification:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message
    })

    if (authError || !user) {
      console.log('❌ Authentification échouée')
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    console.log('✅ Utilisateur authentifié:', user.id)

    // Parse request body
    const body: CombineSceneRequest = await request.json()
    const {
      selectedCharacters,
      selectedDecor,
      sceneDescription,
      cameraAngle,
      lighting,
      mood,
      additionalDetails,
      projectId
    } = body

    // Validation
    if (!selectedCharacters || selectedCharacters.length === 0) {
      return NextResponse.json(
        { error: 'Au moins un personnage doit être sélectionné', success: false },
        { status: 400 }
      )
    }

    if (selectedCharacters.length > 3) {
      return NextResponse.json(
        { error: 'Maximum 3 personnages peuvent être sélectionnés', success: false },
        { status: 400 }
      )
    }

    if (!selectedDecor) {
      return NextResponse.json(
        { error: 'Un décor doit être sélectionné', success: false },
        { status: 400 }
      )
    }

    if (!sceneDescription || !cameraAngle || !lighting || !mood) {
      return NextResponse.json(
        { error: 'Tous les champs requis doivent être remplis', success: false },
        { status: 400 }
      )
    }

    // Check user limits using the unified system
    const { data: userLimits, error: limitsError } = await supabase
      .rpc('get_user_limits', { p_user_id: user.id })

    const { data: userUsage, error: usageError } = await supabase
      .rpc('get_user_usage_stats', { p_user_id: user.id })

    if (limitsError || usageError) {
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des limites', success: false },
        { status: 500 }
      )
    }

    // CORRECTION: Les fonctions RPC retournent des tableaux
    const limitsData = Array.isArray(userLimits) ? userLimits[0] : userLimits
    const usageData = Array.isArray(userUsage) ? userUsage[0] : userUsage

    // Vérifier si l'utilisateur peut créer une scène (coûte 1 scène)
    if (limitsData?.scene_generation !== -1 && usageData?.scene_generation >= limitsData?.scene_generation) {
      return NextResponse.json(
        { error: 'Limite de génération de scènes atteinte', success: false },
        { status: 402 }
      )
    }

    // Récupérer les données des personnages
    const { data: characters, error: charactersError } = await supabase
      .from('character_images')
      .select('id, image_url, original_prompt, metadata')
      .in('id', selectedCharacters)
      .eq('user_id', user.id)

    if (charactersError || !characters || characters.length !== selectedCharacters.length) {
      return NextResponse.json(
        { error: 'Personnages non trouvés ou non autorisés', success: false },
        { status: 404 }
      )
    }

    // Récupérer les données du décor
    const { data: decor, error: decorError } = await supabase
      .from('decor_images')
      .select('id, image_url, original_prompt, metadata')
      .eq('id', selectedDecor)
      .eq('user_id', user.id)
      .single()

    if (decorError || !decor) {
      return NextResponse.json(
        { error: 'Décor non trouvé ou non autorisé', success: false },
        { status: 404 }
      )
    }

    console.log('🚀 Début de la génération de scène orchestrée...')
    console.log('📋 Workflow: Grok-2-Vision-1212 (analyse) → Grok-2-Image-1212 (génération)')
    const startTime = Date.now()

    // Étape 1: Analyser les images avec Grok-2-Vision-1212 (version sophistiquée)
    console.log('🔍 Étape 1: Analyse sophistiquée avec Grok-2-Vision-1212...')
    console.log(`📊 Données à analyser: ${characters.length} personnages + 1 décor`)

    const characterImageUrls = characters.map(char => char.image_url)
    const decorImageUrl = decor.image_url

    let optimizedPrompt: string

    try {
      // Tentative d'analyse sophistiquée avec Grok-2-Vision
      optimizedPrompt = await analyzeImagesWithVision(
        characterImageUrls,
        decorImageUrl,
        sceneDescription,
        cameraAngle,
        lighting,
        mood,
        characters,
        decor,
        additionalDetails,
        supabase
      )
      console.log('✅ Analyse sophistiquée réussie')
    } catch (error) {
      console.error('⚠️ Analyse sophistiquée échouée, utilisation du fallback intelligent:', error)

      // Fallback intelligent : créer un mega-prompt basé sur les prompts originaux
      optimizedPrompt = createIntelligentFallbackPrompt(
        characters,
        decor,
        sceneDescription,
        cameraAngle,
        lighting,
        mood,
        additionalDetails
      )
      console.log('🔄 Fallback intelligent activé')
    }

    console.log('✅ Étape 1 terminée - Mega-prompt sophistiqué généré')
    console.log('📝 Longueur du prompt:', optimizedPrompt.length, 'caractères')
    console.log('🔍 Aperçu du prompt:', optimizedPrompt.substring(0, 150) + '...')

    // Étape 2: Générer l'image avec Grok-2-Image-1212
    console.log('🎨 Étape 2: Génération de l\'image avec Grok-2-Image-1212...')
    const temporaryImageUrl = await generateSceneImage(optimizedPrompt)

    const generationTime = Date.now() - startTime
    console.log('✅ Étape 2 terminée - Image générée avec succès')

    // Générer un ID unique pour cette scène
    const sceneId = crypto.randomUUID()

    // Étape 3: Upload de l'image vers Supabase Storage pour stockage permanent
    console.log('📦 Téléchargement de l\'image vers Supabase Storage...')

    let publicUrl: string
    let storagePath: string | undefined

    try {
      const uploadResult = await uploadImageWithRetry(temporaryImageUrl, user.id, sceneId, 'scene')

      if (!uploadResult.success) {
        console.error('❌ Échec du stockage permanent:', uploadResult.error)
        return NextResponse.json(
          {
            error: 'Image storage failed',
            success: false,
            details: uploadResult.error,
            message: 'L\'image a été générée mais n\'a pas pu être sauvegardée. Veuillez réessayer.'
          },
          { status: 500 }
        )
      }

      publicUrl = uploadResult.publicUrl!
      storagePath = uploadResult.storagePath
      console.log('✅ Image stockée de manière permanente:', publicUrl)

    } catch (error) {
      console.error('🚨 Erreur lors du stockage:', error)
      return NextResponse.json(
        {
          error: 'Image storage failed',
          success: false,
          details: error instanceof Error ? error.message : 'Storage error',
          message: 'L\'image a été générée mais n\'a pas pu être sauvegardée. Veuillez réessayer.'
        },
        { status: 500 }
      )
    }

    // Sauvegarder en base de données dans la table scene_images
    console.log('💾 Sauvegarde de la scène générée...')

    const sceneRecord = {
      id: sceneId,
      user_id: user.id,
      project_id: projectId,
      image_url: publicUrl,
      original_prompt: sceneDescription,
      optimized_prompt: optimizedPrompt,
      character_ids: selectedCharacters,
      decor_id: selectedDecor,
      scene_settings: {
        camera_plan: cameraAngle,
        lighting: lighting,
        mood: mood
      },
      metadata: {
        type: 'scene',
        generation_time_ms: generationTime,
        credits_used: 3,
        grok_vision_analysis: true,
        grok_image_generation: true,
        storage_path: storagePath,
        is_permanent: true,
        original_xai_url: temporaryImageUrl,
        upload_success: true,
        upload_error: null
      }
    }

    console.log('📝 Données de la scène à sauvegarder:', sceneRecord)

    const { error: insertError } = await supabase
      .from('scene_images')
      .insert(sceneRecord)

    if (insertError) {
      console.error('❌ Erreur sauvegarde:', insertError)
      console.error('📊 Détails de l\'erreur:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return NextResponse.json(
        {
          error: 'Erreur lors de la sauvegarde',
          success: false,
          details: insertError.message
        },
        { status: 500 }
      )
    }

    // Incrémenter l'usage de génération de scènes
    const { error: updateError } = await supabase
      .rpc('increment_user_usage', {
        p_user_id: user.id,
        p_usage_type: 'scene_generation',
        p_amount: 1
      })

    if (updateError) {
      console.error('⚠️ Credits update error:', updateError)
    }

    console.log('✅ Scene generated successfully!')

    return NextResponse.json({
      success: true,
      data: {
        sceneId,
        imageUrl: publicUrl,
        originalPrompt: sceneDescription,
        optimizedPrompt,
        analysisMethod: 'Grok-2-Vision-1212 sophisticated analysis',
        combinedAssets: {
          characters,
          decor
        },
        generationTimeMs: generationTime,
        creditsUsed: 3,
        storagePath,
        isPermanent: true,
        originalXaiUrl: temporaryImageUrl
      }
    })

  } catch (error) {
    console.error('❌ Scene generation error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}
