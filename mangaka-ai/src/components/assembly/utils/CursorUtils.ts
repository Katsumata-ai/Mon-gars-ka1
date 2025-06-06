// Utilitaires pour les curseurs personnalisés selon l'outil actif

/**
 * Obtient le curseur CSS approprié selon l'outil actif
 */
export function getCursorForTool(tool: string): string {
  switch (tool) {
    case 'select':
      return 'default'
    
    case 'panel':
      return 'crosshair'
    
    case 'dialogue':
      return 'copy'
    
    case 'text':
      return 'text'
    
    case 'zoom':
      return 'zoom-in'
    
    case 'pan':
      return 'grab'
    
    case 'move':
      return 'move'
    
    default:
      return 'default'
  }
}

/**
 * Obtient le curseur pendant une interaction
 */
export function getCursorForInteraction(tool: string, isInteracting: boolean): string {
  if (!isInteracting) {
    return getCursorForTool(tool)
  }

  switch (tool) {
    case 'panel':
      return 'crosshair'
    
    case 'pan':
      return 'grabbing'
    
    case 'move':
      return 'grabbing'
    
    case 'zoom':
      return 'zoom-in'
    
    default:
      return getCursorForTool(tool)
  }
}

/**
 * Curseurs personnalisés avec SVG pour des outils spécifiques
 */
export const CustomCursors = {
  /**
   * Curseur pour l'outil panel (croix avec carré)
   */
  panel: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 2v20M2 12h20' stroke='%23ef4444' stroke-width='2'/%3E%3Crect x='8' y='8' width='8' height='8' fill='none' stroke='%23ef4444' stroke-width='1'/%3E%3C/svg%3E") 12 12, crosshair`,

  /**
   * Curseur pour l'outil bulle (croix avec bulle)
   */
  dialogue: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M12 2v20M2 12h20' stroke='%23ef4444' stroke-width='1'/%3E%3Cellipse cx='12' cy='10' rx='6' ry='4' fill='none' stroke='%23ef4444' stroke-width='1.5'/%3E%3Cpath d='M9 14l-2 3 3-1' fill='%23ef4444'/%3E%3C/svg%3E") 12 12, copy`,

  /**
   * Curseur pour l'outil zoom
   */
  zoom: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Ccircle cx='11' cy='11' r='8' fill='none' stroke='%23ef4444' stroke-width='2'/%3E%3Cpath d='M21 21l-4.35-4.35'/%3E%3Cpath d='M11 8v6M8 11h6' stroke='%23ef4444' stroke-width='2'/%3E%3C/svg%3E") 12 12, zoom-in`,

  /**
   * Curseur pour l'outil déplacement
   */
  pan: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'%3E%3Cpath d='M9 12l2 2 4-4' stroke='none'/%3E%3Cpath d='M12 2v20M2 12h20' stroke='%23ef4444' stroke-width='1'/%3E%3Cpath d='M8 8l4 4 4-4M8 16l4-4 4 4' stroke='%23ef4444' stroke-width='1.5' fill='none'/%3E%3C/svg%3E") 12 12, grab`,

  /**
   * Curseur pour le redimensionnement
   */
  resize: {
    nw: 'nw-resize',
    n: 'n-resize',
    ne: 'ne-resize',
    e: 'e-resize',
    se: 'se-resize',
    s: 's-resize',
    sw: 'sw-resize',
    w: 'w-resize'
  }
}

/**
 * Applique un curseur personnalisé à un élément
 */
export function applyCursor(element: HTMLElement, tool: string, isInteracting = false): void {
  const cursor = getCursorForInteraction(tool, isInteracting)
  element.style.cursor = cursor
}

/**
 * Applique un curseur personnalisé SVG
 */
export function applyCustomCursor(element: HTMLElement, tool: string): void {
  const customCursor = CustomCursors[tool as keyof typeof CustomCursors]
  
  if (typeof customCursor === 'string') {
    element.style.cursor = customCursor
  } else {
    element.style.cursor = getCursorForTool(tool)
  }
}

/**
 * Remet le curseur par défaut
 */
export function resetCursor(element: HTMLElement): void {
  element.style.cursor = 'default'
}

/**
 * Hook pour gérer les curseurs automatiquement
 */
export function useCursor(tool: string, isInteracting = false) {
  const cursor = getCursorForInteraction(tool, isInteracting)
  
  React.useEffect(() => {
    document.body.style.cursor = cursor
    
    return () => {
      document.body.style.cursor = 'default'
    }
  }, [cursor])
  
  return cursor
}

/**
 * Utilitaires pour les curseurs de redimensionnement
 */
export const ResizeCursors = {
  /**
   * Obtient le curseur de redimensionnement selon la position
   */
  getResizeCursor(position: string): string {
    const cursors: Record<string, string> = {
      'top-left': 'nw-resize',
      'top': 'n-resize',
      'top-right': 'ne-resize',
      'right': 'e-resize',
      'bottom-right': 'se-resize',
      'bottom': 's-resize',
      'bottom-left': 'sw-resize',
      'left': 'w-resize'
    }
    
    return cursors[position] || 'default'
  },

  /**
   * Obtient le curseur de redimensionnement selon l'angle
   */
  getResizeCursorByAngle(angle: number): string {
    // Normaliser l'angle entre 0 et 360
    const normalizedAngle = ((angle % 360) + 360) % 360
    
    if (normalizedAngle >= 337.5 || normalizedAngle < 22.5) return 'e-resize'
    if (normalizedAngle >= 22.5 && normalizedAngle < 67.5) return 'se-resize'
    if (normalizedAngle >= 67.5 && normalizedAngle < 112.5) return 's-resize'
    if (normalizedAngle >= 112.5 && normalizedAngle < 157.5) return 'sw-resize'
    if (normalizedAngle >= 157.5 && normalizedAngle < 202.5) return 'w-resize'
    if (normalizedAngle >= 202.5 && normalizedAngle < 247.5) return 'nw-resize'
    if (normalizedAngle >= 247.5 && normalizedAngle < 292.5) return 'n-resize'
    if (normalizedAngle >= 292.5 && normalizedAngle < 337.5) return 'ne-resize'
    
    return 'default'
  }
}

// Import React pour le hook
import React from 'react'
