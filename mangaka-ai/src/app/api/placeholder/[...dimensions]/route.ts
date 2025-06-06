import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { dimensions: string[] } }
) {
  try {
    const [width, height] = params.dimensions
    const w = parseInt(width) || 150
    const h = parseInt(height) || 150

    // Créer un SVG placeholder simple
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#374151"/>
        <rect x="10%" y="10%" width="80%" height="80%" fill="#4B5563" rx="8"/>
        <text x="50%" y="50%" text-anchor="middle" dy="0.3em" fill="#9CA3AF" font-family="Arial, sans-serif" font-size="14">
          ${w}×${h}
        </text>
      </svg>
    `

    return new NextResponse(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000'
      }
    })
  } catch (error) {
    console.error('Erreur génération placeholder:', error)
    return NextResponse.json({ error: 'Erreur génération placeholder' }, { status: 500 })
  }
}
