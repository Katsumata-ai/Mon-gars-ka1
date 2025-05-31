# 🔧 SPÉCIFICATIONS TECHNIQUES DÉTAILLÉES
## Système de Persistance Script - MANGAKA AI

**Date :** 21 Janvier 2025  
**Version :** 1.0  
**Scope :** Implémentation technique complète du système de persistance

---

## 🏗️ ARCHITECTURE TECHNIQUE

### 📦 Stack Technologique
```typescript
// Dependencies à ajouter
"zustand": "^4.4.7",           // State management global
"@types/lodash": "^4.14.202",  // Utilitaires merge/deep
"react-hot-toast": "^2.4.1",   // Notifications
"date-fns": "^3.0.6"           // Formatage dates
```

### 🗂️ Structure de Fichiers
```
src/
├── stores/
│   ├── projectStore.ts        # Store Zustand principal
│   ├── persistanceMiddleware.ts # Middleware localStorage
│   └── types.ts               # Types store
├── hooks/
│   ├── useProjectStore.ts     # Hook store simplifié
│   ├── useAutoSave.ts         # Hook sauvegarde automatique
│   └── useSaveIndicator.ts    # Hook indicateurs visuels
├── components/
│   ├── SaveButton.tsx         # Bouton Save global
│   ├── SaveIndicator.tsx      # Indicateur changements
│   └── SaveNotifications.tsx  # Toast notifications
├── api/
│   ├── projects/
│   │   └── [id]/
│   │       ├── save-all.ts    # Endpoint sauvegarde complète
│   │       └── load-all.ts    # Endpoint chargement
└── utils/
    ├── dataSerializer.ts      # Sérialisation données
    ├── conflictResolver.ts    # Résolution conflits
    └── migrationHelper.ts     # Migration données
```

---

## 🎯 STORE ZUSTAND GLOBAL

### 📋 Interface Principale
```typescript
// stores/types.ts
export interface ProjectState {
  // Identifiants
  projectId: string
  userId: string
  
  // Données métier
  scriptData: {
    content: string
    title: string
    stats: ScriptStats
    fileTree: FileTreeNode[]
    lastModified: Date
  }
  
  charactersData: {
    characters: CharacterData[]
    lastModified: Date
  }
  
  backgroundsData: {
    backgrounds: BackgroundData[]
    lastModified: Date
  }
  
  scenesData: {
    scenes: SceneData[]
    lastModified: Date
  }
  
  assemblyData: {
    pages: PageData[]
    currentPage: number
    lastModified: Date
  }
  
  // Métadonnées persistance
  hasUnsavedChanges: boolean
  lastSavedToDb: Date | null
  lastSavedToLocal: Date | null
  isLoading: boolean
  isSaving: boolean
  error: string | null
  
  // Actions
  updateScriptData: (data: Partial<ScriptData>) => void
  updateCharactersData: (data: Partial<CharactersData>) => void
  updateBackgroundsData: (data: Partial<BackgroundsData>) => void
  updateScenesData: (data: Partial<ScenesData>) => void
  updateAssemblyData: (data: Partial<AssemblyData>) => void
  
  // Persistance
  saveToDatabase: () => Promise<void>
  loadFromDatabase: () => Promise<void>
  markAsModified: () => void
  resetUnsavedChanges: () => void
  
  // Utilitaires
  getLastModified: () => Date
  hasDataChanged: (section?: string) => boolean
  exportAllData: () => ProjectExportData
}
```

