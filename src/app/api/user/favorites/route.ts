import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
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

    // Get user favorites
    const { data: favorites, error: favoritesError } = await supabase
      .from('user_favorites')
      .select('item_id')
      .eq('user_id', user.id)

    if (favoritesError) {
      console.error('Error fetching favorites:', favoritesError)
      return NextResponse.json(
        { error: 'Failed to fetch favorites', success: false },
        { status: 500 }
      )
    }

    const favoriteIds = favorites.map(fav => fav.item_id)

    return NextResponse.json({
      success: true,
      favorites: favoriteIds
    })

  } catch (error) {
    console.error('Get favorites error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
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

    const { imageId, type } = await request.json()

    if (!imageId) {
      return NextResponse.json(
        { error: 'Missing imageId', success: false },
        { status: 400 }
      )
    }

    // Add to favorites
    const { error: insertError } = await supabase
      .from('user_favorites')
      .insert({
        user_id: user.id,
        item_id: imageId,
        item_type: type || 'character'
      })

    if (insertError) {
      console.error('Error adding favorite:', insertError)
      return NextResponse.json(
        { error: 'Failed to add favorite', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Added to favorites'
    })

  } catch (error) {
    console.error('Add favorite error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
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

    const { imageId } = await request.json()

    if (!imageId) {
      return NextResponse.json(
        { error: 'Missing imageId', success: false },
        { status: 400 }
      )
    }

    // Remove from favorites
    const { error: deleteError } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('item_id', imageId)

    if (deleteError) {
      console.error('Error removing favorite:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove favorite', success: false },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Removed from favorites'
    })

  } catch (error) {
    console.error('Remove favorite error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
        success: false
      },
      { status: 500 }
    )
  }
}
