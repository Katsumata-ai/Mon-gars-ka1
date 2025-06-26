import { useCallback, useMemo } from 'react'
import { useCanvasContext } from '../components/assembly/context/CanvasContext'

/**
 * 🎯 HOOK UNIFIÉ POUR LES TRANSFORMATIONS DE COORDONNÉES
 * 
 * Ce hook centralise toutes les transformations de coordonnées pour garantir
 * la cohérence entre les systèmes Konva (panels) et HTML (bulles/textes).
 * 
 * PRINCIPE :
 * - Source unique de vérité depuis CanvasContext
 * - Même logique de transformation que Konva
 * - Élimination des incohérences de scale/pan
 */

export interface CanvasTransform {
  /** Niveau de zoom en pourcentage (ex: 45) */
  zoomLevel: number
  /** Échelle calculée (ex: 0.45) */
  canvasScale: number
  /** Translation X du canvas */
  panX: number
  /** Translation Y du canvas */
  panY: number
  /** Convertit coordonnées DOM vers coordonnées Canvas */
  domToCanvas: (x: number, y: number) => { x: number; y: number }
  /** Convertit coordonnées Canvas vers coordonnées DOM */
  canvasToDOM: (x: number, y: number) => { x: number; y: number }
}

/**
 * Hook principal pour les transformations de coordonnées
 * Utilise les props passées aux couches HTML
 *
 * @param canvasTransformProp - Transformation du canvas passée en prop
 * @param zoomLevelProp - Niveau de zoom passé en prop
 * @returns Objet contenant toutes les valeurs et fonctions de transformation
 */
export const useCanvasTransform = (
  canvasTransformProp?: { x: number; y: number; scale?: number },
  zoomLevelProp?: number
): CanvasTransform => {
  const { zoom: contextZoom } = useCanvasContext()

  // Utiliser les props si disponibles, sinon fallback sur le contexte
  const zoomLevel = zoomLevelProp ?? contextZoom
  const panX = canvasTransformProp?.x ?? 0
  const panY = canvasTransformProp?.y ?? 0

  // ✅ CALCUL UNIFIÉ : Priorité au scale de canvasTransform, sinon calculer depuis zoomLevel
  const canvasScale = useMemo(() => {
    // Si canvasTransformProp a un scale, l'utiliser directement
    if (canvasTransformProp?.scale !== undefined) {

      return canvasTransformProp.scale
    }
    // Sinon, calculer depuis zoomLevel
    const calculatedScale = zoomLevel / 100

    return calculatedScale
  }, [canvasTransformProp?.scale, zoomLevel])

  // ✅ CONVERSION DOM → CANVAS : Même logique que Konva
  const domToCanvas = useCallback((x: number, y: number) => {
    console.log('🔄 useCanvasTransform domToCanvas:', {
      input: { x, y },
      transform: { panX, panY, canvasScale },
      output: {
        x: (x - panX) / canvasScale,
        y: (y - panY) / canvasScale
      }
    })

    return {
      x: (x - panX) / canvasScale,
      y: (y - panY) / canvasScale
    }
  }, [panX, panY, canvasScale])

  // ✅ CONVERSION CANVAS → DOM : Pour positionnement HTML
  const canvasToDOM = useCallback((x: number, y: number) => {
    const result = {
      x: x * canvasScale + panX,
      y: y * canvasScale + panY
    }

    console.log('🔄 useCanvasTransform canvasToDOM:', {
      input: { x, y },
      transform: { panX, panY, canvasScale },
      output: result
    })

    return result
  }, [panX, panY, canvasScale])

  return {
    zoomLevel,
    canvasScale,
    panX,
    panY,
    domToCanvas,
    canvasToDOM
  }
}

/**
 * 🎯 HOOK SPÉCIALISÉ POUR LA CRÉATION D'ÉLÉMENTS
 *
 * Simplifie la création d'éléments en fournissant directement
 * les coordonnées canvas à partir d'un clic DOM.
 */
export const useElementCreation = (
  canvasTransformProp?: { x: number; y: number; scale?: number },
  zoomLevelProp?: number
) => {
  const { domToCanvas } = useCanvasTransform(canvasTransformProp, zoomLevelProp)

  const createElementAtPosition = useCallback((
    domX: number,
    domY: number,
    elementWidth: number = 0,
    elementHeight: number = 0
  ) => {
    const canvasCoords = domToCanvas(domX, domY)

    // Centrer l'élément sur la position de clic
    return {
      x: canvasCoords.x - elementWidth / 2,
      y: canvasCoords.y - elementHeight / 2
    }
  }, [domToCanvas])

  return { createElementAtPosition }
}

/**
 * 🎯 HOOK SPÉCIALISÉ POUR LE POSITIONNEMENT HTML
 * 
 * Simplifie le positionnement des éléments HTML en fournissant
 * directement les styles CSS calculés.
 */
export const useHTMLPositioning = () => {
  const { canvasToDOM } = useCanvasTransform()

  const getElementStyle = useCallback((
    canvasX: number, 
    canvasY: number, 
    additionalStyles: React.CSSProperties = {}
  ): React.CSSProperties => {
    const domCoords = canvasToDOM(canvasX, canvasY)
    
    return {
      position: 'absolute',
      left: `${domCoords.x}px`,
      top: `${domCoords.y}px`,
      ...additionalStyles
    }
  }, [canvasToDOM])

  return { getElementStyle }
}
