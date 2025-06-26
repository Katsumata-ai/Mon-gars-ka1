// Queue Migration Utility - Convert legacy queue properties to enhanced queue system
// Provides backward compatibility and smooth transition

import { DialogueElement, QueueConfiguration } from '../types/assembly.types'

/**
 * Migrates legacy queue properties to enhanced queue configuration
 */
export function migrateLegacyQueue(element: DialogueElement): DialogueElement {
  const { dialogueStyle } = element
  
  // If already has enhanced queue, return as-is
  if (dialogueStyle.queue) {
    return element
  }

  // Convert legacy properties to enhanced queue
  const legacyAngle = dialogueStyle.tailAngleDegrees || 225
  const legacyLength = dialogueStyle.tailLength || 30
  const legacyPosition = dialogueStyle.tailPosition || 'bottom-left'

  // Convert legacy position to angle if no angle specified
  let angle = legacyAngle
  if (!dialogueStyle.tailAngleDegrees && dialogueStyle.tailPosition) {
    angle = convertPositionToAngle(legacyPosition)
  }

  // Determine queue style based on bubble type
  const queueStyle = getQueueStyleForBubbleType(dialogueStyle.type)

  // Create enhanced queue configuration
  const enhancedQueue: QueueConfiguration = {
    angle: angle,
    length: Math.max(20, legacyLength), // Ensure minimum length
    thickness: getThicknessForBubbleType(dialogueStyle.type),
    style: queueStyle,
    seamlessConnection: true,
    isManipulating: false,
    showHandles: false,
    snapToCardinal: false,
    curvature: queueStyle === 'curved' ? 0.3 : 0,
    tapering: queueStyle === 'triangle' ? 0.2 : 0
  }

  // Return migrated element
  return {
    ...element,
    dialogueStyle: {
      ...dialogueStyle,
      queue: enhancedQueue
    }
  }
}

/**
 * Convert legacy position string to angle in degrees
 */
function convertPositionToAngle(position: string): number {
  const positionAngles: Record<string, number> = {
    'top-left': 135,
    'top-right': 45,
    'bottom-left': 225,
    'bottom-right': 315,
    'top': 90,
    'bottom': 270,
    'left': 180,
    'right': 0
  }

  return positionAngles[position] || 225 // Default to bottom-left
}

/**
 * Get appropriate queue style for bubble type
 */
function getQueueStyleForBubbleType(bubbleType: string): 'triangle' | 'curved' | 'jagged' | 'thin' {
  switch (bubbleType) {
    case 'speech':
      return 'triangle'
    case 'thought':
      return 'curved'
    case 'shout':
      return 'triangle' // Pas de queue pour les cris
    case 'whisper':
      return 'thin'
    case 'explosion':
      return 'triangle' // Won't be rendered anyway
    default:
      return 'triangle'
  }
}

/**
 * Get appropriate thickness for bubble type
 */
function getThicknessForBubbleType(bubbleType: string): number {
  switch (bubbleType) {
    case 'speech':
      return 20
    case 'thought':
      return 16
    case 'shout':
      return 25
    case 'whisper':
      return 12
    case 'explosion':
      return 20
    default:
      return 20
  }
}

/**
 * Batch migrate multiple elements
 */
export function migrateLegacyQueues(elements: DialogueElement[]): DialogueElement[] {
  return elements.map(migrateLegacyQueue)
}

/**
 * Check if element needs migration
 */
export function needsMigration(element: DialogueElement): boolean {
  return !element.dialogueStyle.queue && (
    element.dialogueStyle.tailPosition !== undefined ||
    element.dialogueStyle.tailAngleDegrees !== undefined ||
    element.dialogueStyle.tailLength !== undefined
  )
}

/**
 * Get default queue configuration for new bubbles
 */
export function getDefaultQueueConfig(bubbleType: string = 'speech'): QueueConfiguration {
  // Pas de queue pour les bulles de cri et explosion
  if (bubbleType === 'shout' || bubbleType === 'explosion') {
    return {
      angle: 225,
      length: 0, // [FR-UNTRANSLATED: Longueur 0 pour masquer la queue]
      thickness: 0,
      style: 'triangle',
      seamlessConnection: true,
      isManipulating: false,
      showHandles: false,
      snapToCardinal: false,
      curvature: 0,
      tapering: 0
    }
  }

  return {
    angle: 225, // Bottom-left default
    length: 40,
    thickness: getThicknessForBubbleType(bubbleType),
    style: getQueueStyleForBubbleType(bubbleType),
    seamlessConnection: true,
    isManipulating: false,
    showHandles: false,
    snapToCardinal: false,
    curvature: getQueueStyleForBubbleType(bubbleType) === 'curved' ? 0.3 : 0,
    tapering: getQueueStyleForBubbleType(bubbleType) === 'triangle' ? 0.2 : 0
  }
}
