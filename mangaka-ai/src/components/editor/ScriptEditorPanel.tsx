'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  BookOpen,
  FileText,
  Image,
  MessageSquare,
  Edit3,
  Book,
  Save,
  Download,
  BarChart3
} from 'lucide-react'

// Types pour l'éditeur révolutionnaire
interface ScriptStats {
  pages: number
  panels: number
  chapters: number
  words: number
  characters: number
  dialogues: number
}

interface ScriptElement {
  id: string
  type: 'chapter' | 'page' | 'panel' | 'dialogue' | 'description'
  content: string
  lineNumber: number
  parent?: string
  children?: ScriptElement[]
}

interface FileTreeNode {
  id: string
  type: 'page' | 'chapter' | 'panel' | 'dialogue' | 'description'
  title: string
  content: string
  children: FileTreeNode[]
  expanded: boolean
  lineNumber: number
}

interface ScriptEditorPanelProps {
  projectId: string
  onSave?: (scriptData: any) => void
}

export default function ScriptEditorPanel({ projectId }: ScriptEditorPanelProps) {
  // États principaux
  const [scriptContent, setScriptContent] = useState('CHAPITRE 1 :')
  const [title, setTitle] = useState('Script Sans Titre')
  const [stats, setStats] = useState<ScriptStats>({
    pages: 0,
    panels: 0,
    chapters: 0,
    words: 0,
    characters: 0,
    dialogues: 0
  })
  const [fileTree, setFileTree] = useState<FileTreeNode[]>([])
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isFocused, setIsFocused] = useState(false)

  // Références
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  // Synchronisation du scroll entre l'éditeur et les numéros de ligne
  const handleScroll = useCallback(() => {
    if (editorRef.current && lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = editorRef.current.scrollTop
    }
    if (editorRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = editorRef.current.scrollTop
    }
  }, [])





  // Calcul des statistiques et génération de l'arbre de fichiers
  const calculateStats = useCallback((content: string): ScriptStats => {
    const lines = content.split('\n')

    let pages = 0
    let panels = 0
    let chapters = 0
    let dialogues = 0

    // Génération de l'arbre de fichiers
    const tree: FileTreeNode[] = []
    let currentPage: FileTreeNode | null = null
    let currentChapter: FileTreeNode | null = null
    let currentPanel: FileTreeNode | null = null

    lines.forEach((line, index) => {
      const trimmed = line.trim()

      if (trimmed.startsWith('PAGE ') && trimmed.includes(' :')) {
        pages++
        currentPage = {
          id: `page-${pages}`,
          type: 'page',
          title: `Page ${pages}`,
          content: trimmed,
          children: [],
          expanded: true,
          lineNumber: index
        }
        tree.push(currentPage)
        currentChapter = null
        currentPanel = null
      } else if (trimmed.startsWith('CHAPITRE ') && trimmed.includes(' :')) {
        chapters++
        currentChapter = {
          id: `chapter-${chapters}`,
          type: 'chapter',
          title: `Chapitre ${chapters}`,
          content: trimmed,
          children: [],
          expanded: true,
          lineNumber: index
        }
        if (currentPage) {
          currentPage.children.push(currentChapter)
        }
        currentPanel = null
      } else if (trimmed.startsWith('PANEL ') && trimmed.includes(' :')) {
        panels++
        currentPanel = {
          id: `panel-${panels}`,
          type: 'panel',
          title: `Panel ${panels}`,
          content: trimmed,
          children: [],
          expanded: true,
          lineNumber: index
        }
        if (currentChapter) {
          currentChapter.children.push(currentPanel)
        } else if (currentPage) {
          currentPage.children.push(currentPanel)
        }
      } else if (trimmed.includes(' :') && !trimmed.startsWith('(')) {
        dialogues++
        const dialogueNode: FileTreeNode = {
          id: `dialogue-${dialogues}`,
          type: 'dialogue',
          title: trimmed.substring(0, 30) + '...',
          content: trimmed,
          children: [],
          expanded: false,
          lineNumber: index
        }
        if (currentPanel) {
          currentPanel.children.push(dialogueNode)
        }
      } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
        const descNode: FileTreeNode = {
          id: `desc-${index}`,
          type: 'description',
          title: trimmed.substring(0, 30) + '...',
          content: trimmed,
          children: [],
          expanded: false,
          lineNumber: index
        }
        if (currentPanel) {
          currentPanel.children.push(descNode)
        }
      }
    })

    setFileTree(tree)

    // Initialiser tous les nœuds comme expandus par défaut
    const allNodeIds = new Set<string>()
    tree.forEach(page => {
      allNodeIds.add(page.id)
      page.children.forEach(chapter => {
        allNodeIds.add(chapter.id)
        chapter.children.forEach(panel => {
          allNodeIds.add(panel.id)
        })
      })
    })
    setExpandedNodes(allNodeIds)

    const words = content.split(/\s+/).filter(w => w.length > 0).length
    const characterCount = content.length

    return {
      pages,
      panels,
      chapters,
      words,
      characters: characterCount,
      dialogues
    }
  }, [])

  // Gestion du contenu de l'éditeur
  const handleContentChange = useCallback((content: string) => {
    setScriptContent(content)
    const newStats = calculateStats(content)
    setStats(newStats)
  }, [calculateStats])

  // Fonctions d'insertion intelligentes
  const insertAtCursor = useCallback((text: string) => {
    if (!editorRef.current) return

    const textarea = editorRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentContent = scriptContent

    const newContent = currentContent.substring(0, start) + text + currentContent.substring(end)
    setScriptContent(newContent)
    handleContentChange(newContent)

    // Repositionner le curseur après l'insertion
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)
    }, 0)
  }, [scriptContent, handleContentChange])

  const insertChapter = useCallback(() => {
    const chapterNumber = stats.chapters + 1
    // Chapitre = 1 ligne d'espacement avant
    insertAtCursor(`\n\nCHAPITRE ${chapterNumber} :\n`)
  }, [insertAtCursor, stats.chapters])

  const insertPage = useCallback(() => {
    const pageNumber = stats.pages + 1
    // Page = 2 lignes d'espacement avant
    insertAtCursor(`\n\n\nPAGE ${pageNumber} :\n`)
  }, [insertAtCursor, stats.pages])

  const insertPanel = useCallback(() => {
    const panelNumber = stats.panels + 1
    // Panel = pas d'espacement (collé)
    insertAtCursor(`\nPANEL ${panelNumber} :\n`)
  }, [insertAtCursor, stats.panels])

  const insertDialogue = useCallback(() => {
    // Dialogue = pas d'espacement (collé)
    insertAtCursor(`PERSONNAGE : `)
  }, [insertAtCursor])

  const insertDescription = useCallback(() => {
    // Description = pas d'espacement (collé)
    insertAtCursor(`(Description de l'action)\n`)
  }, [insertAtCursor])

  // Auto-sauvegarde
  const autoSave = useCallback(async () => {
    if (!scriptContent.trim()) return

    setAutoSaving(true)
    try {
      const { error } = await supabase
        .from('manga_scripts')
        .upsert({
          project_id: projectId,
          title: title,
          script_data: {
            content: scriptContent,
            stats: stats,
            fileTree: fileTree
          },
          updated_at: new Date().toISOString()
        })

      if (!error) {
        setLastSaved(new Date())
      }
    } catch (error) {
      console.error('Erreur auto-sauvegarde:', error)
    } finally {
      setAutoSaving(false)
    }
  }, [scriptContent, title, stats, fileTree, projectId, supabase])

  // Fonctions d'export
  const exportToTXT = useCallback(() => {
    const blob = new Blob([scriptContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${title.replace(/\s+/g, '_')}_script.txt`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [scriptContent, title])

  const exportToJSON = useCallback(() => {
    const data = {
      title,
      content: scriptContent,
      stats,
      fileTree: fileTree,
      exportDate: new Date().toISOString()
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${title.replace(/\s+/g, '_')}_script.json`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [scriptContent, title, stats, fileTree])

  // Auto-sauvegarde toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(autoSave, 30000)
    return () => clearInterval(interval)
  }, [autoSave])

  // Fonction pour naviguer vers une ligne
  const scrollToLine = useCallback((lineNumber: number) => {
    if (editorRef.current) {
      const lines = scriptContent.split('\n')
      const position = lines.slice(0, lineNumber).join('\n').length + (lineNumber > 0 ? 1 : 0)

      editorRef.current.focus()
      editorRef.current.setSelectionRange(position, position)

      // Calculer la position de scroll
      const lineHeight = 24 // hauteur approximative d'une ligne
      const scrollTop = lineNumber * lineHeight
      editorRef.current.scrollTop = Math.max(0, scrollTop - editorRef.current.clientHeight / 2)
    }
  }, [scriptContent])

  // Fonction pour basculer l'expansion d'un nœud
  const toggleNodeExpansion = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev)
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId)
      } else {
        newSet.add(nodeId)
      }
      return newSet
    })
  }, [])

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-gray-100 overflow-hidden">
      {/* Barre d'outils compacte */}
      <div className="bg-gray-800 border-b border-gray-700 px-2 py-1 flex-shrink-0">
        {/* Boutons d'insertion compacts */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button
              onClick={insertChapter}
              className="flex items-center space-x-1 bg-purple-600 hover:bg-purple-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <Book className="w-3 h-3" />
              <span>Chapitre</span>
            </button>

            <button
              onClick={insertPage}
              className="flex items-center space-x-1 bg-red-600 hover:bg-red-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <FileText className="w-3 h-3" />
              <span>Page</span>
            </button>

            <button
              onClick={insertPanel}
              className="flex items-center space-x-1 bg-yellow-600 hover:bg-yellow-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <Image className="w-3 h-3" />
              <span>Panel</span>
            </button>

            <button
              onClick={insertDialogue}
              className="flex items-center space-x-1 bg-blue-600 hover:bg-blue-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <MessageSquare className="w-3 h-3" />
              <span>Dialogue</span>
            </button>

            <button
              onClick={insertDescription}
              className="flex items-center space-x-1 bg-gray-600 hover:bg-gray-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <Edit3 className="w-3 h-3" />
              <span>Description</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={exportToTXT}
              className="flex items-center space-x-1 bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <Download className="w-3 h-3" />
              <span>Export TXT</span>
            </button>

            <button
              onClick={exportToJSON}
              className="flex items-center space-x-1 bg-indigo-600 hover:bg-indigo-700 text-white px-2 py-1 rounded text-xs transition-colors"
            >
              <Save className="w-3 h-3" />
              <span>Export JSON</span>
            </button>

            <div className="flex items-center text-xs text-gray-400 ml-2">
              {autoSaving ? (
                <span className="text-yellow-400">💾</span>
              ) : lastSaved ? (
                <span>💾</span>
              ) : (
                <span className="text-red-400">💾</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Zone principale avec éditeur et sidebar */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Éditeur de texte principal avec numéros de ligne */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="p-1">
            <div className="w-full max-w-4xl mx-auto">
              <div className={`flex border rounded overflow-hidden bg-gray-800 transition-colors duration-200 ${isFocused ? 'border-red-500 border-2' : 'border-gray-600'}`} style={{ height: '456px' }}>
              {/* Numéros de ligne - 19 lignes max */}
              <div
                ref={lineNumbersRef}
                className="w-10 bg-gray-800 border-r border-gray-600 py-2 text-right text-xs text-gray-400 select-none overflow-hidden font-mono"
                style={{
                  background: 'linear-gradient(to right, #374151, #4b5563)',
                  height: '456px' // 19 lignes × 24px = 456px
                }}
              >
                {Array.from({ length: Math.max(19, scriptContent.split('\n').length) }, (_, index) => (
                  <div key={index} className="h-6 leading-6 px-1 flex-shrink-0">
                    {index + 1}
                  </div>
                ))}
              </div>

              {/* Zone d'éditeur - 21 lignes */}
              <div className="flex-1 relative bg-gradient-to-br from-gray-900 to-gray-800" style={{ height: '504px' }}>
                {/* Overlay pour coloration de texte uniquement */}
                <div
                  ref={overlayRef}
                  className="absolute inset-0 p-3 font-mono text-sm leading-6 pointer-events-none whitespace-pre-wrap overflow-hidden"
                  style={{
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                    height: '504px'
                  }}
                >
                  {scriptContent.split('\n').map((line, index) => {
                    const trimmed = line.trim()
                    let textColor = 'text-gray-100'

                    if (trimmed.startsWith('CHAPITRE ') && trimmed.includes(' :')) {
                      textColor = 'text-purple-400'
                    } else if (trimmed.startsWith('PAGE ') && trimmed.includes(' :')) {
                      textColor = 'text-red-400'
                    } else if (trimmed.startsWith('PANEL ') && trimmed.includes(' :')) {
                      textColor = 'text-yellow-400'
                    } else if (trimmed.includes(' :') && !trimmed.startsWith('(')) {
                      textColor = 'text-blue-400'
                    } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                      textColor = 'text-gray-400'
                    }

                    return (
                      <div key={index} className={`${textColor} min-h-[24px]`} style={{ lineHeight: '24px' }}>
                        {line || '\u00A0'}
                      </div>
                    )
                  })}
                </div>

                {/* Textarea - 19 lignes */}
                <textarea
                  ref={editorRef}
                  value={scriptContent}
                  onChange={(e) => handleContentChange(e.target.value)}
                  onScroll={handleScroll}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  className="absolute inset-0 w-full bg-transparent p-3 font-mono text-sm leading-6 resize-none border-none outline-none overflow-auto z-10"
                  placeholder=""
                  spellCheck={false}
                  style={{
                    lineHeight: '24px',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                    caretColor: '#60a5fa',
                    color: 'transparent',
                    height: '456px',
                    scrollbarWidth: 'thin',
                    scrollbarColor: '#4b5563 #374151'
                  }}
                />

              </div>
            </div>
          </div>
        </div>
      </div>

        {/* Sidebar compacte avec statistiques */}
        <div className="w-56 bg-gray-800 border-l border-gray-700 flex flex-col h-full">
          {/* Statistiques ultra-compactes */}
          <div className="p-2 border-b border-gray-700 flex-shrink-0">
            <h3 className="text-xs font-semibold mb-1 text-white flex items-center">
              <BarChart3 className="w-3 h-3 mr-1" />
              Statistiques
            </h3>
            <div className="grid grid-cols-3 gap-1 text-xs">
              <div className="bg-purple-600/20 p-1 rounded text-center">
                <div className="text-purple-400 text-xs">CH</div>
                <div className="text-xs font-bold text-white">{stats.chapters}</div>
              </div>
              <div className="bg-red-600/20 p-1 rounded text-center">
                <div className="text-red-400 text-xs">PG</div>
                <div className="text-xs font-bold text-white">{stats.pages}</div>
              </div>
              <div className="bg-yellow-600/20 p-1 rounded text-center">
                <div className="text-yellow-400 text-xs">PN</div>
                <div className="text-xs font-bold text-white">{stats.panels}</div>
              </div>
              <div className="bg-blue-600/20 p-1 rounded text-center">
                <div className="text-blue-400 text-xs">DL</div>
                <div className="text-xs font-bold text-white">{stats.dialogues}</div>
              </div>
              <div className="bg-green-600/20 p-1 rounded text-center">
                <div className="text-green-400 text-xs">MT</div>
                <div className="text-xs font-bold text-white">{stats.words}</div>
              </div>
              <div className="bg-gray-600/20 p-1 rounded text-center">
                <div className="text-gray-400 text-xs">CR</div>
                <div className="text-xs font-bold text-white">{stats.characters}</div>
              </div>
            </div>
          </div>

          {/* Gestionnaire de fichiers hiérarchique */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-2 border-b border-gray-700 flex-shrink-0">
              <h3 className="text-xs font-semibold text-white flex items-center">
                <BookOpen className="w-3 h-3 mr-1" />
                Structure du Script
              </h3>
            </div>
            <div
              className="overflow-y-auto overflow-x-hidden"
              style={{
                maxHeight: '270px', // 9 éléments × 30px = 270px
                minHeight: '270px'
              }}
            >
              <div className="p-1 space-y-1 text-xs pb-2">
              {fileTree.map((page) => {
                const pageExpanded = expandedNodes.has(page.id)
                return (
                  <div key={page.id} className="space-y-1">
                    <div className="flex items-center space-x-1 p-1 bg-red-900/20 text-red-400 rounded cursor-pointer hover:bg-red-900/40">
                      <button
                        onClick={() => toggleNodeExpansion(page.id)}
                        className="w-3 h-3 flex items-center justify-center hover:bg-red-800/30 rounded"
                      >
                        <span className={`transform transition-transform text-xs ${pageExpanded ? 'rotate-90' : ''}`}>
                          ▶
                        </span>
                      </button>
                      <div
                        className="flex items-center space-x-1 flex-1"
                        onClick={() => scrollToLine(page.lineNumber)}
                      >
                        <FileText className="w-3 h-3" />
                        <span className="font-medium text-xs truncate">{page.title}</span>
                      </div>
                    </div>

                    {pageExpanded && page.children.map((chapter) => {
                      const chapterExpanded = expandedNodes.has(chapter.id)
                      return (
                        <div key={chapter.id} className="ml-3 space-y-1">
                          <div className="flex items-center space-x-1 p-1 bg-purple-900/20 text-purple-400 rounded cursor-pointer hover:bg-purple-900/40">
                            <button
                              onClick={() => toggleNodeExpansion(chapter.id)}
                              className="w-3 h-3 flex items-center justify-center hover:bg-purple-800/30 rounded"
                            >
                              <span className={`transform transition-transform text-xs ${chapterExpanded ? 'rotate-90' : ''}`}>
                                ▶
                              </span>
                            </button>
                            <div
                              className="flex items-center space-x-1 flex-1"
                              onClick={() => scrollToLine(chapter.lineNumber)}
                            >
                              <Book className="w-3 h-3" />
                              <span className="font-medium text-xs truncate">{chapter.title}</span>
                            </div>
                          </div>

                          {chapterExpanded && chapter.children.map((panel) => {
                            const panelExpanded = expandedNodes.has(panel.id)
                            return (
                              <div key={panel.id} className="ml-3 space-y-1">
                                <div className="flex items-center space-x-1 p-1 bg-yellow-900/20 text-yellow-400 rounded cursor-pointer hover:bg-yellow-900/40">
                                  <button
                                    onClick={() => toggleNodeExpansion(panel.id)}
                                    className="w-3 h-3 flex items-center justify-center hover:bg-yellow-800/30 rounded"
                                  >
                                    <span className={`transform transition-transform text-xs ${panelExpanded ? 'rotate-90' : ''}`}>
                                      ▶
                                    </span>
                                  </button>
                                  <div
                                    className="flex items-center space-x-1 flex-1"
                                    onClick={() => scrollToLine(panel.lineNumber)}
                                  >
                                    <Image className="w-3 h-3" />
                                    <span className="font-medium text-xs truncate">{panel.title}</span>
                                  </div>
                                </div>

                                {panelExpanded && panel.children.map((element) => (
                                  <div key={element.id} className="ml-3">
                                    <div
                                      className={`flex items-center space-x-1 p-1 rounded cursor-pointer text-xs ${
                                        element.type === 'dialogue'
                                          ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40'
                                          : 'bg-gray-800/20 text-gray-400 hover:bg-gray-800/40'
                                      }`}
                                      onClick={() => scrollToLine(element.lineNumber)}
                                    >
                                      {element.type === 'dialogue' ? (
                                        <MessageSquare className="w-3 h-3" />
                                      ) : (
                                        <Edit3 className="w-3 h-3" />
                                      )}
                                      <span className="truncate text-xs">{element.title}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )
                          })}
                        </div>
                      )
                    })}
                  </div>
                )
              })}
                {fileTree.length === 0 && (
                  <div className="text-gray-500 text-xs italic p-2">
                    Commencez à écrire pour voir la structure...
                  </div>
                )}
              </div>
            </div>
          </div>


        </div>
      </div>
    </div>
  )
}
