'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { PureTextEditor } from './PureTextEditor'
import { useProjectStore } from '@/stores/projectStore'

interface NativeScriptEditorProps {
  projectId: string
  onStatsUpdate?: (stats: any) => void
}

export default function NativeScriptEditor({ projectId, onStatsUpdate }: NativeScriptEditorProps) {
  const { scriptData, updateScriptData } = useProjectStore()
  
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
    })

    editor.onStatsUpdateCallback((content: string) => {
      // Calculate stats in idle time and update React state
      requestIdleCallback(() => {
        const stats = calculateStats(content)
        updateScriptData({ content, stats })
        if (onStatsUpdate) {
          onStatsUpdate(stats)
        }
      }, { timeout: 500 })
    })

    editorRef.current = editor
    setIsInitialized(true)

    return () => {
      editor.destroy()
    }
  }, [scriptData.content, isInitialized, updateScriptData, onStatsUpdate])

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
      else if (/^CHAPITRE\s+\d+\s*:/.test(trimmed)) chapters++
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
    <div className="relative w-full h-full">
      {/* Line Numbers */}
      <div
        ref={lineNumbersRef}
        className="absolute left-0 top-0 w-16 h-full overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, rgba(31, 41, 55, 0.8) 0%, rgba(17, 24, 39, 0.9) 100%)',
          borderRight: '1px solid rgba(75, 85, 99, 0.3)',
          zIndex: 5
        }}
      />

      {/* Editor Container */}
      <div 
        className="absolute left-16 right-0 top-0 bottom-0"
        style={{
          background: 'linear-gradient(180deg, rgba(17, 24, 39, 1) 0%, rgba(31, 41, 55, 0.95) 100%)'
        }}
      >
        {/* Syntax Highlighting Overlay */}
        <div
          ref={overlayRef}
          className="absolute inset-0"
          style={{ zIndex: 10 }}
        />

        {/* Tutorial Placeholder - Conditional Visibility */}
        {(!currentContent || currentContent.trim() === '') && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 15 }}>
            <div className="bg-gray-800/95 backdrop-blur-sm rounded-lg p-3 border border-gray-600/30 shadow-xl max-w-xs mx-4">
              {/* Header ultra-compact */}
              <div className="text-center mb-2">
                <div className="text-base mb-1">📖</div>
                <h3 className="text-white text-sm font-medium mb-1">Structure de Script Manga</h3>
                <p className="text-gray-400 text-xs">Format pour organiser votre histoire</p>
              </div>

              {/* Exemples ultra-compacts avec couleurs */}
              <div className="space-y-1 font-mono text-xs">
                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></div>
                  <span className="text-red-400 font-medium">PAGE 1:</span>
                  <span className="text-gray-500 text-xs">Nouvelle page</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full flex-shrink-0"></div>
                  <span className="text-purple-400 font-medium">CHAPITRE 1: Titre</span>
                  <span className="text-gray-500 text-xs">Chapitre</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full flex-shrink-0"></div>
                  <span className="text-yellow-400 font-medium">PANEL 1:</span>
                  <span className="text-gray-500 text-xs">Case</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <span className="text-blue-400 font-medium">[HÉROS]: Dialogue</span>
                  <span className="text-gray-500 text-xs">Paroles</span>
                </div>

                <div className="flex items-center space-x-1.5">
                  <div className="w-1.5 h-1.5 bg-gray-500 rounded-full flex-shrink-0"></div>
                  <span className="text-gray-400 font-medium">(Description)</span>
                  <span className="text-gray-500 text-xs">Action</span>
                </div>
              </div>

              {/* Call to action ultra-compact */}
              <div className="text-center mt-2 pt-1.5 border-t border-gray-600/20">
                <p className="text-gray-400 text-xs">
                  Cliquez pour commencer à écrire
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
