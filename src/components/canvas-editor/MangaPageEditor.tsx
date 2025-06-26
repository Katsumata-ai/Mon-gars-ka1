'use client'

import { useState, useRef } from 'react'
import { Canvas, Textbox } from 'fabric'
import CanvasEditor from './CanvasEditor'
import ImageLibrary from './ImageLibrary'

interface MangaPageEditorProps {
  projectId?: string
  onSave?: (pageData: any) => void
}

export default function MangaPageEditor({ projectId, onSave }: MangaPageEditorProps) {
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const [showImageLibrary, setShowImageLibrary] = useState(true)
  const [pageTitle, setPageTitle] = useState('Nouvelle Page')
  const [saving, setSaving] = useState(false)

  const handleCanvasReady = (fabricCanvas: Canvas) => {
    setCanvas(fabricCanvas)
  }

  const savePageAsImage = () => {
    if (!canvas) return

    // Export canvas as image
    const dataURL = canvas.toDataURL({
      format: 'png',
      quality: 1,
      multiplier: 2, // Higher resolution
    })

    // Create download link
    const link = document.createElement('a')
    link.download = `${pageTitle.replace(/\s+/g, '_')}.png`
    link.href = dataURL
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const savePageAsJSON = async () => {
    if (!canvas) return

    setSaving(true)
    try {
      // Export canvas as JSON for later editing
      const canvasData = canvas.toJSON()

      const pageData = {
        title: pageTitle,
        canvasData,
        projectId,
        createdAt: new Date().toISOString(),
      }

      // In a real app, you would save this to your database
      console.log('Page data to save:', pageData)

      // For now, just download as JSON file
      const blob = new Blob([JSON.stringify(pageData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${pageTitle.replace(/\s+/g, '_')}.json`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      onSave?.(pageData)
    } catch (error) {
      console.error('Error saving page:', error)
    } finally {
      setSaving(false)
    }
  }

  const loadPageFromJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !canvas) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const pageData = JSON.parse(e.target?.result as string)

        // Load canvas data
        canvas.loadFromJSON(pageData.canvasData, () => {
          canvas.renderAll()
          setPageTitle(pageData.title || 'Page Chargée')
        })
      } catch (error) {
        console.error('Error loading page:', error)
        alert('Erreur lors du chargement de la page')
      }
    }
    reader.readAsText(file)

    // Reset input
    event.target.value = ''
  }

  const clearCanvas = () => {
    if (!canvas) return

    if (confirm('Êtes-vous sûr de vouloir effacer toute la page ?')) {
      canvas.clear()
      canvas.backgroundColor = '#ffffff'
      canvas.renderAll()
    }
  }

  const addTextBox = () => {
    if (!canvas) return

    const text = new Textbox('Tapez votre texte ici...', {
      left: 100,
      top: 100,
      width: 200,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#000000',
      backgroundColor: 'transparent',
      borderColor: '#cccccc',
      cornerColor: '#cccccc',
      transparentCorners: false,
    })

    canvas.add(text)
    canvas.setActiveObject(text)
    canvas.renderAll()
  }

  return (
    <div className="h-screen flex flex-col bg-dark-900">
      {/* Header */}
      <div className="bg-dark-800 border-b border-dark-700 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              value={pageTitle}
              onChange={(e) => setPageTitle(e.target.value)}
              className="bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Titre de la page"
            />
            <button
              onClick={addTextBox}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
            >
              📝 Ajouter Texte
            </button>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowImageLibrary(!showImageLibrary)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showImageLibrary
                  ? 'bg-primary-500 text-white'
                  : 'bg-dark-700 text-dark-200 hover:bg-dark-600'
              }`}
            >
              🖼️ Images
            </button>

            <label className="bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg transition-colors cursor-pointer">
              📁 Charger
              <input
                type="file"
                accept=".json"
                onChange={loadPageFromJSON}
                className="hidden"
              />
            </label>

            <button
              onClick={savePageAsJSON}
              disabled={saving}
              className="bg-accent-500 hover:bg-accent-600 disabled:bg-accent-500/50 text-white px-4 py-2 rounded-lg transition-colors"
            >
              {saving ? '💾 Sauvegarde...' : '💾 Sauvegarder'}
            </button>

            <button
              onClick={savePageAsImage}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              📥 Exporter PNG
            </button>

            <button
              onClick={clearCanvas}
              className="bg-error hover:bg-error/80 text-white px-4 py-2 rounded-lg transition-colors"
            >
              🗑️ Effacer
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Canvas Editor */}
        <div className="flex-1">
          <CanvasEditor
            width={800}
            height={1200}
            onCanvasReady={handleCanvasReady}
          />
        </div>

        {/* Image Library Sidebar */}
        {showImageLibrary && (
          <div className="w-80 bg-dark-800 border-l border-dark-700">
            <ImageLibrary
              canvas={canvas}
              onImageAdded={(image) => {
                console.log('Image added to canvas:', image.original_prompt)
              }}
            />
          </div>
        )}
      </div>
    </div>
  )
}
