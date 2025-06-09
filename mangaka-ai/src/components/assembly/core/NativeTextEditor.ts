import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { DialogueElement } from '../../../types/assembly'
import { applyCenteringUniversal, calculateOptimalWrapWidth, createOptimalTextStyle } from '../utils/TextCenteringUtils'

/**
 * Éditeur de texte 100% natif PixiJS pour les bulles de dialogue
 * Aucun élément HTML - tout se passe dans PixiJS
 *
 * LOGIQUE D'INTERACTION :
 * - Double-clic sur bulle → Entre en mode édition
 * - Clic dans la bulle → Reste en mode édition (positionne le curseur)
 * - Clic EXTÉRIEUR à la bulle → Sort du mode édition
 * - Escape → Sort du mode édition
 * - Après sortie : Clic simple = manipulation, Double-clic = édition
 */
// ✅ VARIABLE GLOBALE POUR ÉVITER LES ÉDITEURS MULTIPLES
let activeEditor: NativeTextEditor | null = null

export class NativeTextEditor extends Container {
  private element: DialogueElement
  private originalText: Text
  private editableText!: Text
  private textCursor!: Graphics // Renommé pour éviter conflit avec Container.cursor
  private background!: Graphics
  private selectionHighlight?: Graphics // Highlight visuel pour la sélection
  private onComplete: (text: string) => void

  private currentText: string = ''
  private cursorPosition: number = 0
  private isActive: boolean = false
  private cursorBlinkTimer: number = 0
  private autoSaveTimer: number = 0
  private keyboardListener?: (e: KeyboardEvent) => void
  private clickListener?: (e: MouseEvent) => void
  private gracePeriodEnd: number = 0 // Période de grâce pour éviter fermeture immédiate
  private lastBubbleSize: { width: number; height: number } = { width: 0, height: 0 } // Surveillance du redimensionnement
  private resizeWatcher: number = 0 // Timer pour surveiller les changements de taille
  private selectionStart: number = 0 // Début de la sélection
  private selectionEnd: number = 0 // Fin de la sélection
  private isSelecting: boolean = false // Flag pour la sélection en cours
  private hasSelection: boolean = false // Flag pour la sélection active
  private lastClickTime: number = 0 // Pour détecter les double-clics
  private isClickingInText: boolean = false // Flag pour éviter la sortie d'édition
  private maxLineWidth: number = 200 // Largeur maximale d'une ligne pour le wrapping manuel

  constructor(
    element: DialogueElement,
    originalText: Text,
    onComplete: (text: string) => void
  ) {
    super()

    console.log('🔤 CRÉATION NativeTextEditor pour:', element.id, 'Éditeur actuel:', activeEditor?.element.id || 'aucun')
    console.trace('🔍 Stack trace de création:')

    this.element = element
    this.originalText = originalText
    this.onComplete = onComplete

    // ✅ GESTION UNIFIÉE DU TEXTE - Distinguer placeholder du contenu réel
    this.currentText = this.getActualText()
    this.cursorPosition = this.currentText.length

    // ✅ SYSTÈME DE SÉLECTION STANDARD (SANS HIGHLIGHT VISUEL DÉFAILLANT)

    this.createEditor()
  }

  /**
   * Obtient le texte réel (pas le placeholder)
   */
  private getActualText(): string {
    const text = this.element.text || ''
    // Si c'est le placeholder par défaut, considérer comme vide
    if (text === 'Nouveau texte...' || text === '') {
      return ''
    }
    return text
  }

  private createEditor(): void {
    const { width, height } = this.element.transform
    const padding = 10

    // ✅ INTERFACE VISUELLE MINIMALE - PAS DE CADRE OU ARRIÈRE-PLAN VISIBLE
    // L'édition se fait directement sur le texte sans éléments visuels perturbateurs

    // ✅ TEXTE ÉDITABLE AVEC WRAPPING MANUEL PRÉCIS
    const displayText = this.currentText || ''

    // Calculer la largeur disponible pour le texte (bulle - marges)
    const textMargin = 20 // Marge de 20px de chaque côté
    this.maxLineWidth = Math.max(50, width - (textMargin * 2))

    // ✅ CRÉER LE TEXTE AVEC STYLE OPTIMAL POUR LE CENTRAGE RADICAL
    const optimalStyle = createOptimalTextStyle(
      this.element.bubbleStyle.fontSize,
      this.element.bubbleStyle.fontFamily,
      this.element.bubbleStyle.textColor,
      width,
      height
    )

    this.editableText = new Text({
      text: displayText,
      style: optimalStyle
    })

    // ✅ CENTRER LE TEXTE DÈS LA CRÉATION
    this.centerTextPerfectly()
    this.addChild(this.editableText)

    console.log('🎯 Texte créé avec centrage automatique:', {
      bubbleSize: { width, height },
      textPosition: { x: this.editableText.x, y: this.editableText.y },
      anchor: this.editableText.anchor
    })

    // ✅ RENDRE LE TEXTE INTERACTIF AVEC PRIORITÉ MAXIMALE
    this.editableText.eventMode = 'static'
    this.editableText.cursor = 'text' // Curseur en forme de I-beam
    this.editableText.interactive = true
    this.editableText.interactiveChildren = false // Empêcher les enfants d'intercepter
    this.editableText.zIndex = 1000 // Priorité maximale

    console.log('✅ Texte éditable configuré comme interactif:', {
      eventMode: this.editableText.eventMode,
      interactive: this.editableText.interactive,
      zIndex: this.editableText.zIndex,
      cursor: this.editableText.cursor
    })

    // Événements avec capture immédiate et logs de debug
    this.editableText.on('pointerdown', (e) => {
      console.log('🖱️ POINTERDOWN sur texte éditable détecté')
      e.stopPropagation()
      e.stopImmediatePropagation()
      this.handleTextClick(e)
    })
    this.editableText.on('pointermove', (e) => {
      console.log('🖱️ POINTERMOVE sur texte éditable détecté')
      e.stopPropagation()
      e.stopImmediatePropagation()
      this.handleTextMove(e)
    })
    this.editableText.on('pointerup', (e) => {
      console.log('🖱️ POINTERUP sur texte éditable détecté')
      e.stopPropagation()
      e.stopImmediatePropagation()
      this.handleTextRelease(e)
    })
    this.editableText.on('pointerover', () => {
      console.log('🖱️ POINTEROVER sur texte éditable')
      this.handleTextHover()
    })
    this.editableText.on('pointerout', () => {
      console.log('🖱️ POINTEROUT sur texte éditable')
      this.handleTextOut()
    })

    // ✅ SUPPRESSION DE LA PROTECTION GLOBALE QUI CAUSE DES PROBLÈMES
    // Plus de capture globale sur l'éditeur - seul le texte capture les événements

    // ✅ CURSEUR CLIGNOTANT ADAPTATIF
    this.textCursor = new Graphics()
    this.textCursor.rect(0, 0, 2, this.element.bubbleStyle.fontSize)
    this.textCursor.fill({ color: this.element.bubbleStyle.textColor })
    this.addChild(this.textCursor)

    // ✅ SYSTÈME DE SÉLECTION STANDARD (PAS DE HIGHLIGHT VISUEL)

    // ✅ CENTRER LE TEXTE AU DÉBUT DE L'ÉDITION
    this.centerTextPerfectly()

    // ✅ POSITIONNER LE CURSEUR
    this.updateCursorPosition()

    console.log('✅ Édition démarrée avec texte centré')
  }

