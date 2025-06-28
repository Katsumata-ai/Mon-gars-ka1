import { ImageResponse } from 'next/og'

// Génération dynamique de l'image Open Graph
export const alt = 'MANGAKA AI - Create manga without knowing how to draw'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0f172a',
          backgroundImage: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
        }}
      >
        {/* Logo/Title */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '40px',
          }}
        >
          <div
            style={{
              fontSize: '72px',
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              backgroundClip: 'text',
              color: 'transparent',
              letterSpacing: '-2px',
            }}
          >
            MANGAKA AI
          </div>
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: '32px',
            color: '#e2e8f0',
            textAlign: 'center',
            maxWidth: '800px',
            lineHeight: '1.2',
            marginBottom: '30px',
          }}
        >
          Create manga without knowing how to draw
        </div>

        {/* Description */}
        <div
          style={{
            fontSize: '20px',
            color: '#94a3b8',
            textAlign: 'center',
            maxWidth: '600px',
            lineHeight: '1.4',
          }}
        >
          The AI that transforms your ideas into professional manga stories
        </div>

        {/* Decorative elements */}
        <div
          style={{
            position: 'absolute',
            top: '50px',
            right: '50px',
            width: '100px',
            height: '100px',
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            borderRadius: '20px',
            opacity: 0.3,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '50px',
            left: '50px',
            width: '80px',
            height: '80px',
            background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
            borderRadius: '15px',
            opacity: 0.2,
          }}
        />
      </div>
    ),
    {
      ...size,
    }
  )
}
