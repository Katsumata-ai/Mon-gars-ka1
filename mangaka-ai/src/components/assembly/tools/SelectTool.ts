import { AssemblyElement, ImageElement } from '../types/assembly.types'
import { Container, Application } from 'pixi.js'

/**
 * Interface pour les handles de redimensionnement
 */
export interface ResizeHandle {
  id: string
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' |
            'top-center' | 'bottom-center' | 'middle-left' | 'middle-right'
  x: number
  y: number
  cursor: string
}

/**
 * Interface pour l'état de sélection
 */
interface SelectionState {
  selectedElementId: string | null
  isDragging: boolean
  isResizing: boolean
  dragStartX: number
  dragStartY: number
  resizeHandle: string | null
  originalBounds: {
    x: number
    y: number
    width: number
    height: number
  } | null
}

/**
 * Outil de sélection et manipulation des éléments
 */
export class SelectTool {
  private state: SelectionState = {
    selectedElementId: null,
    isDragging: false,
    isResizing: false,
    dragStartX: 0,
    dragStartY: 0,
    resizeHandle: null,
    originalBounds: null
  }

  private onElementSelect?: (elementId: string | null) => void
  private onElementUpdate?: (elementId: string, updates: Partial<AssemblyElement>) => void
  private stageContainerRef?: Container | null
  private canvasElement: HTMLCanvasElement | null = null
  private panelContentService?: any // Service pour les associations panel-image

  constructor(
    onElementSelect?: (elementId: string | null) => void,
    onElementUpdate?: (elementId: string, updates: Partial<AssemblyElement>) => void,
    panelContentService?: any
  ) {
    this.onElementSelect = onElementSelect
    this.onElementUpdate = onElementUpdate
    this.panelContentService = panelContentService
  }

  /**
   * Définit la référence au conteneur du stage pour accéder aux objets PixiJS
   */
  setStageContainer(stageContainer: Container | null): void {
    this.stageContainerRef = stageContainer
  }

  /**
   * Définit la référence au canvas HTML pour changer le curseur
   */
  setCanvasElement(canvas: HTMLCanvasElement | null): void {
    this.canvasElement = canvas
  }

  /**
   * Met à jour le curseur du canvas avec optimisation et debugging
   */
  private updateCursor(cursor: string): void {
    if (!this.canvasElement) {
      console.warn('⚠️ SelectTool: canvasElement non défini pour updateCursor')
      return
    }

    // Éviter les changements inutiles de curseur
    const currentCursor = this.canvasElement.style.cursor
    if (currentCursor === cursor) {
      return // Pas de changement nécessaire
    }

    console.log('🖱️ Changement de curseur:', {
      from: currentCursor || 'undefined',
      to: cursor,
      context: this.getCursorContext()
    })

    this.canvasElement.style.cursor = cursor
  }

  /**
   * Obtient le contexte actuel pour le debugging du curseur
   */
  private getCursorContext(): string {
    if (this.state.isDragging) return 'dragging'
    if (this.state.isResizing) return 'resizing'
    if (this.state.selectedElementId) return 'element-selected'
    return 'idle'
  }

  /**
   * Gère le clic pour sélectionner un élément avec priorité pour les images dans les panels
   */
  handlePointerDown(x: number, y: number, elements: AssemblyElement[]): boolean {
    console.log('🎯 SelectTool handlePointerDown:', { x, y, elementsCount: elements.length })

    // Séparer les éléments par type pour une sélection intelligente
    const images = elements.filter(el => el.type === 'image')
    const panels = elements.filter(el => el.type === 'panel')
    const otherElements = elements.filter(el => el.type !== 'image' && el.type !== 'panel')

    // 🎯 SÉLECTION INTELLIGENTE AVEC DISTINCTION PANEL/IMAGE

    // 1. D'abord, vérifier si on clique sur les handles d'un élément déjà sélectionné
    if (this.state.selectedElementId) {
      const selectedElement = elements.find(el => el.id === this.state.selectedElementId)
      if (selectedElement) {
        const handle = this.getResizeHandleAt(x, y, selectedElement)
        if (handle) {
          console.log('🎯 Clic sur handle de l\'élément sélectionné:', handle.position)
          return this.handleElementSelection(x, y, selectedElement)
        }
      }
    }

    // 2. Vérifier les images (priorité haute, mais avec logique spéciale)
    const sortedImages = [...images].sort((a, b) => b.transform.zIndex - a.transform.zIndex)
    for (const image of sortedImages) {
      if (this.isPointInElement(x, y, image)) {
        // Vérifier si on clique près du bord de l'image (zone panel)
        const imageElement = image as ImageElement
        const parentPanelId = imageElement.metadata?.parentPanelId

        if (parentPanelId) {
          const parentPanel = panels.find(p => p.id === parentPanelId)
          if (parentPanel && this.isNearPanelBorder(x, y, image, parentPanel)) {
            console.log('📦 Clic près du bord - sélection du panel parent:', parentPanel.id)
            return this.handleElementSelection(x, y, parentPanel)
          }
        }

        console.log('🖼️ Image trouvée sous le curseur:', image.id)
        return this.handleElementSelection(x, y, image)
      }
    }

    // 3. Vérifier les autres éléments (dialogue, text, etc.)
    const sortedOthers = [...otherElements].sort((a, b) => b.transform.zIndex - a.transform.zIndex)
    for (const element of sortedOthers) {
      if (this.isPointInElement(x, y, element)) {
        console.log('🎯 Autre élément trouvé sous le curseur:', element.id)
        return this.handleElementSelection(x, y, element)
      }
    }

    // 4. Enfin, vérifier les panels (priorité basse)
    const sortedPanels = [...panels].sort((a, b) => b.transform.zIndex - a.transform.zIndex)
    for (const panel of sortedPanels) {
      if (this.isPointInElement(x, y, panel)) {
        console.log('📦 Panel trouvé sous le curseur:', panel.id)
        return this.handleElementSelection(x, y, panel)
      }
    }

    // Aucun élément trouvé, désélectionner
    console.log('❌ Aucun élément trouvé, désélection')
    this.selectElement(null)
    return true // Retourner true pour indiquer que l'événement a été traité
  }

