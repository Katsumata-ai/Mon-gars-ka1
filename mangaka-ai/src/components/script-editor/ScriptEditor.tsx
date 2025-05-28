'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from '@/hooks/useUserCredits'

// Types simplifiés et professionnels
interface ScriptLine {
  id: string
  type: 'page' | 'panel' | 'description' | 'dialogue' | 'character'
  content: string
  pageNumber?: number
  panelNumber?: number
  character?: string
  lineNumber: number
}

interface ScriptDocument {
  id: string
  title: string
  lines: ScriptLine[]
  characters: string[]
  stats: {
    pages: number
    panels: number
    words: number
    characters: number
  }
}

export default function ScriptEditor({ projectId = 'default' }: { projectId?: string }) {
  // État principal du document
  const [document, setDocument] = useState<ScriptDocument>({
    id: crypto.randomUUID(),
    title: 'Script Sans Titre',
    lines: [],
    characters: [],
    stats: { pages: 0, panels: 0, words: 0, characters: 0 }
  })

  // États de l'interface
  const [currentLine, setCurrentLine] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showCharacters, setShowCharacters] = useState(false)
  const [autoSaving, setAutoSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  // Références
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const lineNumbersRef = useRef<HTMLDivElement>(null)

  const { } = useUserCredits()
  const supabase = createClient()

  // Fonctions utilitaires pour le parsing du script
  const parseScriptContent = useCallback((content: string): ScriptLine[] => {
    const lines = content.split('\n')
    const scriptLines: ScriptLine[] = []
    let currentPage = 1
    let currentPanel = 1

    lines.forEach((line, index) => {
      const trimmedLine = line.trim()
      if (!trimmedLine) return

      let type: ScriptLine['type'] = 'description'
      let character: string | undefined

      // Détection automatique du type de ligne
      if (trimmedLine.startsWith('PAGE ') || trimmedLine.startsWith('Page ')) {
        type = 'page'
        currentPage = parseInt(trimmedLine.split(' ')[1]) || currentPage
        currentPanel = 1
      } else if (trimmedLine.startsWith('PANEL ') || trimmedLine.startsWith('Panel ')) {
        type = 'panel'
        currentPanel = parseInt(trimmedLine.split(' ')[1]) || currentPanel
      } else if (trimmedLine.includes(':') && !trimmedLine.startsWith('(')) {
        // Dialogue avec personnage
        type = 'dialogue'
        character = trimmedLine.split(':')[0].trim()
      } else if (trimmedLine.startsWith('(') && trimmedLine.endsWith(')')) {
        // Description d'action
        type = 'description'
      }

      scriptLines.push({
        id: crypto.randomUUID(),
        type,
        content: trimmedLine,
        pageNumber: currentPage,
        panelNumber: currentPanel,
        character,
        lineNumber: index + 1
      })
    })

    return scriptLines
  }, [])

  // Calcul des statistiques en temps réel
  const calculateStats = useCallback((lines: ScriptLine[]) => {
    const pages = Math.max(...lines.filter(l => l.pageNumber).map(l => l.pageNumber!), 0)
    const panels = lines.filter(l => l.type === 'panel').length
    const content = lines.map(l => l.content).join(' ')
    const words = content.split(/\s+/).filter(w => w.length > 0).length
    const characters = content.length

    return { pages, panels, words, characters }
  }, [])

  // Extraction automatique des personnages
  const extractCharacters = useCallback((lines: ScriptLine[]) => {
    const characters = new Set<string>()
    lines.forEach(line => {
      if (line.type === 'dialogue' && line.character) {
        characters.add(line.character)
      }
    })
    return Array.from(characters).sort()
  }, [])

  // Gestion du contenu de l'éditeur
  const handleContentChange = useCallback((content: string) => {
    const lines = parseScriptContent(content)
    const stats = calculateStats(lines)
    const characters = extractCharacters(lines)

    setDocument(prev => ({
      ...prev,
      lines,
      stats,
      characters
    }))
  }, [parseScriptContent, calculateStats, extractCharacters])

  // Auto-sauvegarde
  const autoSave = useCallback(async () => {
    if (!document.lines.length) return

    setAutoSaving(true)
    try {
      const content = document.lines.map(l => l.content).join('\n')

      const { error } = await supabase
        .from('manga_scripts')
        .upsert({
          project_id: projectId,
          title: document.title,
          script_data: {
            content,
            lines: document.lines,
            characters: document.characters,
            stats: document.stats
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
  }, [document, projectId, supabase])

  // Auto-sauvegarde toutes les 30 secondes
  useEffect(() => {
    const interval = setInterval(autoSave, 30000)
    return () => clearInterval(interval)
  }, [autoSave])

  // Fonctions d'export
  const exportToTXT = useCallback(() => {
    const content = document.lines.map(l => l.content).join('\n')
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${document.title.replace(/\s+/g, '_')}_script.txt`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [document])

  const exportToJSON = useCallback(() => {
    const blob = new Blob([JSON.stringify(document, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.download = `${document.title.replace(/\s+/g, '_')}_script.json`
    link.href = url
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [document])

  // Raccourcis clavier
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 's':
            e.preventDefault()
            autoSave()
            break
          case 'f':
            e.preventDefault()
            // Focus sur la recherche
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [autoSave])

  return (
    <div className="h-screen flex bg-gray-900 text-gray-100 font-mono">
      {/* Sidebar minimaliste */}
      <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
        {/* Header avec titre */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            value={document.title}
            onChange={(e) => setDocument(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white font-bold text-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
            placeholder="Titre du script"
          />
        </div>

        {/* Recherche rapide */}
        <div className="p-4 border-b border-gray-700">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher..."
            className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-white text-sm focus:ring-2 focus:ring-red-500 focus:border-transparent"
          />
        </div>

        {/* Statistiques en temps réel */}
        <div className="p-4 border-b border-gray-700">
          <h3 className="text-sm font-semibold mb-2 text-gray-300">Statistiques</h3>
          <div className="space-y-1 text-xs text-gray-400">
            <div className="flex justify-between">
              <span>Pages:</span>
              <span className="text-red-400 font-semibold">{document.stats.pages}</span>
            </div>
            <div className="flex justify-between">
              <span>Panels:</span>
              <span className="text-red-400 font-semibold">{document.stats.panels}</span>
            </div>
            <div className="flex justify-between">
              <span>Mots:</span>
              <span className="text-red-400 font-semibold">{document.stats.words}</span>
            </div>
            <div className="flex justify-between">
              <span>Caractères:</span>
              <span className="text-red-400 font-semibold">{document.stats.characters}</span>
            </div>
          </div>
        </div>

        {/* Personnages */}
        <div className="p-4 border-b border-gray-700">
          <button
            onClick={() => setShowCharacters(!showCharacters)}
            className="w-full flex items-center justify-between text-sm font-semibold text-gray-300 hover:text-white transition-colors"
          >
            <span>Personnages ({document.characters.length})</span>
            <span className={`transform transition-transform ${showCharacters ? 'rotate-90' : ''}`}>▶</span>
          </button>
          {showCharacters && (
            <div className="mt-2 space-y-1">
              {document.characters.map((character, index) => (
                <div key={index} className="text-xs text-gray-400 px-2 py-1 bg-gray-700 rounded">
                  {character}
                </div>
              ))}
              {document.characters.length === 0 && (
                <div className="text-xs text-gray-500 italic">Aucun personnage détecté</div>
              )}
            </div>
          )}
        </div>

        {/* Actions d'export */}
        <div className="p-4 space-y-2">
          <button
            onClick={exportToTXT}
            className="w-full bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded text-sm transition-colors"
          >
            📄 Export TXT
          </button>
          <button
            onClick={exportToJSON}
            className="w-full bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded text-sm transition-colors"
          >
            📋 Export JSON
          </button>
        </div>

        {/* Indicateur de sauvegarde */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{autoSaving ? '💾 Sauvegarde...' : lastSaved ? `💾 ${lastSaved.toLocaleTimeString()}` : '💾 Non sauvé'}</span>
            <span>Ctrl+S</span>
          </div>
        </div>
      </div>

      {/* Zone d'éditeur principale */}
      <div className="flex-1 flex flex-col">
        {/* Header de l'éditeur */}
        <div className="h-12 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-bold text-white">Script Editor</h1>
            <div className="text-sm text-gray-400">
              Ligne {currentLine + 1} • {document.lines.length} lignes
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="text-xs text-gray-500">
              {autoSaving ? 'Sauvegarde automatique...' : 'Prêt'}
            </div>
            <div className={`w-2 h-2 rounded-full ${autoSaving ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
          </div>
        </div>

        {/* Zone d'écriture principale */}
        <div className="flex-1 flex">
          {/* Numéros de ligne */}
          <div
            ref={lineNumbersRef}
            className="w-12 bg-gray-800 border-r border-gray-700 py-4 text-right text-xs text-gray-500 select-none"
          >
            {Array.from({ length: Math.max(20, document.lines.length + 5) }, (_, i) => (
              <div key={i} className="h-6 leading-6 px-2">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Éditeur de texte principal */}
          <div className="flex-1 relative">
            <textarea
              ref={editorRef}
              className="w-full h-full bg-gray-900 text-gray-100 p-4 font-mono text-sm leading-6 resize-none border-none outline-none focus:ring-0"
              placeholder={`Commencez à écrire votre script...

Format suggéré:
PAGE 1

PANEL 1
(Description de l'action)
PERSONNAGE: Dialogue du personnage

PANEL 2
(Nouvelle action)
AUTRE_PERSONNAGE: Autre dialogue

PAGE 2
...`}
              value={document.lines.map(l => l.content).join('\n')}
              onChange={(e) => handleContentChange(e.target.value)}
              onScroll={(e) => {
                // Synchroniser le scroll des numéros de ligne
                if (lineNumbersRef.current) {
                  lineNumbersRef.current.scrollTop = e.currentTarget.scrollTop
                }
              }}
              onSelectionChange={(e) => {
                // Mettre à jour la ligne courante
                const textarea = e.target as HTMLTextAreaElement
                const lines = textarea.value.substring(0, textarea.selectionStart).split('\n')
                setCurrentLine(lines.length - 1)
              }}
              spellCheck={false}
            />

            {/* Overlay pour la coloration syntaxique */}
            <div className="absolute inset-0 pointer-events-none p-4 font-mono text-sm leading-6 whitespace-pre-wrap">
              {document.lines.map((line) => (
                <div key={line.id} className="h-6">
                  <span className={
                    line.type === 'page' ? 'text-red-400 font-bold' :
                    line.type === 'panel' ? 'text-yellow-400 font-semibold' :
                    line.type === 'dialogue' ? 'text-blue-400' :
                    line.type === 'character' ? 'text-green-400 font-semibold' :
                    'text-gray-300'
                  }>
                    {line.content}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Barre d'aide en bas */}
        <div className="h-8 bg-gray-800 border-t border-gray-700 flex items-center justify-between px-4 text-xs text-gray-500">
          <div className="flex items-center space-x-4">
            <span>PAGE: Nouvelle page</span>
            <span>PANEL: Nouveau panel</span>
            <span>PERSONNAGE: Dialogue</span>
            <span>(Action): Description</span>
          </div>
          <div className="flex items-center space-x-4">
            <span>Ctrl+S: Sauvegarder</span>
            <span>Ctrl+F: Rechercher</span>
          </div>
        </div>
      </div>
    </div>
  )
}
