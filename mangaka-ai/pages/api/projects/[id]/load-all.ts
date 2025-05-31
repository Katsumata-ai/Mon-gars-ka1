// pages/api/projects/[id]/load-all.ts - Endpoint chargement complet
import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id: projectId } = req.query

    // Validation des données requises
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID requis' })
    }

    const supabase = createClient()

    // Pour l'instant, on utilise un mode démo sans authentification (UUID valide)
    const userId = '00000000-0000-0000-0000-000000000001'

    // Charger données avec contrainte unique
    const { data, error } = await supabase
      .from('manga_scripts')
      .select('*')
      .eq('project_id', projectId)
      .eq('user_id', userId)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Erreur chargement DB:', error)
      return res.status(500).json({ error: 'Database error' })
    }

    if (!data) {
      // Créer enregistrement vide si n'existe pas
      const defaultData = {
        script: {
          content: '',
          title: 'Script Sans Titre',
          stats: { pages: 0, panels: 0, chapters: 0, words: 0, characters: 0, dialogues: 0 },
          fileTree: [],
          lastModified: new Date().toISOString()
        },
        characters: {
          characters: [],
          lastModified: new Date().toISOString()
        },
        backgrounds: {
          backgrounds: [],
          lastModified: new Date().toISOString()
        },
        scenes: {
          scenes: [],
          lastModified: new Date().toISOString()
        },
        assembly: {
          pages: [],
          currentPage: 1,
          totalPages: 0,
          lastModified: new Date().toISOString()
        },
        metadata: {
          version: 1,
          createdAt: new Date().toISOString()
        }
      }

      const { data: newData, error: createError } = await supabase
        .from('manga_scripts')
        .insert({
          project_id: projectId,
          user_id: userId,
          title: 'Script Sans Titre',
          description: '',
          script_data: defaultData
        })
        .select()
        .single()

      if (createError) {
        console.error('Erreur création script:', createError)
        return res.status(500).json({ error: 'Failed to create script' })
      }

      return res.status(200).json({
        success: true,
        data: defaultData,
        updatedAt: newData.updated_at,
        isNew: true
      })
    }

    // Retourner données existantes
    res.status(200).json({
      success: true,
      data: data.script_data,
      updatedAt: data.updated_at,
      isNew: false
    })

  } catch (error) {
    console.error('Erreur API load-all:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}