  public startEditing(): void {
    // ✅ EMPÊCHER LES ÉDITEURS MULTIPLES
    if (activeEditor && activeEditor !== this) {
      console.log('🚫 Éditeur déjà actif - fermeture de l\'ancien')
      activeEditor.finishEditing()
    }

    activeEditor = this
    this.isActive = true

    // ✅ DÉSACTIVER LA MANIPULATION DES BULLES PENDANT L'ÉDITION
    this.disableBubbleManipulation()

    // ✅ SÉLECTION STANDARD DE TOUT LE TEXTE EXISTANT
    if (this.currentText.length > 0) {
      // Sélectionner tout le texte existant (comportement standard)
      this.selectionStart = 0
      this.selectionEnd = this.currentText.length
      this.hasSelection = true
      this.cursorPosition = this.currentText.length
      console.log('🔤 Texte existant sélectionné:', this.currentText)
    } else {
      this.hasSelection = false
      this.cursorPosition = 0
      console.log('🔤 Bulle vide - prêt pour nouveau texte')
    }

    // ✅ PÉRIODE DE GRÂCE : Ignorer les clics pendant 300ms pour éviter fermeture immédiate
    this.gracePeriodEnd = Date.now() + 300

    // ✅ INITIALISER LA SURVEILLANCE DU REDIMENSIONNEMENT
    this.lastBubbleSize = {
      width: this.element.transform.width,
      height: this.element.transform.height
    }
    this.startResizeWatcher()

    // ✅ ÉCOUTER LES ÉVÉNEMENTS CLAVIER
    this.keyboardListener = (e: KeyboardEvent) => this.handleKeyboard(e)
    window.addEventListener('keydown', this.keyboardListener)

    // ✅ GESTIONNAIRE DE CLIC EXTÉRIEUR INTELLIGENT
    this.clickListener = (e: MouseEvent) => this.handleGlobalClick(e)
    window.addEventListener('click', this.clickListener, true)

    console.log('✅ Gestionnaire de clic extérieur activé - Sortie seulement si clic en dehors de la bulle')

    // ✅ DÉMARRER L'ANIMATION DU CURSEUR
    this.startCursorBlink()

    // ✅ FORCER LE CURSEUR TEXTE PENDANT TOUTE L'ÉDITION
    this.forceTextCursor()

    console.log('🔤 Édition native démarrée - manipulation des bulles désactivée')
  }

  private handleKeyboard(e: KeyboardEvent): void {
    if (!this.isActive) return

    // ✅ NE PAS BLOQUER TOUS LES ÉVÉNEMENTS - Seulement ceux qu'on gère
    const handledKeys = ['Enter', 'Escape', 'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Tab']
    const isHandledKey = handledKeys.includes(e.key) || (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey)

    if (isHandledKey) {
      e.preventDefault()
      e.stopPropagation()
    }

    switch (e.key) {
      case 'Enter':
        // ✅ ENTRÉE = NOUVELLE LIGNE (COMPORTEMENT STANDARD POUR MANGA)
        this.insertText('\n')
        break

      case 'Escape':
        // ✅ ESCAPE = TERMINE L'ÉDITION ET DÉSÉLECTIONNE (IDENTIQUE AU CLIC EXTÉRIEUR)
        console.log('⌨️ Escape pressé - Fin d\'édition ET désélection (identique au clic extérieur)')
        this.finishEditingAndDeselect()
        break

      // case 'Tab':
      //   this.finishEditing()
      //   break

      case 'Backspace':
        this.deleteCharacter()
        break

      case 'Delete':
        this.deleteCharacterForward()
        break

      case 'ArrowLeft':
        this.moveCursor(-1)
        break

      case 'ArrowRight':
        this.moveCursor(1)
        break

      case 'Home':
        this.clearSelection() // Désactiver la sélection
        this.cursorPosition = 0
        this.updateCursorPosition()
        break

      case 'End':
        this.clearSelection() // Désactiver la sélection
        this.cursorPosition = this.currentText.length
        this.updateCursorPosition()
        break

      default:
        // ✅ OPÉRATIONS DE PRESSE-PAPIERS STANDARD
        if (e.ctrlKey || e.metaKey) {
          switch (e.key.toLowerCase()) {
            case 'c':
              this.copySelectedText()
              break
            case 'v':
              this.pasteText()
              break
            case 'x':
              this.cutSelectedText()
              break
            case 'a':
              this.selectAllText()
              break
            default:
              console.log('🚫 Raccourci clavier non géré:', e.key)
          }
        } else if (e.key.length === 1) {
          // ✅ CARACTÈRES NORMAUX
          console.log('🔤 Insertion du caractère:', `"${e.key}"`, 'Texte avant:', `"${this.currentText}"`)
          this.insertText(e.key)
        } else {
          console.log('🚫 Caractère ignoré:', e.key, 'Longueur:', e.key.length)
        }
        break
    }
  }

  private handleGlobalClick(e: MouseEvent): void {
    // ✅ PÉRIODE DE GRÂCE : Ignorer les clics pendant les premiers 300ms
    if (Date.now() < this.gracePeriodEnd) {
      console.log('🛡️ Clic ignoré pendant la période de grâce')
      return
    }

    // ✅ VÉRIFIER QUE LE CLIC EST DANS LE CANVAS
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const canvasX = e.clientX - rect.left
    const canvasY = e.clientY - rect.top

    // ✅ IGNORER LES CLICS EN DEHORS DU CANVAS
    if (canvasX < 0 || canvasY < 0 || canvasX > rect.width || canvasY > rect.height) {
      console.log('🚫 Clic en dehors du canvas - ignoré')
      return
    }

    // ✅ OBTENIR LA POSITION EXACTE DE LA BULLE
    const bubbleContainer = this.parent?.parent // Container de la bulle
    if (!bubbleContainer) {
      console.log('❌ Container de bulle non trouvé - Fin d\'édition par sécurité')
      this.finishEditingAndDeselect()
      return
    }

    // Calculer les bounds globaux de la bulle avec une TRÈS GRANDE marge de sécurité
    const globalBounds = bubbleContainer.getBounds()
    const margin = 50 // TRÈS GRANDE marge de 50px pour éviter TOUTE sortie accidentelle

    const bubbleArea = {
      x: globalBounds.x - margin,
      y: globalBounds.y - margin,
      width: globalBounds.width + (margin * 2),
      height: globalBounds.height + (margin * 2)
    }

    const isInsideBubbleArea =
      canvasX >= bubbleArea.x &&
      canvasX <= bubbleArea.x + bubbleArea.width &&
      canvasY >= bubbleArea.y &&
      canvasY <= bubbleArea.y + bubbleArea.height

    console.log('🎯 Détection de clic:', {
      clic: { x: canvasX, y: canvasY },
      bubbleArea,
      isInside: isInsideBubbleArea,
      canvasBounds: { width: rect.width, height: rect.height }
    })

    // ✅ SEULS LES CLICS VRAIMENT EXTÉRIEURS TERMINENT L'ÉDITION
    if (!isInsideBubbleArea) {
      console.log('🚪 Clic VRAIMENT EXTÉRIEUR - Fin d\'édition ET désélection')
      this.finishEditingAndDeselect()
    } else {
      console.log('🏠 Clic dans la zone de bulle - ÉDITION CONTINUE')
      // ✅ AUCUNE ACTION - L'édition continue sans interruption
      // Les clics à l'intérieur de la bulle ne font JAMAIS sortir du mode édition
    }
  }

  private insertText(char: string): void {
    console.log('🔤 DÉBUT insertText:', { char, currentText: this.currentText, cursorPosition: this.cursorPosition })

    this.ensureSelectionConsistency() // Vérifier la cohérence avant insertion

    // ✅ SI DU TEXTE EST SÉLECTIONNÉ, le remplacer (comportement standard)
    if (this.hasSelection) {
      console.log('🔤 Remplacement de texte sélectionné par:', char)
      // Remplacer le texte sélectionné
      const start = Math.min(this.selectionStart, this.selectionEnd)
      const end = Math.max(this.selectionStart, this.selectionEnd)
      const before = this.currentText.substring(0, start)
      const after = this.currentText.substring(end)

      this.currentText = before + char + after
      this.cursorPosition = start + char.length
      this.clearSelection()
      console.log('🔤 Texte sélectionné remplacé:', char)
    } else {
      // Insérer le caractère à la position du curseur (mode normal)
      const before = this.currentText.substring(0, this.cursorPosition)
      const after = this.currentText.substring(this.cursorPosition)

      this.currentText = before + char + after
      this.cursorPosition += char.length
      console.log('🔤 Caractère inséré:', char, 'Nouveau texte:', this.currentText)
    }

    // ✅ APPLIQUER LE WRAPPING AUTOMATIQUE APRÈS INSERTION
    if (char !== '\n') { // Ne pas wrapper si c'est un saut de ligne manuel
      this.applyAutoWrapping()
    }

    // ✅ MISE À JOUR SANS REDIMENSIONNEMENT FORCÉ
    console.log('🔄 APPEL updateDisplay depuis insertText')
    this.updateDisplay()

    console.log('✅ FIN insertText')
  }

