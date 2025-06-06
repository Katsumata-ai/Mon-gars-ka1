import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadImageWithRetry } from '@/lib/storage/imageUpload'

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

// Fonction pour analyser les images avec Grok-2-Vision
async function analyzeImagesWithVision(
  characterImages: string[],
  decorImage: string,
  sceneDescription: string,
  cameraAngle: string,
  lighting: string,
  mood: string
): Promise<string> {
  const XAI_API_KEY = 'xai-5vp7lvCb89wKcfHfzIOC5IgpAPxTT9ghyK0KoHPgNRwR4vw6Wi6o8RlP89rdGw8ZeRl1fv8GdnM0SwES'

  console.log('🔍 Analyse des images avec Grok-2-Vision...')

  const analysisPrompt = `Tu es un expert en création de manga et storyboard. Analyse ces images et crée un prompt parfait pour générer une scène manga cohérente.

IMAGES À ANALYSER:
- Personnages: ${characterImages.length} personnage(s)
- Décor: 1 environnement

DEMANDE DE L'UTILISATEUR:
- Description: ${sceneDescription}
- Plan de caméra: ${cameraAngle}
- Éclairage: ${lighting}
- Ambiance: ${mood}

INSTRUCTIONS:
1. Analyse chaque personnage: apparence, style, couleurs, traits distinctifs
2. Analyse le décor: environnement, style, couleurs, éléments importants
3. Crée un prompt détaillé qui:
   - Préserve fidèlement l'apparence de chaque personnage
   - Intègre parfaitement le décor
   - Respecte la demande de l'utilisateur
   - Utilise le style manga cohérent
   - Inclut les détails techniques (caméra, éclairage, ambiance)

RÉPONDS UNIQUEMENT avec le prompt optimisé, sans explication.`

  try {
    const images = [...characterImages, decorImage].map(url => ({
      type: "image_url",
      image_url: { url }
    }))

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-2-vision-1212',
        messages: [
          {
            role: 'user',
            content: [
              { type: "text", text: analysisPrompt },
              ...images
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

// Fonction de fallback pour créer un prompt basique
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

// Fonction pour générer l'image avec Grok-2-Image (utilise la même clé que l'API generate-image)
async function generateSceneImage(optimizedPrompt: string): Promise<string> {
  const XAI_API_KEY = process.env.XAI_API_KEY

  console.log('🎨 Génération de l\'image avec Grok-2-Image...')

  if (!XAI_API_KEY) {
    console.error('❌ XAI_API_KEY non configurée')
    throw new Error('XAI_API_KEY not configured')
  }

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
        prompt: optimizedPrompt
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

    // Check user credits (scene combination costs 3 credits)
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_quotas')
      .select('comic_panels_used, comic_panels_limit')
      .eq('user_id', user.id)
      .single()

    if (creditsError || !userCredits || (userCredits.comic_panels_limit - userCredits.comic_panels_used) < 3) {
      return NextResponse.json(
        { error: 'Crédits insuffisants (3 panneaux requis pour la création de scène)', success: false },
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
    const startTime = Date.now()

    // Étape 1: Analyser les images avec Grok-2-Vision
    const characterImageUrls = characters.map(char => char.image_url)
    const decorImageUrl = decor.image_url

    const analysisPrompt = `${sceneDescription}${additionalDetails ? ` - ${additionalDetails}` : ''}`

    const optimizedPrompt = await analyzeImagesWithVision(
      characterImageUrls,
      decorImageUrl,
      analysisPrompt,
      cameraAngle,
      lighting,
      mood
    )

    console.log('📝 Prompt optimisé généré:', optimizedPrompt)

    // Étape 2: Générer l'image avec Grok-2-Image
    const temporaryImageUrl = await generateSceneImage(optimizedPrompt)

    const generationTime = Date.now() - startTime

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

    // Déduire les crédits (3 pour la création de scène)
    const { error: updateError } = await supabase
      .from('user_quotas')
      .update({
        comic_panels_used: userCredits.comic_panels_used + 3
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('⚠️ Erreur mise à jour crédits:', updateError)
    }

    console.log('✅ Scène générée avec succès!')

    return NextResponse.json({
      success: true,
      data: {
        sceneId,
        imageUrl: publicUrl,
        originalPrompt: sceneDescription,
        optimizedPrompt,
        analysisPrompt,
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
    console.error('❌ Erreur génération scène:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Erreur interne du serveur',
        success: false
      },
      { status: 500 }
    )
  }
}
