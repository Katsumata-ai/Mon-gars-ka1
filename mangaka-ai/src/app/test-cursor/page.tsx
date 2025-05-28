'use client'

import { useState, useRef, useCallback } from 'react'

export default function TestCursorPage() {
  const [content, setContent] = useState('CHAPITRE 1 : Test\n\nPAGE 1 :\n\nPANEL 1 :\n(Description test)\nPERSONNAGE : Dialogue test')
  const [mode, setMode] = useState<'simple' | 'overlay'>('overlay')
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)

  const handleScroll = useCallback(() => {
    if (editorRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = editorRef.current.scrollTop
    }
  }, [])

  const handleClick = () => {
    if (editorRef.current) {
      editorRef.current.focus()
      console.log('Focus appelé sur le textarea')
    }
  }

  const handleFocus = () => {
    console.log('Textarea a reçu le focus')
  }

  const handleBlur = () => {
    console.log('Textarea a perdu le focus')
  }

  const handleSelectionChange = () => {
    if (editorRef.current) {
      console.log('Sélection:', {
        start: editorRef.current.selectionStart,
        end: editorRef.current.selectionEnd,
        direction: editorRef.current.selectionDirection
      })
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <h1 className="text-2xl font-bold mb-4">Test du Curseur - Éditeur de Script</h1>

      <div className="mb-4 space-x-4">
        <button
          onClick={handleClick}
          className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
        >
          Focus sur l'éditeur
        </button>
        <button
          onClick={() => setContent('')}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
        >
          Vider le contenu
        </button>
        <button
          onClick={() => setMode(mode === 'simple' ? 'overlay' : 'simple')}
          className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded"
        >
          Mode: {mode === 'simple' ? 'Simple' : 'Overlay'}
        </button>
      </div>

      <div className="border border-gray-700 rounded-lg overflow-hidden h-96">
        <div className="h-full flex">
          {/* Numéros de ligne */}
          <div className="w-12 bg-gray-800 border-r border-gray-600 py-2 text-right text-xs text-gray-500 select-none overflow-hidden">
            {content.split('\n').map((_, index) => (
              <div key={index} className="h-6 leading-6 px-2">
                {index + 1}
              </div>
            ))}
          </div>

          {/* Zone d'éditeur */}
          <div className="flex-1 relative">
            {mode === 'overlay' ? (
              <>
                {/* Mode Overlay - Coloration avancée */}
                <div
                  ref={overlayRef}
                  className="absolute inset-0 p-3 font-mono text-sm leading-6 pointer-events-none whitespace-pre-wrap overflow-hidden"
                  style={{
                    lineHeight: '24px',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace'
                  }}
                >
                  {content.split('\n').map((line, index) => {
                    const trimmed = line.trim()
                    let colorClass = 'text-gray-100'

                    if (trimmed.startsWith('CHAPITRE ') && trimmed.includes(' :')) {
                      colorClass = 'text-purple-400 font-bold bg-purple-900/20'
                    } else if (trimmed.startsWith('PAGE ') && trimmed.includes(' :')) {
                      colorClass = 'text-red-400 font-bold bg-red-900/20'
                    } else if (trimmed.startsWith('PANEL ') && trimmed.includes(' :')) {
                      colorClass = 'text-yellow-400 font-semibold bg-yellow-900/20'
                    } else if (trimmed.includes(' :') && !trimmed.startsWith('(')) {
                      colorClass = 'text-blue-400 bg-blue-900/20'
                    } else if (trimmed.startsWith('(') && trimmed.endsWith(')')) {
                      colorClass = 'text-gray-400 bg-gray-800/20'
                    }

                    return (
                      <div key={index} className={`${colorClass} px-1 rounded min-h-[24px]`}>
                        {line || '\u00A0'}
                      </div>
                    )
                  })}
                </div>

                <textarea
                  ref={editorRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  onScroll={handleScroll}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  onSelect={handleSelectionChange}
                  className="absolute inset-0 w-full h-full bg-transparent p-3 font-mono text-sm leading-6 resize-none border-none outline-none overflow-auto z-10"
                  style={{
                    lineHeight: '24px',
                    fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                    caretColor: 'white',
                    color: 'rgba(255, 255, 255, 0.01)',
                    WebkitTextFillColor: 'transparent'
                  }}
                  spellCheck={false}
                />
              </>
            ) : (
              /* Mode Simple - Textarea seul */
              <textarea
                ref={editorRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onSelect={handleSelectionChange}
                className="w-full h-full bg-gray-900 text-gray-100 p-3 font-mono text-sm leading-6 resize-none border-none outline-none overflow-auto"
                placeholder="Tapez ici pour tester le curseur..."
                style={{
                  lineHeight: '24px',
                  fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Consolas, "Liberation Mono", Menlo, monospace',
                  caretColor: 'white'
                }}
                spellCheck={false}
              />
            )}

            {/* Placeholder pour mode overlay */}
            {mode === 'overlay' && content === '' && (
              <div className="absolute inset-0 p-3 font-mono text-sm leading-6 pointer-events-none text-gray-500 z-5">
                <div className="space-y-1">
                  <div className="text-gray-400">Tapez ici pour tester le curseur...</div>
                  <div className="text-xs text-gray-600 mt-4">Exemples avec coloration :</div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="text-purple-400 bg-purple-900/20 px-1 rounded">CHAPITRE 1 :</div>
                    <div className="text-red-400 bg-red-900/20 px-1 rounded">PAGE 1 :</div>
                    <div className="text-yellow-400 bg-yellow-900/20 px-1 rounded">PANEL 1 :</div>
                    <div className="text-gray-400 bg-gray-800/20 px-1 rounded">(Description)</div>
                    <div className="text-blue-400 bg-blue-900/20 px-1 rounded">PERSONNAGE : Dialogue</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <p><strong>Tests à effectuer :</strong></p>
        <ul className="list-disc list-inside space-y-1">
          <li>Cliquer dans le texte - le curseur doit apparaître à la bonne position</li>
          <li>Utiliser les flèches du clavier - le curseur doit se déplacer</li>
          <li>Sélectionner du texte avec la souris - la sélection doit fonctionner</li>
          <li>Taper du texte - il doit s'insérer à la position du curseur</li>
          <li>Le curseur doit clignoter et être visible (blanc)</li>
        </ul>
      </div>

      <div className="mt-4 text-xs text-gray-500">
        <p>Ouvrez la console pour voir les logs de focus/sélection</p>
      </div>
    </div>
  )
}
