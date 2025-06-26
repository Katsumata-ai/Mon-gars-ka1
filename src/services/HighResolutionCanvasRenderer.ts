// Renderer Canvas 2D haute résolution pour l'export
// Adapté pour SimpleCanvasEditor + éléments HTML

import type { 
  PageData, 
  ExportPageData, 
  RenderConfig, 
  ElementRenderResult 
} from '@/types/export.types'
import type { 
  PanelElement, 
  DialogueElement, 
  TextElement 
} from '@/components/assembly/types/assembly.types'
import { CrossOriginImageLoader } from './CrossOriginImageLoader'

export class HighResolutionCanvasRenderer {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private config: RenderConfig
  private imageLoader: CrossOriginImageLoader

  constructor(
    width: number, 
    height: number, 
    scale: number = 3,
    imageLoader?: CrossOriginImageLoader
  ) {
    this.config = {
      width,
      height,
      scale,
      quality: 1.0,
      backgroundColor: '#ffffff'
    }

    this.imageLoader = imageLoader || new CrossOriginImageLoader()
    this.initializeCanvas()
  }

  /**
   * Initialise le canvas haute résolution
   */
  private initializeCanvas(): void {
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.config.width * this.config.scale
    this.canvas.height = this.config.height * this.config.scale

    this.ctx = this.canvas.getContext('2d')!
    
    // Configuration haute qualité
    this.ctx.scale(this.config.scale, this.config.scale)
    this.ctx.imageSmoothingEnabled = true
    this.ctx.imageSmoothingQuality = 'high'
    this.ctx.textBaseline = 'top'
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
  }

  /**
   * Rend une page complète
   */
  async renderPage(pageData: PageData, onProgress?: (progress: number) => void): Promise<HTMLCanvasElement> {
    // Nettoyer le canvas
    this.clearCanvas()

    // Préparer les données
    const preparedData = this.preparePageData(pageData)
    const totalElements = this.getTotalElementCount(preparedData)
    
    if (totalElements === 0) {
      onProgress?.(1)
      return this.canvas
    }

    let processedElements = 0

    // Rendu par couches (ordre important)
    
    // 1. Panels (arrière-plan)
    for (const panel of preparedData.elements.panels) {
      await this.renderPanel(panel)
      processedElements++
      onProgress?.(processedElements / totalElements)
    }

    // 2. Bulles de dialogue (milieu)
    for (const bubble of preparedData.elements.bubbles) {
      await this.renderBubble(bubble)
      processedElements++
      onProgress?.(processedElements / totalElements)
    }

    // 3. Textes libres (premier plan)
    for (const text of preparedData.elements.texts) {
      await this.renderText(text)
      processedElements++
      onProgress?.(processedElements / totalElements)
    }

    return this.canvas
  }