  /**
   * Gère la sélection d'un élément spécifique
   */
  private handleElementSelection(x: number, y: number, element: AssemblyElement): boolean {
    // Vérifier si l'élément est déjà sélectionné
    if (this.state.selectedElementId === element.id) {
      console.log('🔄 Élément déjà sélectionné, vérification des handles de resize')

      // Vérifier si on clique sur un handle de redimensionnement
      const resizeHandle = this.getResizeHandleAt(x, y, element)
      if (resizeHandle) {
        console.log('🎯 Handle de resize détecté:', resizeHandle.position)
        this.prepareResize(x, y, element, resizeHandle.position)
      } else {
        console.log('🔄 Préparation pour drag')
        // L'élément est déjà sélectionné, préparer pour le drag
        this.prepareDrag(x, y, element)
      }
    } else {
      console.log('🆕 Nouveau élément sélectionné:', element.id)
      // Nouvel élément, le sélectionner et préparer pour le drag
      this.selectElement(element.id)
      this.prepareDrag(x, y, element)
    }
    return true
  }

  /**
   * Gère le déplacement de la souris avec logique de curseur cohérente
   */
  handlePointerMove(x: number, y: number, elements: AssemblyElement[]): void {
    // Si on a préparé une action mais qu'elle n'a pas encore commencé, la démarrer maintenant
    if (this.state.originalBounds && !this.state.isDragging && !this.state.isResizing) {
      const deltaX = Math.abs(x - this.state.dragStartX)
      const deltaY = Math.abs(y - this.state.dragStartY)

      // Démarrer l'action seulement si on a bougé de plus de 3 pixels (évite les clics accidentels)
      if (deltaX > 3 || deltaY > 3) {
        if (this.state.resizeHandle) {
          console.log('🚀 Démarrage du resize après mouvement, handle:', this.state.resizeHandle)
          this.state.isResizing = true
        } else {
          console.log('🚀 Démarrage du drag après mouvement')
          this.state.isDragging = true
        }
      }
    }

    // 🎯 GESTION DES ACTIONS EN COURS
    if (this.state.isDragging && this.state.selectedElementId) {
      this.updateDrag(x, y, elements)
      // Pendant le drag, garder le curseur move
      this.updateCursor('move')
      return
    }

    if (this.state.isResizing && this.state.selectedElementId) {
      this.updateResize(x, y, elements)
      // Pendant le resize, garder le curseur de resize approprié
      if (this.state.resizeHandle) {
        const selectedElement = elements.find(el => el.id === this.state.selectedElementId)
        if (selectedElement) {
          const handles = this.getResizeHandles(selectedElement)
          const handle = handles.find(h => h.position === this.state.resizeHandle)
          if (handle) {
            this.updateCursor(handle.cursor)
          }
        }
      }
      return
    }

    // 🎯 GESTION DU CURSEUR SELON LE CONTEXTE
    this.updateCursorBasedOnContext(x, y, elements)
  }

  /**
   * Met à jour le curseur selon le contexte actuel (logique centralisée)
   */
  private updateCursorBasedOnContext(x: number, y: number, elements: AssemblyElement[]): void {
    // 1. PRIORITÉ HAUTE : Handles de l'élément sélectionné
    if (this.state.selectedElementId) {
      const selectedElement = elements.find(el => el.id === this.state.selectedElementId)
      if (selectedElement) {
        const handle = this.getResizeHandleAt(x, y, selectedElement)
        if (handle) {
          console.log('🎯 Curseur handle:', handle.cursor, 'pour handle:', handle.position)
          this.updateCursor(handle.cursor)
          return
        }

        // 2. PRIORITÉ MOYENNE : Élément sélectionné lui-même
        if (this.isPointInElement(x, y, selectedElement)) {
          this.updateCursor('move')
          return
        }
      }
    }

    // 3. PRIORITÉ BASSE : Autres éléments survolés
    const hoveredElement = this.findElementUnderCursor(x, y, elements)
    if (hoveredElement) {
      this.updateCursor('move')
      return
    }

    // 4. DÉFAUT : Aucun élément interactif
    this.updateCursor('default')
  }

