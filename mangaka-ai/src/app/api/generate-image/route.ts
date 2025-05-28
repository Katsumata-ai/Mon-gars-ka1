import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface GenerateImageRequest {
  prompt: string
  type: 'character' | 'background' | 'scene'
  optimizePrompt?: boolean
}

// Prompt optimization templates for manga style
const MANGA_TEMPLATES = {
  character: "manga style, anime art, detailed character design, clean lines, professional illustration",
  background: "manga style, anime background, detailed environment, atmospheric, professional illustration",
  scene: "manga style, anime scene, dynamic composition, detailed illustration, professional artwork"
}

const QUALITY_ENHANCERS = "high quality, detailed, sharp, professional, 4k resolution"
const STYLE_CONSISTENCY = "consistent art style, manga aesthetic, black and white with selective color"

function optimizePromptInternal(originalPrompt: string, imageType: 'character' | 'background' | 'scene'): string {
  // Remove any existing style keywords to avoid conflicts
  const cleanPrompt = originalPrompt
    .replace(/\b(manga|anime|style|art)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim()

  // Add manga-specific template
  const template = MANGA_TEMPLATES[imageType]

  // Construct optimized prompt
  const optimizedPrompt = `${template}, ${cleanPrompt}, ${QUALITY_ENHANCERS}, ${STYLE_CONSISTENCY}`

  return optimizedPrompt
}

async function generateImageWithXai(): Promise<string> {
  const XAI_API_KEY = process.env.XAI_API_KEY

  if (!XAI_API_KEY) {
    throw new Error('XAI_API_KEY not configured')
  }

  // For now, return a placeholder image URL since we don't have real Xai API access
  // In production, this would make the actual API call
  const mockImageUrl = `https://picsum.photos/1024/1024?random=${Date.now()}`

  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))

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
    const body: GenerateImageRequest = await request.json()
    const { prompt, type, optimizePrompt = true } = body

    if (!prompt || !type) {
      return NextResponse.json(
        { error: 'Missing required fields: prompt, type', success: false },
        { status: 400 }
      )
    }

    // Check user quotas
    const { data: userQuotas, error: quotasError } = await supabase
      .from('user_quotas')
      .select('monthly_generations_used, monthly_generations_limit')
      .eq('user_id', user.id)
      .single()

    if (quotasError) {
      // If user quotas don't exist, create them
      const resetDate = new Date()
      resetDate.setMonth(resetDate.getMonth() + 1)

      const { error: insertError } = await supabase
        .from('user_quotas')
        .insert({
          user_id: user.id,
          monthly_generations_used: 0,
          monthly_generations_limit: 5,
          comic_panels_used: 0,
          comic_panels_limit: 10,
          reset_date: resetDate.toISOString()
        })

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to initialize user quotas', success: false },
          { status: 500 }
        )
      }

      // Retry getting quotas
      const { data: newUserQuotas, error: retryError } = await supabase
        .from('user_quotas')
        .select('monthly_generations_used, monthly_generations_limit')
        .eq('user_id', user.id)
        .single()

      if (retryError || !newUserQuotas) {
        return NextResponse.json(
          { error: 'Failed to get user quotas', success: false },
          { status: 500 }
        )
      }

      if ((newUserQuotas.monthly_generations_limit - newUserQuotas.monthly_generations_used) < 1) {
        return NextResponse.json(
          { error: 'Insufficient generations remaining', success: false },
          { status: 402 }
        )
      }
    } else if (!userQuotas || (userQuotas.monthly_generations_limit - userQuotas.monthly_generations_used) < 1) {
      return NextResponse.json(
        { error: 'Insufficient generations remaining', success: false },
        { status: 402 }
      )
    }

    // Optimize prompt if requested
    const finalPrompt = optimizePrompt ? optimizePromptInternal(prompt, type) : prompt

    // Generate image
    const startTime = Date.now()
    const imageUrl = await generateImageWithXai()
    const generationTime = Date.now() - startTime

    // Generate unique ID for this image
    const imageId = crypto.randomUUID()

    // For now, use the mock image URL directly
    // In production, you would upload to Supabase Storage here
    const publicUrl = imageUrl

    // Save to database
    const { error: insertError } = await supabase
      .from('generated_images')
      .insert({
        id: imageId,
        user_id: user.id,
        original_prompt: prompt,
        optimized_prompt: finalPrompt,
        image_url: publicUrl,
        image_type: type,
        credits_used: 1,
        generation_time_ms: generationTime
      })

    if (insertError) {
      console.error('Failed to save image record:', insertError)
      return NextResponse.json(
        { error: 'Failed to save image record', success: false },
        { status: 500 }
      )
    }

    // Update generation count
    const currentUsed = userQuotas?.monthly_generations_used || 0
    const { error: updateError } = await supabase
      .from('user_quotas')
      .update({
        monthly_generations_used: currentUsed + 1
      })
      .eq('user_id', user.id)

    if (updateError) {
      console.error('Failed to update quotas:', updateError)
      // Don't fail the request, but log the error
    }

    // Get updated quotas
    const { data: updatedQuotas } = await supabase
      .from('user_quotas')
      .select('monthly_generations_used, monthly_generations_limit')
      .eq('user_id', user.id)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        imageId,
        imageUrl: publicUrl,
        originalPrompt: prompt,
        optimizedPrompt: finalPrompt,
        creditsUsed: 1,
        creditsRemaining: updatedQuotas ? (updatedQuotas.monthly_generations_limit - updatedQuotas.monthly_generations_used) : 0,
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
