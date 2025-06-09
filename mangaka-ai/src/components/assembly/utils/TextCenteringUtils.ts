import { Text, TextStyle } from 'pixi.js'

/**
 * ✅ UTILITAIRES DE CENTRAGE UNIVERSEL POUR LES TEXTES
 * Système de centrage qui fonctionne parfaitement pour toutes les tailles de bulles
 */

export interface CenteringResult {
  success: boolean
  centeringError: { x: number, y: number }
  textBounds: { x: number, y: number, width: number, height: number }
  textCenter: { x: number, y: number }
  bubbleCenter: { x: number, y: number }
}

/**
 * ✅ FONCTION DE CENTRAGE UNIVERSEL
 * Applique un centrage parfait qui fonctionne pour toutes les tailles de bulles
 */
export function applyCenteringUniversal(
  textElement: Text, 
  bubbleWidth: number, 
  bubbleHeight: number,
  debug: boolean = false
): CenteringResult {
  
  if (debug) {
    console.log('🎯 DÉBUT centrage universel:', {
      bubbleSize: { width: bubbleWidth, height: bubbleHeight },
      textContent: textElement.text.substring(0, 50) + (textElement.text.length > 50 ? '...' : '')
    })
  }

  // ✅ ÉTAPE 1 : FORCER LE RECALCUL DES BOUNDS APRÈS WRAPPING
  // CRUCIAL pour que PixiJS recalcule correctement les dimensions
  textElement.getBounds()
  
  // ✅ ÉTAPE 2 : APPLIQUER L'ANCHOR AU CENTRE
  textElement.anchor.set(0.5, 0.5)
  
  // ✅ ÉTAPE 3 : POSITIONNER AU CENTRE EXACT DE LA BULLE
  textElement.x = bubbleWidth / 2
  textElement.y = bubbleHeight / 2
  
  // ✅ ÉTAPE 4 : FORCER UN NOUVEAU RECALCUL APRÈS POSITIONNEMENT
  const finalBounds = textElement.getBounds()
  
  // ✅ ÉTAPE 5 : VALIDATION DU CENTRAGE
  const bubbleCenter = { x: bubbleWidth / 2, y: bubbleHeight / 2 }
  const textCenter = { 
    x: finalBounds.x + finalBounds.width / 2, 
    y: finalBounds.y + finalBounds.height / 2 
  }
  
  const centeringError = {
    x: Math.abs(textCenter.x - bubbleCenter.x),
    y: Math.abs(textCenter.y - bubbleCenter.y)
  }
  
  if (debug) {
    console.log('🎯 Centrage universel appliqué:', {
      bubbleCenter,
      textPosition: { x: textElement.x, y: textElement.y },
      textBounds: finalBounds,
      textCenter,
      centeringError,
      isPerfectlyCentered: centeringError.x < 1 && centeringError.y < 1,
      anchor: textElement.anchor,
      wrapWidth: textElement.style.wordWrapWidth
    })
  }
  
  // ✅ CORRECTION AUTOMATIQUE SI NÉCESSAIRE
  if (centeringError.x > 1 || centeringError.y > 1) {
    if (debug) {
      console.log('⚠️ Correction du centrage nécessaire')
    }
    
    // Recalculer la position pour compenser l'erreur
    textElement.x = bubbleWidth / 2 - (textCenter.x - bubbleCenter.x)
    textElement.y = bubbleHeight / 2 - (textCenter.y - bubbleCenter.y)
    
    const correctedBounds = textElement.getBounds()
    const correctedCenter = { 
      x: correctedBounds.x + correctedBounds.width / 2, 
      y: correctedBounds.y + correctedBounds.height / 2 
    }
    
    const finalError = {
      x: Math.abs(correctedCenter.x - bubbleCenter.x),
      y: Math.abs(correctedCenter.y - bubbleCenter.y)
    }
    
    if (debug) {
      console.log('✅ Centrage corrigé:', {
        newPosition: { x: textElement.x, y: textElement.y },
        correctedCenter,
        finalError
      })
    }
    
    return {
      success: finalError.x < 1 && finalError.y < 1,
      centeringError: finalError,
      textBounds: correctedBounds,
      textCenter: correctedCenter,
      bubbleCenter
    }
  }
  
  return {
    success: centeringError.x < 1 && centeringError.y < 1,
    centeringError,
    textBounds: finalBounds,
    textCenter,
    bubbleCenter
  }
}

/**
 * ✅ CALCUL INTELLIGENT DE LA LARGEUR DE WRAPPING
 * Fonction unifiée pour tous les composants
 */
export function calculateOptimalWrapWidth(bubbleWidth: number, bubbleHeight: number): number {
  // Marges dynamiques basées sur la taille de la bulle
  let horizontalPadding: number
  
  if (bubbleWidth <= 120) {
    horizontalPadding = 10 // Très petites bulles : marges minimales
  } else if (bubbleWidth <= 200) {
    horizontalPadding = 15 // Petites bulles : marges réduites
  } else if (bubbleWidth <= 300) {
    horizontalPadding = 20 // Bulles moyennes : marges standard
  } else if (bubbleWidth <= 400) {
    horizontalPadding = 25 // Grandes bulles : marges confortables
  } else {
    horizontalPadding = 30 // Très grandes bulles : marges généreuses
  }

  // Calculer la largeur disponible
  const availableWidth = Math.max(60, bubbleWidth - (horizontalPadding * 2))

  return availableWidth
}

/**
 * ✅ CRÉATION D'UN STYLE DE TEXTE OPTIMAL POUR LE CENTRAGE
 */
export function createOptimalTextStyle(
  fontSize: number,
  fontFamily: string,
  textColor: string,
  bubbleWidth: number,
  bubbleHeight: number
): TextStyle {
  const wrapWidth = calculateOptimalWrapWidth(bubbleWidth, bubbleHeight)
  
  return new TextStyle({
    fontSize,
    fontFamily,
    fill: textColor,
    align: 'center',
    wordWrap: true,
    wordWrapWidth: wrapWidth,
    breakWords: true,
    lineHeight: fontSize * 1.2
  })
}

/**
 * ✅ VALIDATION DU CENTRAGE
 * Vérifie si un texte est correctement centré dans une bulle
 */
export function validateCentering(
  textElement: Text,
  bubbleWidth: number,
  bubbleHeight: number,
  tolerance: number = 2
): boolean {
  const textBounds = textElement.getBounds()
  const bubbleCenter = { x: bubbleWidth / 2, y: bubbleHeight / 2 }
  const textCenter = { 
    x: textBounds.x + textBounds.width / 2, 
    y: textBounds.y + textBounds.height / 2 
  }
  
  const error = {
    x: Math.abs(textCenter.x - bubbleCenter.x),
    y: Math.abs(textCenter.y - bubbleCenter.y)
  }
  
  return error.x <= tolerance && error.y <= tolerance
}
