// Gestionnaire de sélection unifié pour coordonner PixiJS et DOM
// Gère la priorité des speech bubbles et la synchronisation des sélections

import { Application, Container, FederatedPointerEvent } from 'pixi.js'
import { AssemblyElement, DialogueElement } from '../types/assembly.types'
import { UnifiedCoordinateSystem } from './CoordinateSystem'

export interface SelectionTarget {
  type: 'bubble' | 'panel' | 'image' | 'canvas'
  id: string | null
  element?: AssemblyElement
  layer: 'dom' | 'pixi'
}

export interface SelectionState {
  selectedElements: Set<string>
  activeElement: string | null
  selectionMode: 'single' | 'multiple'
  isEditing: boolean
  editingElementId: string | null
}

/**
 * Gestionnaire de sélection unifié qui coordonne les interactions
 * entre les éléments PixiJS et DOM avec priorité aux speech bubbles
 */
export class UnifiedSelectionManager {
  private static instance: UnifiedSelectionManager | null = null
  
  private pixiApp: Application | null = null
  private coordinateSystem: UnifiedCoordinateSystem | null = null
  private elements: AssemblyElement[] = []
  
  private state: SelectionState = {
    selectedElements: new Set(),
    activeElement: null,
    selectionMode: 'single',
    isEditing: false,
    editingElementId: null
  }
  
  private callbacks = {
    onSelectionChange: [] as Array<(selectedIds: string[]) => void>,
    onEditStart: [] as Array<(elementId: string) => void>,
    onEditEnd: [] as Array<(elementId: string) => void>
  }

  private constructor() {
    this.setupGlobalEventListeners()
  }

  /**
   * ✅ SINGLETON PATTERN
   */
  static getInstance(): UnifiedSelectionManager {
    if (!UnifiedSelectionManager.instance) {
      UnifiedSelectionManager.instance = new UnifiedSelectionManager()
    }
    return UnifiedSelectionManager.instance
  }

  /**
   * ✅ INITIALISATION
   */
  initialize(
    pixiApp: Application,
    coordinateSystem: UnifiedCoordinateSystem,
    elements: AssemblyElement[]
  ) {
    this.pixiApp = pixiApp
    this.coordinateSystem = coordinateSystem
    this.elements = elements
    
    console.log('🎯 UnifiedSelectionManager initialized')
  }

  /**
   * ✅ MISE À JOUR DES ÉLÉMENTS
   */
  updateElements(elements: AssemblyElement[]) {
    this.elements = elements
  }

  /**
   * ✅ GESTION DES CLICS GLOBAUX
   * Priorité : Bulles DOM > Éléments PixiJS > Canvas
   */
  handleGlobalClick(event: MouseEvent | FederatedPointerEvent): void {
    const target = this.identifyTarget(event)
    
    console.log('🖱️ Global click detected:', target)
    
    // Si on est en mode édition, vérifier si on sort de l'édition
    if (this.state.isEditing) {
      if (target.type !== 'bubble' || target.id !== this.state.editingElementId) {
        this.exitEditMode()
      }
    }
    
    // Sélectionner le nouvel élément
    if (target.id) {
      this.selectElement(target.id, target.layer)
    } else {
      this.clearSelection()
    }
  }

  /**
   * ✅ IDENTIFICATION DE LA CIBLE
   * Priorité : Bulles DOM > Éléments PixiJS > Canvas
   */
  private identifyTarget(event: MouseEvent | FederatedPointerEvent): SelectionTarget {
    // 1. PRIORITÉ HAUTE : Vérifier les bulles DOM
    const bubbleTarget = this.findBubbleTarget(event)
    if (bubbleTarget) {
      return bubbleTarget
    }
    
    // 2. PRIORITÉ MOYENNE : Vérifier les éléments PixiJS
    const pixiTarget = this.findPixiTarget(event)
    if (pixiTarget) {
      return pixiTarget
    }
    
    // 3. PRIORITÉ BASSE : Canvas vide
    return { type: 'canvas', id: null, layer: 'pixi' }
  }