  /**
   * Trouve l'élément sous le curseur (pour le survol) avec même logique de priorité que la sélection
   */
  private findElementUnderCursor(x: number, y: number, elements: AssemblyElement[]): AssemblyElement | null {
    // Séparer les éléments par type pour une détection intelligente (même logique que handlePointerDown)
    const images = elements.filter(el => el.type === 'image')
    const panels = elements.filter(el => el.type === 'panel')
    const otherElements = elements.filter(el => el.type !== 'image' && el.type !== 'panel')

    // 1. D'abord, vérifier les images (priorité haute)
    const sortedImages = [...images].sort((a, b) => b.transform.zIndex - a.transform.zIndex)
    for (const image of sortedImages) {
      if (this.isPointInElement(x, y, image)) {
        // Vérifier si on survole près du bord de l'image (zone panel)
        const imageElement = image as ImageElement
        const parentPanelId = imageElement.metadata?.parentPanelId

        if (parentPanelId) {
          const parentPanel = panels.find(p => p.id === parentPanelId)
          if (parentPanel && this.isNearPanelBorder(x, y, image, parentPanel)) {
            console.log('🖱️ Survol près du bord - curseur pour panel parent:', parentPanel.id)
            return parentPanel
          }
        }

        console.log('🖱️ Survol d\'image:', image.id)
        return image
      }
    }

    // 2. Ensuite, vérifier les autres éléments (dialogue, text, etc.)
    const sortedOthers = [...otherElements].sort((a, b) => b.transform.zIndex - a.transform.zIndex)
    for (const element of sortedOthers) {
      if (this.isPointInElement(x, y, element)) {
        console.log('🖱️ Survol d\'autre élément:', element.id)
        return element
      }
    }

    // 3. Enfin, vérifier les panels (priorité basse)
    const sortedPanels = [...panels].sort((a, b) => b.transform.zIndex - a.transform.zIndex)
    for (const panel of sortedPanels) {
      if (this.isPointInElement(x, y, panel)) {
        console.log('🖱️ Survol de panel:', panel.id)
        return panel
      }
    }

    return null
  }

  /**
   * Gère le relâchement de la souris
   */
  handlePointerUp(): void {
    console.log('👆 SelectTool handlePointerUp - état avant:', {
      isDragging: this.state.isDragging,
      isResizing: this.state.isResizing,
      selectedElementId: this.state.selectedElementId
    })

    // Nettoyer l'état de drag/resize mais garder la sélection
    this.state.isDragging = false
    this.state.isResizing = false
    this.state.resizeHandle = null
    this.state.originalBounds = null

    // Réinitialiser le curseur après les actions
    this.updateCursor('default')

    console.log('✅ SelectTool état nettoyé, sélection maintenue:', this.state.selectedElementId)
  }

  /**
   * Gère la sortie du curseur du canvas (réinitialise le curseur)
   */
  handlePointerLeave(): void {
    console.log('🚪 Curseur sorti du canvas - réinitialisation')
    this.updateCursor('default')
  }

  /**
   * Sélectionne un élément
   */
  private selectElement(elementId: string | null): void {
    // Éviter les appels inutiles si l'élément est déjà sélectionné
    if (this.state.selectedElementId === elementId) {
      console.log('🔄 SelectTool: Élément déjà sélectionné, ignoré:', elementId)
      return
    }

    console.log('🎯 SelectTool: Changement de sélection:', {
      from: this.state.selectedElementId,
      to: elementId
    })

    this.state.selectedElementId = elementId
    this.onElementSelect?.(elementId)
  }

  /**
   * Prépare le glissement d'un élément (ne démarre pas immédiatement)
   */
  private prepareDrag(x: number, y: number, element: AssemblyElement): void {
    console.log('🎯 Préparation du drag pour:', element.id)
    // Ne pas démarrer le drag immédiatement, juste stocker les informations
    this.state.isDragging = false // Important : ne pas démarrer le drag tout de suite
    this.state.isResizing = false
    this.state.resizeHandle = null
    this.state.dragStartX = x
    this.state.dragStartY = y
    this.state.originalBounds = {
      x: element.transform.x,
      y: element.transform.y,
      width: element.transform.width || 0,
      height: element.transform.height || 0
    }
    console.log('✅ Drag préparé, bounds originales:', this.state.originalBounds)
  }