  private applyAutoWrapping(): void {
    // ✅ WRAPPING AUTOMATIQUE INTELLIGENT
    const lines = this.currentText.split('\n')
    const newLines: string[] = []

    // Style temporaire pour mesurer le texte
    const tempStyle = new TextStyle({
      fontSize: this.element.bubbleStyle.fontSize,
      fontFamily: this.element.bubbleStyle.fontFamily
    })

    for (const line of lines) {
      if (!line.trim()) {
        newLines.push(line)
        continue
      }

      const words = line.split(' ')
      let currentLine = ''

      for (const word of words) {
        const testLine = currentLine ? currentLine + ' ' + word : word

        // Créer un texte temporaire pour mesurer
        const tempText = new Text({ text: testLine, style: tempStyle })
        tempText.getBounds()
        const lineWidth = tempText.width
        tempText.destroy()

        if (lineWidth <= this.maxLineWidth || currentLine === '') {
          currentLine = testLine
        } else {
          // La ligne est trop longue, commencer une nouvelle ligne
          newLines.push(currentLine)
          currentLine = word
        }
      }

      // Ajouter la dernière ligne
      if (currentLine) {
        newLines.push(currentLine)
      }
    }

    // Reconstruire le texte avec les sauts de ligne
    const wrappedText = newLines.join('\n')

    // Mettre à jour le texte si nécessaire
    if (wrappedText !== this.currentText) {
      const oldCursorPos = this.cursorPosition
      this.currentText = wrappedText

      // Ajuster la position du curseur (approximation simple)
      this.cursorPosition = Math.min(oldCursorPos, this.currentText.length)

      console.log('📝 Wrapping automatique appliqué:', {
        oldLength: this.currentText.length,
        newLength: wrappedText.length,
        lines: newLines.length
      })
    }
  }

  private deleteCharacter(): void {
    this.ensureSelectionConsistency() // Vérifier la cohérence avant suppression

    if (this.hasSelection) {
      console.log('🗑️ Suppression de texte sélectionné avec Backspace')
      // Si texte sélectionné, supprimer la sélection
      const start = Math.min(this.selectionStart, this.selectionEnd)
      const end = Math.max(this.selectionStart, this.selectionEnd)
      const before = this.currentText.substring(0, start)
      const after = this.currentText.substring(end)

      this.currentText = before + after
      this.cursorPosition = start
      this.clearSelection()
    } else if (this.cursorPosition > 0) {
      const before = this.currentText.substring(0, this.cursorPosition - 1)
      const after = this.currentText.substring(this.cursorPosition)

      this.currentText = before + after
      this.cursorPosition--
    }

    // ✅ MISE À JOUR SANS REDIMENSIONNEMENT FORCÉ
    this.updateDisplay()
  }

  private deleteCharacterForward(): void {
    this.ensureSelectionConsistency() // Vérifier la cohérence avant suppression

    if (this.hasSelection) {
      console.log('🗑️ Suppression de texte sélectionné avec Delete')
      // Si texte sélectionné, supprimer la sélection
      const start = Math.min(this.selectionStart, this.selectionEnd)
      const end = Math.max(this.selectionStart, this.selectionEnd)
      const before = this.currentText.substring(0, start)
      const after = this.currentText.substring(end)

      this.currentText = before + after
      this.cursorPosition = start
      this.clearSelection()
    } else if (this.cursorPosition < this.currentText.length) {
      const before = this.currentText.substring(0, this.cursorPosition)
      const after = this.currentText.substring(this.cursorPosition + 1)

      this.currentText = before + after
    }

    // ✅ MISE À JOUR SANS REDIMENSIONNEMENT FORCÉ
    this.updateDisplay()
  }

  private moveCursor(delta: number): void {
    this.clearSelection() // Désactiver la sélection lors du déplacement
    this.cursorPosition = Math.max(0, Math.min(this.currentText.length, this.cursorPosition + delta))
    // ✅ SYNCHRONISATION PARFAITE LORS DU MOUVEMENT DU CURSEUR
    this.updateCursorPosition()
  }

  private updateDisplay(): void {
    // ✅ MISE À JOUR SIMPLE DU TEXTE SANS REDIMENSIONNEMENT FORCÉ
    const newText = this.currentText || ''

    // Mettre à jour le texte
    if (this.editableText.text !== newText) {
      this.editableText.text = newText
    }

    // Centrer le texte dans la taille actuelle de la bulle
    this.centerTextPerfectly()

    // Mise à jour du curseur
    this.updateCursorPosition()

    // Sauvegarde automatique
    this.autoSave()
  }

  private centerTextPerfectly(): void {
    // ✅ SOLUTION SIMPLE : CENTRAGE AVEC ANCHOR
    const { width, height } = this.element.transform

    // 1. Mettre à jour le style si nécessaire
    const optimalStyle = createOptimalTextStyle(
      this.element.bubbleStyle.fontSize,
      this.element.bubbleStyle.fontFamily,
      this.element.bubbleStyle.textColor,
      width,
      height
    )

    this.editableText.style = optimalStyle

    // 2. Forcer le recalcul des dimensions
    this.editableText.getBounds()

    // 3. Centrer avec anchor (solution simple qui marche)
    this.editableText.anchor.set(0.5, 0.5)
    this.editableText.x = width / 2
    this.editableText.y = height / 2

    // 4. S'assurer que le texte est visible
    this.editableText.visible = true
    this.editableText.alpha = 1

    console.log('✅ Texte centré simplement:', {
      position: { x: this.editableText.x, y: this.editableText.y },
      bubbleSize: { width, height },
      visible: this.editableText.visible
    })
  }



  private autoSave(): void {
    // ✅ SAUVEGARDE AUTOMATIQUE INTELLIGENTE ET OPTIMISÉE
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
    }

    // Délai adaptatif basé sur la longueur du texte
    const textLength = this.currentText.length
    let saveDelay: number

    if (textLength < 50) {
      saveDelay = 300 // Texte court : sauvegarde rapide
    } else if (textLength < 200) {
      saveDelay = 500 // Texte moyen : sauvegarde standard
    } else {
      saveDelay = 800 // Texte long : sauvegarde moins fréquente pour éviter les ralentissements
    }