  /**
   * ✅ RECHERCHE DE BULLES DOM
   */
  private findBubbleTarget(event: MouseEvent | FederatedPointerEvent): SelectionTarget | null {
    let target: Element | null = null
    
    if (event instanceof MouseEvent) {
      target = event.target as Element
    } else {
      // Pour les événements PixiJS, convertir les coordonnées
      const domPoint = this.coordinateSystem?.canvasToDOM(
        event.global.x,
        event.global.y
      )
      if (domPoint) {
        target = document.elementFromPoint(domPoint.x, domPoint.y)
      }
    }
    
    if (!target) return null
    
    // Remonter dans le DOM pour trouver une bulle
    const bubbleElement = target.closest('[data-bubble-id]')
    if (bubbleElement) {
      const bubbleId = bubbleElement.getAttribute('data-bubble-id')
      const element = this.elements.find(el => el.id === bubbleId)
      
      if (element && element.type === 'dialogue') {
        return {
          type: 'bubble',
          id: bubbleId!,
          element,
          layer: 'dom'
        }
      }
    }
    
    return null
  }

  /**
   * ✅ RECHERCHE D'ÉLÉMENTS PIXI
   */
  private findPixiTarget(event: MouseEvent | FederatedPointerEvent): SelectionTarget | null {
    if (!this.pixiApp || !this.coordinateSystem) return null
    
    let canvasPoint: { x: number; y: number }
    
    if (event instanceof MouseEvent) {
      // Convertir les coordonnées DOM vers canvas
      canvasPoint = this.coordinateSystem.domToCanvas(event.clientX, event.clientY)
    } else {
      // Événement PixiJS déjà en coordonnées canvas
      canvasPoint = this.coordinateSystem.adjustPixiCoordinates(
        event.global.x,
        event.global.y
      )
    }
    
    // Chercher l'élément PixiJS sous le curseur
    const hitElement = this.findElementAtPoint(canvasPoint.x, canvasPoint.y)
    
    if (hitElement) {
      return {
        type: hitElement.type === 'panel' ? 'panel' : 'image',
        id: hitElement.id,
        element: hitElement,
        layer: 'pixi'
      }
    }
    
    return null
  }

  /**
   * ✅ RECHERCHE D'ÉLÉMENT À UN POINT
   */
  private findElementAtPoint(x: number, y: number): AssemblyElement | null {
    // Chercher dans l'ordre inverse (z-index décroissant)
    const sortedElements = [...this.elements]
      .filter(el => el.type !== 'dialogue') // Exclure les bulles (gérées en DOM)
      .sort((a, b) => b.transform.zIndex - a.transform.zIndex)
    
    for (const element of sortedElements) {
      const { x: elX, y: elY, width, height } = element.transform
      
      if (x >= elX && x <= elX + width && y >= elY && y <= elY + height) {
        return element
      }
    }
    
    return null
  }

  /**
   * ✅ SÉLECTION D'UN ÉLÉMENT
   */
  selectElement(elementId: string, layer: 'dom' | 'pixi'): void {
    // Mode sélection simple pour l'instant
    this.state.selectedElements.clear()
    this.state.selectedElements.add(elementId)
    this.state.activeElement = elementId
    
    console.log(`🎯 Element selected: ${elementId} (${layer})`)
    
    // Synchroniser avec les couches appropriées
    if (layer === 'dom') {
      this.notifyDomLayer(elementId)
    } else {
      this.notifyPixiLayer(elementId)
    }
    
    // Notifier les callbacks
    this.notifySelectionChange()
  }

  /**
   * ✅ DÉMARRAGE DU MODE ÉDITION
   */
  startEditMode(elementId: string): void {
    if (this.state.isEditing && this.state.editingElementId !== elementId) {
      this.exitEditMode()
    }
    
    this.state.isEditing = true
    this.state.editingElementId = elementId
    
    console.log(`✏️ Edit mode started: ${elementId}`)
    
    // Notifier les callbacks
    this.callbacks.onEditStart.forEach(callback => callback(elementId))
    
    // Désactiver la sélection pendant l'édition
    document.dispatchEvent(new CustomEvent('selection-disabled', {
      detail: { elementId }
    }))
  }

