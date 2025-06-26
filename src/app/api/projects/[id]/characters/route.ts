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

    // Get characters for this project from the specialized table
    const { data: characters, error: charactersError } = await supabase
      .from('character_images')
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

    if (charactersError) {
      console.error('Error fetching characters:', charactersError)
      return NextResponse.json(
        { error: 'Failed to fetch characters', success: false },
        { status: 500 }
      )
    }

    // Transform data to match Character interface
    const transformedCharacters = characters.map(char => ({
      id: char.id,
      name: char.metadata?.name || 'Personnage sans nom',
      description: char.original_prompt,
      prompt: char.optimized_prompt,
      image_url: char.image_url,
      traits: char.metadata?.traits || [],
      style: char.metadata?.style || 'shonen',
      created_at: char.created_at,
      metadata: char.metadata
    }))

    return NextResponse.json({
      success: true,
      characters: transformedCharacters
    })

  } catch (error) {
    console.error('Get characters error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}
