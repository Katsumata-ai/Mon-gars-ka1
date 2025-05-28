'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from '@/hooks/useUserCredits'

interface ScriptChapter {
  id: string
  title: string
  scenes: ScriptScene[]
}

interface ScriptScene {
  id: string
  title: string
  description: string
  panels: ScriptPanel[]
}

interface ScriptPanel {
  id: string
  description: string
  dialogue: string
  notes: string
}

interface ScriptProject {
  id: string
  title: string
  description: string
  chapters: ScriptChapter[]
  createdAt: string
  updatedAt: string
}

export default function ScriptEditor() {
  const [project, setProject] = useState<ScriptProject>({
    id: crypto.randomUUID(),
    title: 'Nouveau Projet',
    description: '',
    chapters: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
  
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null)
  const [selectedScene, setSelectedScene] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const { user } = useUserCredits()
  const supabase = createClient()

  const addChapter = () => {
    const newChapter: ScriptChapter = {
      id: crypto.randomUUID(),
      title: `Chapitre ${project.chapters.length + 1}`,
      scenes: []
    }

    setProject(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter],
      updatedAt: new Date().toISOString()
    }))

    setSelectedChapter(newChapter.id)
  }

  const addScene = (chapterId: string) => {
    const newScene: ScriptScene = {
      id: crypto.randomUUID(),
      title: 'Nouvelle Scène',
      description: '',
      panels: []
    }

    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? { ...chapter, scenes: [...chapter.scenes, newScene] }
          : chapter
      ),
      updatedAt: new Date().toISOString()
    }))

    setSelectedScene(newScene.id)
  }

  const addPanel = (chapterId: string, sceneId: string) => {
    const newPanel: ScriptPanel = {
      id: crypto.randomUUID(),
      description: '',
      dialogue: '',
      notes: ''
    }

    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              scenes: chapter.scenes.map(scene =>
                scene.id === sceneId
                  ? { ...scene, panels: [...scene.panels, newPanel] }
                  : scene
              )
            }
          : chapter
      ),
      updatedAt: new Date().toISOString()
    }))
  }

  const updateProject = (updates: Partial<ScriptProject>) => {
    setProject(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date().toISOString()
    }))
  }

  const updateChapter = (chapterId: string, updates: Partial<ScriptChapter>) => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId ? { ...chapter, ...updates } : chapter
      ),
      updatedAt: new Date().toISOString()
    }))
  }

  const updateScene = (chapterId: string, sceneId: string, updates: Partial<ScriptScene>) => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              scenes: chapter.scenes.map(scene =>
                scene.id === sceneId ? { ...scene, ...updates } : scene
              )
            }
          : chapter
      ),
      updatedAt: new Date().toISOString()
    }))
  }

  const updatePanel = (chapterId: string, sceneId: string, panelId: string, updates: Partial<ScriptPanel>) => {
    setProject(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId
          ? {
              ...chapter,
              scenes: chapter.scenes.map(scene =>
                scene.id === sceneId
                  ? {
                      ...scene,
                      panels: scene.panels.map(panel =>
                        panel.id === panelId ? { ...panel, ...updates } : panel
                      )
                    }
                  : scene
              )
            }
          : chapter
      ),
      updatedAt: new Date().toISOString()
    }))
  }

  const saveProject = async () => {
    setSaving(true)
    try {
      // For now, just download as JSON
      const blob = new Blob([JSON.stringify(project, null, 2)], { 
        type: 'application/json' 
      })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = `${project.title.replace(/\s+/g, '_')}_script.json`
      link.href = url
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error saving project:', error)
    } finally {
      setSaving(false)
    }
  }

  const loadProject = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const loadedProject = JSON.parse(e.target?.result as string)
        setProject(loadedProject)
        setSelectedChapter(null)
        setSelectedScene(null)
      } catch (error) {
        console.error('Error loading project:', error)
        alert('Erreur lors du chargement du projet')
      }
    }
    reader.readAsText(file)
    
    // Reset input
    event.target.value = ''
  }

  const selectedChapterData = project.chapters.find(c => c.id === selectedChapter)
  const selectedSceneData = selectedChapterData?.scenes.find(s => s.id === selectedScene)

  return (
    <div className="h-screen flex bg-dark-900 text-dark-50">
      {/* Sidebar - Project Structure */}
      <div className="w-80 bg-dark-800 border-r border-dark-700 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-dark-700">
          <input
            type="text"
            value={project.title}
            onChange={(e) => updateProject({ title: e.target.value })}
            className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white font-bold text-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <textarea
            value={project.description}
            onChange={(e) => updateProject({ description: e.target.value })}
            placeholder="Description du projet..."
            className="w-full mt-2 bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
            rows={2}
          />
        </div>

        {/* Actions */}
        <div className="p-4 border-b border-dark-700 flex gap-2">
          <button
            onClick={addChapter}
            className="flex-1 bg-primary-500 hover:bg-primary-600 text-white px-3 py-2 rounded-lg text-sm transition-colors"
          >
            + Chapitre
          </button>
          <label className="flex-1 bg-dark-700 hover:bg-dark-600 text-white px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer text-center">
            📁 Charger
            <input
              type="file"
              accept=".json"
              onChange={loadProject}
              className="hidden"
            />
          </label>
          <button
            onClick={saveProject}
            disabled={saving}
            className="flex-1 bg-accent-500 hover:bg-accent-600 disabled:bg-accent-500/50 text-white px-3 py-2 rounded-lg text-sm transition-colors"
          >
            {saving ? '💾' : '💾 Sauver'}
          </button>
        </div>

        {/* Chapter List */}
        <div className="flex-1 overflow-auto p-4">
          {project.chapters.map((chapter) => (
            <div key={chapter.id} className="mb-4">
              <div
                onClick={() => setSelectedChapter(selectedChapter === chapter.id ? null : chapter.id)}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  selectedChapter === chapter.id
                    ? 'bg-primary-500/20 border border-primary-500'
                    : 'bg-dark-700 hover:bg-dark-600 border border-dark-600'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{chapter.title}</span>
                  <span className="text-xs text-dark-400">{chapter.scenes.length} scènes</span>
                </div>
              </div>

              {selectedChapter === chapter.id && (
                <div className="mt-2 ml-4 space-y-2">
                  <button
                    onClick={() => addScene(chapter.id)}
                    className="w-full p-2 bg-dark-600 hover:bg-dark-500 text-white rounded text-sm transition-colors"
                  >
                    + Ajouter Scène
                  </button>
                  
                  {chapter.scenes.map((scene) => (
                    <div
                      key={scene.id}
                      onClick={() => setSelectedScene(selectedScene === scene.id ? null : scene.id)}
                      className={`p-2 rounded cursor-pointer transition-colors ${
                        selectedScene === scene.id
                          ? 'bg-accent-500/20 border border-accent-500'
                          : 'bg-dark-600 hover:bg-dark-500 border border-dark-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm">{scene.title}</span>
                        <span className="text-xs text-dark-400">{scene.panels.length} panels</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          {project.chapters.length === 0 && (
            <div className="text-center py-8">
              <p className="text-dark-400 mb-4">Aucun chapitre</p>
              <button
                onClick={addChapter}
                className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Créer le premier chapitre
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Editor */}
      <div className="flex-1 flex flex-col">
        {selectedChapterData && selectedSceneData ? (
          <>
            {/* Scene Header */}
            <div className="p-4 border-b border-dark-700 bg-dark-800">
              <input
                type="text"
                value={selectedSceneData.title}
                onChange={(e) => updateScene(selectedChapter!, selectedScene!, { title: e.target.value })}
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white font-bold text-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent mb-2"
              />
              <textarea
                value={selectedSceneData.description}
                onChange={(e) => updateScene(selectedChapter!, selectedScene!, { description: e.target.value })}
                placeholder="Description de la scène..."
                className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                rows={2}
              />
              <button
                onClick={() => addPanel(selectedChapter!, selectedScene!)}
                className="mt-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                + Ajouter Panel
              </button>
            </div>

            {/* Panels */}
            <div className="flex-1 overflow-auto p-4">
              {selectedSceneData.panels.map((panel, index) => (
                <div key={panel.id} className="mb-6 bg-dark-800 rounded-lg p-4 border border-dark-700">
                  <div className="flex items-center mb-3">
                    <span className="bg-primary-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                      Panel {index + 1}
                    </span>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Description visuelle</label>
                      <textarea
                        value={panel.description}
                        onChange={(e) => updatePanel(selectedChapter!, selectedScene!, panel.id, { description: e.target.value })}
                        placeholder="Décrivez ce qui se passe visuellement..."
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium mb-2">Dialogue</label>
                      <textarea
                        value={panel.dialogue}
                        onChange={(e) => updatePanel(selectedChapter!, selectedScene!, panel.id, { dialogue: e.target.value })}
                        placeholder="Dialogues et textes..."
                        className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium mb-2">Notes</label>
                    <textarea
                      value={panel.notes}
                      onChange={(e) => updatePanel(selectedChapter!, selectedScene!, panel.id, { notes: e.target.value })}
                      placeholder="Notes de réalisation, références..."
                      className="w-full bg-dark-700 border border-dark-600 rounded-lg px-3 py-2 text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                      rows={2}
                    />
                  </div>
                </div>
              ))}

              {selectedSceneData.panels.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-dark-400 mb-4">Aucun panel dans cette scène</p>
                  <button
                    onClick={() => addPanel(selectedChapter!, selectedScene!)}
                    className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    Créer le premier panel
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <h2 className="text-2xl font-bold mb-4">Script Editor</h2>
              <p className="text-dark-400 mb-6">
                Organisez votre histoire en chapitres, scènes et panels
              </p>
              {project.chapters.length === 0 ? (
                <button
                  onClick={addChapter}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
                >
                  Créer le premier chapitre
                </button>
              ) : (
                <p className="text-dark-500">
                  Sélectionnez un chapitre et une scène pour commencer à écrire
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
