// Service principal d'export pour mangaka-ai
// Adapté pour SimpleCanvasEditor + couches HTML

import { createClient } from '@/lib/supabase/client'
import { useAssemblyStore } from '@/components/assembly/managers/StateManager'
import { HighResolutionCanvasRenderer } from './HighResolutionCanvasRenderer'
import { CrossOriginImageLoader } from './CrossOriginImageLoader'
import { jsPDF } from 'jspdf'
import type { 
  ExportOptions, 
  ExportProgress, 
  PageData, 
  ExportPageData,
  ExportError,
  ExportMetadata
} from '@/types/export.types'

export class ExportManager {
  private supabaseClient
  private imageLoader: CrossOriginImageLoader
  private startTime: number = 0

  constructor() {
    this.supabaseClient = createClient()
    this.imageLoader = new CrossOriginImageLoader()
  }

  /**
   * Point d'entrée principal pour l'export
   */
  async exportPages(options: ExportOptions): Promise<Blob> {
    this.startTime = Date.now()
    
    try {
      // 1. Récupération des données
      options.onProgress?.({
        step: 'fetching',
        current: 0,
        total: 1,
        message: 'Récupération des pages...'
      })

      const pages = await this.fetchAllPages(options.projectId)
      const selectedPages = options.pageIds 
        ? pages.filter(p => options.pageIds!.includes(p.id))
        : pages

      if (selectedPages.length === 0) {
        throw new ExportError('Aucune page à exporter', 'FETCH_ERROR')
      }

      // 2. Export selon le format
      if (options.format === 'png' && selectedPages.length === 1) {
        return await this.exportSinglePageAsPNG(selectedPages[0], options)
      } else {
        return await this.exportMultiplePagesAsPDF(selectedPages, options)
      }
    } catch (error) {
      console.error('Erreur export:', error)
      if (error instanceof ExportError) {
        throw error
      }
      throw new ExportError(
        `Erreur lors de l'export: ${error.message}`,
        'EXPORT_ERROR',
        error
      )
    }
  }

  /**
   * Récupération des pages depuis Supabase
   */
  async fetchAllPages(projectId: string): Promise<PageData[]> {
    try {
      const { data, error } = await this.supabaseClient
        .from('pages')
        .select('*')
        .eq('project_id', projectId)
        .order('page_number', { ascending: true })

      if (error) {
        throw new ExportError(
          `Erreur récupération pages: ${error.message}`,
          'FETCH_ERROR',
          error
        )
      }

      return data?.map(page => ({
        id: page.id,
        number: page.page_number,
        title: page.title || `Page ${page.page_number}`,
        content: page.content || { stage: { children: [] } },
        lastModified: new Date(page.updated_at)
      })) || []
    } catch (error) {
      if (error instanceof ExportError) throw error
      throw new ExportError(
        'Impossible de récupérer les pages',
        'FETCH_ERROR',
        error
      )
    }
  }

  /**
   * Export d'une page unique en PNG
   */
  async exportSinglePageAsPNG(pageData: PageData, options: ExportOptions): Promise<Blob> {
    const renderer = new HighResolutionCanvasRenderer(
      1200, 
      1600, 
      options.resolution,
      this.imageLoader
    )

    options.onProgress?.({
      step: 'rendering',
      current: 0,
      total: 1,
      message: `Rendu de la page ${pageData.number}...`,
      pageId: pageData.id
    })

    const canvas = await renderer.renderPage(pageData, (progress) => {
      options.onProgress?.({
        step: 'rendering',
        current: progress,
        total: 1,
        message: `Rendu des éléments... ${Math.round(progress * 100)}%`,
        pageId: pageData.id
      })
    })

    options.onProgress?.({
      step: 'exporting',
      current: 1,
      total: 1,
      message: 'Génération du fichier PNG...',
      pageId: pageData.id
    })

    return new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new ExportError('Impossible de générer le PNG', 'EXPORT_ERROR'))
        }
      }, 'image/png', options.quality)
    })
  }

  /**
   * Export de plusieurs pages en PDF
   */
  async exportMultiplePagesAsPDF(pages: PageData[], options: ExportOptions): Promise<Blob> {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'px',
      format: [1200, 1600],
      compress: true
    })

    // Métadonnées PDF
    pdf.setProperties({
      title: `Manga Export - ${pages.length} pages`,
      subject: 'Export depuis Mangaka AI',
      author: 'Mangaka AI',
      creator: 'Mangaka AI Export System',
      keywords: 'manga, export, pdf'
    })

    const renderer = new HighResolutionCanvasRenderer(
      1200, 
      1600, 
      options.resolution,
      this.imageLoader
    )

    for (let i = 0; i < pages.length; i++) {
      const page = pages[i]

      options.onProgress?.({
        step: 'rendering',
        current: i,
        total: pages.length,
        message: `Rendu de la page ${page.number}...`,
        pageId: page.id
      })

      const canvas = await renderer.renderPage(page, (elementProgress) => {
        const totalProgress = (i + elementProgress) / pages.length
        options.onProgress?.({
          step: 'rendering',
          current: totalProgress,
          total: 1,
          message: `Page ${page.number} - ${Math.round(elementProgress * 100)}%`,
          pageId: page.id
        })
      })

      const imgData = canvas.toDataURL('image/png', options.quality)

      if (i > 0) pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, 0, 1200, 1600)
    }

    options.onProgress?.({
      step: 'exporting',
      current: pages.length,
      total: pages.length,
      message: 'Génération du fichier PDF...'
    })

    return pdf.output('blob')
  }

  /**
   * Préparation des données de page pour le rendu
   */
  private preparePageData(pageData: PageData): ExportPageData {
    const elements = pageData.content.stage.children || []
    
    return {
      ...pageData,
      elements: {
        panels: elements.filter(el => el.type === 'panel') as any[],
        bubbles: elements.filter(el => el.type === 'dialogue') as any[],
        texts: elements.filter(el => el.type === 'text') as any[]
      }
    }
  }

  /**
   * Génération des métadonnées d'export
   */
  private generateMetadata(options: ExportOptions, pageCount: number, totalElements: number): ExportMetadata {
    return {
      projectId: options.projectId,
      exportDate: new Date(),
      format: options.format,
      resolution: options.resolution,
      pageCount,
      totalElements,
      exportDuration: Date.now() - this.startTime
    }
  }
}

// Fonction utilitaire pour télécharger un blob
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.style.display = 'none'
  
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  
  // Nettoyer l'URL après un délai
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
