'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

// Types pour le script
export interface DialogueBubble {
  id: string
  character: string
  text: string
  type: 'speech' | 'thought' | 'narration' | 'sound' | 'caption'
  formatting: {
    bold?: boolean
    italic?: boolean
    size?: 'small' | 'normal' | 'large'
  }
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center'
  bubbleStyle?: 'normal' | 'jagged' | 'cloud' | 'burst' | 'whisper'
}

export interface SoundEffect {
  id: string
  text: string
  style: 'impact' | 'ambient' | 'action' | 'emotion'
  size: 'small' | 'medium' | 'large'
  position?: string
}

export interface Panel {
  id: string
  pageNumber: number
  panelNumber: number
  description: string
  dialogues: DialogueBubble[]
  characters: string[]
  shotType: 'extreme-close' | 'close-up' | 'medium-close' | 'medium' | 'medium-wide' | 'wide' | 'extreme-wide' | 'bird-eye'
  cameraAngle: 'eye-level' | 'high-angle' | 'low-angle' | 'dutch-angle' | 'overhead'
  transition: 'cut' | 'fade' | 'dissolve' | 'wipe' | 'zoom' | 'pan'
  soundEffects: SoundEffect[]
  notes: string
  timing?: number
  mood?: 'action' | 'calm' | 'tense' | 'romantic' | 'comedic' | 'dramatic'
  lighting?: 'bright' | 'dim' | 'dramatic' | 'natural' | 'artificial'
}

export interface Scene {
  id: string
  title: string
  description: string
  location: string
  timeOfDay: 'dawn' | 'morning' | 'noon' | 'afternoon' | 'evening' | 'night'
  panels: Panel[]
  expanded: boolean
  notes: string
}

export interface Chapter {
  id: string
  title: string
  description: string
  scenes: Scene[]
  expanded: boolean
  pageCount?: number
}

export interface ScriptData {
  id?: string
  projectId: string
  title: string
  description: string
  chapters: Chapter[]
  createdAt?: string
  updatedAt?: string
}

export function useScriptData(projectId: string) {
  const [scriptData, setScriptData] = useState<ScriptData>({
    projectId,
    title: 'Mon Manga',
    description: '',
    chapters: []
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)

  const supabase = createClient()

  // Charger le script depuis Supabase
  const loadScript = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase
        .from('manga_scripts')
        .select('*')
        .eq('project_id', projectId)
        .single()

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error
      }

      if (data) {
        setScriptData({
          id: data.id,
          projectId: data.project_id,
          title: data.title || 'Mon Manga',
          description: data.description || '',
          chapters: data.script_data?.chapters || [],
          createdAt: data.created_at,
          updatedAt: data.updated_at
        })
      } else {
        // Créer un script vide si aucun n'existe
        setScriptData({
          projectId,
          title: 'Mon Manga',
          description: '',
          chapters: []
        })
      }
    } catch (err) {
      console.error('Erreur lors du chargement du script:', err)
      setError('Impossible de charger le script')
    } finally {
      setLoading(false)
    }
  }, [projectId, supabase])

  // Sauvegarder le script dans Supabase
  const saveScript = useCallback(async (data?: Partial<ScriptData>) => {
    try {
      setSaving(true)
      setError(null)

      const dataToSave = data ? { ...scriptData, ...data } : scriptData

      const scriptPayload = {
        project_id: projectId,
        title: dataToSave.title,
        description: dataToSave.description,
        script_data: {
          chapters: dataToSave.chapters
        },
        updated_at: new Date().toISOString()
      }

      let result
      if (scriptData.id) {
        // Mise à jour
        result = await supabase
          .from('manga_scripts')
          .update(scriptPayload)
          .eq('id', scriptData.id)
          .select()
          .single()
      } else {
        // Création
        result = await supabase
          .from('manga_scripts')
          .insert({
            ...scriptPayload,
            created_at: new Date().toISOString()
          })
          .select()
          .single()
      }

      if (result.error) {
        throw result.error
      }

      // Mettre à jour l'état local avec les données sauvegardées
      setScriptData(prev => ({
        ...prev,
        id: result.data.id,
        updatedAt: result.data.updated_at
      }))

      setLastSaved(new Date())
      return result.data
    } catch (err) {
      console.error('Erreur lors de la sauvegarde:', err)
      setError('Impossible de sauvegarder le script')
      throw err
    } finally {
      setSaving(false)
    }
  }, [scriptData, projectId, supabase])

  // Auto-sauvegarde toutes les 30 secondes
  useEffect(() => {
    if (!scriptData.id || saving) return

    const autoSaveInterval = setInterval(() => {
      saveScript().catch(console.error)
    }, 30000) // 30 secondes

    return () => clearInterval(autoSaveInterval)
  }, [scriptData.id, saving, saveScript])

  // Charger le script au montage
  useEffect(() => {
    loadScript()
  }, [loadScript])

  // Fonctions utilitaires
  const updateScriptData = useCallback((updates: Partial<ScriptData>) => {
    setScriptData(prev => ({ ...prev, ...updates }))
  }, [])

  const addChapter = useCallback(() => {
    const newChapter: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapitre ${scriptData.chapters.length + 1}`,
      description: '',
      scenes: [],
      expanded: true
    }
    
    setScriptData(prev => ({
      ...prev,
      chapters: [...prev.chapters, newChapter]
    }))
  }, [scriptData.chapters.length])

  const updateChapter = useCallback((chapterId: string, updates: Partial<Chapter>) => {
    setScriptData(prev => ({
      ...prev,
      chapters: prev.chapters.map(chapter =>
        chapter.id === chapterId ? { ...chapter, ...updates } : chapter
      )
    }))
  }, [])

  const deleteChapter = useCallback((chapterId: string) => {
    setScriptData(prev => ({
      ...prev,
      chapters: prev.chapters.filter(chapter => chapter.id !== chapterId)
    }))
  }, [])

  // Statistiques du script
  const getScriptStats = useCallback(() => {
    const totalScenes = scriptData.chapters.reduce((total, chapter) => total + chapter.scenes.length, 0)
    const totalPanels = scriptData.chapters.reduce((total, chapter) => 
      total + chapter.scenes.reduce((sceneTotal, scene) => sceneTotal + scene.panels.length, 0), 0
    )
    const totalDialogues = scriptData.chapters.reduce((total, chapter) => 
      total + chapter.scenes.reduce((sceneTotal, scene) => 
        sceneTotal + scene.panels.reduce((panelTotal, panel) => panelTotal + panel.dialogues.length, 0), 0
      ), 0
    )
    const estimatedPages = Math.ceil(totalPanels / 6) // Environ 6 panels par page

    return {
      chapters: scriptData.chapters.length,
      scenes: totalScenes,
      panels: totalPanels,
      dialogues: totalDialogues,
      estimatedPages
    }
  }, [scriptData])

  return {
    scriptData,
    loading,
    saving,
    error,
    lastSaved,
    updateScriptData,
    saveScript,
    loadScript,
    addChapter,
    updateChapter,
    deleteChapter,
    getScriptStats
  }
}