  /**
   * Prépare le redimensionnement d'un élément
   */
  private prepareResize(x: number, y: number, element: AssemblyElement, handlePosition: string): void {
    console.log('🎯 Préparation du resize pour:', element.id, 'handle:', handlePosition)
    this.state.isDragging = false
    this.state.isResizing = false // Ne pas démarrer le resize immédiatement
    this.state.resizeHandle = handlePosition
    this.state.dragStartX = x
    this.state.dragStartY = y
    this.state.originalBounds = {
      x: element.transform.x,
      y: element.transform.y,
      width: element.transform.width || 0,
      height: element.transform.height || 0
    }
    console.log('✅ Resize préparé, handle:', handlePosition, 'bounds:', this.state.originalBounds)
  }

  /**
   * Met à jour le glissement avec gestion des associations panel-image
   */
  private updateDrag(x: number, y: number, elements: AssemblyElement[]): void {
    if (!this.state.selectedElementId || !this.state.originalBounds) return

    // Trouver l'élément actuel pour préserver ses propriétés
    const currentElement = elements.find(el => el.id === this.state.selectedElementId)
    if (!currentElement) return

    const deltaX = x - this.state.dragStartX
    const deltaY = y - this.state.dragStartY

    const newX = this.state.originalBounds.x + deltaX
    const newY = this.state.originalBounds.y + deltaY

    // Optimisation : ne mettre à jour que si le déplacement est significatif (> 1px)
    const currentX = currentElement.transform.x
    const currentY = currentElement.transform.y

    if (Math.abs(newX - currentX) < 1 && Math.abs(newY - currentY) < 1) {
      return // Éviter les micro-mises à jour
    }

    // 🔗 GESTION DES ASSOCIATIONS PANEL-IMAGE
    if (currentElement.type === 'panel' && this.panelContentService) {
      // Si on déplace un panel, déplacer aussi les images associées
      const associatedImageIds = this.panelContentService.getImagesForPanel(currentElement.id)

      if (associatedImageIds && associatedImageIds.length > 0) {
        console.log('🔗 Déplacement du panel avec images associées:', {
          panelId: currentElement.id,
          imageIds: associatedImageIds,
          delta: { x: newX - currentX, y: newY - currentY }
        })

        // Déplacer chaque image associée avec le même delta que le panel
        const deltaXPanel = newX - currentX
        const deltaYPanel = newY - currentY

        associatedImageIds.forEach((imageId: string) => {
          const imageElement = elements.find(el => el.id === imageId && el.type === 'image') as ImageElement
          if (imageElement) {
            this.onElementUpdate?.(imageId, {
              transform: {
                ...imageElement.transform,
                x: Math.round(imageElement.transform.x + deltaXPanel),
                y: Math.round(imageElement.transform.y + deltaYPanel)
              }
            } as Partial<AssemblyElement>)
          }
        })
      }
    } else if (currentElement.type === 'image' && this.panelContentService) {
      // Si on déplace une image, vérifier si elle est unifiée avec un panel
      const imageElement = currentElement as ImageElement
      const parentPanelId = imageElement.metadata?.parentPanelId
      const isUnified = imageElement.metadata?.isUnifiedWithPanel

      if (parentPanelId && isUnified) {
        const parentPanel = elements.find(el => el.id === parentPanelId && el.type === 'panel')
        if (parentPanel) {
          console.log('🎯 Déplacement unifié : Image et panel ensemble', {
            imageId: imageElement.id,
            panelId: parentPanel.id,
            newPosition: { x: newX, y: newY }
          })

          // Calculer le déplacement
          const imageDeltaX = newX - currentElement.transform.x
          const imageDeltaY = newY - currentElement.transform.y

          // Déplacer le panel avec le même delta que l'image
          this.onElementUpdate?.(parentPanel.id, {
            transform: {
              ...parentPanel.transform,
              x: Math.round(parentPanel.transform.x + imageDeltaX),
              y: Math.round(parentPanel.transform.y + imageDeltaY)
            }
          } as Partial<AssemblyElement>)

          // Mettre à jour l'image pour qu'elle suive le panel
          this.onElementUpdate?.(this.state.selectedElementId, {
            transform: {
              ...currentElement.transform,
              x: Math.round(newX),
              y: Math.round(newY)
            }
          } as Partial<AssemblyElement>)

          return
        }
      }

      // 🔒 COMPORTEMENT NORMAL pour images non-unifiées : Contraindre dans les limites du panel
      if (parentPanelId && !isUnified) {
        const parentPanel = elements.find(el => el.id === parentPanelId && el.type === 'panel')
        if (parentPanel) {
          const constrainedX = Math.max(
            parentPanel.transform.x,
            Math.min(newX, parentPanel.transform.x + parentPanel.transform.width - imageElement.transform.width)
          )
          const constrainedY = Math.max(
            parentPanel.transform.y,
            Math.min(newY, parentPanel.transform.y + parentPanel.transform.height - imageElement.transform.height)
          )

          console.log('🔒 Contraintes appliquées à l\'image non-unifiée:', {
            imageId: imageElement.id,
            parentPanelId,
            original: { x: newX, y: newY },
            constrained: { x: constrainedX, y: constrainedY }
          })

          this.onElementUpdate?.(this.state.selectedElementId, {
            transform: {
              ...currentElement.transform,
              x: Math.round(constrainedX),
              y: Math.round(constrainedY)
            }
          } as Partial<AssemblyElement>)
          return
        }
      }
    }

    // Mise à jour normale de l'élément
    this.onElementUpdate?.(this.state.selectedElementId, {
      transform: {
        ...currentElement.transform, // Préserver toutes les propriétés existantes
        x: Math.round(newX), // Arrondir pour éviter les positions fractionnaires
        y: Math.round(newY)
      }
    } as Partial<AssemblyElement>)
  }

