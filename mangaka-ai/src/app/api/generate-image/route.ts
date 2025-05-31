import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface GenerateImageRequest {
  prompt: string
  type: 'character' | 'background' | 'scene'
  optimizePrompt?: boolean
  projectId?: string
  metadata?: {
    name?: string
    style?: string
    traits?: string[]
    archetype?: string
    [key: string]: unknown
  }
}

// Prompt optimization templates for manga style
const MANGA_TEMPLATES = {
  character: "manga style character, anime art, detailed character design, clean lines, cel shading, professional illustration, full body portrait",
  background: "manga style background, anime environment, detailed scenery, atmospheric lighting, professional illustration",
  scene: "manga style scene, anime composition, dynamic layout, detailed illustration, professional artwork"
}

const QUALITY_ENHANCERS = "high quality, detailed, sharp, professional, 4k resolution, masterpiece"
const STYLE_CONSISTENCY = "consistent art style, manga aesthetic, anime style, vibrant colors"

// Enhanced character-specific templates
const CHARACTER_STYLE_TEMPLATES = {
  shonen: "shonen manga style, dynamic pose, determined expression, action-oriented design",
  shoujo: "shoujo manga style, elegant features, soft expressions, romantic aesthetic, beautiful details",
  seinen: "seinen manga style, mature design, realistic proportions, sophisticated appearance",
  josei: "josei manga style, refined features, adult character design, elegant composition",
  chibi: "chibi manga style, cute proportions, large eyes, small body, adorable design",
  realistic: "semi-realistic manga style, detailed anatomy, natural proportions, refined artwork"
}

function optimizePromptInternal(originalPrompt: string, imageType: 'character' | 'background' | 'scene', metadata?: Record<string, unknown>): string {
  // Remove any existing style keywords to avoid conflicts
  const cleanPrompt = originalPrompt
    .replace(/\b(manga|anime|style|art)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Add manga-specific template
  let template = MANGA_TEMPLATES[imageType]

  // For characters, add style-specific template if available
  if (imageType === 'character' && metadata?.style && CHARACTER_STYLE_TEMPLATES[metadata.style as keyof typeof CHARACTER_STYLE_TEMPLATES]) {
    template += `, ${CHARACTER_STYLE_TEMPLATES[metadata.style as keyof typeof CHARACTER_STYLE_TEMPLATES]}`
  }

  // Construct optimized prompt
  const optimizedPrompt = `${template}, ${cleanPrompt}, ${QUALITY_ENHANCERS}, ${STYLE_CONSISTENCY}`

  return optimizedPrompt
}

async function generateImageWithXai(prompt: string): Promise<string> {
  const XAI_API_KEY = process.env.XAI_API_KEY

  console.log('🎨 Génération d\'image avec prompt:', prompt.substring(0, 100) + '...')

  if (!XAI_API_KEY) {
    console.error('❌ XAI_API_KEY non configurée')
    throw new Error('XAI_API_KEY not configured')
  }

  try {
    // Tentative d'appel à l'API xAI avec timeout
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
        prompt: prompt
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
  console.log('🚀 Début de la requête de génération d\'image')

  try {
    const supabase = await createClient()
    console.log('✅ Client Supabase créé avec succès')

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error('❌ Erreur d\'authentification:', authError)
      return NextResponse.json(
        { error: 'Authentication error', success: false },
        { status: 401 }
      )
    }

    if (!user) {
      console.error('❌ Utilisateur non connecté')
      return NextResponse.json(
        { error: 'Unauthorized - no user', success: false },
        { status: 401 }
      )
    }

    console.log('✅ Utilisateur authentifié:', user.id)

    // Parse request body
    const body: GenerateImageRequest = await request.json()
    const { prompt, type, optimizePrompt = true, projectId, metadata } = body

    console.log('📋 Données de la requête:', { prompt: prompt?.substring(0, 50) + '...', type, optimizePrompt, projectId })

    if (!prompt || !type) {
      console.error('❌ Champs requis manquants:', { prompt: !!prompt, type: !!type })
      return NextResponse.json(
        { error: 'Missing required fields: prompt, type', success: false },
        { status: 400 }
      )
    }

    // TEMPORAIREMENT DÉSACTIVÉ : Vérifications de quotas supprimées pour le développement
    // Les limitations seront réimplémentées plus tard selon les besoins business

    // Optimize prompt if requested
    const finalPrompt = optimizePrompt ? optimizePromptInternal(prompt, type, metadata) : prompt

    // Generate image
    const startTime = Date.now()
    let imageUrl: string

    try {
      imageUrl = await generateImageWithXai(finalPrompt)
    } catch (error) {
      console.error('🚨 Erreur lors de la génération d\'image:', error)

      // Fallback avec images de test thématiques
      const testImages = [
        'https://picsum.photos/1024/1024?random=manga1',
        'https://picsum.photos/1024/1024?random=manga2',
        'https://picsum.photos/1024/1024?random=manga3',
        'https://picsum.photos/1024/1024?random=manga4',
        'https://picsum.photos/1024/1024?random=manga5'
      ]

      const randomIndex = Math.floor(Math.random() * testImages.length)
      imageUrl = testImages[randomIndex]
      console.log('🎭 Utilisation d\'une image de test:', imageUrl)
    }

    const generationTime = Date.now() - startTime

    // Generate unique ID for this image
    const imageId = crypto.randomUUID()

    // For now, use the image URL directly
    // In production, you would upload to Supabase Storage here
    const publicUrl = imageUrl

    // Save to database
    console.log('💾 Sauvegarde en base de données...')

    const imageRecord = {
      id: imageId,
      user_id: user.id,
      project_id: projectId,
      prompt: finalPrompt || prompt, // Colonne requise NOT NULL - utilise finalPrompt ou prompt en fallback
      original_prompt: prompt,
      optimized_prompt: finalPrompt,
      image_url: publicUrl,
      image_type: type,
      credits_used: 1,
      generation_time_ms: generationTime,
      metadata: metadata || {}
    }

    // Debug: vérifier que prompt n'est pas null
    console.log('🔍 Vérification des valeurs:')
    console.log('   - prompt original:', prompt)
    console.log('   - finalPrompt:', finalPrompt)
    console.log('   - prompt dans record:', imageRecord.prompt)

    console.log('📝 Données à insérer:', imageRecord)

    // Déterminer la table de destination selon le type d'image
    const targetTable = type === 'character' ? 'character_images' : 'decor_images'
    console.log(`🎯 Sauvegarde dans la table: ${targetTable}`)

    // Préparer les données pour les nouvelles tables (sans image_type et credits_used)
    const { image_type, credits_used, generation_time_ms, ...cleanRecord } = imageRecord

    const { error: insertError } = await supabase
      .from(targetTable)
      .insert(cleanRecord)

    if (insertError) {
      console.error('❌ Erreur lors de la sauvegarde:', insertError)
      console.error('📊 Détails de l\'erreur:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })
      return NextResponse.json(
        {
          error: `Failed to save image record: ${insertError.message}`,
          success: false,
          details: insertError.details
        },
        { status: 500 }
      )
    }

    console.log('✅ Image sauvegardée avec succès en base de données')

    // TEMPORAIREMENT DÉSACTIVÉ : Mise à jour des quotas supprimée

    return NextResponse.json({
      success: true,
      data: {
        imageId,
        imageUrl: publicUrl,
        originalPrompt: prompt,
        optimizedPrompt: finalPrompt,
        creditsUsed: 0, // Temporairement désactivé
        creditsRemaining: 999999, // Illimité pour le développement
        generationTimeMs: generationTime
      }
    })

  } catch (error) {
    console.error('Generate image error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}
