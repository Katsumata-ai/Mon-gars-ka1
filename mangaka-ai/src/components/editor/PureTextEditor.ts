/**
 * Pure DOM Text Editor - Zero React Overhead
 * Achieves native performance by bypassing React entirely for input handling
 */

export interface SyntaxHighlightRule {
  regex: RegExp
  color: string
  fontWeight?: string
}

export class PureTextEditor {
  private textarea: HTMLTextAreaElement
  private overlay: HTMLDivElement
  private lineNumbers: HTMLDivElement
  private content: string = ''
  private isInitialized: boolean = false
  
  // Syntax highlighting rules
  private syntaxRules: SyntaxHighlightRule[] = [
    { regex: /^CHAPITRE\s+\d+\s*:/gm, color: '#a855f7', fontWeight: '600' },
    { regex: /^PAGE\s+\d+\s*:/gm, color: '#ef4444', fontWeight: '600' },
    { regex: /^PANEL\s+\d+\s*:/gm, color: '#f59e0b', fontWeight: '600' },
    { regex: /^\(.*\)$/gm, color: '#9ca3af', fontWeight: '400' }
  ]

  // Callbacks
  private onContentChange?: (content: string) => void
  private onStatsUpdate?: (content: string) => void

  constructor(
    textareaElement: HTMLTextAreaElement,
    overlayElement: HTMLDivElement,
    lineNumbersElement: HTMLDivElement
  ) {
    this.textarea = textareaElement
    this.overlay = overlayElement
    this.lineNumbers = lineNumbersElement
    this.init()
  }

  private init() {
    if (this.isInitialized) return
    
    // Configure textarea for maximum performance with custom scrollbar
    this.textarea.style.cssText = `
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      padding: 16px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 14px;
      line-height: 26px;
      color: transparent;
      background: transparent;
      border: none;
      outline: none;
      resize: none;
      overflow: auto;
      caret-color: #3b82f6;
      z-index: 20;
      tab-size: 2;
      white-space: pre-wrap;
      word-wrap: break-word;
      scrollbar-width: thin;
      scrollbar-color: #6b7280 #374151;
    `

    // Apply custom scrollbar styles for webkit browsers
    const style = document.createElement('style')
    style.textContent = `
      .pure-text-editor-textarea::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      .pure-text-editor-textarea::-webkit-scrollbar-track {
        background: #374151;
        border-radius: 3px;
      }

      .pure-text-editor-textarea::-webkit-scrollbar-thumb {
        background: #6b7280;
        border-radius: 3px;
        transition: background-color 0.2s ease;
      }

      .pure-text-editor-textarea::-webkit-scrollbar-thumb:hover {
        background: #9ca3af;
      }

      .pure-text-editor-textarea::-webkit-scrollbar-corner {
        background: #374151;
      }
    `
    document.head.appendChild(style)

    // Add class for scrollbar styling
    this.textarea.classList.add('pure-text-editor-textarea')

    // No placeholder needed - using UI overlay instead
    this.textarea.placeholder = ''

    // Configure overlay
    this.overlay.style.cssText = `
      position: absolute;
      inset: 0;
      padding: 16px;
      font-family: ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace;
      font-size: 14px;
      line-height: 26px;
      white-space: pre-wrap;
      word-wrap: break-word;
      pointer-events: none;
      overflow: hidden;
      z-index: 10;
    `

    // Bind events with pure DOM (no React synthetic events)
    this.bindEvents()
    this.isInitialized = true
  }