  /**
   * Nettoie le canvas
   */
  private clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.config.width, this.config.height)
    
    // Fond blanc
    this.ctx.fillStyle = this.config.backgroundColor
    this.ctx.fillRect(0, 0, this.config.width, this.config.height)
  }

  /**
   * Rend un panel avec son image
   */
  private async renderPanel(panel: PanelElement): Promise<ElementRenderResult> {
    try {
      const { x, y, width, height } = panel.transform
      const style = panel.panelStyle

      // Dessiner le fond du panel si défini
      if (style.fillColor !== null && style.fillColor !== undefined) {
        this.ctx.fillStyle = `#${style.fillColor.toString(16).padStart(6, '0')}`
        this.ctx.globalAlpha = style.fillAlpha || 1

        switch (style.shape) {
          case 'rectangle':
            this.ctx.fillRect(x, y, width, height)
            break
          case 'circle':
            this.ctx.beginPath()
            this.ctx.arc(x + width/2, y + height/2, Math.min(width, height)/2, 0, 2 * Math.PI)
            this.ctx.fill()
            break
          default:
            this.ctx.fillRect(x, y, width, height)
        }

        this.ctx.globalAlpha = 1
      }

      // Charger et dessiner l'image si présente
      const imageUrl = (panel as any).imageUrl || (panel as any).imageData?.src
      if (imageUrl) {
        try {
          const image = await this.imageLoader.loadImage(imageUrl)

          // Sauvegarder le contexte pour le clipping
          this.ctx.save()

          // Créer un chemin de clipping selon la forme
          this.createClippingPath(x, y, width, height, style.shape)
          this.ctx.clip()

          // Dessiner l'image avec ajustement
          this.drawImageFitted(image, x, y, width, height)

          // Restaurer le contexte
          this.ctx.restore()
        } catch (error) {
          console.warn(`Impossible de charger l'image du panel ${panel.id}:`, error)
          this.drawImagePlaceholder(x, y, width, height)
        }
      }

      // Dessiner le contour noir très épais du panel (fidèle au canvas)
      this.ctx.strokeStyle = '#000000' // Toujours noir comme dans le canvas
      this.ctx.lineWidth = 6 // Contour très épais pour correspondre au canvas

      // Gestion des formes
      switch (style.shape) {
        case 'rectangle':
          this.ctx.strokeRect(x, y, width, height)
          break
        case 'circle':
          this.drawCircle(x + width/2, y + height/2, Math.min(width, height)/2, false)
          break
        default:
          this.ctx.strokeRect(x, y, width, height)
      }

      return { success: true, bounds: { x, y, width, height } }
    } catch (error) {
      console.error(`Erreur rendu panel ${panel.id}:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Rend une bulle de dialogue
   */
  private async renderBubble(bubble: DialogueElement): Promise<ElementRenderResult> {
    try {
      const { x, y, width, height } = bubble.transform
      const style = bubble.dialogueStyle

      // Dessiner la forme de la bulle
      this.drawBubbleShape(x, y, width, height, style)

      // Rendre le texte
      await this.renderBubbleText(bubble, x, y, width, height)

      return { success: true, bounds: { x, y, width, height } }
    } catch (error) {
      console.error(`Erreur rendu bulle ${bubble.id}:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Rend un texte libre
   */
  private async renderText(text: TextElement): Promise<ElementRenderResult> {
    try {
      const { x, y, width, height } = text.transform
      const style = text.textStyle

      // Validation des propriétés de style
      const fontSize = style.fontSize || 16
      const fontFamily = style.fontFamily || 'Arial, sans-serif'
      const textColor = style.textColor || '#000000'
      const textAlign = style.textAlign || 'left'

      // Configuration du texte
      this.ctx.font = `${fontSize}px ${fontFamily}`

      // Gestion de la couleur (peut être string ou number)
      if (typeof textColor === 'string') {
        this.ctx.fillStyle = textColor.startsWith('#') ? textColor : `#${textColor}`
      } else {
        this.ctx.fillStyle = `#${textColor.toString(16).padStart(6, '0')}`
      }

      this.ctx.textAlign = textAlign as CanvasTextAlign

      // Récupérer le contenu du texte (supprimer les balises HTML)
      let textContent = text.text || (text as any).content || ''

      // Si c'est du HTML, extraire le texte sans les balises
      if (typeof textContent === 'string' && textContent.includes('<') && textContent.includes('>')) {
        textContent = this.extractTextFromTipTap(textContent)
      }

      // Rendu multi-ligne avec wrapping
      this.renderWrappedText(textContent, x, y, width, {
        fontSize,
        fontFamily,
        textAlign
      })

      return { success: true, bounds: { x, y, width, height } }
    } catch (error) {
      console.error(`Erreur rendu texte ${text.id}:`, error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Dessine une forme de bulle avec queue (comme dans l'interface)
   */
  private drawBubbleShape(x: number, y: number, width: number, height: number, style: any): void {
    this.ctx.save()

    // Couleur de fond
    this.ctx.fillStyle = `#${style.backgroundColor.toString(16).padStart(6, '0')}`

    // Contour
    this.ctx.strokeStyle = `#${style.outlineColor.toString(16).padStart(6, '0')}`
    this.ctx.lineWidth = style.outlineWidth

    // Dessiner la bulle principale selon le type
    this.ctx.beginPath()

    switch (style.type) {
      case 'thought':
        this.drawThoughtBubbleWithQueue(x, y, width, height, style)
        break
      case 'shout':
        this.drawShoutBubbleWithQueue(x, y, width, height, style)
        break
      default: // speech
        this.drawSpeechBubbleWithQueue(x, y, width, height, style)
    }

    this.ctx.fill()
    this.ctx.stroke()
    this.ctx.restore()
  }

  /**
   * Dessine une bulle de dialogue avec queue (forme ovale + triangle)
   */
  private drawSpeechBubbleWithQueue(x: number, y: number, width: number, height: number, style: any): void {
    const centerX = x + width/2
    const centerY = y + height/2
    const radiusX = width/2
    const radiusY = height/2

    // Récupérer les paramètres de queue
    const queueConfig = style.queue || {}
    const angle = (queueConfig.angle || style.tailAngleDegrees || 225) * Math.PI / 180
    const length = queueConfig.length || style.tailLength || 40
    const thickness = queueConfig.thickness || 16

    // Calculer le point d'attache sur l'ellipse
    const attachX = centerX + Math.cos(angle) * radiusX * 0.9
    const attachY = centerY + Math.sin(angle) * radiusY * 0.9

    // Point de la pointe de la queue
    const tipX = attachX + Math.cos(angle) * length
    const tipY = attachY + Math.sin(angle) * length

    // Dessiner la forme unifiée (ellipse + queue)
    this.drawUnifiedEllipseWithQueue(centerX, centerY, radiusX, radiusY, attachX, attachY, tipX, tipY, thickness)
  }

  /**
   * Dessine une bulle de pensée avec queue (forme ovale + petites bulles)
   */
  private drawThoughtBubbleWithQueue(x: number, y: number, width: number, height: number, style: any): void {
    const centerX = x + width/2
    const centerY = y + height/2
    const radiusX = width/2
    const radiusY = height/2

    // Bulle principale (ellipse)
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)

    // Petites bulles de pensée (simplifiées pour l'export)
    const queueConfig = style.queue || {}
    const angle = (queueConfig.angle || style.tailAngleDegrees || 225) * Math.PI / 180
    const length = queueConfig.length || style.tailLength || 40

    // Première petite bulle
    const bubble1X = centerX + Math.cos(angle) * radiusX * 1.2
    const bubble1Y = centerY + Math.sin(angle) * radiusY * 1.2
    this.ctx.moveTo(bubble1X + 8, bubble1Y)
    this.ctx.arc(bubble1X, bubble1Y, 8, 0, 2 * Math.PI)

    // Deuxième petite bulle
    const bubble2X = bubble1X + Math.cos(angle) * 20
    const bubble2Y = bubble1Y + Math.sin(angle) * 20
    this.ctx.moveTo(bubble2X + 5, bubble2Y)
    this.ctx.arc(bubble2X, bubble2Y, 5, 0, 2 * Math.PI)
  }

  /**
   * Dessine une bulle de cri (forme étoilée, pas de queue)
   */
  private drawShoutBubbleWithQueue(x: number, y: number, width: number, height: number, style: any): void {
    const centerX = x + width/2
    const centerY = y + height/2
    const radiusX = width/2
    const radiusY = height/2

    // Forme en étoile (8 pointes)
    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI) / 8
      const radius = i % 2 === 0 ? 1 : 0.7
      const px = centerX + Math.cos(angle) * radiusX * radius
      const py = centerY + Math.sin(angle) * radiusY * radius

      if (i === 0) {
        this.ctx.moveTo(px, py)
      } else {
        this.ctx.lineTo(px, py)
      }
    }
    this.ctx.closePath()
  }

  /**
   * Dessine une ellipse unifiée avec queue triangulaire (comme dans l'interface)
   */
  private drawUnifiedEllipseWithQueue(
    centerX: number, centerY: number, radiusX: number, radiusY: number,
    attachX: number, attachY: number, tipX: number, tipY: number, thickness: number
  ): void {
    // Calculer les points de base de la queue
    const queueAngle = Math.atan2(tipY - attachY, tipX - attachX)
    const perpAngle = queueAngle + Math.PI / 2

    const halfThickness = thickness / 2
    const basePoint1X = attachX + Math.cos(perpAngle) * halfThickness
    const basePoint1Y = attachY + Math.sin(perpAngle) * halfThickness
    const basePoint2X = attachX - Math.cos(perpAngle) * halfThickness
    const basePoint2Y = attachY - Math.sin(perpAngle) * halfThickness

    // Dessiner l'ellipse principale
    this.ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, 2 * Math.PI)

    // Ajouter la queue triangulaire
    this.ctx.moveTo(basePoint1X, basePoint1Y)
    this.ctx.lineTo(tipX, tipY)
    this.ctx.lineTo(basePoint2X, basePoint2Y)

    // Connecter de manière fluide à l'ellipse
    this.ctx.lineTo(basePoint1X, basePoint1Y)
  }

  /**
   * Utilitaires de dessin
   */
  private drawRoundedRect(x: number, y: number, width: number, height: number, radius: number): void {
    this.ctx.beginPath()
    this.ctx.moveTo(x + radius, y)
    this.ctx.lineTo(x + width - radius, y)
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius)
    this.ctx.lineTo(x + width, y + height - radius)
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height)
    this.ctx.lineTo(x + radius, y + height)
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius)
    this.ctx.lineTo(x, y + radius)
    this.ctx.quadraticCurveTo(x, y, x + radius, y)
    this.ctx.closePath()
  }

  private drawCircle(x: number, y: number, radius: number, fill: boolean = true): void {
    this.ctx.beginPath()
    this.ctx.arc(x, y, radius, 0, 2 * Math.PI)
    if (fill) this.ctx.fill()
    this.ctx.stroke()
  }

  /**
   * Prépare les données de page et nettoie les balises HTML
   */
  private preparePageData(pageData: PageData): ExportPageData {
    const elements = pageData.content.stage.children || []



    // ✅ NETTOYAGE AUTOMATIQUE : Éliminer les balises HTML de tous les éléments texte
    const cleanedElements = elements.map(el => {
      if ((el.type === 'dialogue' || el.type === 'text') && (el as any).text) {
        const cleanedText = this.extractTextFromTipTap((el as any).text)
        console.log(`🧹 Nettoyage HTML pour ${el.id}:`, {
          avant: (el as any).text,
          après: cleanedText
        })
        return {
          ...el,
          text: cleanedText
        }
      }
      return el
    })

    const prepared = {
      ...pageData,
      elements: {
        panels: cleanedElements.filter(el => el.type === 'panel') as PanelElement[],
        bubbles: cleanedElements.filter(el => el.type === 'dialogue') as DialogueElement[],
        texts: cleanedElements.filter(el => el.type === 'text') as TextElement[]
      }
    }

    console.log('🔍 Debug - Éléments préparés:', {
      panels: prepared.elements.panels.length,
      bubbles: prepared.elements.bubbles.length,
      texts: prepared.elements.texts.length
    })

    return prepared
  }

  private getTotalElementCount(data: ExportPageData): number {
    return data.elements.panels.length +
           data.elements.bubbles.length +
           data.elements.texts.length
  }

  /**
   * Crée un chemin de clipping selon la forme
   */
  private createClippingPath(x: number, y: number, width: number, height: number, shape: string): void {
    this.ctx.beginPath()
    switch (shape) {
      case 'circle':
        this.ctx.arc(x + width/2, y + height/2, Math.min(width, height)/2, 0, 2 * Math.PI)
        break
      default:
        this.ctx.rect(x, y, width, height)
    }
  }

  /**
   * Dessine une image ajustée dans un rectangle (mode cover - fidèle au canvas)
   */
  private drawImageFitted(image: HTMLImageElement, x: number, y: number, width: number, height: number): void {
    // Utiliser la même logique que dans l'interface Konva/Polotno
    // Mode "cover" : l'image remplit tout l'espace (peut être coupée)
    const scaleX = width / image.width
    const scaleY = height / image.height
    const scale = Math.max(scaleX, scaleY) // Cover (remplit tout l'espace)

    const scaledWidth = image.width * scale
    const scaledHeight = image.height * scale

    // Centrer l'image dans le panel
    const offsetX = (width - scaledWidth) / 2
    const offsetY = (height - scaledHeight) / 2

    // Dessiner l'image avec la même logique que le canvas
    this.ctx.drawImage(
      image,
      x + offsetX,
      y + offsetY,
      scaledWidth,
      scaledHeight
    )
  }

  /**
   * Dessine un placeholder pour image manquante
   */
  private drawImagePlaceholder(x: number, y: number, width: number, height: number): void {
    // Fond gris clair
    this.ctx.fillStyle = '#f0f0f0'
    this.ctx.fillRect(x, y, width, height)

    // Bordure
    this.ctx.strokeStyle = '#cccccc'
    this.ctx.lineWidth = 1
    this.ctx.strokeRect(x, y, width, height)

    // Texte centré
    this.ctx.fillStyle = '#666666'
    this.ctx.font = '14px Arial, sans-serif'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('Image non disponible', x + width/2, y + height/2)
  }

  /**
   * Rend le texte d'une bulle (style manga comme dans l'interface)
   */
  private async renderBubbleText(bubble: DialogueElement, x: number, y: number, width: number, height: number): Promise<void> {
    const style = bubble.dialogueStyle

    // Validation des propriétés de style (comme dans l'interface TipTap)
    const fontSize = Math.max(style.fontSize || 16, 20) // Minimum 20px comme dans l'interface
    const fontFamily = 'Comic Sans MS, Bangers, Roboto, system-ui, sans-serif' // Police manga
    const textColor = style.textColor || 0x000000

    // Style selon le type de bulle
    let fontWeight = '700' // Bold par défaut
    let textTransform = 'none'
    let letterSpacing = '0.02em'

    switch (style.type) {
      case 'shout':
        fontWeight = '900' // Extra bold pour les cris
        textTransform = 'uppercase'
        letterSpacing = '0.05em'
        break
      case 'thought':
        fontWeight = '600' // Semi-bold pour les pensées
        break
    }

    // Configuration du texte
    this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`
    this.ctx.fillStyle = `#${textColor.toString(16).padStart(6, '0')}`
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'

    // Ombre de texte pour meilleure lisibilité (comme dans l'interface)
    this.ctx.shadowColor = 'rgba(255, 255, 255, 0.8)'
    this.ctx.shadowBlur = style.type === 'shout' ? 2 : 1
    this.ctx.shadowOffsetX = 0
    this.ctx.shadowOffsetY = 0

    // Récupérer le texte de la bulle (nettoyer les balises HTML existantes)
    let textContent = bubble.text || this.extractTextFromTipTap((bubble as any).content) || ''

    // ✅ NETTOYAGE FORCÉ : Éliminer toutes les balises HTML existantes
    textContent = this.extractTextFromTipTap(textContent)

    // Appliquer la transformation de texte
    if (textTransform === 'uppercase') {
      textContent = textContent.toUpperCase()
    }

    // Rendu du texte centré dans la bulle avec espacement
    if (textContent) {
      this.renderBubbleWrappedText(textContent, x + width/2, y + height/2, width * 0.8, {
        fontSize,
        fontFamily,
        letterSpacing
      })
    }

    // Réinitialiser l'ombre
    this.ctx.shadowColor = 'transparent'
    this.ctx.shadowBlur = 0
  }

  /**
   * Extrait le texte brut du contenu TipTap (supprime les balises HTML)
   */
  private extractTextFromTipTap(content: any): string {
    if (typeof content === 'string') {
      // Si c'est du HTML, extraire le texte sans les balises
      if (content.includes('<') && content.includes('>')) {
        // Créer un élément temporaire pour extraire le texte
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = content
        return tempDiv.textContent || tempDiv.innerText || ''
      }
      return content
    }

    if (!content || !content.content) return ''

    let text = ''
    const traverse = (node: any) => {
      if (node.type === 'text') {
        text += node.text || ''
      } else if (node.content) {
        node.content.forEach(traverse)
      }
    }

    content.content.forEach(traverse)
    return text.trim()
  }

  /**
   * Rend du texte centré dans une bulle avec retour à la ligne
   */
  private renderBubbleWrappedText(text: string, centerX: number, centerY: number, maxWidth: number, style: any): void {
    const words = text.split(' ')
    const lineHeight = style.fontSize * 1.3 // Espacement ligne comme dans l'interface
    const lines: string[] = []
    let currentLine = ''

    // Créer les lignes avec retour à la ligne
    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + ' '
      const metrics = this.ctx.measureText(testLine)

      if (metrics.width > maxWidth && currentLine !== '') {
        lines.push(currentLine.trim())
        currentLine = words[i] + ' '
      } else {
        currentLine = testLine
      }
    }

    if (currentLine.trim()) {
      lines.push(currentLine.trim())
    }

    // Centrer verticalement
    const totalHeight = lines.length * lineHeight
    const startY = centerY - (totalHeight / 2) + (lineHeight / 2)

    // Dessiner chaque ligne centrée
    lines.forEach((line, index) => {
      this.ctx.fillText(line, centerX, startY + (index * lineHeight))
    })
  }

  /**
   * Rend du texte avec retour à la ligne
   */
  private renderWrappedText(text: string, x: number, y: number, maxWidth: number, style: any): void {
    const words = text.split(' ')
    const lineHeight = style.fontSize * 1.2
    let line = ''
    let currentY = y

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + ' '
      const metrics = this.ctx.measureText(testLine)

      if (metrics.width > maxWidth && line !== '') {
        this.ctx.fillText(line.trim(), x + maxWidth/2, currentY)
        line = words[i] + ' '
        currentY += lineHeight
      } else {
        line = testLine
      }
    }

    if (line.trim()) {
      this.ctx.fillText(line.trim(), x + maxWidth/2, currentY)
    }
  }

  /**
   * Nettoie les ressources
   */
  dispose(): void {
    // Le canvas sera automatiquement nettoyé par le garbage collector
  }
}
