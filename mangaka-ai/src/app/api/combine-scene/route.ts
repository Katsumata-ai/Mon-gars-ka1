import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface CombineSceneRequest {
  assetIds: string[]
  sceneContext: string
  sceneType?: 'action' | 'dialogue' | 'dramatic' | 'romantic' | 'comedy'
  optimizePrompt?: boolean
}

interface AssetData {
  id: string
  original_prompt: string
  optimized_prompt: string
  image_type: 'character' | 'background' | 'scene'
}

// Scene combination templates
const SCENE_TEMPLATES = {
  action: "dynamic action scene, intense movement, dramatic lighting, manga action style",
  dialogue: "conversation scene, character interaction, emotional expression, manga dialogue style",
  dramatic: "dramatic scene, intense emotions, atmospheric lighting, manga drama style",
  romantic: "romantic scene, soft lighting, emotional connection, manga romance style",
  comedy: "comedic scene, expressive characters, lighthearted mood, manga comedy style"
}

const COMBINATION_ENHANCERS = "cohesive composition, unified art style, professional manga illustration, detailed scene"

function createCombinedPrompt(
  assets: AssetData[], 
  sceneContext: string, 
  sceneType: string = 'dramatic'
): string {
  // Extract key elements from each asset
  const characterElements = assets
    .filter(asset => asset.image_type === 'character')
    .map(asset => {
      // Extract character description from prompt
      const prompt = asset.original_prompt.toLowerCase()
      return prompt.replace(/\b(manga|anime|style|art|character|person)\b/gi, '').trim()
    })
    .filter(desc => desc.length > 0)

  const backgroundElements = assets
    .filter(asset => asset.image_type === 'background')
    .map(asset => {
      // Extract background description from prompt
      const prompt = asset.original_prompt.toLowerCase()
      return prompt.replace(/\b(manga|anime|style|art|background|scene|environment)\b/gi, '').trim()
    })
    .filter(desc => desc.length > 0)

  // Build combined prompt
  let combinedPrompt = ""

  // Add scene template
  const template = SCENE_TEMPLATES[sceneType as keyof typeof SCENE_TEMPLATES] || SCENE_TEMPLATES.dramatic
  combinedPrompt += template + ", "

  // Add scene context
  combinedPrompt += sceneContext + ", "

  // Add character elements
  if (characterElements.length > 0) {
    combinedPrompt += "featuring " + characterElements.join(" and ") + ", "
  }

  // Add background elements
  if (backgroundElements.length > 0) {
    combinedPrompt += "set in " + backgroundElements.join(" with ") + ", "
  }

  // Add enhancement keywords
  combinedPrompt += COMBINATION_ENHANCERS

  // Clean up the prompt
  combinedPrompt = combinedPrompt
    .replace(/,\s*,/g, ',')
    .replace(/,\s*$/, '')
    .trim()

  return combinedPrompt
}

async function generateCombinedScene(optimizedPrompt: string): Promise<string> {
  const XAI_API_KEY = process.env.XAI_API_KEY

  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY not configured')
  }

  // For now, return a placeholder image URL since we don't have real Xai API access
  // In production, this would make the actual API call with the combined prompt
  const mockImageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}`

  // Simulate API delay for scene generation (longer than single image)
  await new Promise(resolve => setTimeout(resolve, 3000))

  return mockImageUrl
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Parse request body
    const body: CombineSceneRequest = await request.json()
    const { assetIds, sceneContext, sceneType = 'dramatic', optimizePrompt = true } = body

    if (!assetIds || assetIds.length === 0 || !sceneContext) {
      return NextResponse.json(
        { error: 'Missing required fields: assetIds, sceneContext', success: false },
        { status: 400 }
      )
    }

    if (assetIds.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 assets can be combined', success: false },
        { status: 400 }
      )
    }

    // Check user credits (scene combination costs 2 credits)
    const { data: userCredits, error: creditsError } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .single()

    if (creditsError || !userCredits || userCredits.credits_remaining < 2) {
      return NextResponse.json(
        { error: 'Insufficient credits (2 credits required for scene combination)', success: false },
        { status: 402 }
      )
    }

    // Get asset data
    const { data: assets, error: assetsError } = await supabase
      .from('generated_images')
      .select('id, original_prompt, optimized_prompt, image_type')
      .in('id', assetIds)
      .eq('user_id', user.id)

    if (assetsError || !assets || assets.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch assets or assets not found', success: false },
        { status: 404 }
      )
    }

    if (assets.length !== assetIds.length) {
      return NextResponse.json(
        { error: 'Some assets not found or not owned by user', success: false },
        { status: 404 }
      )
    }

    // Create combined prompt
    const combinedPrompt = optimizePrompt 
      ? createCombinedPrompt(assets, sceneContext, sceneType)
      : sceneContext

    // Generate combined scene
    const startTime = Date.now()
    const imageUrl = await generateCombinedScene(combinedPrompt)
    const generationTime = Date.now() - startTime

    // Generate unique ID for this scene
    const sceneId = crypto.randomUUID()

    // For now, use the mock image URL directly
    // In production, you would upload to Supabase Storage here
    const publicUrl = imageUrl

    // Save to database
    const { error: insertError } = await supabase
      .from('generated_images')
      .insert({
        id: sceneId,
        user_id: user.id,
        original_prompt: sceneContext,
        optimized_prompt: combinedPrompt,
        image_url: publicUrl,
        image_type: 'scene',
        credits_used: 2,
        generation_time_ms: generationTime
      })

    if (insertError) {
      console.error('Failed to save scene record:', insertError)
      return NextResponse.json(
        { error: 'Failed to save scene record', success: false },
        { status: 500 }
      )
    }

    // Deduct credits (2 for scene combination)
    const { error: updateError } = await supabase
      .from('user_credits')
      .update({
        credits_remaining: userCredits.credits_remaining - 2
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update credits:', updateError)
      // Don't fail the request, but log the error
    }

    // Get updated credits
    const { data: updatedCredits } = await supabase
      .from('user_credits')
      .select('credits_remaining')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        sceneId,
        imageUrl: publicUrl,
        originalPrompt: sceneContext,
        optimizedPrompt: combinedPrompt,
        combinedAssets: assetIds,
        sceneType,
        creditsUsed: 2,
        creditsRemaining: updatedCredits?.credits_remaining || 0,
        generationTimeMs: generationTime
      }
    })

  } catch (error) {
    console.error('Combine scene error:', error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}