  /**
   * Met à jour le redimensionnement
   */
  private updateResize(x: number, y: number, elements: AssemblyElement[]): void {
    if (!this.state.selectedElementId || !this.state.originalBounds || !this.state.resizeHandle) return

    const deltaX = x - this.state.dragStartX
    const deltaY = y - this.state.dragStartY

    let newX = this.state.originalBounds.x
    let newY = this.state.originalBounds.y
    let newWidth = this.state.originalBounds.width
    let newHeight = this.state.originalBounds.height

    // Calculer les nouvelles dimensions selon le handle
    switch (this.state.resizeHandle) {
      case 'top-left':
        newX += deltaX
        newY += deltaY
        newWidth -= deltaX
        newHeight -= deltaY
        break
      case 'top-right':
        newY += deltaY
        newWidth += deltaX
        newHeight -= deltaY
        break
      case 'bottom-left':
        newX += deltaX
        newWidth -= deltaX
        newHeight += deltaY
        break
      case 'bottom-right':
        newWidth += deltaX
        newHeight += deltaY
        break
      case 'top-center':
        newY += deltaY
        newHeight -= deltaY
        break
      case 'bottom-center':
        newHeight += deltaY
        break
      case 'middle-left':
        newX += deltaX
        newWidth -= deltaX
        break
      case 'middle-right':
        newWidth += deltaX
        break
    }

    // Taille minimale
    newWidth = Math.max(20, newWidth)
    newHeight = Math.max(20, newHeight)

    // Trouver l'élément actuel pour préserver ses propriétés
    const currentElement = elements.find(el => el.id === this.state.selectedElementId)
    if (!currentElement) return

    // 🎯 REDIMENSIONNEMENT UNIFIÉ POUR LES IMAGES UNIFIÉES
    if (currentElement.type === 'image' && this.panelContentService) {
      const imageElement = currentElement as ImageElement
      const parentPanelId = imageElement.metadata?.parentPanelId
      const isUnified = imageElement.metadata?.isUnifiedWithPanel

      if (parentPanelId && isUnified) {
        const parentPanel = elements.find(el => el.id === parentPanelId && el.type === 'panel')
        if (parentPanel) {
          console.log('🎯 Redimensionnement unifié : Image et panel ensemble', {
            imageId: imageElement.id,
            panelId: parentPanel.id,
            newBounds: { x: newX, y: newY, width: newWidth, height: newHeight }
          })

          // Redimensionner le panel avec les mêmes dimensions que l'image
          this.onElementUpdate?.(parentPanel.id, {
            transform: {
              ...parentPanel.transform,
              x: Math.round(newX),
              y: Math.round(newY),
              width: Math.round(newWidth),
              height: Math.round(newHeight)
            }
          } as Partial<AssemblyElement>)

          // Mettre à jour l'image pour qu'elle reste synchronisée
          this.onElementUpdate?.(this.state.selectedElementId, {
            transform: {
              ...currentElement.transform,
              x: Math.round(newX),
              y: Math.round(newY),
              width: Math.round(newWidth),
              height: Math.round(newHeight)
            }
          } as Partial<AssemblyElement>)

          return
        }
      }

      // 🔒 CONTRAINTES POUR LES IMAGES NON-UNIFIÉES
      if (parentPanelId && !isUnified) {
        const parentPanel = elements.find(el => el.id === parentPanelId && el.type === 'panel')
        if (parentPanel) {
          // Contraindre la taille et position de l'image dans les limites du panel
          const panelBounds = {
            x: parentPanel.transform.x,
            y: parentPanel.transform.y,
            width: parentPanel.transform.width,
            height: parentPanel.transform.height
          }

          // Contraindre la position pour que l'image reste dans le panel
          newX = Math.max(panelBounds.x, Math.min(newX, panelBounds.x + panelBounds.width - newWidth))
          newY = Math.max(panelBounds.y, Math.min(newY, panelBounds.y + panelBounds.height - newHeight))

          // Contraindre la taille pour que l'image ne dépasse pas le panel
          const maxWidth = panelBounds.x + panelBounds.width - newX
          const maxHeight = panelBounds.y + panelBounds.height - newY
          newWidth = Math.min(newWidth, maxWidth)
          newHeight = Math.min(newHeight, maxHeight)

          console.log('🔒 Contraintes de redimensionnement appliquées à l\'image non-unifiée:', {
            imageId: imageElement.id,
            parentPanelId,
            panelBounds,
            constrainedBounds: { x: newX, y: newY, width: newWidth, height: newHeight }
          })
        }
      }
    }

    // 🎯 REDIMENSIONNEMENT UNIFIÉ DES IMAGES ASSOCIÉES POUR LES PANELS
    if (currentElement.type === 'panel' && this.panelContentService) {
      const associatedImageIds = this.panelContentService.getImagesForPanel(currentElement.id)

      if (associatedImageIds && associatedImageIds.length > 0) {
        console.log('🎯 Redimensionnement du panel avec images associées:', {
          panelId: currentElement.id,
          imageIds: associatedImageIds,
          newPanelBounds: { x: newX, y: newY, width: newWidth, height: newHeight }
        })

        // Redimensionner chaque image associée
        associatedImageIds.forEach((imageId: string) => {
          const imageElement = elements.find(el => el.id === imageId && el.type === 'image') as ImageElement
          if (imageElement) {
            const isUnified = imageElement.metadata?.isUnifiedWithPanel

            if (isUnified) {
              // Image unifiée : redimensionner à 100% du panel
              console.log('🎯 Redimensionnement unifié de l\'image:', imageId)
              this.onElementUpdate?.(imageId, {
                transform: {
                  ...imageElement.transform,
                  x: Math.round(newX),
                  y: Math.round(newY),
                  width: Math.round(newWidth),
                  height: Math.round(newHeight)
                }
              } as Partial<AssemblyElement>)
            } else {
              // Image non-unifiée : adapter intelligemment
              this.adaptImageToPanel(imageElement, { x: newX, y: newY, width: newWidth, height: newHeight })
            }
          }
        })
      }
    }

    console.log('🔄 updateResize:', {
      elementId: this.state.selectedElementId,
      newBounds: { x: newX, y: newY, width: newWidth, height: newHeight },
      preservedTransform: currentElement.transform
    })

    // Préserver toutes les propriétés de transform, ne changer que position et taille
    this.onElementUpdate?.(this.state.selectedElementId, {
      transform: {
        ...currentElement.transform, // Préserver toutes les propriétés existantes
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight
      }
    } as Partial<AssemblyElement>)
  }

