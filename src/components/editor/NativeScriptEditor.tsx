'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { PureTextEditor } from './PureTextEditor'
import { useProjectStore } from '@/stores/projectStore'

interface NativeScriptEditorProps {
  projectId: string
  onStatsUpdate?: (stats: any) => void
  onContentChange?: (content: string) => void // ✅ NOUVEAU : Callback pour notifier les changements de contenu
}

export default function NativeScriptEditor({ projectId, onStatsUpdate, onContentChange }: NativeScriptEditorProps) {
  const { scriptData } = useProjectStore()
  
  // Refs for DOM elements
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<PureTextEditor | null>(null)
  
  // Minimal React state (only for UI updates)
  const [isInitialized, setIsInitialized] = useState(false)
  // Real-time content state for placeholder visibility
  const [currentContent, setCurrentContent] = useState(scriptData.content || '')

  // Initialize pure DOM editor
  useEffect(() => {
    if (!textareaRef.current || !overlayRef.current || !lineNumbersRef.current || isInitialized) {
      return
    }

    // Create pure DOM editor instance
    const editor = new PureTextEditor(
      textareaRef.current,
      overlayRef.current,
      lineNumbersRef.current
    )

    // Set initial content
    editor.setContent(scriptData.content || '')

    // Setup callbacks for React integration (minimal)
    editor.onContentChangeCallback((content: string) => {
      // Update current content immediately for placeholder visibility
      setCurrentContent(content)

      // ✅ CORRECTION : Notifier le parent des changements de contenu
      if (onContentChange) {
        onContentChange(content)
      }
    })

    editor.onStatsUpdateCallback((content: string) => {
      // ✅ CORRECTION : Ne plus mettre à jour le store directement, laisser le parent s'en charger
      requestIdleCallback(() => {
        console.log('📊 NativeScriptEditor: Content changed, notifying parent')
        const stats = calculateStats(content)
        if (onStatsUpdate) {
          onStatsUpdate(stats)
        }
        // Le parent (ScriptEditorPanel) se chargera de mettre à jour le store avec le fileTree
      }, { timeout: 500 })
    })

    editorRef.current = editor
    setIsInitialized(true)

    return () => {
      editor.destroy()
    }
  }, [scriptData.content, isInitialized, onStatsUpdate, onContentChange])

  // Sync content when store changes (external updates)
  useEffect(() => {
    if (editorRef.current && scriptData.content !== editorRef.current.getContent()) {
      editorRef.current.setContent(scriptData.content || '')
      setCurrentContent(scriptData.content || '')
    }
  }, [scriptData.content])

  // Calculate stats function (moved outside React render cycle)
  const calculateStats = useCallback((content: string) => {
    const lines = content.split('\n')
    let pages = 0, panels = 0, chapters = 0, dialogues = 0

    for (const line of lines) {
      const trimmed = line.trim()
      if (/^PAGE\s+\d+\s*:/.test(trimmed)) pages++
      else if (/^CHAPTER\s+\d+\s*:/.test(trimmed)) chapters++
      else if (/^PANEL\s+\d+\s*:/.test(trimmed)) panels++
      else if (/^\[.*\]\s*:/.test(trimmed)) dialogues++
    }

    const words = content.match(/\S+/g)?.length || 0
    const characters = content.length

    return { pages, panels, chapters, words, characters, dialogues }
  }, [])

  // Public API for parent components
  const insertAtCursor = useCallback((text: string) => {
    if (editorRef.current) {
      editorRef.current.insertAtCursor(text)
    }
  }, [])

  const scrollToLine = useCallback((lineNumber: number) => {
    if (editorRef.current) {
      editorRef.current.scrollToLine(lineNumber)
    }
  }, [])

  const focus = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.focus()
    }
  }, [])

  const getCurrentLine = useCallback(() => {
    if (editorRef.current) {
      return editorRef.current.getCurrentLine()
    }
    return 1
  }, [])

  const ensureCursorVisible = useCallback(() => {
    if (editorRef.current) {
      editorRef.current.ensureCursorVisible()
    }
  }, [])

  // Expose API to parent
  useEffect(() => {
    if (isInitialized && editorRef.current) {
      // Attach methods to a global ref or context if needed
      (window as any).scriptEditor = {
        insertAtCursor,
        scrollToLine,
        focus,
        getCurrentLine,
        ensureCursorVisible,
        getContent: () => editorRef.current?.getContent() || ''
      }
    }
  }, [isInitialized, insertAtCursor, scrollToLine, focus, getCurrentLine, ensureCursorVisible])

  return (
    <div className="relative w-full h-full" suppressHydrationWarning={true}>
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="absolute left-0 top-0 w-16 h-full overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%)',
          borderRight: '1px solid rgba(75, 85, 99, 0.3)',
          zIndex: 5
        }}
        suppressHydrationWarning={true}
      />

      {/* Editor Container */}
      <div
        className="absolute left-16 right-0 top-0 bottom-0"
        style={{
          background: 'linear-gradient(180deg, rgba(17, 24, 39, 1) 0%, rgba(31, 41, 55, 0.95) 100%)'
        }}
        suppressHydrationWarning={true}
      >
        {/* Syntax Highlighting Overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0"
          style={{ zIndex: 10 }}
          suppressHydrationWarning={true}
        />

        {/* Tutorial Placeholder - Conditional Visibility */}
        {(!currentContent || currentContent.trim() === '') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 15 }} suppressHydrationWarning={true}>
            <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 border border-gray-600/30 shadow-xl max-w-xs mx-4" suppressHydrationWarning={true}>
              {/* Header ultra-compact */}
              <div className="text-center mb-2" suppressHydrationWarning={true}>
                <div className="text-base mb-1" suppressHydrationWarning={true}>📖</div>
                <h3 className="text-white text-sm font-medium mb-1">Manga Script Structure</h3>
                <p className="text-gray-400 text-xs">Format to organize your story</p>
              </div>

              {/* Exemples ultra-compacts avec couleurs */}
              <div className="space-y-1 font-mono text-xs" suppressHydrationWarning={true}>
                <div className="flex items-center space-x-1.5" suppressHydrationWarning={true}>
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0" suppressHydrationWarning={true}></div>
                  <span className="text-red-400 font-medium">PAGE 1:</span>
                  <span className="text-gray-500 text-xs">New page</span>
                </div>

                <div className="flex items-center space-x-1.5" suppressHydrationWarning={true}>
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0" suppressHydrationWarning={true}></div>
                  <span className="text-purple-400 font-medium">CHAPTER 1: Title</span>
                  <span className="text-gray-500 text-xs">Chapter</span>
                </div>

                <div className="flex items-center space-x-1.5" suppressHydrationWarning={true}>
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full flex-shrink-0" suppressHydrationWarning={true}></div>
                  <span className="text-yellow-400 font-medium">PANEL 1:</span>
                  <span className="text-gray-500 text-xs">Panel</span>
                </div>

                <div className="flex items-center space-x-1.5" suppressHydrationWarning={true}>
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0" suppressHydrationWarning={true}></div>
                  <span className="text-blue-400 font-medium">[HERO]: Dialogue</span>
                  <span className="text-gray-500 text-xs">Character speech</span>
                </div>

                <div className="flex items-center space-x-1.5" suppressHydrationWarning={true}>
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full flex-shrink-0" suppressHydrationWarning={true}></div>
                  <span className="text-gray-400 font-medium">(Description)</span>
                  <span className="text-gray-500 text-xs">Action</span>
                </div>
              </div>

              {/* Call to action ultra-compact */}
              <div className="text-center mt-2 pt-1.5 border-t border-gray-600/20" suppressHydrationWarning={true}>
                <p className="text-gray-400 text-xs">
                  Click to start writing
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Pure DOM Textarea */}
        <textarea
          ref={textareaRef}
          className="absolute inset-0"
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          style={{ zIndex: 20 }}
        />
      </div>
    </div>
  )
}
