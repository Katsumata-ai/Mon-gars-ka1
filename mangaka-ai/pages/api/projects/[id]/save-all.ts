// pages/api/projects/[id]/save-all.ts - Endpoint sauvegarde complète
import { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@/lib/supabase/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { id: projectId } = req.query
    const { scriptData, charactersData, backgroundsData, scenesData, assemblyData } = req.body

    // Validation des données requises
    if (!projectId) {
      return res.status(400).json({ error: 'Project ID requis' })
    }

    const supabase = createClient()

    // Pour l'instant, on utilise un mode démo sans authentification (UUID valide)
    const userId = '00000000-0000-0000-0000-000000000001'

    // Préparer données unifiées avec métadonnées
    const unifiedData = {
      script: {
        content: scriptData?.content || '',
        title: scriptData?.title || 'Script Sans Titre',
        stats: scriptData?.stats || { pages: 0, panels: 0, chapters: 0, words: 0, characters: 0, dialogues: 0 },
        fileTree: scriptData?.fileTree || [],
        lastModified: new Date().toISOString()
      },
      characters: {
        characters: charactersData || [],
        lastModified: new Date().toISOString()
      },
      backgrounds: {
        backgrounds: backgroundsData || [],
        lastModified: new Date().toISOString()
      },
      scenes: {
        scenes: scenesData || [],
        lastModified: new Date().toISOString()
      },
      assembly: {
        pages: assemblyData?.pages || [],
        currentPage: assemblyData?.currentPage || 1,
        totalPages: assemblyData?.totalPages || 0,
        lastModified: new Date().toISOString()
      },
      metadata: {
        version: 1,
        savedAt: new Date().toISOString(),
        savedBy: userId
      }
    }

    // Upsert avec contrainte unique (project_id, user_id)
    const { data, error } = await supabase
      .from('manga_scripts')
      .upsert({
        project_id: projectId,
        user_id: userId,
        title: scriptData?.title || 'Script Sans Titre',
        description: scriptData?.description || '',
        script_data: unifiedData,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,user_id'
      })
      .select()
      .single()

    if (error) {
      console.error('Erreur sauvegarde DB:', error)
      return res.status(500).json({
        error: 'Database error',
        details: error.message
      })
    }

    // Réponse optimisée avec métadonnées
    res.status(200).json({
      success: true,
      data: data,
      savedAt: new Date().toISOString(),
      message: 'Sauvegarde réussie'
    })

  } catch (error) {
    console.error('Erreur API save-all:', error)
    res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Erreur inconnue'
    })
  }
}