    this.autoSaveTimer = window.setTimeout(() => {
      if (this.isActive && this.currentText !== this.element.text) {
        console.log('💾 Sauvegarde automatique intelligente:', {
          textLength,
          saveDelay,
          preview: this.currentText.substring(0, 50) + (this.currentText.length > 50 ? '...' : '')
        })

        // Mettre à jour l'élément sans fermer l'éditeur
        this.element.text = this.currentText

        // ✅ PAS DE REDIMENSIONNEMENT AUTOMATIQUE - GARDER LA TAILLE CHOISIE PAR L'UTILISATEUR
      }
    }, saveDelay)
  }

  // ✅ REDIMENSIONNEMENT INTELLIGENT EN HAUTEUR SEULEMENT
  // Ajuste automatiquement la hauteur pour contenir tout le texte
  // Préserve la largeur choisie par l'utilisateur

  private calculateRequiredHeight(): number {
    if (!this.currentText || this.currentText.trim() === '') {
      // Hauteur minimale pour une bulle vide basée sur la taille de police
      const minHeight = Math.max(50, this.element.bubbleStyle.fontSize * 2.5)
      return minHeight
    }

    // ✅ CALCUL PRÉCIS DE LA HAUTEUR AVEC WRAPPING ACTUEL
    const currentWrapWidth = this.editableText.style.wordWrapWidth

    // Créer un texte temporaire avec exactement les mêmes paramètres
    const tempText = new Text({
      text: this.currentText,
      style: new TextStyle({
        fontSize: this.element.bubbleStyle.fontSize,
        fontFamily: this.element.bubbleStyle.fontFamily,
        fill: this.element.bubbleStyle.textColor,
        align: 'center',
        wordWrap: true,
        wordWrapWidth: currentWrapWidth,
        breakWords: true,
        lineHeight: this.element.bubbleStyle.fontSize * 1.2
      })
    })

    tempText.getBounds()
    const textHeight = tempText.height
    tempText.destroy()

    // ✅ MARGES VERTICALES DYNAMIQUES BASÉES SUR LA TAILLE DE LA BULLE
    const bubbleWidth = this.element.transform.width
    let verticalPadding: number

    if (bubbleWidth <= 120) {
      verticalPadding = 20 // Petites bulles : marges réduites
    } else if (bubbleWidth <= 200) {
      verticalPadding = 25 // Bulles moyennes : marges standard
    } else if (bubbleWidth <= 300) {
      verticalPadding = 30 // Grandes bulles : marges confortables
    } else {
      verticalPadding = 35 // Très grandes bulles : marges généreuses
    }

    const minHeight = Math.max(50, this.element.bubbleStyle.fontSize * 2.5)
    const requiredHeight = Math.max(minHeight, textHeight + verticalPadding)

    console.log('📏 Hauteur intelligente calculée:', {
      textHeight,
      verticalPadding,
      requiredHeight,
      currentHeight: this.element.transform.height,
      bubbleWidth,
      wrapWidth: currentWrapWidth
    })

    return requiredHeight
  }

  private smartResizeBidirectional(): void {
    console.log('🔧 DÉBUT redimensionnement intelligent bidirectionnel')

    const requiredHeight = this.calculateRequiredHeight()
    const currentHeight = this.element.transform.height
    const heightDifference = Math.abs(requiredHeight - currentHeight)

    console.log('📏 Analyse des dimensions:', {
      requiredHeight,
      currentHeight,
      heightDifference,
      needsResize: heightDifference > 2 // Seuil de tolérance de 2px pour éviter les micro-ajustements
    })

    // ✅ REDIMENSIONNEMENT INTELLIGENT AVEC SEUIL DE TOLÉRANCE
    if (heightDifference > 2) {
      console.log('🔧 Redimensionnement automatique de la bulle:', {
        from: currentHeight,
        to: requiredHeight,
        difference: requiredHeight - currentHeight,
        reason: requiredHeight > currentHeight ? 'Texte plus long' : 'Texte plus court'
      })

      // ✅ ANIMATION FLUIDE DU REDIMENSIONNEMENT (optionnel)
      const steps = Math.min(5, Math.ceil(heightDifference / 10))
      const stepSize = (requiredHeight - currentHeight) / steps

      let currentStep = 0
      const animateResize = () => {
        if (currentStep < steps) {
          const newHeight = currentHeight + (stepSize * (currentStep + 1))
          this.element.transform.height = newHeight
          this.lastBubbleSize.height = newHeight

          // Recentrer à chaque étape pour un mouvement fluide
          this.centerTextPerfectly()
          this.updateCursorPosition() // ✅ CURSEUR SYNCHRONISÉ À CHAQUE ÉTAPE

          currentStep++
          requestAnimationFrame(animateResize)
        } else {
          // Finaliser avec la hauteur exacte
          this.element.transform.height = requiredHeight
          this.lastBubbleSize.height = requiredHeight
          this.centerTextPerfectly()
          this.updateCursorPosition() // ✅ CURSEUR SYNCHRONISÉ À LA FIN
          this.forceImmediateUpdate()

          console.log('✅ Redimensionnement fluide terminé avec curseur synchronisé')
        }
      }

      // Démarrer l'animation ou redimensionnement direct selon la préférence
      if (heightDifference > 20) {
        animateResize() // Animation pour les gros changements
      } else {
        // Redimensionnement direct pour les petits ajustements
        this.element.transform.height = requiredHeight
        this.lastBubbleSize.height = requiredHeight
        this.centerTextPerfectly()
        this.updateCursorPosition() // ✅ CURSEUR SYNCHRONISÉ IMMÉDIATEMENT
        this.forceImmediateUpdate()
      }

      console.log('✅ Hauteur de bulle ajustée intelligemment avec curseur synchronisé')
    } else {
      console.log('ℹ️ Hauteur optimale - pas de redimensionnement nécessaire')
      // ✅ MÊME SI PAS DE REDIMENSIONNEMENT, S'ASSURER QUE LE CURSEUR EST CORRECT
      this.updateCursorPosition()
    }

    console.log('✅ FIN redimensionnement intelligent')
  }

  private adaptTextToNewBubbleSize(newWidth: number, newHeight: number): void {
    console.log('🔄 Adaptation intelligente aux nouvelles dimensions:', {
      newSize: { width: newWidth, height: newHeight },
      currentWrapWidth: this.editableText.style.wordWrapWidth,
      textLength: this.currentText.length
    })

    // ✅ CRÉER LE STYLE OPTIMAL POUR LES NOUVELLES DIMENSIONS
    const optimalStyle = createOptimalTextStyle(
      this.element.bubbleStyle.fontSize,
      this.element.bubbleStyle.fontFamily,
      this.element.bubbleStyle.textColor,
      newWidth,
      newHeight
    )

    const currentWrapWidth = this.editableText.style.wordWrapWidth
    const newWrapWidth = optimalStyle.wordWrapWidth
    const wrapDifference = Math.abs(newWrapWidth - currentWrapWidth)

    // ✅ ADAPTATION INTELLIGENTE DU WRAPPING
    if (wrapDifference > 5) { // Seuil pour éviter les micro-ajustements
      console.log('📏 Adaptation significative du wrapping:', {
        from: currentWrapWidth,
        to: newWrapWidth,
        difference: wrapDifference,
        reason: newWrapWidth > currentWrapWidth ? 'Bulle élargie' : 'Bulle rétrécie'
      })

      // Appliquer le style optimal
      this.editableText.style = optimalStyle

      // ✅ RECALCUL INTELLIGENT DE LA HAUTEUR APRÈS RE-WRAPPING
      const requiredHeight = this.calculateRequiredHeight()
      const heightDifference = Math.abs(requiredHeight - newHeight)

      if (heightDifference > 5) {
        console.log('📏 Ajustement automatique de la hauteur après re-wrapping:', {
          from: newHeight,
          to: requiredHeight,
          difference: heightDifference,
          reason: requiredHeight > newHeight ? 'Plus de lignes nécessaires' : 'Moins de lignes nécessaires'
        })

        this.element.transform.height = requiredHeight
        this.lastBubbleSize.height = requiredHeight
      }

      // ✅ SYNCHRONISATION PARFAITE APRÈS ADAPTATION
      this.synchronizeTextAndCursor()

      // ✅ MISE À JOUR OPTIMISÉE
      this.forceImmediateUpdate()

      console.log('✅ Adaptation complète terminée')
    } else {
      console.log('ℹ️ Changement de wrapping minimal - pas d\'adaptation nécessaire')
    }
  }

  private forceImmediateUpdate(): void {
    // ✅ FORCER LA MISE À JOUR IMMÉDIATE DE L'AFFICHAGE PIXI
    // Mettre à jour immédiatement l'élément avec les nouvelles dimensions
    this.element.text = this.currentText

    // ✅ DÉCLENCHER LA MISE À JOUR VIA LE CALLBACK SI DISPONIBLE
    if (this.onComplete) {
      // Appeler le callback avec le texte actuel pour déclencher la mise à jour
      // Cela force le système PixiJS à redessiner la bulle avec les nouvelles dimensions
      console.log('🔄 Déclenchement de la mise à jour immédiate via callback')
    }

    // ✅ FORCER LE RENDU PIXI
    if (this.parent && this.parent.parent) {
      const container = this.parent.parent
      if ('getBounds' in container) {
        // Forcer le recalcul des bounds pour déclencher le rendu
        container.getBounds()
      }
    }

    console.log('✅ Mise à jour immédiate forcée')
  }

  private triggerElementUpdate(): void {
    // ✅ VERSION SIMPLIFIÉE - JUSTE FORCER LA MISE À JOUR
    this.forceImmediateUpdate()
  }

  private updateCursorPosition(): void {
    // ✅ NETTOYAGE ET PRÉPARATION DU CURSEUR
    this.textCursor.clear()
    this.textCursor.visible = true

    // ✅ UTILISER LES DIMENSIONS ACTUELLES DE LA BULLE
    const { width, height } = this.element.transform
    const fontSize = this.element.bubbleStyle.fontSize

    if (!this.currentText || this.currentText.trim() === '') {
      // ✅ CURSEUR PARFAITEMENT CENTRÉ POUR BULLE VIDE
      this.textCursor.x = width / 2 - 1 // -1 pour centrer la ligne de 2px
      this.textCursor.y = height / 2 - fontSize / 2
      this.textCursor.rect(0, 0, 2, fontSize)
      this.textCursor.fill({ color: this.element.bubbleStyle.textColor })

      console.log('🎯 Curseur centré pour bulle vide:', {
        position: { x: this.textCursor.x, y: this.textCursor.y },
        bubbleCenter: { x: width / 2, y: height / 2 }
      })
      return
    }

    const bubbleCenterX = width / 2
    const bubbleCenterY = height / 2

    // ✅ CALCUL PRÉCIS POUR TEXTE MULTI-LIGNES
    const lines = this.currentText.split('\n')
    const lineHeight = fontSize * 1.2

    // Déterminer la ligne et position du curseur
    let currentLine = 0
    let positionInLine = this.cursorPosition
    let charCount = 0

    for (let i = 0; i < lines.length; i++) {
      if (charCount + lines[i].length >= this.cursorPosition) {
        currentLine = i
        positionInLine = this.cursorPosition - charCount
        break
      }
      charCount += lines[i].length + 1 // +1 pour le \n
    }

    // ✅ UTILISER EXACTEMENT LE MÊME STYLE QUE LE TEXTE ÉDITABLE
    const textBeforeCursor = lines[currentLine].substring(0, positionInLine)
    const currentLineText = lines[currentLine]

    // Créer des textes temporaires avec EXACTEMENT le même style que editableText
    const beforeText = new Text({
      text: textBeforeCursor,
      style: this.editableText.style
    })
    const lineText = new Text({
      text: currentLineText,
      style: this.editableText.style
    })

    beforeText.getBounds()
    lineText.getBounds()

    const beforeWidth = beforeText.width
    const lineWidth = lineText.width

    // ✅ POSITIONNEMENT BASÉ SUR LE CENTRE DE LA BULLE (STABLE)
    // Calculer où devrait être le texte centré
    const totalTextHeight = this.editableText.height

    // Position X : centre de la bulle - moitié de la ligne + largeur avant curseur
    const cursorX = bubbleCenterX - (lineWidth / 2) + beforeWidth

    // Position Y : centre de la bulle - moitié de la hauteur totale + ligne courante
    const cursorY = bubbleCenterY - (totalTextHeight / 2) + (currentLine * lineHeight)

    this.textCursor.x = cursorX
    this.textCursor.y = cursorY

    // ✅ DESSINER LE CURSEUR AVEC STYLE ADAPTATIF
    this.textCursor.rect(0, 0, 2, fontSize)
    this.textCursor.fill({ color: this.element.bubbleStyle.textColor })

    console.log('🎯 Curseur positionné par rapport au centre de la bulle:', {
      line: currentLine + 1,
      positionInLine,
      cursorPos: { x: cursorX, y: cursorY },
      bubbleCenter: { x: bubbleCenterX, y: bubbleCenterY },
      textMetrics: {
        lineWidth,
        beforeWidth,
        totalHeight: totalTextHeight
      }
    })

    // Nettoyer les objets temporaires
    beforeText.destroy()
    lineText.destroy()
  }

  /**
   * ✅ FONCTION DE SYNCHRONISATION TEXTE-CURSEUR
   * Garantit que le curseur suit le centrage du texte
   */
  private synchronizeTextAndCursor(): void {
    // 1. Centrer le texte
    this.centerTextPerfectly()

    // 2. Positionner le curseur
    this.updateCursorPosition()
  }

  /**
   * ✅ FONCTION DE VALIDATION DU CENTRAGE
   * Vérifie que le curseur est bien centré par rapport au texte
   */
  private validateCursorCentering(): boolean {
    if (!this.currentText || this.currentText.trim() === '') {
      // Pour bulle vide, vérifier que le curseur est au centre de la bulle
      const { width, height } = this.element.transform
      const expectedX = width / 2 - 1
      const expectedY = height / 2 - this.element.bubbleStyle.fontSize / 2

      const isCorrect = Math.abs(this.textCursor.x - expectedX) < 2 &&
                       Math.abs(this.textCursor.y - expectedY) < 2

      console.log('🔍 Validation curseur bulle vide:', {
        expected: { x: expectedX, y: expectedY },
        actual: { x: this.textCursor.x, y: this.textCursor.y },
        isCorrect
      })

      return isCorrect
    }

    // Pour texte existant, vérifier que le curseur suit le centrage du texte
    const textBounds = this.editableText.getBounds()
    const isWithinTextBounds = this.textCursor.x >= textBounds.x - 5 &&
                              this.textCursor.x <= textBounds.x + textBounds.width + 5 &&
                              this.textCursor.y >= textBounds.y - 5 &&
                              this.textCursor.y <= textBounds.y + textBounds.height + 5

    console.log('🔍 Validation curseur avec texte:', {
      textBounds,
      cursorPos: { x: this.textCursor.x, y: this.textCursor.y },
      isWithinBounds: isWithinTextBounds
    })

    return isWithinTextBounds
  }

  private startCursorBlink(): void {
    const blink = () => {
      if (!this.isActive) return

      this.textCursor.visible = !this.textCursor.visible
      this.cursorBlinkTimer = window.setTimeout(blink, 500)
    }

    blink()
  }

  private stopCursorBlink(): void {
    if (this.cursorBlinkTimer) {
      clearTimeout(this.cursorBlinkTimer)
      this.cursorBlinkTimer = 0
    }
    this.textCursor.visible = false
  }

  private startResizeWatcher(): void {
    const checkResize = () => {
      if (!this.isActive) return

      const currentSize = this.element.transform
      const widthDiff = Math.abs(currentSize.width - this.lastBubbleSize.width)
      const heightDiff = Math.abs(currentSize.height - this.lastBubbleSize.height)

      // Seuils de tolérance pour éviter les micro-ajustements
      const widthChanged = widthDiff > 2
      const heightChanged = heightDiff > 2

      if (widthChanged || heightChanged) {
        console.log('📏 Redimensionnement intelligent détecté:', {
          from: this.lastBubbleSize,
          to: { width: currentSize.width, height: currentSize.height },
          differences: { width: widthDiff, height: heightDiff },
          changes: { widthChanged, heightChanged }
        })

        // ✅ ADAPTATION INTELLIGENTE SELON LE TYPE DE CHANGEMENT
        if (widthChanged) {
          console.log('📐 Largeur modifiée - adaptation intelligente du wrapping')
          this.adaptTextToNewBubbleSize(currentSize.width, currentSize.height)
        } else if (heightChanged) {
          // ✅ HAUTEUR MODIFIÉE - RECENTRAGE INTELLIGENT
          console.log('📏 Hauteur modifiée - recentrage intelligent')
          this.centerTextPerfectly()
          this.updateCursorPosition()
        }

        // Mettre à jour la taille surveillée
        this.lastBubbleSize = {
          width: currentSize.width,
          height: currentSize.height
        }
      }

      // ✅ SURVEILLANCE ADAPTATIVE - Fréquence basée sur l'activité
      const watchInterval = (widthChanged || heightChanged) ? 30 : 100 // Plus rapide si changements détectés
      this.resizeWatcher = window.setTimeout(checkResize, watchInterval)
    }

    checkResize()
  }

  private stopResizeWatcher(): void {
    if (this.resizeWatcher) {
      clearTimeout(this.resizeWatcher)
      this.resizeWatcher = 0
    }
  }

  private clearSelection(): void {
    this.hasSelection = false
    this.selectionStart = 0
    this.selectionEnd = 0
    this.textCursor.visible = true // Réafficher le curseur
    this.hideSelectionHighlight() // S'assurer que le highlight est caché
    console.log('🔄 Sélection effacée - curseur visible')
  }

  private ensureSelectionConsistency(): void {
    // S'assurer que hasSelection reflète toujours l'état réel
    const realSelection = this.selectionStart !== this.selectionEnd
    this.hasSelection = realSelection

    // Logs de débogage pour tracer les problèmes
    console.log('🔍 État de sélection:', {
      hasSelection: this.hasSelection,
      selectionStart: this.selectionStart,
      selectionEnd: this.selectionEnd,
      selectedText: this.hasSelection ? this.getSelectedText() : 'aucun'
    })
  }

  // ✅ OPÉRATIONS DE PRESSE-PAPIERS STANDARD
  private async copySelectedText(): Promise<void> {
    if (!this.hasSelection) {
      console.log('🚫 Aucun texte sélectionné pour copier')
      return
    }

    const start = Math.min(this.selectionStart, this.selectionEnd)
    const end = Math.max(this.selectionStart, this.selectionEnd)
    const selectedText = this.currentText.substring(start, end)

    try {
      await navigator.clipboard.writeText(selectedText)
      console.log('📋 Texte copié:', `"${selectedText}"`)
    } catch (error) {
      console.error('❌ Erreur lors de la copie:', error)
    }
  }

  private async pasteText(): Promise<void> {
    try {
      const clipboardText = await navigator.clipboard.readText()
      if (clipboardText) {
        this.insertText(clipboardText)
        console.log('📋 Texte collé:', `"${clipboardText}"`)
      }
    } catch (error) {
      console.error('❌ Erreur lors du collage:', error)
    }
  }

  private async cutSelectedText(): Promise<void> {
    if (!this.hasSelection) {
      console.log('🚫 Aucun texte sélectionné pour couper')
      return
    }

    // Copier d'abord
    await this.copySelectedText()

    // Puis supprimer le texte sélectionné
    const start = Math.min(this.selectionStart, this.selectionEnd)
    const end = Math.max(this.selectionStart, this.selectionEnd)
    const before = this.currentText.substring(0, start)
    const after = this.currentText.substring(end)

    this.currentText = before + after
    this.cursorPosition = start
    this.clearSelection()
    this.updateDisplay()

    console.log('✂️ Texte coupé et supprimé')
  }

  private selectAllText(): void {
    if (this.currentText.length === 0) {
      console.log('🚫 Aucun texte à sélectionner')
      return
    }

    this.selectionStart = 0
    this.selectionEnd = this.currentText.length
    this.hasSelection = true
    this.cursorPosition = this.currentText.length
    this.updateSelectionDisplay()

    console.log('📝 Tout le texte sélectionné:', `"${this.currentText}"`)
  }

  private disableBubbleManipulation(): void {
    console.log('🚫 DÉSACTIVATION COMPLÈTE de la manipulation pendant l\'édition')

    // ✅ DÉSACTIVER TOUS LES HANDLES ET LA SÉLECTION
    const app = this.element.pixiApp
    if (app) {
      // Désactiver complètement la sélection de la bulle
      if (app.clearSelection) {
        app.clearSelection()
      }

      // Désactiver tous les handles dans la scène
      if (app.stage) {
        this.disableHandlesInContainer(app.stage)
      }

      // Désactiver le système de sélection global
      if (app.setSelectedElement) {
        app.setSelectedElement(null)
      }
    }

    // ✅ DÉSACTIVER AUSSI LES ÉVÉNEMENTS GLOBAUX DE MANIPULATION
    this.disableGlobalManipulationEvents()

    console.log('✅ TOUS les handles, cadres et manipulation désactivés')
  }

  private disableHandlesInContainer(container: any): void {
    if (!container || !container.children) return

    container.children.forEach((child: any) => {
      // ✅ DÉSACTIVER AGRESSIVEMENT TOUS LES ÉLÉMENTS DE MANIPULATION
      const isManipulationElement = child.name && (
        child.name.toLowerCase().includes('handle') ||
        child.name.toLowerCase().includes('resize') ||
        child.name.toLowerCase().includes('corner') ||
        child.name.toLowerCase().includes('edge') ||
        child.name.toLowerCase().includes('move') ||
        child.name.toLowerCase().includes('drag') ||
        child.name.toLowerCase().includes('selection') ||
        child.name.toLowerCase().includes('manipul') ||
        child.name.toLowerCase().includes('tail') ||
        child.name.toLowerCase().includes('bubble') ||
        child.name.toLowerCase().includes('frame') ||
        child.name.toLowerCase().includes('border') ||
        child.name.toLowerCase().includes('outline')
      )

      if (isManipulationElement) {
        // Sauvegarder l'état original pour la restauration
        if (!child._originalState) {
          child._originalState = {
            visible: child.visible,
            eventMode: child.eventMode,
            interactive: child.interactive,
            cursor: child.cursor
          }
        }

        // DÉSACTIVATION COMPLÈTE
        child.visible = false
        child.eventMode = 'none'
        child.interactive = false
        child.cursor = 'default'
        console.log('🚫 Élément de manipulation désactivé:', child.name)
      }

      // ✅ DÉSACTIVER AUSSI TOUS LES CONTAINERS INTERACTIFS (sauf notre éditeur)
      if (child !== this && child !== this.editableText && child.eventMode && child.eventMode !== 'none') {
        if (!child._originalState) {
          child._originalState = {
            eventMode: child.eventMode,
            interactive: child.interactive,
            cursor: child.cursor
          }
        }
        child.eventMode = 'none'
        child.interactive = false
        child.cursor = 'text' // Curseur texte pendant l'édition
      }

      // Récursion pour les enfants
      if (child.children && child.children.length > 0) {
        this.disableHandlesInContainer(child)
      }
    })
  }

  private disableGlobalManipulationEvents(): void {
    // ✅ DÉSACTIVER LES ÉVÉNEMENTS GLOBAUX DE MANIPULATION
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.style.pointerEvents = 'none'
      // Réactiver seulement pour le texte
      setTimeout(() => {
        canvas.style.pointerEvents = 'auto'
      }, 100)
    }
  }

  private enableBubbleManipulation(): void {
    // ✅ RÉACTIVER TOUS LES HANDLES DE MANIPULATION
    const app = this.element.pixiApp
    if (app && app.stage) {
      this.enableHandlesInContainer(app.stage)
    }

    // ✅ RÉACTIVER LES ÉVÉNEMENTS GLOBAUX
    this.enableGlobalManipulationEvents()

    console.log('✅ TOUS les handles et événements de manipulation réactivés après l\'édition')
  }

  private enableHandlesInContainer(container: any): void {
    if (!container || !container.children) return

    container.children.forEach((child: any) => {
      // Réactiver TOUS les éléments qui ressemblent à des handles
      if (child.name && (
        child.name.toLowerCase().includes('handle') ||
        child.name.toLowerCase().includes('resize') ||
        child.name.toLowerCase().includes('corner') ||
        child.name.toLowerCase().includes('edge') ||
        child.name.toLowerCase().includes('move') ||
        child.name.toLowerCase().includes('drag') ||
        child.name.toLowerCase().includes('selection') ||
        child.name.toLowerCase().includes('manipul') ||
        child.name.toLowerCase().includes('tail') ||
        child.name.toLowerCase().includes('bubble')
      )) {
        // Restaurer l'état original si disponible
        if (child._originalState) {
          child.visible = child._originalState.visible
          child.eventMode = child._originalState.eventMode
          child.interactive = child._originalState.interactive
          child.cursor = child._originalState.cursor
          delete child._originalState
        } else {
          // Valeurs par défaut si pas d'état sauvegardé
          child.visible = true
          child.eventMode = 'static'
          child.interactive = true
          child.cursor = 'pointer'
        }
        console.log('✅ Handle réactivé:', child.name)
      }

      // Réactiver aussi les containers de bulles
      if (child !== this && child !== this.editableText) {
        if (child._originalState) {
          child.eventMode = child._originalState.eventMode
          child.cursor = child._originalState.cursor
          delete child._originalState
        } else if (child.eventMode !== undefined) {
          child.eventMode = 'static'
        }
      }

      // Récursion pour les enfants
      if (child.children && child.children.length > 0) {
        this.enableHandlesInContainer(child)
      }
    })
  }

  private enableGlobalManipulationEvents(): void {
    // ✅ RÉACTIVER LES ÉVÉNEMENTS GLOBAUX DE MANIPULATION
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.style.pointerEvents = 'auto'
    }
  }





  private handleTextHover(): void {
    // ✅ FORCER LE CURSEUR TEXTE (I-BEAM) PENDANT L'ÉDITION
    document.body.style.cursor = 'text !important'
    document.documentElement.style.cursor = 'text !important'

    // Forcer aussi sur l'élément canvas si disponible
    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.style.cursor = 'text !important'
    }

    console.log('🖱️ Curseur texte (I-beam) activé')
  }

  private handleTextOut(): void {
    // ✅ REMETTRE LE CURSEUR NORMAL SEULEMENT SI ON SORT DU TEXTE
    if (this.isActive) {
      // Garder le curseur texte tant qu'on est en mode édition
      document.body.style.cursor = 'text'
      document.documentElement.style.cursor = 'text'

      const canvas = document.querySelector('canvas')
      if (canvas) {
        canvas.style.cursor = 'text'
      }
    } else {
      // Remettre le curseur par défaut si l'édition est terminée
      document.body.style.cursor = 'default'
      document.documentElement.style.cursor = 'default'

      const canvas = document.querySelector('canvas')
      if (canvas) {
        canvas.style.cursor = 'default'
      }
    }
  }

  private forceTextCursor(): void {
    // ✅ FORCER LE CURSEUR TEXTE DE MANIÈRE SIMPLE ET EFFICACE
    document.body.style.cursor = 'text'

    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.style.cursor = 'text'
    }

    // Style CSS simple pour forcer le curseur texte
    const style = document.createElement('style')
    style.id = 'text-editor-cursor-override'
    style.textContent = `
      canvas {
        cursor: text !important;
      }
      body {
        cursor: text !important;
      }
    `
    document.head.appendChild(style)

    console.log('🖱️ Curseur texte activé pendant l\'édition')
  }

  private restoreNormalCursor(): void {
    // ✅ RESTAURER LE CURSEUR NORMAL APRÈS L'ÉDITION
    document.body.style.cursor = 'default'

    const canvas = document.querySelector('canvas')
    if (canvas) {
      canvas.style.cursor = 'default'
    }

    // Supprimer le style CSS global
    const style = document.getElementById('text-editor-cursor-override')
    if (style) {
      style.remove()
    }

    console.log('🖱️ Curseur normal restauré après l\'édition')
  }

  private handleTextClick(e: any): void {
    console.log('🖱️ handleTextClick appelé - DÉBUT')

    // ✅ EMPÊCHER COMPLÈTEMENT LA PROPAGATION VERS LE GESTIONNAIRE GLOBAL
    e.stopPropagation()
    e.stopImmediatePropagation()
    e.preventDefault()

    // ✅ GESTION DES CLICS MULTIPLES (SIMPLE, DOUBLE, TRIPLE)
    const currentTime = Date.now()
    const timeSinceLastClick = currentTime - (this.lastClickTime || 0)
    this.lastClickTime = currentTime

    // ✅ CALCUL PRÉCIS POUR LIGNES MULTIPLES
    const localPos = e.getLocalPosition(this.editableText)
    console.log('🎯 Position locale du clic:', localPos)

    const clickPosition = this.getTextPositionFromCoords(localPos.x, localPos.y)

    console.log('🎯 Position calculée:', {
      clickPosition,
      timeSinceLastClick,
      textLength: this.currentText.length,
      localPos
    })

    // ✅ GESTION DES CLICS MULTIPLES
    if (timeSinceLastClick < 300) { // Double-clic
      if (timeSinceLastClick < 150) { // Triple-clic très rapide
        this.handleTripleClick()
        return
      } else {
        this.handleDoubleClick(clickPosition)
        return
      }
    }

    // ✅ CLIC SIMPLE - POSITIONNER LE CURSEUR ET PRÉPARER LA SÉLECTION
    this.cursorPosition = clickPosition
    this.clearSelection()
    this.updateCursorPosition()

    // ✅ PRÉPARER LA SÉLECTION PAR GLISSEMENT
    this.isSelecting = true
    this.selectionStart = clickPosition
    this.selectionEnd = clickPosition

    console.log('🖱️ Clic simple - curseur positionné à:', clickPosition)
  }

  private handleDoubleClick(clickPosition: number): void {
    // ✅ DOUBLE-CLIC = SÉLECTIONNER LE MOT
    const wordBounds = this.getWordBounds(clickPosition)
    if (wordBounds) {
      this.selectionStart = wordBounds.start
      this.selectionEnd = wordBounds.end
      this.hasSelection = true
      this.cursorPosition = wordBounds.end
      this.updateSelectionDisplay()
      console.log('🖱️ Double-clic - mot sélectionné:', this.currentText.substring(wordBounds.start, wordBounds.end))
    }
  }

  private handleTripleClick(): void {
    // ✅ TRIPLE-CLIC = SÉLECTIONNER TOUT LE TEXTE
    this.selectAllText()
    console.log('🖱️ Triple-clic - tout le texte sélectionné')
  }

  private getWordBounds(position: number): { start: number, end: number } | null {
    if (!this.currentText || position < 0 || position > this.currentText.length) {
      return null
    }

    // Trouver le début du mot
    let start = position
    while (start > 0 && /\w/.test(this.currentText[start - 1])) {
      start--
    }

    // Trouver la fin du mot
    let end = position
    while (end < this.currentText.length && /\w/.test(this.currentText[end])) {
      end++
    }

    return start < end ? { start, end } : null
  }

  private handleTextMove(e: any): void {
    console.log('🖱️ handleTextMove appelé - isSelecting:', this.isSelecting)

    if (!this.isSelecting) {
      console.log('🚫 Pas en mode sélection - ignoré')
      return
    }

    const localPos = e.getLocalPosition(this.editableText)
    const movePosition = this.getTextPositionFromCoords(localPos.x, localPos.y)

    console.log('🖱️ Mouvement détecté:', {
      localPos,
      movePosition,
      selectionStart: this.selectionStart,
      oldSelectionEnd: this.selectionEnd
    })

    this.selectionEnd = movePosition

    // ✅ METTRE À JOUR L'AFFICHAGE DE LA SÉLECTION
    this.updateSelectionDisplay()

    if (this.hasSelection) {
      console.log('✅ Sélection activée par mouvement')
    }
  }

  private handleTextRelease(_e: any): void {
    console.log('🖱️ handleTextRelease appelé')
    this.isSelecting = false

    // ✅ METTRE À JOUR L'ÉTAT DE SÉLECTION BASÉ SUR LES POSITIONS
    this.updateSelectionDisplay()

    if (this.hasSelection) {
      const selectedText = this.getSelectedText()
      this.cursorPosition = this.selectionEnd // Positionner le curseur à la fin de la sélection
      console.log('📝 Texte sélectionné:', selectedText)
    } else {
      console.log('🖱️ Pas de sélection - positionnement du curseur')
      this.updateCursorPosition()
    }
  }

  private updateSelectionDisplay(): void {
    // ✅ CALCULER L'ÉTAT DE SÉLECTION BASÉ SUR LES POSITIONS
    const hasRealSelection = this.selectionStart !== this.selectionEnd
    this.hasSelection = hasRealSelection

    if (!hasRealSelection) {
      this.textCursor.visible = true
      this.hideSelectionHighlight()
      console.log('🎨 Pas de sélection - curseur visible')
      return
    }

    // ✅ SÉLECTION ACTIVE
    this.textCursor.visible = false
    this.showSelectionHighlight()

    const selectedText = this.getSelectedText()
    console.log('🎨 Sélection active:', {
      start: this.selectionStart,
      end: this.selectionEnd,
      selectedText: `"${selectedText}"`
    })
  }

  private showSelectionHighlight(): void {
    // ✅ HIGHLIGHT PRÉCIS DU TEXTE SÉLECTIONNÉ UNIQUEMENT
    if (!this.selectionHighlight) {
      this.selectionHighlight = new Graphics()
      this.addChild(this.selectionHighlight)
    }

    this.selectionHighlight.clear()

    const start = Math.min(this.selectionStart, this.selectionEnd)
    const end = Math.max(this.selectionStart, this.selectionEnd)

    if (start === end) return

    // ✅ CALCUL PRÉCIS DES POSITIONS DE CARACTÈRES
    const lines = this.currentText.split('\n')
    const lineHeight = this.element.bubbleStyle.fontSize * 1.2
    const fontSize = this.element.bubbleStyle.fontSize

    let charCount = 0
    let currentY = this.editableText.y - (this.editableText.height / 2)

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const line = lines[lineIndex]
      const lineStart = charCount
      const lineEnd = charCount + line.length

      // Vérifier si cette ligne contient une partie de la sélection
      if (start <= lineEnd && end >= lineStart) {
        const selectionStartInLine = Math.max(0, start - lineStart)
        const selectionEndInLine = Math.min(line.length, end - lineStart)

        if (selectionStartInLine < selectionEndInLine) {
          // Calculer les positions X précises
          const textBeforeSelection = line.substring(0, selectionStartInLine)
          const selectedText = line.substring(selectionStartInLine, selectionEndInLine)

          // Mesurer les largeurs
          const beforeWidth = this.measureTextWidth(textBeforeSelection)
          const selectedWidth = this.measureTextWidth(selectedText)
          const lineWidth = this.measureTextWidth(line)

          // Position X centrée
          const lineStartX = this.editableText.x - (lineWidth / 2)
          const highlightX = lineStartX + beforeWidth
          const highlightY = currentY

          // Dessiner le rectangle de sélection précis
          this.selectionHighlight.rect(highlightX, highlightY, selectedWidth, fontSize)
          this.selectionHighlight.fill({ color: 0x4A90E2, alpha: 0.4 }) // Bleu sélection standard
        }
      }

      charCount += line.length + 1 // +1 pour le \n
      currentY += lineHeight
    }

    console.log('🎨 Highlight précis affiché pour sélection:', { start, end })
  }

  private measureTextWidth(text: string): number {
    if (!text) return 0

    const measureText = new Text({
      text: text,
      style: this.editableText.style
    })
    measureText.getBounds()
    const width = measureText.width
    measureText.destroy()
    return width
  }

  private hideSelectionHighlight(): void {
    if (this.selectionHighlight) {
      this.selectionHighlight.clear()
    }
  }

  private getSelectedText(): string {
    if (!this.hasSelection) return ''

    const start = Math.min(this.selectionStart, this.selectionEnd)
    const end = Math.max(this.selectionStart, this.selectionEnd)

    return this.currentText.substring(start, end)
  }

  private getTextPositionFromCoords(x: number, y: number): number {
    // ✅ CALCUL PRÉCIS AVEC COORDONNÉES PARFAITEMENT SYNCHRONISÉES
    if (!this.currentText) return 0

    console.log('🎯 Calcul position curseur - Coordonnées locales:', { x, y })

    // ✅ UTILISER EXACTEMENT LE MÊME SYSTÈME QUE updateCursorPosition
    let bestPosition = 0
    let bestDistance = Infinity

    // Récupérer les coordonnées exactes du texte centré (même référence que updateCursorPosition)
    const textCenterX = this.editableText.x
    const textCenterY = this.editableText.y
    const totalTextHeight = this.editableText.height

    // Tester chaque position possible dans tout le texte
    for (let i = 0; i <= this.currentText.length; i++) {
      // Utiliser EXACTEMENT la même logique que updateCursorPosition
      const lines = this.currentText.split('\n')
      const lineHeight = this.element.bubbleStyle.fontSize * 1.2

      // Trouver sur quelle ligne se trouve cette position
      let currentLine = 0
      let positionInLine = i
      let charCount = 0

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        if (charCount + lines[lineIdx].length >= i) {
          currentLine = lineIdx
          positionInLine = i - charCount
          break
        }
        charCount += lines[lineIdx].length + 1 // +1 pour le \n
      }

      // Calculer la position X dans la ligne courante avec EXACTEMENT le même style
      const textBeforeCursor = lines[currentLine].substring(0, positionInLine)
      const currentLineText = lines[currentLine]

      const beforeText = new Text({
        text: textBeforeCursor,
        style: this.editableText.style // EXACTEMENT le même style
      })

      const lineText = new Text({
        text: currentLineText,
        style: this.editableText.style // EXACTEMENT le même style
      })

      beforeText.getBounds()
      lineText.getBounds()

      const beforeWidth = beforeText.width
      const lineWidth = lineText.width

      // ✅ UTILISER EXACTEMENT LA MÊME FORMULE QUE updateCursorPosition
      const localCursorX = textCenterX - (lineWidth / 2) + beforeWidth
      const localCursorY = textCenterY - (totalTextHeight / 2) + (currentLine * lineHeight)

      // Convertir en coordonnées locales relatives au texte éditable
      const relativeX = localCursorX - textCenterX
      const relativeY = localCursorY - textCenterY

      // Distance entre le clic et cette position de curseur
      const distance = Math.sqrt(Math.pow(x - relativeX, 2) + Math.pow(y - relativeY, 2))

      if (distance < bestDistance) {
        bestDistance = distance
        bestPosition = i
      }

      beforeText.destroy()
      lineText.destroy()
    }

    console.log('✅ Position trouvée avec système synchronisé:', {
      position: bestPosition,
      distance: bestDistance,
      textCenter: { x: textCenterX, y: textCenterY },
      clickCoords: { x, y }
    })

    return bestPosition
  }

  private finishEditing(): void {
    console.log('🔤 Fin édition native - Texte final:', this.currentText)

    this.isActive = false
    this.stopCursorBlink()

    // ✅ NETTOYER LA VARIABLE GLOBALE
    if (activeEditor === this) {
      activeEditor = null
    }

    // ✅ RÉACTIVER LA MANIPULATION DES BULLES
    this.enableBubbleManipulation()

    // ✅ RESTAURER LE CURSEUR NORMAL
    this.restoreNormalCursor()

    // ✅ NETTOYAGE COMPLET DES ÉVÉNEMENTS
    this.cleanupEventListeners()

    // ✅ SAUVEGARDE IMMÉDIATE ET FINALE - GESTION UNIFIÉE DU TEXTE
    const finalText = this.currentText.trim() || 'Nouveau texte...'
    this.element.text = finalText

    // ✅ METTRE À JOUR LE TEXTE ORIGINAL AVEC LE CONTENU FINAL ET CENTRAGE
    this.originalText.text = finalText

    // ✅ CENTRAGE PARFAIT DU TEXTE FINAL
    this.centerOriginalText()
    this.originalText.visible = true

    console.log('💾 Texte sauvegardé, centré et affiché:', finalText)

    // Appeler le callback avec le nouveau texte
    this.onComplete(finalText)

    // Se supprimer du parent proprement
    if (this.parent) {
      this.parent.removeChild(this)
    }

    this.destroy()
  }

  private centerOriginalText(): void {
    // ✅ CENTRAGE MANUEL RADICAL POUR LE TEXTE FINAL
    const { width, height } = this.element.transform

    // ✅ APPLIQUER LE MÊME CENTRAGE MANUEL QUE L'ÉDITEUR
    this.applyManualCenteringToText(this.originalText, width, height)

    console.log('🎯 Texte final centré avec centrage MANUEL RADICAL')
  }

  /**
   * 🔧 CENTRAGE MANUEL POUR N'IMPORTE QUEL TEXTE
   * Version générique de applyManualCentering pour d'autres objets Text
   */
  private applyManualCenteringToText(textElement: Text, bubbleWidth: number, bubbleHeight: number): void {
    console.log('🔧 Application du centrage manuel à un texte externe')

    // ✅ ABANDONNER L'ANCHOR POUR UN CONTRÔLE TOTAL
    textElement.anchor.set(0, 0)

    // ✅ CALCULER LA POSITION MANUELLE
    const position = this.calculateManualCenterPositionForText(textElement, bubbleWidth, bubbleHeight)

    // ✅ APPLIQUER LA POSITION
    textElement.x = position.x
    textElement.y = position.y

    // ✅ GARANTIR LA VISIBILITÉ
    textElement.visible = true
    textElement.alpha = 1

    console.log('✅ Centrage manuel appliqué au texte externe:', {
      position,
      textPreview: textElement.text.substring(0, 30) + (textElement.text.length > 30 ? '...' : '')
    })
  }

  /**
   * 📐 CALCUL DE POSITION POUR N'IMPORTE QUEL TEXTE
   */
  private calculateManualCenterPositionForText(textElement: Text, bubbleWidth: number, bubbleHeight: number): { x: number, y: number } {
    if (!textElement.text || textElement.text.trim() === '') {
      return {
        x: bubbleWidth / 2,
        y: bubbleHeight / 2 - this.element.bubbleStyle.fontSize / 2
      }
    }

    // ✅ MESURE AVEC TEXTE TEMPORAIRE
    const tempText = new Text({
      text: textElement.text,
      style: textElement.style
    })

    tempText.getBounds()
    const textWidth = tempText.width
    const textHeight = tempText.height
    tempText.destroy()

    return {
      x: (bubbleWidth - textWidth) / 2,
      y: (bubbleHeight - textHeight) / 2
    }
  }

  private finishEditingAndDeselect(): void {
    console.log('🔤 Fin édition ET désélection de la bulle')

    // ✅ D'ABORD TERMINER L'ÉDITION NORMALEMENT
    this.finishEditing()

    // ✅ PUIS DÉSÉLECTIONNER LA BULLE
    // Déclencher la désélection via l'application PixiJS
    if (this.element.pixiApp && this.element.pixiApp.setSelectedElement) {
      this.element.pixiApp.setSelectedElement(null)
      console.log('✅ Bulle désélectionnée après fin d\'édition')
    }
  }

  private cleanupEventListeners(): void {
    if (this.keyboardListener) {
      window.removeEventListener('keydown', this.keyboardListener)
      this.keyboardListener = undefined
    }

    if (this.clickListener) {
      window.removeEventListener('click', this.clickListener, true)
      this.clickListener = undefined
    }

    // ✅ ARRÊTER LA SURVEILLANCE DU REDIMENSIONNEMENT
    this.stopResizeWatcher()
  }

  private cancelEditing(): void {
    console.log('🔤 Édition annulée')

    this.isActive = false
    this.stopCursorBlink()

    // ✅ NETTOYAGE COMPLET DES ÉVÉNEMENTS
    this.cleanupEventListeners()

    // Remettre le texte original visible SANS sauvegarder
    this.originalText.visible = true

    // Se supprimer du parent sans sauvegarder
    if (this.parent) {
      this.parent.removeChild(this)
    }

    this.destroy()
  }

  public destroy(): void {
    this.stopCursorBlink()

    // ✅ NETTOYER TOUS LES TIMERS
    if (this.autoSaveTimer) {
      clearTimeout(this.autoSaveTimer)
      this.autoSaveTimer = 0
    }

    // ✅ NETTOYER LE HIGHLIGHT DE SÉLECTION
    if (this.selectionHighlight) {
      this.selectionHighlight.destroy()
      this.selectionHighlight = undefined
    }

    if (this.keyboardListener) {
      window.removeEventListener('keydown', this.keyboardListener)
    }

    if (this.clickListener) {
      window.removeEventListener('click', this.clickListener, true)
    }

    super.destroy()
  }
}