  /**
   * ✅ SORTIE DU MODE ÉDITION
   */
  exitEditMode(): void {
    if (!this.state.isEditing) return
    
    const elementId = this.state.editingElementId
    
    this.state.isEditing = false
    this.state.editingElementId = null
    
    console.log(`✏️ Edit mode ended: ${elementId}`)
    
    // Notifier les callbacks
    if (elementId) {
      this.callbacks.onEditEnd.forEach(callback => callback(elementId))
    }
    
    // Réactiver la sélection
    document.dispatchEvent(new CustomEvent('selection-enabled'))
  }

  /**
   * ✅ EFFACEMENT DE LA SÉLECTION
   */
  clearSelection(): void {
    this.state.selectedElements.clear()
    this.state.activeElement = null
    
    console.log('🎯 Selection cleared')
    
    this.notifySelectionChange()
  }

  /**
   * ✅ NOTIFICATION COUCHE DOM
   */
  private notifyDomLayer(elementId: string): void {
    document.dispatchEvent(new CustomEvent('bubble-select', {
      detail: { elementId }
    }))
  }

  /**
   * ✅ NOTIFICATION COUCHE PIXI
   */
  private notifyPixiLayer(elementId: string): void {
    // Cette logique sera intégrée avec le système PixiJS existant
    console.log(`🎯 Notifying PixiJS layer: ${elementId}`)
  }

  /**
   * ✅ NOTIFICATION CHANGEMENT DE SÉLECTION
   */
  private notifySelectionChange(): void {
    const selectedIds = Array.from(this.state.selectedElements)
    this.callbacks.onSelectionChange.forEach(callback => callback(selectedIds))
  }

  /**
   * ✅ CONFIGURATION DES EVENT LISTENERS GLOBAUX
   */
  private setupGlobalEventListeners(): void {
    // Écouter les événements personnalisés
    document.addEventListener('bubble-edit-start', (e: any) => {
      this.startEditMode(e.detail.bubbleId)
    })
    
    document.addEventListener('bubble-exit-edit', () => {
      this.exitEditMode()
    })
    
    // Écouter les clics globaux
    document.addEventListener('click', (e) => {
      this.handleGlobalClick(e)
    })
  }

  /**
   * ✅ ABONNEMENT AUX ÉVÉNEMENTS
   */
  onSelectionChange(callback: (selectedIds: string[]) => void): () => void {
    this.callbacks.onSelectionChange.push(callback)
    return () => {
      const index = this.callbacks.onSelectionChange.indexOf(callback)
      if (index > -1) {
        this.callbacks.onSelectionChange.splice(index, 1)
      }
    }
  }

  onEditStart(callback: (elementId: string) => void): () => void {
    this.callbacks.onEditStart.push(callback)
    return () => {
      const index = this.callbacks.onEditStart.indexOf(callback)
      if (index > -1) {
        this.callbacks.onEditStart.splice(index, 1)
      }
    }
  }

  onEditEnd(callback: (elementId: string) => void): () => void {
    this.callbacks.onEditEnd.push(callback)
    return () => {
      const index = this.callbacks.onEditEnd.indexOf(callback)
      if (index > -1) {
        this.callbacks.onEditEnd.splice(index, 1)
      }
    }
  }

  /**
   * ✅ OBTENIR L'[FR-UNTRANSLATED: ÉTAT ACTUEL
   */
  getState(): SelectionState {
    return { ...this.state }
  }

  /**
   * ✅ NETTOYAGE
   */
  cleanup(): void {
    this.callbacks.onSelectionChange.length = 0
    this.callbacks.onEditStart.length = 0
    this.callbacks.onEditEnd.length = 0
    
    this.state.selectedElements.clear()
    this.state.activeElement = null
    this.state.isEditing = false
    this.state.editingElementId = null
    
    console.log('🧹 UnifiedSelectionManager cleaned up')
  }
}
