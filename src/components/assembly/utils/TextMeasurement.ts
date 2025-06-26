// Utilitaires pour mesurer et calculer les dimensions de texte de manière précise
// Optimisé pour les bulles de dialogue manga

export interface TextMetrics {
  width: number
  height: number
  lines: string[]
  lineCount: number
  actualBoundingBoxAscent: number
  actualBoundingBoxDescent: number
}

export interface BubbleTextConfig {
  text: string
  fontSize: number
  fontFamily: string
  fontWeight?: string
  fontStyle?: string
  maxWidth?: number
  lineHeight?: number
  padding?: number
}

export interface BubbleSizeResult {
  width: number
  height: number
  textMetrics: TextMetrics
  recommendedFontSize?: number
}

// Cache pour optimiser les mesures répétées
const measurementCache = new Map<string, TextMetrics>()

// Canvas invisible pour les mesures précises
let measurementCanvas: HTMLCanvasElement | null = null
let measurementContext: CanvasRenderingContext2D | null = null

function getMeasurementContext(): CanvasRenderingContext2D {
  if (!measurementCanvas) {
    measurementCanvas = document.createElement('canvas')
    measurementCanvas.width = 1000
    measurementCanvas.height = 1000
    measurementContext = measurementCanvas.getContext('2d')!
  }
  return measurementContext!
}

/**
 * Mesure précise du texte avec support multi-lignes
 */
export function measureText(config: BubbleTextConfig): TextMetrics {
  const {
    text,
    fontSize,
    fontFamily,
    fontWeight = 'normal',
    fontStyle = 'normal',
    maxWidth = 300,
    lineHeight = 1.4
  } = config

  // Clé de cache
  const cacheKey = `${text}-${fontSize}-${fontFamily}-${fontWeight}-${fontStyle}-${maxWidth}`
  if (measurementCache.has(cacheKey)) {
    return measurementCache.get(cacheKey)!
  }

  const ctx = getMeasurementContext()
  ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`

  // Diviser le texte en lignes selon la largeur max
  const words = text.split(' ')
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word
    const testWidth = ctx.measureText(testLine).width

    if (testWidth <= maxWidth || !currentLine) {
      currentLine = testLine
    } else {
      lines.push(currentLine)
      currentLine = word
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  // Si pas de texte, ajouter une ligne vide pour les calculs
  if (lines.length === 0) {
    lines.push('')
  }

  // Mesurer la largeur maximale réelle
  let maxLineWidth = 0
  for (const line of lines) {
    const lineWidth = ctx.measureText(line).width
    maxLineWidth = Math.max(maxLineWidth, lineWidth)
  }

  // Mesurer les métriques détaillées sur la première ligne
  const firstLineMetrics = ctx.measureText(lines[0] || 'M')
  const actualLineHeight = fontSize * lineHeight

  const result: TextMetrics = {
    width: maxLineWidth,
    height: lines.length * actualLineHeight,
    lines,
    lineCount: lines.length,
    actualBoundingBoxAscent: firstLineMetrics.actualBoundingBoxAscent || fontSize * 0.8,
    actualBoundingBoxDescent: firstLineMetrics.actualBoundingBoxDescent || fontSize * 0.2
  }

  // Mettre en cache
  measurementCache.set(cacheKey, result)
  return result
}

/**
 * Calcule la taille optimale d'une bulle selon son contenu
 */
export function calculateOptimalBubbleSize(config: BubbleTextConfig): BubbleSizeResult {
  const {
    text,
    fontSize,
    fontFamily,
    padding = 20,
    maxWidth = 300
  } = config

  // Mesurer le texte
  const textMetrics = measureText(config)

  // Contraintes de taille pour les bulles manga
  const minWidth = 80
  const minHeight = 50
  const maxBubbleWidth = 350
  const maxBubbleHeight = 200

  // Calculer la taille de la bulle avec padding
  let bubbleWidth = Math.max(textMetrics.width + padding, minWidth)
  let bubbleHeight = Math.max(textMetrics.height + padding, minHeight)

  // Appliquer les contraintes maximales
  bubbleWidth = Math.min(bubbleWidth, maxBubbleWidth)
  bubbleHeight = Math.min(bubbleHeight, maxBubbleHeight)

  // Si le texte dépasse, suggérer une taille de police plus petite
  let recommendedFontSize: number | undefined
  if (textMetrics.width + padding > maxBubbleWidth || textMetrics.height + padding > maxBubbleHeight) {
    // Calculer la réduction nécessaire
    const widthRatio = maxBubbleWidth / (textMetrics.width + padding)
    const heightRatio = maxBubbleHeight / (textMetrics.height + padding)
    const reductionRatio = Math.min(widthRatio, heightRatio)
    
    recommendedFontSize = Math.floor(fontSize * reductionRatio * 0.9) // 10% de marge
  }

  return {
    width: Math.round(bubbleWidth),
    height: Math.round(bubbleHeight),
    textMetrics,
    recommendedFontSize
  }
}

/**
 * Calcule la taille adaptative selon le type de bulle
 */
export function calculateBubbleSizeByType(
  config: BubbleTextConfig,
  bubbleType: 'speech' | 'thought' | 'shout' | 'whisper' | 'explosion'
): BubbleSizeResult {
  const baseResult = calculateOptimalBubbleSize(config)

  // Ajustements selon le type de bulle
  switch (bubbleType) {
    case 'thought':
      // Les bulles de pensée sont généralement plus rondes
      const maxDimension = Math.max(baseResult.width, baseResult.height)
      return {
        ...baseResult,
        width: maxDimension,
        height: maxDimension
      }

    case 'shout':
      // Les bulles de cri sont plus grandes et plus dynamiques
      return {
        ...baseResult,
        width: Math.round(baseResult.width * 1.2),
        height: Math.round(baseResult.height * 1.1)
      }

    case 'whisper':
      // Les bulles de chuchotement sont plus petites
      return {
        ...baseResult,
        width: Math.round(baseResult.width * 0.9),
        height: Math.round(baseResult.height * 0.9)
      }

    case 'explosion':
      // Les bulles d'explosion sont irrégulières mais plus grandes
      return {
        ...baseResult,
        width: Math.round(baseResult.width * 1.3),
        height: Math.round(baseResult.height * 1.2)
      }

    case 'speech':
    default:
      return baseResult
  }
}

/**
 * Nettoie le cache de mesures (à appeler périodiquement)
 */
export function clearMeasurementCache(): void {
  measurementCache.clear()
}

/*[FR-UNTRANSLATED: *
 * Estime si le texte nécessite un redimensionnement de bulle]
 */
export function shouldResizeBubble(
  currentSize: { width: number; height: number },
  newTextConfig: BubbleTextConfig,
  tolerance: number = 20
): boolean {
  const optimalSize = calculateOptimalBubbleSize(newTextConfig)
  
  const widthDiff = Math.abs(currentSize.width - optimalSize.width)
  const heightDiff = Math.abs(currentSize.height - optimalSize.height)
  
  return widthDiff > tolerance || heightDiff > tolerance
}
