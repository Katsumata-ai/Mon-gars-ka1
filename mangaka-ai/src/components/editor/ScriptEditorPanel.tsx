'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useProjectStore } from '@/stores/projectStore'
import {
  BookOpen,
  FileText,
  Image,
  MessageSquare,
  Edit3,
  Book,
  Download,
  BarChart3
} from 'lucide-react'

// Import des composants mobile
import MobileScriptStats from './MobileScriptStats'

// Import du nouvel éditeur natif
import NativeScriptEditor from './NativeScriptEditor'



// Types pour l'éditeur révolutionnaire
interface ScriptStats {
  pages: number
  panels: number
  chapters: number
  words: number
  characters: number
  dialogues: number
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
  onSave?: (scriptData: unknown) => void
  pagesSidebarVisible?: boolean // Nouvelle prop pour détecter si le sidebar des pages est visible
}

export default function ScriptEditorPanel({ projectId, pagesSidebarVisible = false }: ScriptEditorPanelProps) {
  // Styles CSS pour masquer la sélection sur l'overlay
  useEffect(() => {
    const style = document.createElement('style')
    style.textContent = `
      .script-overlay::selection,
      .script-overlay *::selection {
        background: transparent !important;
      }
      .script-overlay::-moz-selection,
      .script-overlay *::-moz-selection {
        background: transparent !important;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  // Store global pour la persistance
  const { scriptData, updateScriptData } = useProjectStore()

  // États pour l'architecture dual-layer
  const [displayContent, setDisplayContent] = useState(scriptData.content || '') // Pour l'affichage et la coloration
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set())
  const [isFocused, setIsFocused] = useState(false)

  // Référence pour le contenu en temps réel (non-React state)
  const currentContentRef = useRef(scriptData.content || '')

  // Données dérivées
  const title = scriptData.title
  const stats = scriptData.stats
  const fileTree = scriptData.fileTree

  // Debug: Log current store data (simplifié)
  console.log('🏪 ScriptEditorPanel loaded - Content length:', scriptData.content?.length || 0, 'FileTree items:', scriptData.fileTree.length)



  // Synchroniser le contenu d'affichage avec le store au montage
  useEffect(() => {
    const content = scriptData.content || ''
    if (content !== displayContent) {
      setDisplayContent(content)
      currentContentRef.current = content
    }
  }, [scriptData.content, displayContent])

  // États pour le redimensionnement vertical uniquement
  const [editorHeight, setEditorHeight] = useState(390) // 15 lignes × 26px = 390px
  const [isResizing, setIsResizing] = useState(false)
  const [lastScrollPosition, setLastScrollPosition] = useState(0)

  // Authentification et Supabase
  const { user, loading: authLoading } = useAuth()
  const supabase = createClient()

  // Références
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  // Fonction pour synchroniser manuellement (utilisée uniquement lors de la navigation)
  const syncScroll = useCallback((scrollTop: number) => {
    if (lineNumbersRef.current) {
      lineNumbersRef.current.scrollTop = scrollTop
    }
    if (overlayRef.current) {
      overlayRef.current.scrollTop = scrollTop
    }
  }, [])

  // Fonction debounce simple
  const debounce = useCallback((func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout
    return (...args: any[]) => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => func.apply(null, args), delay)
    }
  }, [])

  // Fonction debounce pour la sauvegarde uniquement
  const handleScrollSave = useCallback(
    debounce((scrollTop: number) => {
      setLastScrollPosition(scrollTop)
    }, 100),
    [debounce]
  )

  // Gestionnaire de scroll optimisé avec synchronisation overlay
  const handleScroll = useCallback((e: React.UIEvent<HTMLTextAreaElement>) => {
    const scrollTop = (e.target as HTMLTextAreaElement).scrollTop

    // Synchronisation immédiate des numéros de ligne et overlay
    requestAnimationFrame(() => {
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop
      }
      if (overlayRef.current) {
        overlayRef.current.scrollTop = scrollTop
      }
    })

    // Sauvegarde avec debounce
    handleScrollSave(scrollTop)
  }, [handleScrollSave])

  // Fonction de redimensionnement vertical avec direction
  const startVerticalResize = useCallback((e: React.MouseEvent, direction: 'top' | 'bottom' = 'bottom') => {
    e.preventDefault()
    setIsResizing(true)

    const startY = e.clientY
    const startHeight = editorHeight

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startY
      let newHeight: number

      if (direction === 'bottom') {
        // Redimensionnement par le bas (normal)
        newHeight = Math.max(260, Math.min(1200, startHeight + deltaY)) // 10 lignes minimum (260px)
      } else {
        // Redimensionnement par le haut (inversé)
        newHeight = Math.max(260, Math.min(1200, startHeight - deltaY)) // 10 lignes minimum (260px)
      }

      setEditorHeight(newHeight)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)

      // Restaurer la position de scroll après redimensionnement
      if (editorRef.current && lastScrollPosition > 0) {
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.scrollTop = lastScrollPosition
          }
        }, 50)
      }
    }

    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }, [editorHeight, lastScrollPosition])







  // ✅ CORRECTION : Calcul simplifié des statistiques uniquement (sans fileTree)
  const calculateStats = useCallback((content: string): ScriptStats => {
    // Optimisation : éviter les calculs si le contenu est vide
    if (!content.trim()) {
      return {
        pages: 0,
        panels: 0,
        chapters: 0,
        words: 0,
        characters: 0,
        dialogues: 0
      }
    }

    const lines = content.split('\n')
    let pages = 0
    let panels = 0
    let chapters = 0
    let dialogues = 0

    // Optimisation : utiliser une seule boucle avec regex pré-compilées
    const pageRegex = /^PAGE\s+\d+\s*:/
    const chapterRegex = /^CHAPITRE\s+\d+\s*:/
    const panelRegex = /^PANEL\s+\d+\s*:/
    const dialogueRegex = /^\[.*\]\s*:/

    lines.forEach((line) => {
      const trimmed = line.trim()
      if (!trimmed) return // Ignorer les lignes vides

      if (pageRegex.test(trimmed)) {
        pages++
      } else if (chapterRegex.test(trimmed)) {
        chapters++
      } else if (panelRegex.test(trimmed)) {
        panels++
      } else if (dialogueRegex.test(trimmed)) {
        dialogues++
      }
    })

    // Optimisation : calcul des mots plus efficace
    const words = content.match(/\S+/g)?.length || 0
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



  // Système de synchronisation intelligent pour l'affichage
  const updateDisplayContent = useCallback(
    debounce((content: string) => {
      console.log('🔄 ScriptEditorPanel: Updating content and regenerating structure - Length:', content.length)
      // Mettre à jour le contenu d'affichage pour la coloration syntaxique
      setDisplayContent(content)

      // ✅ CORRECTION : Calculer les stats et le fileTree, puis mettre à jour le store en une seule fois
      const newStats = calculateStats(content)

      // ✅ CORRECTION : Générer le fileTree avec des IDs uniques globaux
      const lines = content.split('\n')
      const tree: FileTreeNode[] = []
      let currentPage: FileTreeNode | null = null
      let currentChapter: FileTreeNode | null = null
      let currentPanel: FileTreeNode | null = null

      // Compteurs globaux pour garantir l'unicité des IDs
      let globalPageCount = 0
      let globalChapterCount = 0
      let globalPanelCount = 0
      let globalDialogueCount = 0

      const pageRegex = /^PAGE\s+\d+\s*:/
      const chapterRegex = /^CHAPITRE\s+\d+\s*:/
      const panelRegex = /^PANEL\s+\d+\s*:/
      const dialogueRegex = /^\[.*\]\s*:/

      lines.forEach((line, index) => {
        const trimmed = line.trim()
        if (!trimmed) return

        if (pageRegex.test(trimmed)) {
          globalPageCount++
          currentPage = {
            id: `page-${globalPageCount}`,
            type: 'page',
            title: `Page ${globalPageCount}`,
            content: trimmed,
            children: [],
            expanded: true,
            lineNumber: index + 1
          }
          tree.push(currentPage)
          currentChapter = null
          currentPanel = null
        } else if (chapterRegex.test(trimmed)) {
          globalChapterCount++
          currentChapter = {
            id: `chapter-${globalChapterCount}`,
            type: 'chapter',
            title: `Chapitre ${globalChapterCount}`,
            content: trimmed,
            children: [],
            expanded: true,
            lineNumber: index + 1
          }
          if (currentPage) {
            currentPage.children.push(currentChapter)
          }
          currentPanel = null
        } else if (panelRegex.test(trimmed)) {
          globalPanelCount++
          currentPanel = {
            id: `panel-${globalPanelCount}`,
            type: 'panel',
            title: `Panel ${globalPanelCount}`,
            content: trimmed,
            children: [],
            expanded: true,
            lineNumber: index + 1
          }
          if (currentChapter) {
            currentChapter.children.push(currentPanel)
          } else if (currentPage) {
            currentPage.children.push(currentPanel)
          }
        } else if (dialogueRegex.test(trimmed)) {
          globalDialogueCount++
          const dialogueNode: FileTreeNode = {
            id: `dialogue-${globalDialogueCount}`,
            type: 'dialogue',
            title: trimmed.length > 30 ? trimmed.substring(0, 30) + '...' : trimmed,
            content: trimmed,
            children: [],
            expanded: false,
            lineNumber: index + 1
          }
          if (currentPanel) {
            currentPanel.children.push(dialogueNode)
          }
        } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
          const descNode: FileTreeNode = {
            id: `desc-${index}`,
            type: 'description',
            title: trimmed.length > 30 ? trimmed.substring(0, 30) + '...' : trimmed,
            content: trimmed,
            children: [],
            expanded: false,
            lineNumber: index + 1
          }
          if (currentPanel) {
            currentPanel.children.push(descNode)
          }
        }
      })

      // Mettre à jour le store avec toutes les données en une seule fois
      updateScriptData({
        content,
        stats: newStats,
        fileTree: tree
      })

      // Mettre à jour les nœuds expandus
      const allNodeIds = new Set<string>()
      tree.forEach(page => {
        allNodeIds.add(page.id)
        page.children?.forEach(chapter => {
          allNodeIds.add(chapter.id)
          chapter.children?.forEach(panel => {
            allNodeIds.add(panel.id)
          })
        })
      })
      setExpandedNodes(allNodeIds)
    }, 150), // Délai court pour la coloration syntaxique
    [calculateStats, updateScriptData, debounce]
  )

  // Gestionnaire d'input ultra-rapide (pas de React state)
  const handleContentChange = useCallback((content: string) => {
    // 1. Mettre à jour la référence immédiatement (pas de re-render)
    currentContentRef.current = content

    // 2. Programmer la mise à jour de l'affichage (différée)
    updateDisplayContent(content)
  }, [updateDisplayContent])

  // Fonctions d'insertion intelligentes
  const insertAtCursor = useCallback((text: string) => {
    if (!editorRef.current) return

    const textarea = editorRef.current
    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const currentContent = currentContentRef.current

    // Sauvegarder la position de scroll actuelle
    const currentScrollTop = textarea.scrollTop

    const newContent = currentContent.substring(0, start) + text + currentContent.substring(end)
    handleContentChange(newContent)

    // Repositionner le curseur après l'insertion en préservant le scroll
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + text.length, start + text.length)

      // Restaurer la position de scroll
      textarea.scrollTop = currentScrollTop

      // Synchroniser les numéros de ligne
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = currentScrollTop
      }
    }, 0)
  }, [handleContentChange])

  const insertChapter = useCallback(() => {
    const chapterNumber = stats.chapters + 1
    if ((window as any).scriptEditor) {
      (window as any).scriptEditor.insertAtCursor(`\n\nCHAPITRE ${chapterNumber} :\n`)
    }
  }, [stats.chapters])

  const insertPage = useCallback(() => {
    const pageNumber = stats.pages + 1
    if ((window as any).scriptEditor) {
      (window as any).scriptEditor.insertAtCursor(`\n\nPAGE ${pageNumber} :\n`)
    }
  }, [stats.pages])

  const insertPanel = useCallback(() => {
    const panelNumber = stats.panels + 1
    if ((window as any).scriptEditor) {
      (window as any).scriptEditor.insertAtCursor(`\nPANEL ${panelNumber} :`)
    }
  }, [stats.panels])

  const insertDialogue = useCallback(() => {
    if ((window as any).scriptEditor) {
      (window as any).scriptEditor.insertAtCursor(`\n[PERSONNAGE] : `)
    }
  }, [])

  const insertDescription = useCallback(() => {
    if ((window as any).scriptEditor) {
      (window as any).scriptEditor.insertAtCursor(`\n(Description de l'action)`)
    }
  }, [])

  // Auto-sauvegarde avec vérification d'authentification
  const autoSave = useCallback(async () => {
    // Sauvegarde automatique intégrée

    //   if (!error) {
    //     setLastSaved(new Date())
    //   } else {
    //     console.error('Erreur lors de la sauvegarde:', error)
    //   }
    // } catch (error) {
    //   console.error('Erreur auto-sauvegarde:', error)
    // } finally {
    //   setAutoSaving(false)
    // }
  }, [title, stats, fileTree, projectId, supabase, user, authLoading])

  // Fonctions d'export
  const exportToTXT = useCallback(() => {
    const blob = new Blob([currentContentRef.current], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${title.replace(/\s+/g, '_')}_script.txt`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [title])

  const exportToJSON = useCallback(() => {
    const data = {
      title,
      content: currentContentRef.current,
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
  }, [title, stats, fileTree])

  // Charger les données existantes du script (désactivé temporairement)
  const loadScriptData = useCallback(async () => {
    // TODO: Réactiver quand le backend sera configuré
    // if (!user || !projectId) return

    // try {
    //   const { data, error } = await supabase
    //     .from('manga_scripts')
    //     .select('*')
    //     .eq('project_id', projectId)
    //     .eq('user_id', user.id)
    //     .single()

    //   if (data && !error) {
    //     const scriptData = data.script_data
    //     if (scriptData?.content) {
    //       setScriptContent(scriptData.content)
    //       handleContentChange(scriptData.content)
    //     }
    //     if (data.title) {
    //       setTitle(data.title)
    //     }
    //   }
    // } catch (error) {
    //   console.error('Erreur lors du chargement du script:', error)
    // }
  }, [user, projectId, supabase, handleContentChange])

  // Charger les données au montage du composant (désactivé temporairement)
  useEffect(() => {
    // TODO: Réactiver quand le backend sera configuré
    // if (user && !authLoading) {
    //   loadScriptData()
    // }
  }, [user, authLoading, loadScriptData])

  // Auto-sauvegarde toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(autoSave, 30000)
    return () => clearInterval(interval)
  }, [autoSave])

  // Préserver la position de scroll lors des changements de contenu
  useEffect(() => {
    if (editorRef.current && lastScrollPosition > 0) {
      editorRef.current.scrollTop = lastScrollPosition
      // Synchronisation manuelle lors de la restauration
      syncScroll(lastScrollPosition)
    }
  }, [lastScrollPosition, syncScroll])

  // Fonction pour naviguer vers une ligne avec l'éditeur natif
  const scrollToLine = useCallback((lineNumber: number) => {
    console.log('📍 ScriptEditorPanel: Navigating to line', lineNumber)
    if ((window as any).scriptEditor) {
      (window as any).scriptEditor.scrollToLine(lineNumber)
    } else {
      console.warn('⚠️ ScriptEditor API not available yet')
    }
  }, [])

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

  // Référence pour la structure du script
  const structureScrollRef = useRef<HTMLDivElement>(null)

  // Gestionnaire de scroll simple pour la structure du script
  const handleStructureScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    // Empêcher la propagation pour isolation
    e.stopPropagation()
  }, [])

  return (
    <div className={`h-screen flex flex-col bg-gray-900 text-gray-100 overflow-hidden transition-all duration-300 ${isResizing ? 'select-none' : ''}`} suppressHydrationWarning={true}>
      {/* CSS simple pour scrollbars */}
      <style jsx global>{`
        .script-line-numbers::-webkit-scrollbar,
        .script-overlay::-webkit-scrollbar {
          display: none;
        }
        .script-line-numbers,
        .script-overlay {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        /* Masquer la scrollbar horizontale pour mobile */
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }

        /* Scrollbar simple pour la structure du script */
        .script-structure-scroll {
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: #6b7280 #374151;
        }

        .script-structure-scroll::-webkit-scrollbar {
          width: 6px;
        }

        .script-structure-scroll::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }

        .script-structure-scroll::-webkit-scrollbar-thumb {
          background: #6b7280;
          border-radius: 3px;
        }

        .script-structure-scroll::-webkit-scrollbar-thumb:hover {
          background: #9ca3af;
        }

        /* Styles pour le textarea avec couleur proche du fond */
        textarea.script-editor {
          /* Couleur très proche du fond pour masquer le texte */
          color: #111827 !important;
          /* Assurer la visibilité du curseur */
          caret-color: #3b82f6 !important;
          /* Optimisation du scroll */
          text-rendering: optimizeSpeed;
          -webkit-font-smoothing: antialiased;
        }

        textarea.script-editor:focus {
          caret-color: #3b82f6 !important;
          outline: none !important;
        }

        /* Classe pour masquer visuellement mais garder accessible */
        .sr-only {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
      `}</style>

      {/* Overlay de redimensionnement simplifié */}
      {isResizing && (
        <div className="fixed inset-0 bg-gray-900/20 z-30 pointer-events-none" suppressHydrationWarning={true}>
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-gray-200 px-2 py-1 rounded text-xs shadow-lg border border-gray-600" suppressHydrationWarning={true}>
            Redimensionnement...
          </div>
        </div>
      )}
      {/* Message d'information pour les utilisateurs non connectés */}
      {!authLoading && !user && (
        <div className="bg-yellow-900/20 border-b border-yellow-700 px-4 py-2 flex items-center gap-2 text-yellow-200 text-sm" suppressHydrationWarning={true}>
          ⚠️
          <span>Vous n&apos;êtes pas connecté. L&apos;auto-sauvegarde est désactivée. Vos modifications ne seront pas conservées.</span>
        </div>
      )}

      {/* Barre d'outils moderne et élégante - Responsive avec scrollbar conditionnelle */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-750 border-b border-gray-600 px-2 md:px-4 py-2 flex-shrink-0 shadow-lg" suppressHydrationWarning={true}>
        <div className="flex items-center justify-between" suppressHydrationWarning={true}>
          {/* Boutons d'insertion dans l'ordre chronologique - Responsive avec scrollbar conditionnelle */}
          <div className={`flex items-center gap-1.5 md:gap-2 ${pagesSidebarVisible ? 'overflow-x-auto' : 'overflow-x-auto scrollbar-hide'}`}
               style={pagesSidebarVisible ? {
                 scrollbarWidth: 'thin',
                 scrollbarColor: 'rgba(107, 114, 128, 0.5) rgba(55, 65, 81, 0.3)'
               } : {}} suppressHydrationWarning={true}>
            <button
              onClick={insertPage}
              className="group flex items-center space-x-1.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white px-2.5 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-300 ease-out hover:shadow-lg hover:shadow-red-500/20 touch-target flex-shrink-0 border border-red-500/20 hover:border-red-400/40"
            >
              <FileText className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Page</span>
              <span className="sm:hidden">Pg</span>
            </button>

            <button
              onClick={insertChapter}
              className="group flex items-center space-x-1.5 bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white px-2.5 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-300 ease-out hover:shadow-lg hover:shadow-purple-500/20 touch-target flex-shrink-0 border border-purple-500/20 hover:border-purple-400/40"
            >
              <Book className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Chapitre</span>
              <span className="sm:hidden">Ch</span>
            </button>

            <button
              onClick={insertPanel}
              className="group flex items-center space-x-1.5 bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 text-white px-2.5 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-300 ease-out hover:shadow-lg hover:shadow-yellow-500/20 touch-target flex-shrink-0 border border-yellow-500/20 hover:border-yellow-400/40"
            >
              <Image className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Panneau</span>
              <span className="sm:hidden">Pn</span>
            </button>

            <button
              onClick={insertDialogue}
              className="group flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white px-2.5 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-300 ease-out hover:shadow-lg hover:shadow-blue-500/20 touch-target flex-shrink-0 border border-blue-500/20 hover:border-blue-400/40"
            >
              <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Dialogue</span>
              <span className="sm:hidden">Dl</span>
            </button>

            <button
              onClick={insertDescription}
              className="group flex items-center space-x-1.5 bg-gray-600 hover:bg-gray-500 active:bg-gray-700 text-white px-2.5 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-300 ease-out hover:shadow-lg hover:shadow-gray-500/20 touch-target flex-shrink-0 border border-gray-500/20 hover:border-gray-400/40"
            >
              <Edit3 className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
              <span className="hidden sm:inline">Description</span>
              <span className="sm:hidden">Ds</span>
            </button>
          </div>

          {/* Contrôles d'export avec design professionnel compact - Responsive */}
          <div className="flex items-center gap-2 md:gap-4 ml-6 md:ml-12" suppressHydrationWarning={true}>
            <div className="flex items-center gap-1.5 md:gap-2" suppressHydrationWarning={true}>
              <button
                onClick={exportToTXT}
                className="group flex items-center space-x-1.5 bg-green-600 hover:bg-green-500 active:bg-green-700 text-white px-2.5 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-300 ease-out hover:shadow-lg hover:shadow-green-500/20 touch-target border border-green-500/20 hover:border-green-400/40"
                title="Exporter en TXT"
              >
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden md:inline">Export TXT</span>
                <span className="md:hidden">TXT</span>
              </button>

              <button
                onClick={exportToJSON}
                className="group flex items-center space-x-1.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white px-2.5 md:px-3 py-1.5 md:py-2 rounded-md text-xs md:text-sm font-medium transition-all duration-300 ease-out hover:shadow-lg hover:shadow-indigo-500/20 touch-target border border-indigo-500/20 hover:border-indigo-400/40"
                title="Exporter en JSON"
              >
                <Download className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" />
                <span className="hidden md:inline">Export JSON</span>
                <span className="md:hidden">JSON</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Statistiques mobiles compactes */}
      <MobileScriptStats stats={stats} />

      {/* Zone principale avec éditeur et sidebar - Responsive */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden" suppressHydrationWarning={true}>
        {/* Éditeur de texte principal moderne et élégant */}
        <div className="flex-1 flex flex-col min-h-0 relative" suppressHydrationWarning={true}>
          <div className="p-2 md:p-6" suppressHydrationWarning={true}>
            <div className="w-full max-w-none mx-auto relative" suppressHydrationWarning={true}>
              {/* Conteneur redimensionnable avec design professionnel */}
              <div
                className={`relative flex border rounded-lg overflow-hidden bg-gray-900 shadow-xl transition-all duration-300 ${isFocused ? 'border-gray-500 shadow-gray-500/10' : 'border-gray-700'}`}
                style={{
                  height: `${editorHeight}px`,
                  minHeight: '260px', // 10 lignes minimum
                  maxHeight: '1200px'
                }}
                suppressHydrationWarning={true}
              >
                {/* Poignée de redimensionnement en haut discrète */}
                <div
                  className="absolute top-0 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-gray-600/20 hover:bg-blue-500/30 cursor-n-resize z-30 transition-all duration-300 rounded-b-sm flex items-center justify-center group"
                  onMouseDown={(e) => startVerticalResize(e, 'top')}
                  title="Redimensionner par le haut"
                  style={{ pointerEvents: 'auto' }}
                  suppressHydrationWarning={true}
                >
                  <div className="w-8 h-0.5 bg-gray-400/40 group-hover:bg-white/60 rounded-full transition-colors duration-300" suppressHydrationWarning={true}></div>
                </div>

                {/* Poignée de redimensionnement en bas discrète */}
                <div
                  className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-16 h-2 bg-gray-600/20 hover:bg-blue-500/30 cursor-s-resize z-30 transition-all duration-300 rounded-t-sm flex items-center justify-center group"
                  onMouseDown={(e) => startVerticalResize(e, 'bottom')}
                  title="Redimensionner par le bas"
                  style={{ pointerEvents: 'auto' }}
                  suppressHydrationWarning={true}
                >
                  <div className="w-8 h-0.5 bg-gray-400/40 group-hover:bg-white/60 rounded-full transition-colors duration-300" suppressHydrationWarning={true}></div>
                </div>

                {/* Native Script Editor - Zero React Overhead */}
                <NativeScriptEditor
                  projectId={projectId}
                  onStatsUpdate={(stats) => {
                    // Update stats in React state when needed
                    console.log('📊 ScriptEditorPanel: Received stats update from NativeScriptEditor')
                  }}
                  onContentChange={(content) => {
                    // ✅ CORRECTION : Recevoir les changements de contenu et mettre à jour la structure
                    console.log('📝 ScriptEditorPanel: Received content change from NativeScriptEditor')
                    handleContentChange(content)
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar moderne avec statistiques et navigation - Desktop uniquement */}
        <div className="hidden lg:flex w-64 bg-gradient-to-b from-gray-800 to-gray-900 border-l border-gray-600/50 flex-col h-full shadow-xl" suppressHydrationWarning={true}>
          {/* Statistiques compactes avec design moderne */}
          <div className="p-2 border-b border-gray-700 flex-shrink-0 bg-gradient-to-r from-gray-800 to-gray-750" suppressHydrationWarning={true}>
            <h3 className="text-xs font-semibold mb-2 text-white flex items-center">
              <BarChart3 className="w-3 h-3 mr-1 text-blue-400" />
              Statistiques
            </h3>
            <div className="grid grid-cols-6 lg:grid-cols-3 gap-1 text-xs" suppressHydrationWarning={true}>
              <div className="bg-purple-600/20 border border-purple-500/30 p-1 rounded text-center hover:bg-purple-600/30 transition-colors touch-target" suppressHydrationWarning={true}>
                <div className="text-purple-300 text-xs font-medium" suppressHydrationWarning={true}>Chapitres</div>
                <div className="text-xs font-bold text-white" suppressHydrationWarning={true}>{stats.chapters}</div>
              </div>
              <div className="bg-red-600/20 border border-red-500/30 p-1 rounded text-center hover:bg-red-600/30 transition-colors touch-target" suppressHydrationWarning={true}>
                <div className="text-red-300 text-xs font-medium" suppressHydrationWarning={true}>Pages</div>
                <div className="text-xs font-bold text-white" suppressHydrationWarning={true}>{stats.pages}</div>
              </div>
              <div className="bg-yellow-600/20 border border-yellow-500/30 p-1 rounded text-center hover:bg-yellow-600/30 transition-colors touch-target" suppressHydrationWarning={true}>
                <div className="text-yellow-300 text-xs font-medium" suppressHydrationWarning={true}>Panneaux</div>
                <div className="text-xs font-bold text-white" suppressHydrationWarning={true}>{stats.panels}</div>
              </div>
              <div className="bg-blue-600/20 border border-blue-500/30 p-1 rounded text-center hover:bg-blue-600/30 transition-colors touch-target" suppressHydrationWarning={true}>
                <div className="text-blue-300 text-xs font-medium" suppressHydrationWarning={true}>Dialogues</div>
                <div className="text-xs font-bold text-white" suppressHydrationWarning={true}>{stats.dialogues}</div>
              </div>
              <div className="bg-green-600/20 border border-green-500/30 p-1 rounded text-center hover:bg-green-600/30 transition-colors touch-target" suppressHydrationWarning={true}>
                <div className="text-green-300 text-xs font-medium" suppressHydrationWarning={true}>Mots</div>
                <div className="text-xs font-bold text-white" suppressHydrationWarning={true}>{stats.words}</div>
              </div>
              <div className="bg-gray-600/20 border border-gray-500/30 p-1 rounded text-center hover:bg-gray-600/30 transition-colors touch-target" suppressHydrationWarning={true}>
                <div className="text-gray-300 text-xs font-medium" suppressHydrationWarning={true}>Caractères</div>
                <div className="text-xs font-bold text-white" suppressHydrationWarning={true}>{stats.characters}</div>
              </div>
            </div>
          </div>

          {/* Gestionnaire de fichiers hiérarchique avec scroll intelligent - Responsive */}
          <div className="flex-1 flex flex-col min-h-0" suppressHydrationWarning={true}>
            <div className="p-2 flex-shrink-0" suppressHydrationWarning={true}>
              <h3 className="text-xs font-semibold text-white flex items-center">
                <BookOpen className="w-3 h-3 mr-1 text-green-400" />
                Structure du Script
              </h3>
            </div>
            <div
              ref={structureScrollRef}
              className="script-structure-scroll overflow-y-auto overflow-x-hidden max-h-[270px] min-h-[200px] lg:max-h-[270px] lg:min-h-[200px] md:max-h-[200px] md:min-h-[150px]"
              onScroll={handleStructureScroll}
              suppressHydrationWarning={true}
            >
              <div className="p-1 space-y-1 text-xs pb-2" suppressHydrationWarning={true}>
              {fileTree.map((page) => {
                const pageExpanded = expandedNodes.has(page.id)
                return (
                  <div key={page.id} className="space-y-1" suppressHydrationWarning={true}>
                    <div className="flex items-center space-x-1 p-1 bg-red-900/20 text-red-400 rounded cursor-pointer hover:bg-red-900/40" suppressHydrationWarning={true}>
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
                        onClick={() => {
                          console.log('🖱️ Clicked on page:', page.title, 'Line:', page.lineNumber)
                          scrollToLine(page.lineNumber ?? 0)
                        }}
                        suppressHydrationWarning={true}
                      >
                        <FileText className="w-3 h-3" />
                        <span className="font-medium text-xs truncate">{page.title}</span>
                      </div>
                    </div>

                    {pageExpanded && page.children?.map((chapter) => {
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
                              onClick={() => scrollToLine(chapter.lineNumber ?? 0)}
                            >
                              <Book className="w-3 h-3" />
                              <span className="font-medium text-xs truncate">{chapter.title}</span>
                            </div>
                          </div>

                          {chapterExpanded && chapter.children?.map((panel) => {
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
                                    onClick={() => scrollToLine(panel.lineNumber ?? 0)}
                                  >
                                    <Image className="w-3 h-3" />
                                    <span className="font-medium text-xs truncate">{panel.title}</span>
                                  </div>
                                </div>

                                {panelExpanded && panel.children?.map((element) => (
                                  <div key={element.id} className="ml-3">
                                    <div
                                      className={`flex items-center space-x-1 p-1 rounded cursor-pointer text-xs ${
                                        element.type === 'dialogue'
                                          ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40'
                                          : 'bg-gray-800/20 text-gray-400 hover:bg-gray-800/40'
                                      }`}
                                      onClick={() => scrollToLine(element.lineNumber ?? 0)}
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
                  <div className="text-gray-500 text-xs italic p-2" suppressHydrationWarning={true}>
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