### 🔧 Implémentation Store
```typescript
// stores/projectStore.ts
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

export const useProjectStore = create<ProjectState>()(
  persist(
    immer((set, get) => ({
      // État initial
      projectId: '',
      userId: '',
      scriptData: {
        content: '',
        title: 'Script Sans Titre',
        stats: { pages: 0, panels: 0, chapters: 0, words: 0, characters: 0, dialogues: 0 },
        fileTree: [],
        lastModified: new Date()
      },
      charactersData: { characters: [], lastModified: new Date() },
      backgroundsData: { backgrounds: [], lastModified: new Date() },
      scenesData: { scenes: [], lastModified: new Date() },
      assemblyData: { pages: [], currentPage: 1, lastModified: new Date() },
      
      hasUnsavedChanges: false,
      lastSavedToDb: null,
      lastSavedToLocal: null,
      isLoading: false,
      isSaving: false,
      error: null,
      
      // Actions de mise à jour
      updateScriptData: (data) => set((state) => {
        state.scriptData = { ...state.scriptData, ...data, lastModified: new Date() }
        state.hasUnsavedChanges = true
        state.lastSavedToLocal = new Date()
      }),
      
      updateCharactersData: (data) => set((state) => {
        state.charactersData = { ...state.charactersData, ...data, lastModified: new Date() }
        state.hasUnsavedChanges = true
        state.lastSavedToLocal = new Date()
      }),
      
      updateBackgroundsData: (data) => set((state) => {
        state.backgroundsData = { ...state.backgroundsData, ...data, lastModified: new Date() }
        state.hasUnsavedChanges = true
        state.lastSavedToLocal = new Date()
      }),
      
      updateScenesData: (data) => set((state) => {
        state.scenesData = { ...state.scenesData, ...data, lastModified: new Date() }
        state.hasUnsavedChanges = true
        state.lastSavedToLocal = new Date()
      }),
      
      updateAssemblyData: (data) => set((state) => {
        state.assemblyData = { ...state.assemblyData, ...data, lastModified: new Date() }
        state.hasUnsavedChanges = true
        state.lastSavedToLocal = new Date()
      }),
      
      // Sauvegarde base de données
      saveToDatabase: async () => {
        const state = get()
        set((draft) => { draft.isSaving = true; draft.error = null })
        
        try {
          const response = await fetch(`/api/projects/${state.projectId}/save-all`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              scriptData: state.scriptData,
              charactersData: state.charactersData,
              backgroundsData: state.backgroundsData,
              scenesData: state.scenesData,
              assemblyData: state.assemblyData
            })
          })
          
          if (!response.ok) throw new Error('Erreur sauvegarde')
          
          set((draft) => {
            draft.hasUnsavedChanges = false
            draft.lastSavedToDb = new Date()
            draft.isSaving = false
          })
          
          toast.success('Sauvegarde réussie !')
          
        } catch (error) {
          set((draft) => {
            draft.error = error.message
            draft.isSaving = false
          })
          toast.error('Erreur lors de la sauvegarde')
          throw error
        }
      },
      
      // Chargement depuis base de données
      loadFromDatabase: async () => {
        const state = get()
        set((draft) => { draft.isLoading = true; draft.error = null })
        
        try {
          const response = await fetch(`/api/projects/${state.projectId}/load-all`)
          if (!response.ok) throw new Error('Erreur chargement')
          
          const data = await response.json()
          
          set((draft) => {
            draft.scriptData = data.scriptData || draft.scriptData
            draft.charactersData = data.charactersData || draft.charactersData
            draft.backgroundsData = data.backgroundsData || draft.backgroundsData
            draft.scenesData = data.scenesData || draft.scenesData
            draft.assemblyData = data.assemblyData || draft.assemblyData
            draft.hasUnsavedChanges = false
            draft.lastSavedToDb = new Date(data.updatedAt)
            draft.isLoading = false
          })
          
        } catch (error) {
          set((draft) => {
            draft.error = error.message
            draft.isLoading = false
          })
          throw error
        }
      },
      
      // Utilitaires
      markAsModified: () => set((state) => {
        state.hasUnsavedChanges = true
      }),
      
      resetUnsavedChanges: () => set((state) => {
        state.hasUnsavedChanges = false
      }),
      
      getLastModified: () => {
        const state = get()
        return new Date(Math.max(
          state.scriptData.lastModified.getTime(),
          state.charactersData.lastModified.getTime(),
          state.backgroundsData.lastModified.getTime(),
          state.scenesData.lastModified.getTime(),
          state.assemblyData.lastModified.getTime()
        ))
      },
      
      hasDataChanged: (section) => {
        const state = get()
        if (!section) return state.hasUnsavedChanges
        
        const lastSaved = state.lastSavedToDb
        if (!lastSaved) return true
        
        switch (section) {
          case 'script': return state.scriptData.lastModified > lastSaved
          case 'characters': return state.charactersData.lastModified > lastSaved
          case 'backgrounds': return state.backgroundsData.lastModified > lastSaved
          case 'scenes': return state.scenesData.lastModified > lastSaved
          case 'assembly': return state.assemblyData.lastModified > lastSaved
          default: return false
        }
      },
      
      exportAllData: () => {
        const state = get()
        return {
          projectId: state.projectId,
          scriptData: state.scriptData,
          charactersData: state.charactersData,
          backgroundsData: state.backgroundsData,
          scenesData: state.scenesData,
          assemblyData: state.assemblyData,
          exportDate: new Date().toISOString()
        }
      }
    })),
    {
      name: 'mangaka-project-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        projectId: state.projectId,
        userId: state.userId,
        scriptData: state.scriptData,
        charactersData: state.charactersData,
        backgroundsData: state.backgroundsData,
        scenesData: state.scenesData,
        assemblyData: state.assemblyData,
        lastSavedToDb: state.lastSavedToDb,
        lastSavedToLocal: state.lastSavedToLocal
      }),
      version: 1,
      migrate: (persistedState, version) => {
        // Migration logic pour versions futures
        return persistedState as ProjectState
      }
    }
  )
)
```