  /**
   * Vérifie si un clic est près du bord d'un panel (pour faciliter la sélection du panel)
   */
  private isNearPanelBorder(x: number, y: number, image: AssemblyElement, panel: AssemblyElement): boolean {
    const borderThreshold = 15 // Pixels près du bord pour considérer comme clic sur panel

    const imageTransform = image.transform
    const panelTransform = panel.transform

    // Vérifier si on est près des bords du panel
    const nearLeftBorder = x <= panelTransform.x + borderThreshold
    const nearRightBorder = x >= panelTransform.x + panelTransform.width - borderThreshold
    const nearTopBorder = y <= panelTransform.y + borderThreshold
    const nearBottomBorder = y >= panelTransform.y + panelTransform.height - borderThreshold

    const isNearBorder = nearLeftBorder || nearRightBorder || nearTopBorder || nearBottomBorder

    if (isNearBorder) {
      console.log('🎯 Clic près du bord du panel détecté:', {
        point: { x, y },
        panelBounds: panelTransform,
        borders: { left: nearLeftBorder, right: nearRightBorder, top: nearTopBorder, bottom: nearBottomBorder }
      })
    }

    return isNearBorder
  }

  /**
   * Adapte une image aux nouvelles dimensions d'un panel
   */
  private adaptImageToPanel(imageElement: ImageElement, newPanelBounds: { x: number, y: number, width: number, height: number }): void {
    const currentImageBounds = imageElement.transform

    // Vérifier si l'image dépasse les nouvelles limites du panel
    const imageRight = currentImageBounds.x + currentImageBounds.width
    const imageBottom = currentImageBounds.y + currentImageBounds.height
    const panelRight = newPanelBounds.x + newPanelBounds.width
    const panelBottom = newPanelBounds.y + newPanelBounds.height

    let newImageX = currentImageBounds.x
    let newImageY = currentImageBounds.y
    let newImageWidth = currentImageBounds.width
    let newImageHeight = currentImageBounds.height

    // Si l'image dépasse à droite ou en bas, la redimensionner
    if (imageRight > panelRight || imageBottom > panelBottom) {
      // Calculer les nouvelles dimensions en gardant les proportions
      const maxWidth = panelRight - currentImageBounds.x
      const maxHeight = panelBottom - currentImageBounds.y

      // Redimensionner proportionnellement
      const scaleX = maxWidth / currentImageBounds.width
      const scaleY = maxHeight / currentImageBounds.height
      const scale = Math.min(scaleX, scaleY, 1) // Ne pas agrandir, seulement réduire

      newImageWidth = currentImageBounds.width * scale
      newImageHeight = currentImageBounds.height * scale

      console.log('📐 Image redimensionnée pour rester dans le panel:', {
        imageId: imageElement.id,
        originalSize: { width: currentImageBounds.width, height: currentImageBounds.height },
        newSize: { width: newImageWidth, height: newImageHeight },
        scale
      })
    }

    // Si l'image est maintenant hors des limites du panel, la repositionner
    if (newImageX < newPanelBounds.x) newImageX = newPanelBounds.x
    if (newImageY < newPanelBounds.y) newImageY = newPanelBounds.y

    // Mettre à jour l'image si nécessaire
    if (newImageX !== currentImageBounds.x ||
        newImageY !== currentImageBounds.y ||
        newImageWidth !== currentImageBounds.width ||
        newImageHeight !== currentImageBounds.height) {

      this.onElementUpdate?.(imageElement.id, {
        transform: {
          ...imageElement.transform,
          x: Math.round(newImageX),
          y: Math.round(newImageY),
          width: Math.round(newImageWidth),
          height: Math.round(newImageHeight)
        }
      } as Partial<AssemblyElement>)

      console.log('🔄 Image adaptée aux nouvelles dimensions du panel:', {
        imageId: imageElement.id,
        newBounds: { x: newImageX, y: newImageY, width: newImageWidth, height: newImageHeight }
      })
    }
  }

