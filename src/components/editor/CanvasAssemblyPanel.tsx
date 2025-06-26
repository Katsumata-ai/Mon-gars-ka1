'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Layout,
  Square,
  Circle,
  Type,
  Image as ImageIcon,
  Move,
  RotateCcw,
  Trash2,
  Download,
  Upload,
  Save,
  Grid,
  Layers,
  ZoomIn,
  ZoomOut,
  MousePointer,
  Hand
} from 'lucide-react'
import MangaButton from '@/components/ui/MangaButton'
import { cn } from '@/lib/utils'

interface CanvasElement {
  id: string
  type: 'panel' | 'text' | 'bubble' | 'image'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  content?: string
  imageUrl?: string
  style?: any
}

interface CanvasAssemblyPanelProps {
  projectId: string
  currentPage: number
  onSave?: (pageData: any) => void
}

const PANEL_TEMPLATES = [
  { name: 'Rectangle', type: 'rect', icon: Square },
  { name: 'Carré', type: 'square', icon: Square },
  { name: 'Cercle', type: 'circle', icon: Circle },
  { name: 'Panel irrégulier', type: 'irregular', icon: Layout }
]

const BUBBLE_TYPES = [
  { name: 'Dialogue', type: 'dialogue', style: 'rounded' },
  { name: 'Pensée', type: 'thought', style: 'cloud' },
  { name: 'Cri', type: 'shout', style: 'spiky' },
  { name: 'Chuchotement', type: 'whisper', style: 'dashed' }
]

const TOOLS = [
  { id: 'select', name: 'Sélection', icon: MousePointer },
  { id: 'pan', name: 'Déplacer', icon: Hand },
  { id: 'panel', name: 'Panel', icon: Square },
  { id: 'text', name: 'Texte', icon: Type },
  { id: 'bubble', name: 'Bulle', icon: Circle },
  { id: 'image', name: 'Image', icon: ImageIcon }
]