---

## 🔴 COMPOSANT BOUTON SAVE GLOBAL

### 🎨 Implémentation Complète
```tsx
// components/SaveButton.tsx
import React from 'react'
import { Save, Clock, AlertCircle, CheckCircle } from 'lucide-react'
import { useProjectStore } from '@/stores/projectStore'
import { formatDistanceToNow } from 'date-fns'
import { fr } from 'date-fns/locale'

interface SaveButtonProps {
  className?: string
  showTimestamp?: boolean
}

export default function SaveButton({ className = '', showTimestamp = true }: SaveButtonProps) {
  const {
    hasUnsavedChanges,
    isSaving,
    lastSavedToDb,
    error,
    saveToDatabase
  } = useProjectStore()
  
  const handleSave = async () => {
    try {
      await saveToDatabase()
    } catch (error) {
      console.error('Erreur sauvegarde:', error)
    }
  }
  
  const formatSaveTime = (date: Date | null) => {
    if (!date) return 'Jamais sauvegardé'
    return formatDistanceToNow(date, { addSuffix: true, locale: fr })
  }
  
  const getButtonState = () => {
    if (error) return 'error'
    if (isSaving) return 'saving'
    if (!hasUnsavedChanges) return 'saved'
    return 'unsaved'
  }
  
  const buttonState = getButtonState()
  
  const stateConfig = {
    unsaved: {
      bg: 'bg-red-600 hover:bg-red-500',
      text: 'text-white',
      icon: Save,
      label: 'Sauvegarder'
    },
    saving: {
      bg: 'bg-blue-600',
      text: 'text-white',
      icon: Clock,
      label: 'Sauvegarde...'
    },
    saved: {
      bg: 'bg-green-600 hover:bg-green-500',
      text: 'text-white',
      icon: CheckCircle,
      label: 'Sauvegardé'
    },
    error: {
      bg: 'bg-red-700 hover:bg-red-600',
      text: 'text-white',
      icon: AlertCircle,
      label: 'Erreur'
    }
  }
  
  const config = stateConfig[buttonState]
  const Icon = config.icon
  
  return (
    <button
      onClick={handleSave}
      disabled={isSaving || (!hasUnsavedChanges && !error)}
      className={`
        relative flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold
        transition-all duration-200 shadow-lg hover:shadow-xl
        ${config.bg} ${config.text}
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
      title={`${config.label} - ${formatSaveTime(lastSavedToDb)}`}
    >
      {/* Indicateur changements non sauvegardés */}
      {hasUnsavedChanges && buttonState !== 'saving' && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full border-2 border-white animate-pulse" />
      )}
      
      {/* Icône avec animation */}
      <Icon className={`w-4 h-4 ${isSaving ? 'animate-spin' : ''}`} />
      
      {/* Texte principal */}
      <span>{config.label}</span>
      
      {/* Timestamp */}
      {showTimestamp && (
        <span className="text-xs opacity-75 font-mono hidden lg:inline">
          {formatSaveTime(lastSavedToDb)}
        </span>
      )}
      
      {/* Raccourci clavier */}
      <span className="text-xs opacity-50 hidden xl:inline">
        Ctrl+S
      </span>
    </button>
  )
}
```

---

## 🔌 API ENDPOINTS

### 📤 Sauvegarde Complète
```typescript
// pages/api/projects/[id]/save-all.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { id: projectId } = req.query
    const { scriptData, charactersData, backgroundsData, scenesData, assemblyData } = req.body
    
    const supabase = createServerSupabaseClient({ req, res })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Préparer données unifiées
    const unifiedData = {
      script: scriptData,
      characters: charactersData,
      backgrounds: backgroundsData,
      scenes: scenesData,
      assembly: assemblyData,
      metadata: {
        lastModified: new Date().toISOString(),
        version: 1
      }
    }
    
    // Upsert avec contrainte unique (project_id, user_id)
    const { data, error } = await supabase
      .from('manga_scripts')
      .upsert({
        project_id: projectId,
        user_id: user.id,
        title: scriptData?.title || 'Script Sans Titre',
        script_data: unifiedData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,user_id'
      })
      .select()
      .single()
    
    if (error) {
      console.error('Erreur sauvegarde DB:', error)
      return res.status(500).json({ error: 'Database error' })
    }
    
    res.status(200).json({
      success: true,
      data: data,
      savedAt: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('Erreur API save-all:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
```

### 📥 Chargement Complet
```typescript
// pages/api/projects/[id]/load-all.ts
import { NextApiRequest, NextApiResponse } from 'next'
import { createServerSupabaseClient } from '@supabase/auth-helpers-nextjs'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }
  
  try {
    const { id: projectId } = req.query
    
    const supabase = createServerSupabaseClient({ req, res })
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }
    
    // Charger données avec contrainte unique
    const { data, error } = await supabase
      .from('manga_scripts')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', user.id)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      console.error('Erreur chargement DB:', error)
      return res.status(500).json({ error: 'Database error' })
    }
    
    if (!data) {
      // Créer enregistrement vide si n'existe pas
      const { data: newData, error: createError } = await supabase
        .from('manga_scripts')
        .insert({
          project_id: projectId,
          user_id: user.id,
          title: 'Script Sans Titre',
          script_data: {
            script: { content: '', title: 'Script Sans Titre', stats: {}, fileTree: [] },
            characters: { characters: [] },
            backgrounds: { backgrounds: [] },
            scenes: { scenes: [] },
            assembly: { pages: [], currentPage: 1 },
            metadata: { lastModified: new Date().toISOString(), version: 1 }
          }
        })
        .select()
        .single()
      
      if (createError) {
        return res.status(500).json({ error: 'Failed to create script' })
      }
      
      return res.status(200).json({
        success: true,
        data: newData.script_data,
        updatedAt: newData.updated_at
      })
    }
    
    res.status(200).json({
      success: true,
      data: data.script_data,
      updatedAt: data.updated_at
    })
    
  } catch (error) {
    console.error('Erreur API load-all:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
```

**Cette spécification technique fournit tous les détails nécessaires pour une implémentation robuste et performante du système de persistance.**