  /**
   * Vérifie si une image remplit la majorité de l'espace de son panel parent (90% ou plus)
   */
  private isImageFillingPanel(imageElement: ImageElement, parentPanel: AssemblyElement): boolean {
    const imageArea = imageElement.transform.width * imageElement.transform.height
    const panelArea = parentPanel.transform.width * parentPanel.transform.height

    const occupationPercentage = (imageArea / panelArea) * 100

    console.log('📐 Vérification occupation image dans panel:', {
      imageId: imageElement.id,
      panelId: parentPanel.id,
      imageArea,
      panelArea,
      occupationPercentage: Math.round(occupationPercentage)
    })

    return occupationPercentage >= 90
  }



  /**
   * Obtient l'objet PixiJS réel depuis le stage
   */
  private getPixiElementFromStage(elementId: string): Container | null {
    if (!this.stageContainerRef) {
      console.warn('⚠️ SelectTool: stageContainerRef non défini')
      return null
    }

    // Chercher dans toutes les couches
    const layerOrder = ['background', 'characters', 'panels', 'dialogue', 'ui']

    for (const layerName of layerOrder) {
      const layerContainer = this.stageContainerRef.getChildByName(`${layerName}Layer`) as Container
      if (layerContainer) {
        const pixiElement = layerContainer.getChildByName(elementId) as Container
        if (pixiElement) {
          return pixiElement
        }
      }
    }

    return null
  }

  /**
   * Vérifie si un point est dans un élément en utilisant les bounds PixiJS réels
   */
  private isPointInElement(x: number, y: number, element: AssemblyElement): boolean {
    // Utiliser d'abord les coordonnées du state React (plus fiables)
    const { transform } = element
    const width = transform.width || 0
    const height = transform.height || 0

    // Ajouter une petite tolérance pour améliorer la détection
    const tolerance = 2

    const isInsideReactBounds = x >= (transform.x - tolerance) &&
                               x <= (transform.x + width + tolerance) &&
                               y >= (transform.y - tolerance) &&
                               y <= (transform.y + height + tolerance)

    console.log('🔍 Test collision avec coordonnées React:', {
      point: { x, y },
      element: {
        id: element.id,
        reactBounds: {
          x: transform.x,
          y: transform.y,
          width,
          height
        },
        withTolerance: {
          x: transform.x - tolerance,
          y: transform.y - tolerance,
          width: width + (tolerance * 2),
          height: height + (tolerance * 2)
        }
      },
      isInside: isInsideReactBounds
    })

    // Si la détection React fonctionne, l'utiliser
    if (isInsideReactBounds) {
      return true
    }

    // Fallback : essayer avec les bounds PixiJS si disponible
    const pixiElement = this.getPixiElementFromStage(element.id)
    if (pixiElement) {
      try {
        // Utiliser getLocalBounds() pour éviter les transformations du parent
        const localBounds = pixiElement.getLocalBounds()
        const boundsRect = localBounds.rectangle || localBounds

        // Convertir en coordonnées globales
        const globalPos = pixiElement.toGlobal({ x: boundsRect.x, y: boundsRect.y })

        const isInsidePixiBounds = x >= globalPos.x &&
                                  x <= globalPos.x + boundsRect.width &&
                                  y >= globalPos.y &&
                                  y <= globalPos.y + boundsRect.height

        console.log('🔍 Test collision fallback PixiJS:', {
          point: { x, y },
          element: {
            id: element.id,
            localBounds: {
              x: boundsRect.x,
              y: boundsRect.y,
              width: boundsRect.width,
              height: boundsRect.height
            },
            globalBounds: {
              x: globalPos.x,
              y: globalPos.y,
              width: boundsRect.width,
              height: boundsRect.height
            }
          },
          isInside: isInsidePixiBounds
        })

        return isInsidePixiBounds
      } catch (error) {
        console.warn('⚠️ Erreur lors du calcul des bounds PixiJS:', error)
      }
    }

    // Si tout échoue, retourner false
    console.warn('⚠️ Impossible de déterminer la collision pour:', element.id)
    return false
  }

