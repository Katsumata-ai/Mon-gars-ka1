import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadImageWithRetry } from '@/lib/storage/imageUpload'

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
  // Use the specialized image generation key
  const XAI_API_KEY = process.env.XAI_API_KEY

  console.log('🎨 Image generation with prompt:', prompt.substring(0, 100) + '...')

  if (!XAI_API_KEY) {
    console.error('❌ XAI_API_KEY not configured for image generation')
    throw new Error('XAI_API_KEY not configured for image generation')
  }

  // Mask API key in logs for security
  const maskedKey = XAI_API_KEY.substring(0, 8) + '...' + XAI_API_KEY.substring(XAI_API_KEY.length - 4)
  console.log('🔑 Using API key:', maskedKey)

  try {
    // Attempt xAI API call with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 seconds timeout

    console.log('🔗 X.AI API call with grok-2-image-1212 model...')

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

    console.log('📡 X.AI response status:', response.status)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ xAI API error:', response.status, errorText)
      throw new Error(`xAI API error: ${response.status} - ${errorText}`)
    }

    const result = await response.json()
    console.log('📋 X.AI response received:', result)

    if (result.data && result.data[0] && result.data[0].url) {
      console.log('✅ Image generated successfully via xAI:', result.data[0].url)
      return result.data[0].url
    } else {
      console.error('❌ Invalid response format:', result)
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

    console.log('✅ User authenticated:', user.id)

    // Parse request body
    const body: GenerateImageRequest = await request.json()
    const { prompt, type, optimizePrompt = true, projectId, metadata } = body

    console.log('📋 Request data:', { prompt: prompt?.substring(0, 50) + '...', type, optimizePrompt, projectId })

    if (!prompt || !type) {
      console.error('❌ Missing required fields:', { prompt: !!prompt, type: !!type })
      return NextResponse.json(
        { error: 'Missing required fields: prompt, type', success: false },
        { status: 400 }
      )
    }

    // Check user limits BEFORE generation
    const usageType = type === 'character' ? 'character_images' :
                     type === 'background' ? 'decor_images' : 'scene_generation'

    const { data: userLimits, error: limitsError } = await supabase
      .rpc('get_user_limits', { p_user_id: user.id })

    const { data: userUsage, error: usageError } = await supabase
      .rpc('get_user_usage_stats', { p_user_id: user.id })

    if (limitsError || usageError) {
      console.error('❌ Erreur vérification limites:', { limitsError, usageError })
      return NextResponse.json(
        { error: 'Erreur lors de la vérification des limites', success: false },
        { status: 500 }
      )
    }

    // Debug: Afficher les données reçues
    console.log('🔍 Debug userLimits:', userLimits)
    console.log('🔍 Debug userUsage:', userUsage)
    console.log('🔍 Debug usageType:', usageType)

    // CORRECTION: Les fonctions RPC retournent des TABLEAUX avec un seul élément
    const limitsData = Array.isArray(userLimits) ? userLimits[0] : userLimits
    const usageData = Array.isArray(userUsage) ? userUsage[0] : userUsage

    // Vérifier si l'utilisateur peut générer ce type d'image
    const currentUsage = usageData?.[usageType] || 0
    const currentLimit = limitsData?.[usageType] || 0
    const monthlyUsage = usageData?.monthly_generations || 0
    const monthlyLimit = limitsData?.monthly_generations || 0

    console.log('🔍 Debug valeurs extraites:', { currentUsage, currentLimit, monthlyUsage, monthlyLimit })

    // Si les limites ne sont pas illimitées (-1), vérifier les dépassements
    if (currentLimit !== -1 && currentUsage >= currentLimit) {
      console.log('❌ Limite spécifique atteinte:', { type: usageType, usage: currentUsage, limit: currentLimit })
      return NextResponse.json(
        {
          error: 'Limite atteinte',
          success: false,
          limitType: usageType,
          currentUsage,
          limit: currentLimit,
          message: `Vous avez atteint votre limite de ${type === 'character' ? 'personnages' : type === 'background' ? 'décors' : 'scènes'} (${currentUsage}/${currentLimit})`
        },
        { status: 402 } // Payment Required
      )
    }

    if (monthlyLimit !== -1 && monthlyUsage >= monthlyLimit) {
      console.log('❌ Limite mensuelle atteinte:', { monthlyUsage, monthlyLimit })
      return NextResponse.json(
        {
          error: 'Limite mensuelle atteinte',
          success: false,
          limitType: 'monthly_generations',
          currentUsage: monthlyUsage,
          limit: monthlyLimit,
          message: `Vous avez atteint votre limite mensuelle de générations (${monthlyUsage}/${monthlyLimit})`
        },
        { status: 402 } // Payment Required
      )
    }

    console.log('✅ Limites vérifiées:', {
      type: usageType,
      usage: `${currentUsage}/${currentLimit}`,
      monthly: `${monthlyUsage}/${monthlyLimit}`
    })

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
      // Return clear error instead of using test images
      return NextResponse.json(
        {
          error: 'Image generation failed',
          success: false,
          details: error instanceof Error ? error.message : 'Unknown error occurred',
          message: 'Image generation failed. Please try again or contact support if the problem persists.'
        },
        { status: 500 }
      )
    }

    const generationTime = Date.now() - startTime

    // Generate unique ID for this image
    const imageId = crypto.randomUUID()

    // Upload image to Supabase Storage for permanent storage
    console.log('📦 Uploading image to Supabase Storage...')

    let publicUrl: string
    let storagePath: string | undefined

    try {
      const uploadResult = await uploadImageWithRetry(imageUrl, user.id, imageId, type as 'character' | 'background' | 'scene')

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

    // Save to database
    console.log('💾 Sauvegarde en base de données...')

    const imageRecord = {
      id: imageId,
      user_id: user.id,
      project_id: projectId,
      original_prompt: prompt,
      optimized_prompt: finalPrompt,
      image_url: publicUrl,
      metadata: {
        ...metadata,
        storage_path: storagePath,
        is_permanent: true,
        original_xai_url: imageUrl,
        upload_success: true,
        upload_error: null
      }
    }

    console.log('📝 Données à insérer:', imageRecord)

    // Déterminer la table de destination selon le type d'image
    const targetTable = type === 'character' ? 'character_images' : 'decor_images'
    console.log(`🎯 Sauvegarde dans la table: ${targetTable}`)

    const { error: insertError } = await supabase
      .from(targetTable)
      .insert(imageRecord)

    if (insertError) {
      console.error('❌ Erreur lors de la sauvegarde en base de données:', insertError)
      console.error('📊 Détails de l\'erreur:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      })

      // L'image est stockée mais pas sauvegardée en DB - c'est un problème critique
      return NextResponse.json(
        {
          error: 'Database save failed',
          success: false,
          details: insertError.message,
          message: 'L\'image a été générée et stockée, mais n\'a pas pu être enregistrée en base de données. Contactez le support.'
        },
        { status: 500 }
      )
    }

    console.log('✅ Image sauvegardée avec succès en base de données')

    // Incrémenter les compteurs d'usage selon le type d'image générée
    // (usageType déjà défini plus haut dans la fonction)
    const { error: updateError } = await supabase
      .rpc('increment_user_usage', {
        p_user_id: user.id,
        p_usage_type: usageType,
        p_amount: 1
      })

    if (updateError) {
      console.error('⚠️ Erreur mise à jour compteurs:', updateError)
      // Ne pas faire échouer la requête pour une erreur de compteur
    } else {
      console.log('✅ Compteurs d\'usage mis à jour:', usageType, '+1')
    }

    return NextResponse.json({
      success: true,
      data: {
        imageId,
        imageUrl: publicUrl,
        originalPrompt: prompt,
        optimizedPrompt: finalPrompt,
        generationTimeMs: generationTime,
        storagePath,
        isPermanent: true,
        originalXaiUrl: imageUrl,
        creditsUsed: 1, // 1 generation used
        usageType: usageType
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
