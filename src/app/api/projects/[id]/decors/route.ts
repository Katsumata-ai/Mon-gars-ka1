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

    // Get decors for this project from the specialized table
    const { data: decors, error: decorsError } = await supabase
      .from('decor_images')
      .select(`
        id,
        original_prompt,
        optimized_prompt,
        image_url,
        metadata,
        created_at
      `)
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (decorsError) {
      console.error('Error fetching decors:', decorsError)
      return NextResponse.json(
        { error: 'Failed to fetch decors', success: false },
        { status: 500 }
      )
    }

    // Transform data to match Decor interface
    const transformedDecors = decors.map(decor => ({
      id: decor.id,
      name: decor.metadata?.name || 'Décor sans nom',
      description: decor.original_prompt,
      prompt: decor.optimized_prompt,
      image_url: decor.image_url,
      traits: decor.metadata?.traits || [],
      style: decor.metadata?.style || 'shonen',
      created_at: decor.created_at,
      metadata: decor.metadata
    }))

    return NextResponse.json({
      success: true,
      decors: transformedDecors
    })

  } catch (error) {
    console.error('Get decors error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}


