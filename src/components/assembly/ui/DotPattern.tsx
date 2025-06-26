'use client'

import React from 'react'

/**
 * Composant pour créer un motif de points décoratifs subtils
 * Similaire aux interfaces professionnelles comme Figma/Adobe
 */
export const DotPattern: React.FC<{
  size?: number
  spacing?: number
  opacity?: number
  color?: string
  className?: string
}> = ({
  size = 1.5,
  spacing = 24,
  opacity = 0.15,
  color = '#ffffff',
  className = ''
}) => {
  // Créer l'ID unique pour le pattern
  const patternId = `dot-pattern-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
          <svg width="${spacing}" height="${spacing}" xmlns="http://www.w3.org/2000/svg">
            <circle 
              cx="${spacing / 2}" 
              cy="${spacing / 2}" 
              r="${size}" 
              fill="${color}" 
              opacity="${opacity}"
            />
          </svg>
        `)}")`,
        backgroundRepeat: 'repeat',
        backgroundPosition: '0 0'
      }}
    />
  )
}

/**
 * Pattern SVG inline pour une performance optimale
 */
export const InlineDotPattern: React.FC<{
  size?: number
  spacing?: number
  opacity?: number
  color?: string
  className?: string
}> = ({
  size = 1.5,
  spacing = 24,
  opacity = 0.15,
  color = '#ffffff',
  className = ''
}) => {
  const patternId = `inline-dot-pattern-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={`absolute inset-0 pointer-events-none ${className}`}>
      <svg 
        className="absolute inset-0 w-full h-full"
        style={{ 
          width: '100%', 
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      >
        <defs>
          <pattern
            id={patternId}
            x="0"
            y="0"
            width={spacing}
            height={spacing}
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx={spacing / 2}
              cy={spacing / 2}
              r={size}
              fill={color}
              opacity={opacity}
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill={`url(#${patternId})`}
        />
      </svg>
    </div>
  )
}

/**
 * Version CSS pure pour performance maximale
 */
export const CssDotPattern: React.FC<{
  size?: number
  spacing?: number
  opacity?: number
  color?: string
  className?: string
}> = ({
  size = 1.5,
  spacing = 24,
  opacity = 0.15,
  color = '#ffffff',
  className = ''
}) => {
  // [FR-UNTRANSLATED: Convertir la couleur hex en rgba pour l'opacité]
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  const dotColor = color.startsWith('#') ? hexToRgba(color, opacity) : color

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{
        backgroundImage: `radial-gradient(circle at center, ${dotColor} ${size}px, transparent ${size}px)`,
        backgroundSize: `${spacing}px ${spacing}px`,
        backgroundPosition: '0 0',
        backgroundRepeat: 'repeat'
      }}
    />
  )
}

export default DotPattern