  /**
   * Génère les handles de redimensionnement pour l'élément sélectionné avec taille adaptée
   */
  getResizeHandles(element: AssemblyElement): ResizeHandle[] {
    const { x, y, width = 0, height = 0 } = element.transform

    // Taille des handles adaptée selon le type d'élément
    const handleSize = element.type === 'panel' ? 12 : 10 // Panels plus gros pour meilleure visibilité

    // Offset pour placer les handles à l'extérieur de l'élément pour les panels
    const offset = element.type === 'panel' ? 2 : 0

    return [
      { id: 'top-left', position: 'top-left', x: x - handleSize/2 - offset, y: y - handleSize/2 - offset, cursor: 'nw-resize' },
      { id: 'top-center', position: 'top-center', x: x + width/2 - handleSize/2, y: y - handleSize/2 - offset, cursor: 'n-resize' },
      { id: 'top-right', position: 'top-right', x: x + width - handleSize/2 + offset, y: y - handleSize/2 - offset, cursor: 'ne-resize' },
      { id: 'middle-left', position: 'middle-left', x: x - handleSize/2 - offset, y: y + height/2 - handleSize/2, cursor: 'w-resize' },
      { id: 'middle-right', position: 'middle-right', x: x + width - handleSize/2 + offset, y: y + height/2 - handleSize/2, cursor: 'e-resize' },
      { id: 'bottom-left', position: 'bottom-left', x: x - handleSize/2 - offset, y: y + height - handleSize/2 + offset, cursor: 'sw-resize' },
      { id: 'bottom-center', position: 'bottom-center', x: x + width/2 - handleSize/2, y: y + height - handleSize/2 + offset, cursor: 's-resize' },
      { id: 'bottom-right', position: 'bottom-right', x: x + width - handleSize/2 + offset, y: y + height - handleSize/2 + offset, cursor: 'se-resize' }
    ]
  }

  /**
   * Détecte si un point est sur un handle de redimensionnement avec zone de détection adaptée
   */
  private getResizeHandleAt(x: number, y: number, element: AssemblyElement): ResizeHandle | null {
    const handles = this.getResizeHandles(element)

    // Taille des handles et tolérance adaptées selon le type d'élément
    const handleSize = element.type === 'panel' ? 12 : 10
    const tolerance = element.type === 'panel' ? 25 : 20 // Plus grande zone pour les panels

    for (const handle of handles) {
      if (x >= handle.x - tolerance &&
          x <= handle.x + handleSize + tolerance &&
          y >= handle.y - tolerance &&
          y <= handle.y + handleSize + tolerance) {
        console.log('🎯 Handle détecté:', handle.position, 'à la position:', { x, y }, 'type:', element.type)
        return handle
      }
    }

    return null
  }

  /**
   * Obtient l'élément actuellement sélectionné
   */
  get selectedElementId(): string | null {
    return this.state.selectedElementId
  }

  /**
   * Vérifie si l'outil est en cours d'utilisation
   */
  get isActive(): boolean {
    return this.state.isDragging || this.state.isResizing
  }

  /**
   * Désélectionne l'élément actuel
   */
  clearSelection(): void {
    if (this.state.selectedElementId) {
      console.log('🧹 Nettoyage de la sélection pour:', this.state.selectedElementId)
      this.selectElement(null)
    }
    this.state.isDragging = false
    this.state.isResizing = false
    this.state.resizeHandle = null
    this.state.originalBounds = null
  }

  /**
   * Nettoie les ressources
   */
  destroy(): void {
    this.clearSelection()
  }
}

/**
 * Hook pour utiliser l'outil de sélection
 */
export function useSelectTool(
  onElementSelect?: (elementId: string | null) => void,
  onElementUpdate?: (elementId: string, updates: Partial<AssemblyElement>) => void,
  panelContentService?: any
) {
  const tool = new SelectTool(onElementSelect, onElementUpdate, panelContentService)

  return {
    handlePointerDown: tool.handlePointerDown.bind(tool),
    handlePointerMove: tool.handlePointerMove.bind(tool),
    handlePointerUp: tool.handlePointerUp.bind(tool),
    handlePointerLeave: tool.handlePointerLeave.bind(tool),
    getResizeHandles: tool.getResizeHandles.bind(tool),
    clearSelection: tool.clearSelection.bind(tool),
    setStageContainer: tool.setStageContainer.bind(tool),
    setCanvasElement: tool.setCanvasElement.bind(tool),
    selectedElementId: tool.selectedElementId,
    isActive: tool.isActive,
    destroy: tool.destroy.bind(tool)
  }
}
