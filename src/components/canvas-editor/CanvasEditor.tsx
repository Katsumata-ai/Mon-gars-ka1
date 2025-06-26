'use client'

import { useEffect, useRef, useState } from 'react'
import { Canvas, Rect, Circle, Path, Text, Group, Ellipse } from 'fabric'
import ClientOnly from '@/components/common/ClientOnly'

interface CanvasEditorProps {
  width?: number
  height?: number
  onCanvasReady?: (canvas: Canvas) => void
}

export default function CanvasEditor({
  width = 800,
  height = 1200,
  onCanvasReady
}: CanvasEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvas, setCanvas] = useState<Canvas | null>(null)
  const [selectedTool, setSelectedTool] = useState<string>('select')
  const [isDrawingPanel, setIsDrawingPanel] = useState(false)

  useEffect(() => {
    if (!canvasRef.current) return

    // Initialize Fabric.js canvas
    const fabricCanvas = new Canvas(canvasRef.current, {
      width,
      height,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    })

    // Set up canvas properties
    fabricCanvas.setZoom(0.8)
    fabricCanvas.renderAll()

    setCanvas(fabricCanvas)
    onCanvasReady?.(fabricCanvas)

    // Cleanup
    return () => {
      fabricCanvas.dispose()
    }
  }, [width, height, onCanvasReady])

  const addRectPanel = () => {
    if (!canvas) return

    const rect = new Rect({
      left: 50,
      top: 50,
      width: 200,
      height: 150,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 3,
      rx: 5,
      ry: 5,
    })

    canvas.add(rect)
    canvas.setActiveObject(rect)
    canvas.renderAll()
  }

  const addCirclePanel = () => {
    if (!canvas) return

    const circle = new Circle({
      left: 100,
      top: 100,
      radius: 75,
      fill: 'transparent',
      stroke: '#000000',
      strokeWidth: 3,
    })

    canvas.add(circle)
    canvas.setActiveObject(circle)
    canvas.renderAll()
  }

  const addSpeechBubble = () => {
    if (!canvas) return

    // Create speech bubble using path
    const bubblePath = 'M 50 50 Q 50 25 75 25 L 175 25 Q 200 25 200 50 L 200 100 Q 200 125 175 125 L 100 125 L 75 150 L 90 125 L 75 125 Q 50 125 50 100 Z'

    const bubble = new Path(bubblePath, {
      left: 100,
      top: 100,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
      scaleX: 1,
      scaleY: 1,
    })

    // Add text inside bubble
    const text = new Text('Dialogue...', {
      left: 125,
      top: 125,
      fontSize: 16,
      fontFamily: 'Arial',
      fill: '#000000',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
    })

    const group = new Group([bubble, text], {
      left: 100,
      top: 100,
    })

    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.renderAll()
  }

  const addThoughtBubble = () => {
    if (!canvas) return

    // Create thought bubble with cloud-like shape
    const bubble = new Ellipse({
      left: 100,
      top: 100,
      rx: 80,
      ry: 60,
      fill: '#ffffff',
      stroke: '#000000',
      strokeWidth: 2,
      strokeDashArray: [5, 5],
    })

    const text = new Text('Pensée...', {
      left: 140,
      top: 130,
      fontSize: 14,
      fontFamily: 'Arial',
      fill: '#000000',
      textAlign: 'center',
      originX: 'center',
      originY: 'center',
      fontStyle: 'italic',
    })

    const group = new Group([bubble, text], {
      left: 100,
      top: 100,
    })

    canvas.add(group)
    canvas.setActiveObject(group)
    canvas.renderAll()
  }

  const deleteSelected = () => {
    if (!canvas) return

    const activeObjects = canvas.getActiveObjects()
    if (activeObjects.length > 0) {
      activeObjects.forEach(obj => canvas.remove(obj))
      canvas.discardActiveObject()
      canvas.renderAll()
    }
  }

  const zoomIn = () => {
    if (!canvas) return
    const zoom = canvas.getZoom()
    canvas.setZoom(Math.min(zoom * 1.2, 3))
  }

  const zoomOut = () => {
    if (!canvas) return
    const zoom = canvas.getZoom()
    canvas.setZoom(Math.max(zoom * 0.8, 0.2))
  }

  const resetZoom = () => {
    if (!canvas) return
    canvas.setZoom(1)
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0]
    canvas.renderAll()
  }

  const tools = [
    { id: 'select', label: 'Sélection', icon: '↖️' },
    { id: 'rect-panel', label: 'Case Rectangle', icon: '⬜' },
    { id: 'circle-panel', label: 'Case Ronde', icon: '⭕' },
    { id: 'speech-bubble', label: 'Bulle Dialogue', icon: '💬' },
    { id: 'thought-bubble', label: 'Bulle Pensée', icon: '💭' },
  ]

  const handleToolClick = (toolId: string) => {
    setSelectedTool(toolId)

    switch (toolId) {
      case 'rect-panel':
        addRectPanel()
        break
      case 'circle-panel':
        addCirclePanel()
        break
      case 'speech-bubble':
        addSpeechBubble()
        break
      case 'thought-bubble':
        addThoughtBubble()
        break
      default:
        break
    }
  }

  return (
    <ClientOnly fallback={
      <div className="flex h-full bg-dark-900">
        <div className="w-64 bg-dark-800 border-r border-dark-700 p-4">
          <div className="animate-pulse">
            <div className="h-6 bg-dark-700 rounded mb-4"></div>
            <div className="space-y-2">
              {[1,2,3,4,5].map(i => (
                <div key={i} className="h-12 bg-dark-700 rounded"></div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex-1 bg-dark-700 p-4">
          <div className="flex justify-center">
            <div className="w-96 h-64 bg-white rounded-lg animate-pulse"></div>
          </div>
        </div>
      </div>
    }>
      <div className="flex h-full bg-dark-900">
        {/* Toolbar */}
        <div className="w-64 bg-dark-800 border-r border-dark-700 p-4">
        <h3 className="text-lg font-bold mb-4 text-white">Outils</h3>

        {/* Tools */}
        <div className="space-y-2 mb-6">
          {tools.map((tool) => (
            <button
              key={tool.id}
              onClick={() => handleToolClick(tool.id)}
              className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                selectedTool === tool.id
                  ? 'border-primary-500 bg-primary-500/10 text-primary-500'
                  : 'border-dark-600 hover:border-primary-500/50 text-dark-200'
              }`}
            >
              <div className="flex items-center">
                <span className="text-xl mr-3">{tool.icon}</span>
                <span className="text-sm font-medium">{tool.label}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="space-y-2 mb-6">
          <h4 className="text-sm font-medium text-dark-400 mb-2">Actions</h4>
          <button
            onClick={deleteSelected}
            className="w-full p-2 bg-error hover:bg-error/80 text-white rounded-lg transition-colors text-sm"
          >
            🗑️ Supprimer
          </button>
        </div>

        {/* Zoom Controls */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-dark-400 mb-2">Zoom</h4>
          <div className="flex gap-2">
            <button
              onClick={zoomOut}
              className="flex-1 p-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm"
            >
              -
            </button>
            <button
              onClick={resetZoom}
              className="flex-1 p-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm"
            >
              100%
            </button>
            <button
              onClick={zoomIn}
              className="flex-1 p-2 bg-dark-700 hover:bg-dark-600 text-white rounded-lg transition-colors text-sm"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 overflow-auto bg-dark-700 p-4">
        <div className="flex justify-center">
          <div className="bg-white rounded-lg shadow-2xl">
            <canvas
              ref={canvasRef}
              className="border border-dark-600 rounded-lg"
            />
          </div>
        </div>
      </div>
      </div>
    </ClientOnly>
  )
}
