'use client'

import { useState } from 'react'
import { Download, FileText, Code, Printer } from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { type ScriptData } from '@/hooks/useScriptData'
import { useUserLimits } from '@/hooks/useUserLimits'
import { useSubscription } from '@/hooks/useStripe'
import { PremiumUpgradeModal } from '@/components/upselling/PremiumUpgradeModal'
import { toast } from 'react-hot-toast'

interface ScriptExporterProps {
  scriptData: ScriptData
  onClose: () => void
}

export default function ScriptExporter({ scriptData, onClose }: ScriptExporterProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'txt' | 'json' | 'html'>('pdf')
  const [includeNotes, setIncludeNotes] = useState(true)
  const [includeStats, setIncludeStats] = useState(true)

  // ✅ NOUVEAU : Système de limites d'export
  const { isLimitReached, incrementUsage, getLimitInfo } = useUserLimits()
  const { hasActiveSubscription } = useSubscription()
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  // Informations sur les limites d'export
  const exportLimitInfo = getLimitInfo('project_exports')

  const exportFormats = [
    {
      value: 'pdf',
      label: 'PDF Professionnel',
      description: 'Format standard pour l\'industrie',
      icon: <FileText className="w-5 h-5" />
    },
    {
      value: 'txt',
      label: 'Texte Formaté',
      description: 'Script lisible en texte brut',
      icon: <FileText className="w-5 h-5" />
    },
    {
      value: 'json',
      label: 'JSON Technique',
      description: 'Données structurées pour développeurs',
      icon: <Code className="w-5 h-5" />
    },
    {
      value: 'html',
      label: 'HTML Web',
      description: 'Page web interactive',
      icon: <Printer className="w-5 h-5" />
    }
  ]

  const generateTextScript = () => {
    let output = `${scriptData.title.toUpperCase()}\n`
    output += `${'='.repeat(scriptData.title.length)}\n\n`
    
    if (scriptData.description) {
      output += `DESCRIPTION:\n${scriptData.description}\n\n`
    }

    if (includeStats) {
      const stats = getScriptStats()
      output += `STATISTICS:\n`
      output += `- Chapters: ${stats.chapters}\n`
      output += `- Scenes: ${stats.scenes}\n`
      output += `- Panels: ${stats.panels}\n`
      output += `- Estimated pages: ${stats.estimatedPages}\n\n`
    }

    scriptData.chapters.forEach((chapter, chapterIndex) => {
      output += `CHAPTER ${chapterIndex + 1}: ${chapter.title.toUpperCase()}\n`
      output += `${'-'.repeat(40)}\n\n`
      
      if (chapter.description) {
        output += `${chapter.description}\n\n`
      }

      chapter.scenes.forEach((scene, sceneIndex) => {
        output += `  SCENE ${sceneIndex + 1}: ${scene.title}\n`
        output += `  Location: ${scene.location || 'Not specified'}\n`
        output += `  Time: ${scene.timeOfDay}\n\n`

        scene.panels.forEach((panel, panelIndex) => {
          output += `    PANEL ${panelIndex + 1} (Page ${panel.pageNumber})\n`
          output += `    ${'-'.repeat(30)}\n`
          output += `    PLAN: ${panel.shotType} | ANGLE: ${panel.cameraAngle}\n`
          output += `    AMBIANCE: ${panel.mood} | TRANSITION: ${panel.transition}\n\n`
          
          if (panel.description) {
            output += `    DESCRIPTION:\n    ${panel.description}\n\n`
          }

          if (panel.dialogues.length > 0) {
            output += `    DIALOGUES:\n`
            panel.dialogues.forEach((dialogue, dialogueIndex) => {
              output += `    ${dialogueIndex + 1}. ${dialogue.character}: "${dialogue.text}"\n`
              output += `       Style: ${dialogue.bubbleStyle} | Type: ${dialogue.type}\n`
            })
            output += '\n'
          }

          if (panel.soundEffects.length > 0) {
            output += `    SOUND EFFECTS:\n`
            panel.soundEffects.forEach((effect, effectIndex) => {
              output += `    ${effectIndex + 1}. ${effect.text} (${effect.style}, ${effect.size})\n`
            })
            output += '\n'
          }

          if (includeNotes && panel.notes) {
            output += `    NOTES:\n    ${panel.notes}\n\n`
          }

          output += '\n'
        })
      })
    })

    return output
  }

  const generateHTMLScript = () => {
    let html = `
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${scriptData.title} - Script</title>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; border-bottom: 3px solid #e74c3c; padding-bottom: 10px; }
        h2 { color: #34495e; margin-top: 30px; }
        h3 { color: #7f8c8d; }
        .panel { background: #ecf0f1; padding: 20px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #e74c3c; }
        .dialogue { background: #d5dbdb; padding: 10px; margin: 10px 0; border-radius: 3px; }
        .notes { background: #ffeaa7; padding: 10px; margin: 10px 0; border-radius: 3px; font-style: italic; }
        .stats { background: #74b9ff; color: white; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .meta { color: #636e72; font-size: 0.9em; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${scriptData.title}</h1>
        ${scriptData.description ? `<p><strong>Description:</strong> ${scriptData.description}</p>` : ''}
        
        ${includeStats ? `
        <div class="stats">
            <h3>Script Statistics</h3>
            <p>Chapters: ${scriptData.chapters.length} | Scenes: ${scriptData.chapters.reduce((total, ch) => total + ch.scenes.length, 0)} | Panels: ${scriptData.chapters.reduce((total, ch) => total + ch.scenes.reduce((sceneTotal, sc) => sceneTotal + sc.panels.length, 0), 0)}</p>
        </div>
        ` : ''}
    `

    scriptData.chapters.forEach((chapter, chapterIndex) => {
      html += `<h2>Chapter ${chapterIndex + 1}: ${chapter.title}</h2>`
      if (chapter.description) {
        html += `<p>${chapter.description}</p>`
      }

      chapter.scenes.forEach((scene, sceneIndex) => {
        html += `<h3>Scene ${sceneIndex + 1}: ${scene.title}</h3>`
        html += `<p class="meta">Location: ${scene.location || 'Not specified'} | Time: ${scene.timeOfDay}</p>`

        scene.panels.forEach((panel, panelIndex) => {
          html += `<div class="panel">`
          html += `<h4>Panel ${panelIndex + 1} (Page ${panel.pageNumber})</h4>`
          html += `<p class="meta">Plan: ${panel.shotType} | Angle: ${panel.cameraAngle} | Ambiance: ${panel.mood}</p>`
          
          if (panel.description) {
            html += `<p><strong>Description:</strong> ${panel.description}</p>`
          }

          if (panel.dialogues.length > 0) {
            html += `<div><strong>Dialogues:</strong></div>`
            panel.dialogues.forEach(dialogue => {
              html += `<div class="dialogue"><strong>${dialogue.character}:</strong> "${dialogue.text}"</div>`
            })
          }

          if (panel.soundEffects.length > 0) {
            html += `<div><strong>Sound effects:</strong> ${panel.soundEffects.map(effect => effect.text).join(', ')}</div>`
          }

          if (includeNotes && panel.notes) {
            html += `<div class="notes"><strong>Notes:</strong> ${panel.notes}</div>`
          }

          html += `</div>`
        })
      })
    })

    html += `
    </div>
</body>
</html>`

    return html
  }

  const getScriptStats = () => {
    const totalScenes = scriptData.chapters.reduce((total, chapter) => total + chapter.scenes.length, 0)
    const totalPanels = scriptData.chapters.reduce((total, chapter) => 
      total + chapter.scenes.reduce((sceneTotal, scene) => sceneTotal + scene.panels.length, 0), 0
    )
    const estimatedPages = Math.ceil(totalPanels / 6)

    return {
      chapters: scriptData.chapters.length,
      scenes: totalScenes,
      panels: totalPanels,
      estimatedPages
    }
  }

  const handleExport = async () => {
    // ✅ NOUVEAU : Vérification des limites d'export pour utilisateurs gratuits
    if (!hasActiveSubscription && isLimitReached('project_exports')) {
      setShowUpgradeModal(true)
      return
    }

    let content = ''
    let filename = `${scriptData.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_script`
    let mimeType = 'text/plain'

    switch (exportFormat) {
      case 'txt':
        content = generateTextScript()
        filename += '.txt'
        mimeType = 'text/plain'
        break
      case 'json':
        content = JSON.stringify(scriptData, null, 2)
        filename += '.json'
        mimeType = 'application/json'
        break
      case 'html':
        content = generateHTMLScript()
        filename += '.html'
        mimeType = 'text/html'
        break
      case 'pdf':
        // Pour le PDF, on utiliserait une bibliothèque comme jsPDF
        toast.error('PDF export will be implemented soon')
        return
    }

    try {
      // Créer et télécharger le fichier
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = filename
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      // ✅ NOUVEAU : Incrémenter le compteur d'exports après succès
      if (!hasActiveSubscription) {
        await incrementUsage('project_exports', 1)
      }

      toast.success(`Script exported successfully!`)
      onClose()
    } catch (error) {
      console.error('Script export error:', error)
      toast.error('Error exporting script')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-800 rounded-xl p-6 max-w-2xl w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Export Script</h2>
            <p className="text-dark-400">Choose export format</p>
          </div>
          <button
            onClick={onClose}
            className="text-dark-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Formats */}
        <div className="space-y-3 mb-6">
          {exportFormats.map(format => (
            <label
              key={format.value}
              className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                exportFormat === format.value
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-dark-600 hover:border-dark-500'
              }`}
            >
              <input
                type="radio"
                name="exportFormat"
                value={format.value}
                checked={exportFormat === format.value}
                onChange={(e) => setExportFormat(e.target.value as any)}
                className="sr-only"
              />
              <div className="flex items-center space-x-3 flex-1">
                <div className="text-primary-400">
                  {format.icon}
                </div>
                <div>
                  <div className="text-white font-medium">{format.label}</div>
                  <div className="text-dark-400 text-sm">{format.description}</div>
                </div>
              </div>
            </label>
          ))}
        </div>

        {/* ✅ NOUVEAU : Indicateur de limites d'export */}
        {!hasActiveSubscription && exportLimitInfo && (
          <div className="bg-slate-700/50 border border-slate-600 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-300">
                📤 Exports disponibles
              </span>
              <span className={`text-sm font-bold ${
                exportLimitInfo.isReached ? 'text-red-400' : 'text-green-400'
              }`}>
                {exportLimitInfo.current}/{exportLimitInfo.limit}
              </span>
            </div>

            <div className="w-full bg-slate-600 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  exportLimitInfo.isReached ? 'bg-red-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(exportLimitInfo.percentage || 0, 100)}%` }}
              />
            </div>

            {exportLimitInfo.isReached && (
              <div className="mt-2 text-xs text-red-400">
                ⚠️ Vous avez utilisé votre export gratuit
              </div>
            )}
          </div>
        )}

        {/* Options */}
        <div className="space-y-3 mb-6">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={includeNotes}
              onChange={(e) => setIncludeNotes(e.target.checked)}
              className="rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-white">Inclure les notes pour l'artiste</span>
          </label>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={includeStats}
              onChange={(e) => setIncludeStats(e.target.checked)}
              className="rounded border-dark-600 bg-dark-700 text-primary-500 focus:ring-primary-500"
            />
            <span className="text-white">Include statistics</span>
          </label>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <MangaButton
            onClick={onClose}
            variant="ghost"
            className="flex-1"
          >
            Cancel
          </MangaButton>
          <MangaButton
            onClick={handleExport}
            icon={<Download className="w-4 h-4" />}
            className="flex-1"
          >
            {!hasActiveSubscription && exportLimitInfo?.isReached ? 'Upgrade to export' : 'Export'}
          </MangaButton>
        </div>

        {/* ✅ NOUVEAU : Modale d'[FR-UNTRANSLATED: upselling pour les exports */}
        <PremiumUpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          limitType="project_exports"
          currentUsage={exportLimitInfo ? {
            used: exportLimitInfo.current,
            limit: exportLimitInfo.limit as number,
            type:]'exports'
          } : undefined}
        />
      </div>
    </div>
  )
}