  private bindEvents() {
    // Ultra-fast input handler - pure DOM
    this.textarea.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement
      this.content = target.value
      
      // Immediate callback for React state (if needed)
      if (this.onContentChange) {
        this.onContentChange(this.content)
      }
      
      // Schedule syntax highlighting for next frame
      this.scheduleHighlighting()
    }, { passive: true })

    // Enhanced scroll synchronization with better performance
    let scrollTimeout: number | null = null
    this.textarea.addEventListener('scroll', () => {
      const scrollTop = this.textarea.scrollTop

      // Clear previous timeout to avoid excessive updates
      if (scrollTimeout) {
        cancelAnimationFrame(scrollTimeout)
      }

      // Use requestAnimationFrame for smooth synchronization
      scrollTimeout = requestAnimationFrame(() => {
        this.overlay.scrollTop = scrollTop
        this.lineNumbers.scrollTop = scrollTop
        scrollTimeout = null
      })
    }, { passive: true })

    // Lightweight focus handlers
    this.textarea.addEventListener('focus', () => {
      this.textarea.style.caretColor = '#3b82f6'
    }, { passive: true })

    this.textarea.addEventListener('blur', () => {
      // Schedule stats update when user stops typing
      this.scheduleStatsUpdate()
    }, { passive: true })

    // Navigation key handlers for smart scrolling
    this.textarea.addEventListener('keydown', (e) => {
      const navigationKeys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'PageUp', 'PageDown', 'Home', 'End'
      ]

      if (navigationKeys.includes(e.key)) {
        // Delay to allow cursor position to update
        setTimeout(() => this.ensureCursorVisible(), 10)
      }
    }, { passive: true })

    // Click handler to ensure cursor visibility
    this.textarea.addEventListener('click', () => {
      setTimeout(() => this.ensureCursorVisible(), 10)
    }, { passive: true })
  }

  private scheduleHighlighting() {
    // Use requestIdleCallback for non-blocking syntax highlighting
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => this.updateSyntaxHighlighting(), { timeout: 50 })
    } else {
      // Fallback for browsers without requestIdleCallback
      setTimeout(() => this.updateSyntaxHighlighting(), 16)
    }
  }

  private scheduleStatsUpdate() {
    // Debounce stats update (non-critical)
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        if (this.onStatsUpdate) {
          this.onStatsUpdate(this.content)
        }
      }, { timeout: 100 })
    }
  }

  private updateSyntaxHighlighting() {
    const lines = this.content.split('\n')
    const highlightedLines: string[] = []

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const highlightedLine = this.escapeHtml(line || '\u00A0')
      let color = '#e5e7eb'
      let fontWeight = '400'

      const trimmed = line.trim()

      // Détection manuelle pour plus de fiabilité
      if (/^CHAPITRE\s+\d+\s*:/.test(trimmed)) {
        color = '#a855f7' // Violet
        fontWeight = '600'
      } else if (/^PAGE\s+\d+\s*:/.test(trimmed)) {
        color = '#ef4444' // Rouge
        fontWeight = '600'
      } else if (/^PANEL\s+\d+\s*:/.test(trimmed)) {
        color = '#f59e0b' // Jaune
        fontWeight = '600'
      } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
        color = '#9ca3af' // Gris pour descriptions
        fontWeight = '400'
      } else if (this.isDialogue(trimmed)) {
        color = '#3b82f6' // Bleu pour dialogues
        fontWeight = '500'
      }

      highlightedLines.push(
        `<div style="line-height: 26px; color: ${color}; font-weight: ${fontWeight}; min-height: 26px;">${highlightedLine}</div>`
      )
    }

    // Update overlay content
    this.overlay.innerHTML = highlightedLines.join('')
  }

  private isDialogue(line: string): boolean {
    // Dialogue avec crochets : [PERSONNAGE] : ou [PERSONNAGE]:
    if (/^\[.+\]\s*:/.test(line)) {
      return true
    }

    // Dialogue direct : HÉROS: ou MARIE CLAIRE:
    // Commence par une majuscule, peut contenir des espaces et accents, se termine par :
    if (/^[A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ][A-ZÀÂÄÉÈÊËÏÎÔÖÙÛÜŸÇ\s]*\s*:/.test(line)) {
      return true
    }

    return false
  }

  private updateLineNumbers() {
    const lineCount = this.content.split('\n').length
    const lineNumbersHtml: string[] = []

    for (let i = 1; i <= Math.max(lineCount, 20); i++) {
      lineNumbersHtml.push(
        `<div style="height: 26px; line-height: 26px; text-align: right; padding-right: 12px; color: #6b7280; font-size: 12px;">${i}</div>`
      )
    }

    this.lineNumbers.innerHTML = lineNumbersHtml.join('')
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div')
    div.textContent = text
    return div.innerHTML
  }

  // Public API
  public setContent(content: string) {
    this.content = content
    this.textarea.value = content
    this.updateSyntaxHighlighting()
    this.updateLineNumbers()
  }

  public getContent(): string {
    return this.content
  }

  public insertAtCursor(text: string) {
    const start = this.textarea.selectionStart
    const end = this.textarea.selectionEnd
    const before = this.content.substring(0, start)
    const after = this.content.substring(end)
    
    this.content = before + text + after
    this.textarea.value = this.content
    
    // Restore cursor position
    const newPosition = start + text.length
    this.textarea.setSelectionRange(newPosition, newPosition)
    this.textarea.focus()
    
    // Update highlighting
    this.scheduleHighlighting()
    
    // Notify React if needed
    if (this.onContentChange) {
      this.onContentChange(this.content)
    }

    // Ensure cursor remains visible after insertion
    setTimeout(() => this.ensureCursorVisible(), 50)
  }

  public focus() {
    this.textarea.focus()
  }

  public getCurrentLine(): number {
    const cursorPosition = this.textarea.selectionStart
    const textBeforeCursor = this.content.substring(0, cursorPosition)
    return textBeforeCursor.split('\n').length
  }

  public ensureCursorVisible() {
    const currentLine = this.getCurrentLine()
    const lineHeight = 26
    const textareaHeight = this.textarea.clientHeight
    const currentScrollTop = this.textarea.scrollTop

    // Calculate visible range
    const visibleStartLine = Math.floor(currentScrollTop / lineHeight) + 1
    const visibleEndLine = Math.floor((currentScrollTop + textareaHeight) / lineHeight)

    // Check if cursor is outside visible area
    if (currentLine < visibleStartLine || currentLine > visibleEndLine) {
      // Scroll to center the current line
      const targetScrollTop = Math.max(0, (currentLine - 1) * lineHeight - textareaHeight / 2)

      // Smooth scroll to cursor position
      const distance = targetScrollTop - currentScrollTop
      const duration = 200 // Shorter duration for cursor following
      const startTime = performance.now()

      const animateScroll = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)
        const easedProgress = easeOutCubic(progress)

        const newScrollTop = currentScrollTop + distance * easedProgress
        this.textarea.scrollTop = newScrollTop

        // Synchronize overlay and line numbers
        this.overlay.scrollTop = newScrollTop
        this.lineNumbers.scrollTop = newScrollTop

        if (progress < 1) {
          requestAnimationFrame(animateScroll)
        }
      }

      requestAnimationFrame(animateScroll)
    }
  }

  public scrollToLine(lineNumber: number) {
    const lines = this.content.split('\n')
    const position = lines.slice(0, lineNumber).join('\n').length + (lineNumber > 0 ? 1 : 0)

    // Set cursor position
    this.textarea.setSelectionRange(position, position)
    this.textarea.focus()

    // Improved scroll calculation with better centering
    const lineHeight = 26
    const textareaHeight = this.textarea.clientHeight
    const targetScrollTop = Math.max(0, (lineNumber - 1) * lineHeight - textareaHeight / 2)

    // Smooth scroll animation
    const currentScrollTop = this.textarea.scrollTop
    const distance = targetScrollTop - currentScrollTop
    const duration = 300 // ms
    const startTime = performance.now()

    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      // Easing function for smooth animation
      const easeInOutCubic = (t: number) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
      const easedProgress = easeInOutCubic(progress)

      const newScrollTop = currentScrollTop + distance * easedProgress
      this.textarea.scrollTop = newScrollTop

      // Synchronize overlay and line numbers immediately
      this.overlay.scrollTop = newScrollTop
      this.lineNumbers.scrollTop = newScrollTop

      if (progress < 1) {
        requestAnimationFrame(animateScroll)
      }
    }

    requestAnimationFrame(animateScroll)
  }

  // Callback setters
  public onContentChangeCallback(callback: (content: string) => void) {
    this.onContentChange = callback
  }

  public onStatsUpdateCallback(callback: (content: string) => void) {
    this.onStatsUpdate = callback
  }

  // Cleanup
  public destroy() {
    // Remove event listeners if needed
    this.isInitialized = false
  }
}
