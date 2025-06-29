import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Lire le fichier SVG
    const svgPath = path.join(process.cwd(), 'public', 'og-image.svg')
    const svgContent = fs.readFileSync(svgPath, 'utf-8')
    
    // Retourner le SVG avec les bons headers
    return new NextResponse(svgContent, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Erreur lors du chargement de l\'image OG:', error)
    return new NextResponse('Image not found', { status: 404 })
  }
}
