'use client'

// Test du nouveau système de sélection HTML unifié
// Valide l'alignement parfait entre bulles HTML et cadre de sélection

import React, { useState, useRef, useEffect } from 'react'
import { UnifiedCoordinateSystem, CanvasTransform, ViewportInfo } from '../core/CoordinateSystem'
import { LayerManager } from '../core/LayerManager'
import { BubbleManipulationManager, HandleType } from '../core/BubbleManipulationManager'
import HtmlBubble from '../ui/HtmlBubble'
import { DialogueElement, BubbleType } from '../types/assembly.types'

interface HtmlSelectionTestProps {
  className?: string
}

/**
 * Test du système de sélection HTML unifié
 * Valide l'alignement parfait entre bulles et cadres
 */
export default function HtmlSelectionTest({ className = '' }: HtmlSelectionTestProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [testBubbles, setTestBubbles] = useState<DialogueElement[]>([])
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null)
  const [canvasTransform, setCanvasTransform] = useState<CanvasTransform>({
    x: 0,
    y: 0,
    scale: 1
  })
  
  const coordinateSystemRef = useRef<UnifiedCoordinateSystem | null>(null)
  const manipulationManagerRef = useRef<BubbleManipulationManager | null>(null)

  // ✅ INITIALISATION
  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect()
      const viewport: ViewportInfo = {
        width: rect.width,
        height: rect.height,
        centerX: rect.width / 2,
        centerY: rect.height / 2
      }
      
      coordinateSystemRef.current = new UnifiedCoordinateSystem(
        canvasTransform,
        viewport,
        { width: 800, height: 600 }
      )
    }

    // Gestionnaire de manipulation
    if (!manipulationManagerRef.current) {
      manipulationManagerRef.current = new BubbleManipulationManager((elementId: string, updates: Partial<DialogueElement>) => {
        setTestBubbles(prev => 
          prev.map(bubble => 
            bubble.id === elementId ? { ...bubble, ...updates } : bubble
          )
        )
      })
    }
  }, [canvasTransform])

  // ✅ CRÉATION DE BULLE DE TEST
  const createTestBubble = (x: number, y: number): DialogueElement => {
    const id = `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    return {
      id,
      type: 'dialogue',
      layerType: 'dialogue',
      text: 'Test de sélection HTML',
      transform: {
        x,
        y,
        width: 200,
        height: 100,
        rotation: 0,
        alpha: 1,
        zIndex: 200
      },
      bubbleStyle: {
        type: 'speech',
        backgroundColor: 0xffffff,
        outlineColor: 0x000000,
        textColor: '#000000',
        dashedOutline: false,
        tailPosition: 'bottom-left',
        fontSize: 16,
        fontFamily: 'Arial, sans-serif',
        textAlign: 'center',
        tailAbsoluteX: x + 50,
        tailAbsoluteY: y + 120,
        tailLength: 30,
        tailAngleDegrees: 225,
        tailAttachmentSide: 'bottom'
      },
      properties: {
        name: 'Test Bubble',
        locked: false,
        visible: true,
        blendMode: 'normal'
      },
      renderMode: 'html'
    }
  }

  // ✅ AJOUTER UNE BULLE
  const addTestBubble = () => {
    const newBubble = createTestBubble(100 + testBubbles.length * 50, 100 + testBubbles.length * 30)
    setTestBubbles(prev => [...prev, newBubble])
    setSelectedBubbleId(newBubble.id)
  }

  // ✅ GESTION DE LA SÉLECTION
  const handleBubbleSelect = (bubbleId: string) => {
    setSelectedBubbleId(bubbleId)
    console.log('🎯 Test: Bulle sélectionnée:', bubbleId)
  }

  // ✅ GESTION DE L'ÉDITION
  const handleBubbleEdit = (bubbleId: string) => {
    console.log('✏️ Test: Édition bulle:', bubbleId)
  }

  // ✅ MISE À JOUR DES BULLES
  const handleBubbleUpdate = (bubbleId: string, updates: Partial<DialogueElement>) => {
    setTestBubbles(prev => 
      prev.map(bubble => 
        bubble.id === bubbleId ? { ...bubble, ...updates } : bubble
      )
    )
  }

  // ✅ DÉMARRAGE DE LA MANIPULATION
  const handleStartManipulation = (element: DialogueElement, handleType: HandleType, globalX: number, globalY: number) => {
    console.log('🔧 Test: Manipulation démarrée:', {
      elementId: element.id,
      handleType: HandleType[handleType],
      position: { globalX, globalY }
    })
    
    manipulationManagerRef.current?.startManipulation(element, handleType, globalX, globalY)
    
    const handleMouseMove = (e: MouseEvent) => {
      manipulationManagerRef.current?.updateManipulation(e.clientX, e.clientY)
    }
    
    const handleMouseUp = () => {
      manipulationManagerRef.current?.endManipulation()
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
    
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseup', handleMouseUp)
  }

  // ✅ CONTRÔLES DE TRANSFORMATION
  const handleZoom = (delta: number) => {
    setCanvasTransform(prev => ({ 
      ...prev, 
      scale: Math.max(0.5, Math.min(2, prev.scale + delta)) 
    }))
  }

  const handlePan = (deltaX: number, deltaY: number) => {
    setCanvasTransform(prev => ({ 
      ...prev, 
      x: prev.x + deltaX,
      y: prev.y + deltaY
    }))
  }

  return (
    <div className={`html-selection-test ${className}`}>
      {/* ✅ CONTRÔLES */}
      <div className="test-controls bg-gray-100 p-4 border-b">
        <h3 className="text-lg font-bold mb-4">🎯 Test Sélection HTML Unifiée</h3>
        
        <div className="flex gap-2 mb-4">
          <button
            onClick={addTestBubble}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Ajouter Bulle
          </button>
          <button
            onClick={() => setTestBubbles([])}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Effacer Tout
          </button>
          <button
            onClick={() => handleZoom(0.2)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Zoom +
          </button>
          <button
            onClick={() => handleZoom(-0.2)}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Zoom -
          </button>
          <button
            onClick={() => setCanvasTransform({ x: 0, y: 0, scale: 1 })}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Reset
          </button>
        </div>

        <div className="text-sm text-gray-600">
          <div>Bulles: {testBubbles.length} | Sélectionnée: {selectedBubbleId || 'Aucune'}</div>
          <div>Transform: x={canvasTransform.x}, y={canvasTransform.y}, scale={canvasTransform.scale.toFixed(2)}</div>
        </div>
      </div>

      {/* ✅ ZONE DE TEST */}
      <div 
        ref={containerRef}
        className="test-area relative bg-gray-50 overflow-hidden"
        style={{ height: '600px' }}
      >
        {/* Canvas simulé */}
        <div 
          className="absolute bg-white border-2 border-gray-300"
          style={{
            width: '800px',
            height: '600px',
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%)`,
            transformOrigin: 'center'
          }}
        >
          {/* Grille de fond */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}
          />
          
          {/* ✅ BULLES HTML AVEC CADRES DE SÉLECTION */}
          {coordinateSystemRef.current && testBubbles.map(bubble => (
            <HtmlBubble
              key={bubble.id}
              element={bubble}
              coordinateSystem={coordinateSystemRef.current!}
              isSelected={bubble.id === selectedBubbleId}
              onSelect={handleBubbleSelect}
              onEdit={handleBubbleEdit}
              onUpdate={handleBubbleUpdate}
              onStartManipulation={handleStartManipulation}
            />
          ))}
        </div>

        {/* ✅ INSTRUCTIONS */}
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-75 text-white text-xs p-3 rounded max-w-xs">
          <div className="font-bold mb-2">Instructions :</div>
          <div>• Cliquez sur une bulle pour la sélectionner</div>
          <div>• Le cadre bleu doit être parfaitement aligné</div>
          <div>• Utilisez les handles pour redimensionner</div>
          <div>• Le handle orange contrôle la queue</div>
        </div>
      </div>
    </div>
  )
}
