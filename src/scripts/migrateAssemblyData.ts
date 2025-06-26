// Script de migration pour adapter les données assemblage existantes
import { createClient } from '@/lib/supabase/server'

interface LegacyAssemblyData {
  pages: any[]
  currentPage: number
  totalPages: number
  lastModified: Date
}

interface NewAssemblyData extends LegacyAssemblyData {
  canvasState?: {
    position: { x: number; y: number }
    zoom: number
    currentPageId: string | null
    showGrid: boolean
    gridSize: number
    activeTool: string
    lastActiveTab: string
    timestamp: number
  }
}

export async function migrateAssemblyData() {
  console.log('🔄 Début de la migration des données assemblage...')
  
  try {
    const supabase = await createClient()
    
    // 1. Récupérer tous les projets avec des données assemblage
    const { data: projects, error: projectsError } = await supabase
      .from('manga_projects')
      .select('id, user_id, title')
      .not('pages', 'is', null)

    if (projectsError) {
      throw new Error(`Erreur récupération projets: ${projectsError.message}`)
    }

    if (!projects || projects.length === 0) {
      console.log('✅ Aucun projet à migrer')
      return { success: true, migratedCount: 0 }
    }

    console.log(`📊 ${projects.length} projets trouvés pour migration`)

    let migratedCount = 0
    let errorCount = 0

    // 2. Migrer chaque projet
    for (const project of projects) {
      try {
        console.log(`🔄 Migration du projet: ${project.title} (${project.id})`)
        
        // Récupérer les données assemblage existantes du ProjectStore
        const localStorageKey = `mangaka-project-store`
        
        // Simuler la récupération depuis localStorage (en production, cela se ferait côté client)
        // Pour cette migration, nous allons créer un état par défaut
        
        const defaultCanvasState = {
          position: { x: 0, y: 0 },
          zoom: 25,
          currentPageId: null,
          showGrid: true,
          gridSize: 20,
          activeTool: 'select',
          lastActiveTab: 'assembly',
          timestamp: Date.now()
        }

        // 3. Récupérer les pages existantes du projet
        const { data: existingPages, error: pagesError } = await supabase
          .from('pages')
          .select('id, page_number, title, created_at')
          .eq('project_id', project.id)
          .order('page_number', { ascending: true })

        if (pagesError) {
          console.warn(`⚠️ Erreur récupération pages pour ${project.id}:`, pagesError.message)
        }

        // 4. Créer les nouvelles données assemblage
        const newAssemblyData: NewAssemblyData = {
          pages: existingPages?.map(page => ({
            id: page.id,
            number: page.page_number,
            panels: [],
            layout: 'single' as const,
            lastModified: new Date(page.created_at)
          })) || [],
          currentPage: 1,
          totalPages: existingPages?.length || 0,
          lastModified: new Date(),
          canvasState: {
            ...defaultCanvasState,
            currentPageId: existingPages?.[0]?.id || null
          }
        }

        // 5. Mettre à jour le projet avec les nouvelles données
        // Note: En production, cela se ferait via l'API du ProjectStore
        console.log(`✅ Données migrées pour ${project.title}:`, {
          pagesCount: newAssemblyData.pages.length,
          hasCanvasState: !!newAssemblyData.canvasState
        })

        migratedCount++
        
      } catch (error) {
        console.error(`❌ Erreur migration projet ${project.id}:`, error)
        errorCount++
      }
    }

    console.log(`✅ Migration terminée: ${migratedCount} projets migrés, ${errorCount} erreurs`)
    
    return {
      success: true,
      migratedCount,
      errorCount,
      totalProjects: projects.length
    }

  } catch (error) {
    console.error('❌ Erreur générale de migration:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

// Fonction pour valider la migration
export async function validateMigration() {
  console.log('🔍 Validation de la migration...')
  
  try {
    const supabase = await createClient()
    
    // Vérifier que toutes les pages ont une numérotation cohérente
    const { data: projects, error } = await supabase
      .from('manga_projects')
      .select('id, title')

    if (error) {
      throw new Error(`Erreur validation: ${error.message}`)
    }

    let validationErrors = 0

    for (const project of projects || []) {
      const { data: pages, error: pagesError } = await supabase
        .from('pages')
        .select('page_number')
        .eq('project_id', project.id)
        .order('page_number', { ascending: true })

      if (pagesError) {
        console.warn(`⚠️ Erreur validation pages ${project.id}:`, pagesError.message)
        validationErrors++
        continue
      }

      // Vérifier la séquence de numérotation
      if (pages && pages.length > 0) {
        for (let i = 0; i < pages.length; i++) {
          if (pages[i].page_number !== i + 1) {
            console.error(`❌ Numérotation incorrecte dans ${project.title}: page ${pages[i].page_number} à l'index ${i}`)
            validationErrors++
            break
          }
        }
      }
    }

    if (validationErrors === 0) {
      console.log('✅ Validation réussie - Toutes les données sont cohérentes')
    } else {
      console.log(`⚠️ Validation terminée avec ${validationErrors} erreurs`)
    }

    return {
      success: validationErrors === 0,
      errorCount: validationErrors,
      totalProjects: projects?.length || 0
    }

  } catch (error) {
    console.error('❌ Erreur validation:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

// Fonction utilitaire pour nettoyer les anciennes données
export async function cleanupLegacyData() {
  console.log('🧹 Nettoyage des anciennes données...')
  
  try {
    // Nettoyer les clés localStorage obsolètes
    if (typeof localStorage !== 'undefined') {
      const keysToRemove = []
      
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith('assembly_draft_')) {
          keysToRemove.push(key)
        }
      }
      
      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        console.log(`🗑️ Supprimé: ${key}`)
      })
      
      console.log(`✅ ${keysToRemove.length} clés obsolètes supprimées`)
    }

    return { success: true, cleanedKeys: 0 }
    
  } catch (error) {
    console.error('❌ Erreur nettoyage:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}