export default function CanvasAssemblyPanel({
  projectId,
  currentPage,
  onSave
}: CanvasAssemblyPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [elements, setElements] = useState<CanvasElement[]>([])
  const [selectedElement, setSelectedElement] = useState<string | null>(null)
  const [activeTool, setActiveTool] = useState('select')
  const [zoom, setZoom] = useState(100)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 1200 })
  const [showGrid, setShowGrid] = useState(true)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })

  useEffect(() => {
    loadPageData()
    loadAvailableAssets()
  }, [projectId, currentPage])

  useEffect(() => {
    drawCanvas()
  }, [elements, selectedElement, zoom, showGrid])

  const loadPageData = async () => {
    // Charger les données de la page depuis Supabase
    // Pour l'instant, on initialise avec des éléments par défaut
    if (elements.length === 0) {
      setElements([
        {
          id: '1',
          type: 'panel',
          x: 50,
          y: 50,
          width: 300,
          height: 200,
          rotation: 0,
          style: { borderWidth: 3, borderColor: '#000' }
        }
      ])
    }
  }

  const loadAvailableAssets = async () => {
    // Les assets sont maintenant gérés par la sidebar droite
    // Cette fonction peut être supprimée ou utilisée pour d'autres besoins
  }

  const drawCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Set zoom
    ctx.save()
    ctx.scale(zoom / 100, zoom / 100)

    // Draw grid
    if (showGrid) {
      drawGrid(ctx)
    }

    // Draw elements
    elements.forEach(element => {
      drawElement(ctx, element)
    })

    ctx.restore()
  }

  const drawGrid = (ctx: CanvasRenderingContext2D) => {
    const gridSize = 20
    ctx.strokeStyle = '#374151'
    ctx.lineWidth = 0.5

    for (let x = 0; x <= canvasSize.width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, canvasSize.height)
      ctx.stroke()
    }

    for (let y = 0; y <= canvasSize.height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(canvasSize.width, y)
      ctx.stroke()
    }
  }

  const drawElement = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    ctx.save()
    ctx.translate(element.x + element.width / 2, element.y + element.height / 2)
    ctx.rotate((element.rotation * Math.PI) / 180)
    ctx.translate(-element.width / 2, -element.height / 2)

    // Highlight selected element
    if (selectedElement === element.id) {
      ctx.strokeStyle = '#ef4444'
      ctx.lineWidth = 2
      ctx.setLineDash([5, 5])
      ctx.strokeRect(-5, -5, element.width + 10, element.height + 10)
      ctx.setLineDash([])
    }

    switch (element.type) {
      case 'panel':
        drawPanel(ctx, element)
        break
      case 'text':
        drawText(ctx, element)
        break
      case 'bubble':
        drawBubble(ctx, element)
        break
      case 'image':
        drawImage(ctx, element)
        break
    }

    ctx.restore()
  }

  const drawPanel = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    ctx.strokeStyle = element.style?.borderColor || '#000'
    ctx.lineWidth = element.style?.borderWidth || 2
    ctx.fillStyle = element.style?.backgroundColor || 'transparent'

    if (element.style?.backgroundColor) {
      ctx.fillRect(0, 0, element.width, element.height)
    }
    ctx.strokeRect(0, 0, element.width, element.height)
  }

  const drawText = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    ctx.fillStyle = element.style?.color || '#000'
    ctx.font = `${element.style?.fontSize || 16}px ${element.style?.fontFamily || 'Arial'}`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(
      element.content || 'Texte',
      element.width / 2,
      element.height / 2
    )
  }

  const drawBubble = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    ctx.fillStyle = element.style?.backgroundColor || '#fff'
    ctx.strokeStyle = element.style?.borderColor || '#000'
    ctx.lineWidth = element.style?.borderWidth || 2

    // Draw bubble shape based on type
    const bubbleType = element.style?.bubbleType || 'dialogue'

    if (bubbleType === 'dialogue') {
      // Rounded rectangle
      const radius = 20
      ctx.beginPath()
      ctx.roundRect(0, 0, element.width, element.height, radius)
      ctx.fill()
      ctx.stroke()
    } else if (bubbleType === 'thought') {
      // Cloud shape (simplified as ellipse)
      ctx.beginPath()
      ctx.ellipse(element.width / 2, element.height / 2, element.width / 2, element.height / 2, 0, 0, 2 * Math.PI)
      ctx.fill()
      ctx.stroke()
    }

    // Draw text
    if (element.content) {
      ctx.fillStyle = element.style?.textColor || '#000'
      ctx.font = `${element.style?.fontSize || 14}px Arial`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(element.content, element.width / 2, element.height / 2)
    }
  }

  const drawImage = (ctx: CanvasRenderingContext2D, element: CanvasElement) => {
    if (element.imageUrl) {
      const img = new Image()
      img.onload = () => {
        ctx.drawImage(img, 0, 0, element.width, element.height)
      }
      img.src = element.imageUrl
    } else {
      // Placeholder
      ctx.fillStyle = '#374151'
      ctx.fillRect(0, 0, element.width, element.height)
      ctx.fillStyle = '#9ca3af'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('Image', element.width / 2, element.height / 2)
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = (event.clientX - rect.left) * (canvas.width / rect.width) / (zoom / 100)
    const y = (event.clientY - rect.top) * (canvas.height / rect.height) / (zoom / 100)

    if (activeTool === 'select') {
      // Find clicked element
      const clickedElement = elements.find(element =>
        x >= element.x && x <= element.x + element.width &&
        y >= element.y && y <= element.y + element.height
      )
      setSelectedElement(clickedElement?.id || null)
    } else if (activeTool === 'panel') {
      addElement('panel', x, y)
    } else if (activeTool === 'text') {
      addElement('text', x, y)
    } else if (activeTool === 'bubble') {
      addElement('bubble', x, y)
    }
  }

  const addElement = (type: CanvasElement['type'], x: number, y: number) => {
    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type,
      x: x - 50,
      y: y - 25,
      width: type === 'text' ? 100 : 100,
      height: type === 'text' ? 50 : 100,
      rotation: 0,
      content: type === 'text' ? 'Nouveau texte' : type === 'bubble' ? 'Dialogue' : undefined,
      style: getDefaultStyle(type)
    }

    setElements([...elements, newElement])
    setSelectedElement(newElement.id)
    setActiveTool('select')
  }

  const getDefaultStyle = (type: CanvasElement['type']) => {
    switch (type) {
      case 'panel':
        return { borderWidth: 3, borderColor: '#000' }
      case 'text':
        return { fontSize: 16, color: '#000', fontFamily: 'Arial' }
      case 'bubble':
        return {
          backgroundColor: '#fff',
          borderColor: '#000',
          borderWidth: 2,
          bubbleType: 'dialogue',
          fontSize: 14,
          textColor: '#000'
        }
      default:
        return {}
    }
  }

  const deleteSelectedElement = () => {
    if (selectedElement) {
      setElements(elements.filter(el => el.id !== selectedElement))
      setSelectedElement(null)
    }
  }

  const saveCanvas = async () => {
    const pageData = {
      pageNumber: currentPage,
      elements,
      canvasSize,
      projectId
    }

    onSave?.(pageData)

    // Sauvegarder dans Supabase
    console.log('Sauvegarde de la page:', pageData)
  }

  return (
    <div className="h-full flex flex-col bg-dark-900 overflow-hidden">
      {/* Toolbar Horizontal */}
      <div className="bg-dark-800 border-b border-dark-700 p-3 flex-shrink-0">
        <div className="flex items-center justify-between">
          {/* Outils principaux */}
          <div className="flex items-center space-x-2">
            {TOOLS.map((tool) => {
              const Icon = tool.icon
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTool(tool.id)}
                  className={cn(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                    activeTool === tool.id
                      ? 'bg-primary-500 text-white'
                      : 'text-dark-400 hover:bg-dark-700 hover:text-white'
                  )}
                  title={tool.name}
                >
                  <Icon className="w-4 h-4" />
                </button>
              )
            })}
          </div>

          {/* Contrôles de vue */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowGrid(!showGrid)}
              className={cn(
                'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                showGrid
                  ? 'bg-dark-600 text-white'
                  : 'text-dark-400 hover:bg-dark-700 hover:text-white'
              )}
              title="Grille"
            >
              <Grid className="w-4 h-4" />
            </button>

            <div className="flex items-center space-x-1 bg-dark-700 rounded-lg px-2">
              <button
                onClick={() => setZoom(Math.max(25, zoom - 10))}
                className="w-7 h-7 rounded flex items-center justify-center text-dark-400 hover:bg-dark-600 hover:text-white transition-colors"
                title="Zoom -"
              >
                <ZoomOut className="w-3 h-3" />
              </button>

              <span className="text-xs text-dark-300 px-2 min-w-[3rem] text-center">
                {zoom}%
              </span>

              <button
                onClick={() => setZoom(Math.min(200, zoom + 10))}
                className="w-7 h-7 rounded flex items-center justify-center text-dark-400 hover:bg-dark-600 hover:text-white transition-colors"
                title="Zoom +"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>

            {/* Propriétés de l'élément sélectionné */}
            {selectedElement && (
              <div className="flex items-center space-x-2 bg-dark-700 rounded-lg px-3 py-1">
                <span className="text-xs text-dark-300">
                  {elements.find(el => el.id === selectedElement)?.type || 'Élément'}
                </span>
                <button
                  onClick={deleteSelectedElement}
                  className="w-6 h-6 rounded flex items-center justify-center text-red-400 hover:bg-red-500/20 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            )}

            {/* Sauvegarde */}
            <MangaButton
              onClick={saveCanvas}
              size="sm"
              icon={<Save className="w-4 h-4" />}
            >
              Sauver
            </MangaButton>
          </div>
        </div>
      </div>

      {/* Zone Canvas Principale */}
      <div className="flex-1 overflow-auto bg-dark-600 p-6">
        <div className="flex justify-center items-center min-h-full">
          <div
            className="bg-white shadow-2xl rounded-lg overflow-hidden"
            style={{
              width: canvasSize.width * (zoom / 100),
              height: canvasSize.height * (zoom / 100)
            }}
          >
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onClick={handleCanvasClick}
              className="cursor-crosshair block"
              style={{
                width: canvasSize.width * (zoom / 100),
                height: canvasSize.height * (zoom / 100)
              }}
            />
          </div>
        </div>
      </div>


    </div>
  )
}
