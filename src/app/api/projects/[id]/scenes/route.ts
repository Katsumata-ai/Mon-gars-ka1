import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const resolvedParams = await params
    const projectId = resolvedParams.id

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      )
    }

    // Get scenes for this project from the specialized table
    const { data: scenes, error: scenesError } = await supabase
      .from('scene_images')
      .select(`
        id,
        original_prompt,
        optimized_prompt,
        image_url,
        character_ids,
        decor_id,
        scene_settings,
        metadata,
        created_at
      `)
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (scenesError) {
      console.error('Error fetching scenes:', scenesError)
      return NextResponse.json(
        { error: 'Failed to fetch scenes', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      scenes: scenes || []
    })

  } catch (error) {
    console.error('Get scenes error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}
