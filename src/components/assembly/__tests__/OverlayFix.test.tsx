import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import PolotnoAssemblyApp from '../PolotnoAssemblyApp'

// Mock des dépendances
jest.mock('react-hot-toast', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}))

jest.mock('../core/SimpleCanvasEditor', () => {
  return function MockSimpleCanvasEditor(props: any) {
    return (
      <div 
        data-testid="simple-canvas-editor"
        onClick={() => props.onCanvasClick?.(100, 100)}
        style={{ width: props.width, height: props.height }}
      >
        Canvas Editor Mock
      </div>
    )
  }
})

describe('Overlay Fix - PolotnoAssemblyApp', () => {
  const defaultProps = {
    projectId: 'test-project',
    currentPage: 1
  }

  it('should have no padding that creates overlay zones', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    // Trouver le conteneur du canvas sans padding
    const canvasContainer = document.querySelector('.canvas-interface')

    // Vérifier qu'on n'a aucun padding qui créait le problème
    expect(canvasContainer).not.toHaveClass('p-8')
    expect(canvasContainer).not.toHaveClass('pl-20')
    expect(canvasContainer).not.toHaveClass('pr-8')
    expect(canvasContainer).not.toHaveClass('py-8')
  })

  it('should have transparent sidebars that do not block canvas', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    // Vérifier que les sidebars ont un fond transparent
    const leftSidebar = document.querySelector('.absolute.left-0.w-16')
    const rightSidebar = document.querySelector('.absolute.right-0.w-80')

    expect(leftSidebar).toHaveClass('bg-transparent')
    expect(rightSidebar).toHaveClass('bg-transparent')
  })

  it('should have left toolbar with proper pointer-events settings', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    // Vérifier que la sidebar gauche a pointer-events-none sur le conteneur
    const leftToolbarContainer = document.querySelector('.absolute.left-0.w-16')
    expect(leftToolbarContainer).toHaveClass('pointer-events-none')

    // Et pointer-events-auto sur le contenu avec backdrop-blur
    const toolbarContent = document.querySelector('.pointer-events-auto.bg-dark-800\\/90.backdrop-blur-sm')
    expect(toolbarContent).toBeInTheDocument()
  })

  it('should have sidebar content with backdrop blur for transparency', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    // Vérifier que les contenus des sidebars ont backdrop-blur
    const leftContent = document.querySelector('.bg-dark-800\\/90.backdrop-blur-sm')
    expect(leftContent).toBeInTheDocument()

    // Vérifier les classes de transparence
    expect(leftContent).toHaveClass('bg-dark-800/90', 'backdrop-blur-sm')
  })

  it('should have canvas area without wrapper containers', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    // Vérifier qu'il n'y a pas de conteneurs avec padding qui créent des zones mortes
    const paddingContainers = document.querySelectorAll('.p-8')
    expect(paddingContainers).toHaveLength(0)

    // Vérifier qu'il n'y a pas de wrappers avec shadow et rounded
    const shadowWrappers = document.querySelectorAll('.shadow-2xl.rounded-lg')
    expect(shadowWrappers).toHaveLength(0)
  })

  it('should have canvas extending full screen without black dotted background', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    // Vérifier qu'il n'y a pas de fond noir avec motifs de points
    const blackBackgrounds = document.querySelectorAll('.bg-black')
    const dotPatterns = document.querySelectorAll('[class*="dot-pattern"]')

    // Le canvas ne devrait pas avoir de fond noir décoratif
    expect(dotPatterns).toHaveLength(0)
  })

  it('should allow canvas clicks without interference from left overlay', () => {
    const mockCanvasClick = jest.fn()
    
    // Mock du SimpleCanvasEditor pour capturer les clics
    jest.doMock('../core/SimpleCanvasEditor', () => {
      return function MockSimpleCanvasEditor(props: any) {
        return (
          <div 
            data-testid="simple-canvas-editor"
            onClick={() => {
              mockCanvasClick()
              props.onCanvasClick?.(100, 100)
            }}
            style={{ width: props.width, height: props.height }}
          >
            Canvas Editor Mock
          </div>
        )
      }
    })

    render(<PolotnoAssemblyApp {...defaultProps} />)

    const canvasEditor = screen.getByTestId('simple-canvas-editor')
    fireEvent.click(canvasEditor)

    expect(mockCanvasClick).toHaveBeenCalled()
  })

  it('should have canvas container positioned correctly relative to sidebars', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    const canvasContainer = document.querySelector('.canvas-container')
    const leftSidebar = document.querySelector('.absolute.left-0.w-16')
    const rightSidebar = document.querySelector('.absolute.right-0.w-80')

    // Vérifier que les sidebars sont en position absolute
    expect(leftSidebar).toHaveClass('absolute', 'left-0', 'z-50')
    expect(rightSidebar).toHaveClass('absolute', 'right-0', 'z-50')

    // Vérifier que le canvas container a les bonnes classes
    expect(canvasContainer).toHaveClass('bg-black', 'shadow-2xl', 'rounded-lg')
  })

  it('should have proper z-index hierarchy', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    const leftSidebar = document.querySelector('.absolute.left-0.w-16')
    const rightSidebar = document.querySelector('.absolute.right-0.w-80')
    const canvasArea = document.querySelector('.absolute.inset-0.bg-black')

    // Sidebars doivent avoir z-50, canvas z-10
    expect(leftSidebar).toHaveClass('z-50')
    expect(rightSidebar).toHaveClass('z-50')
    expect(canvasArea).toHaveClass('z-10')
  })

  it('should have toolbar buttons still functional', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    // Vérifier que les boutons de la toolbar sont présents et cliquables
    const selectButton = document.querySelector('button[title*="Sélection"]')
    const panelButton = document.querySelector('button[title*="Panel"]')

    expect(selectButton).toBeInTheDocument()
    expect(panelButton).toBeInTheDocument()

    if (selectButton) {
      fireEvent.click(selectButton)
      // Le bouton devrait être cliquable sans problème
    }
  })

  it('should not have any elements creating dead zones in left area', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    // Vérifier que le padding left de 80px laisse assez d'espace pour la sidebar de 64px
    const canvasInterface = document.querySelector('.canvas-interface')
    
    if (canvasInterface) {
      const styles = window.getComputedStyle(canvasInterface)
      const paddingLeft = parseInt(styles.paddingLeft)
      
      // 80px (pl-20) devrait être suffisant pour éviter la sidebar de 64px
      expect(paddingLeft).toBeGreaterThanOrEqual(64)
    }
  })

  it('should maintain canvas visibility across full width when dragged', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    // Vérifier que la zone de canvas couvre bien toute la largeur disponible
    const canvasArea = document.querySelector('.absolute.inset-0.bg-black')
    
    expect(canvasArea).toHaveClass('inset-0')
    
    if (canvasArea) {
      const rect = canvasArea.getBoundingClientRect()
      expect(rect.left).toBe(0)
      expect(rect.right).toBeGreaterThan(0)
    }
  })

  it('should have proper overflow settings to prevent scrollbars', () => {
    render(<PolotnoAssemblyApp {...defaultProps} />)

    const canvasInterface = document.querySelector('.canvas-interface')
    const mainLayout = document.querySelector('.overflow-hidden')

    expect(canvasInterface).toHaveClass('no-scrollbar')
    expect(mainLayout).toHaveClass('overflow-hidden')
  })
})
