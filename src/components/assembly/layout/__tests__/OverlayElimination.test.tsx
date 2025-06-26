import React from 'react'
import { render, screen } from '@testing-library/react'
import DashtoonLayout from '../DashtoonLayout'

// Mock des composants
const MockLeftToolbar = () => <div data-testid="left-toolbar">Left Toolbar</div>
const MockCenterCanvas = () => <div data-testid="center-canvas">Center Canvas</div>
const MockRightPanel = () => <div data-testid="right-panel">Right Panel</div>

describe('Overlay Elimination', () => {
  it('should render layout with proper z-index hierarchy', () => {
    render(
      <DashtoonLayout
        leftToolbar={<MockLeftToolbar />}
        centerCanvas={<MockCenterCanvas />}
        rightPanel={<MockRightPanel />}
      />
    )

    const leftToolbar = screen.getByTestId('left-toolbar').parentElement
    const centerCanvas = screen.getByTestId('center-canvas').parentElement?.parentElement
    const rightPanel = screen.getByTestId('right-panel').parentElement

    // Vérifier que les sidebars sont en position absolute avec z-50
    expect(leftToolbar).toHaveClass('absolute', 'left-0', 'z-50')
    expect(rightPanel).toHaveClass('absolute', 'right-0', 'z-50')

    // Vérifier que le canvas est en position absolute avec z-10
    expect(centerCanvas).toHaveClass('absolute', 'inset-0')
  })

  it('should have canvas area covering full screen', () => {
    render(
      <DashtoonLayout
        leftToolbar={<MockLeftToolbar />}
        centerCanvas={<MockCenterCanvas />}
        rightPanel={<MockRightPanel />}
      />
    )

    const canvasArea = screen.getByTestId('center-canvas').parentElement?.parentElement
    
    // Le canvas doit couvrir tout l'écran (inset-0)
    expect(canvasArea).toHaveClass('absolute', 'inset-0')
  })

  it('should have sidebars positioned as overlays', () => {
    render(
      <DashtoonLayout
        leftToolbar={<MockLeftToolbar />}
        centerCanvas={<MockCenterCanvas />}
        rightPanel={<MockRightPanel />}
      />
    )

    const leftToolbar = screen.getByTestId('left-toolbar').parentElement
    const rightPanel = screen.getByTestId('right-panel').parentElement

    // Les sidebars doivent être en position absolute (overlay)
    expect(leftToolbar).toHaveClass('absolute')
    expect(rightPanel).toHaveClass('absolute')

    // Vérifier les positions
    expect(leftToolbar).toHaveClass('left-0', 'top-0', 'bottom-0')
    expect(rightPanel).toHaveClass('right-0', 'top-0', 'bottom-0')
  })

  it('should have proper z-index values to prevent canvas masking', () => {
    const { container } = render(
      <DashtoonLayout
        leftToolbar={<MockLeftToolbar />}
        centerCanvas={<MockCenterCanvas />}
        rightPanel={<MockRightPanel />}
      />
    )

    // Vérifier les z-index via les styles calculés
    const leftToolbar = screen.getByTestId('left-toolbar').parentElement
    const rightPanel = screen.getByTestId('right-panel').parentElement
    const canvasArea = screen.getByTestId('center-canvas').parentElement?.parentElement

    // Les sidebars doivent avoir z-index plus élevé que le canvas
    const leftStyle = window.getComputedStyle(leftToolbar!)
    const rightStyle = window.getComputedStyle(rightPanel!)
    const canvasStyle = window.getComputedStyle(canvasArea!)

    // Vérifier que les classes z-index sont appliquées
    expect(leftToolbar).toHaveClass('z-50')
    expect(rightPanel).toHaveClass('z-50')
    expect(canvasArea).toHaveClass('z-10')
  })

  it('should not have flex layout that could create masking zones', () => {
    const { container } = render(
      <DashtoonLayout
        leftToolbar={<MockLeftToolbar />}
        centerCanvas={<MockCenterCanvas />}
        rightPanel={<MockRightPanel />}
      />
    )

    const mainContainer = container.firstChild as HTMLElement

    // Le conteneur principal doit être en position relative, pas flex
    expect(mainContainer).toHaveClass('relative')
    
    // Vérifier qu'il n'y a pas de flex-shrink-0 qui pourrait créer des zones mortes
    const leftToolbar = screen.getByTestId('left-toolbar').parentElement
    const rightPanel = screen.getByTestId('right-panel').parentElement

    expect(leftToolbar).not.toHaveClass('flex-shrink-0')
    expect(rightPanel).not.toHaveClass('flex-shrink-0')
  })

  it('should allow canvas to be visible across full width', () => {
    render(
      <DashtoonLayout
        leftToolbar={<MockLeftToolbar />}
        centerCanvas={<MockCenterCanvas />}
        rightPanel={<MockRightPanel />}
      />
    )

    const canvasArea = screen.getByTestId('center-canvas').parentElement?.parentElement

    // Le canvas doit couvrir toute la largeur (inset-0)
    expect(canvasArea).toHaveClass('inset-0')
    
    // Vérifier qu'il n'y a pas de contraintes de largeur
    const style = window.getComputedStyle(canvasArea!)
    expect(style.left).toBe('0px')
    expect(style.right).toBe('0px')
  })

  it('should have background pattern covering full area', () => {
    render(
      <DashtoonLayout
        leftToolbar={<MockLeftToolbar />}
        centerCanvas={<MockCenterCanvas />}
        rightPanel={<MockRightPanel />}
      />
    )

    // Vérifier que le motif de points couvre toute la zone
    const dotPattern = document.querySelector('.absolute.inset-0.z-0')
    expect(dotPattern).toBeInTheDocument()
  })

  it('should maintain sidebar functionality while eliminating masking', () => {
    render(
      <DashtoonLayout
        leftToolbar={<MockLeftToolbar />}
        centerCanvas={<MockCenterCanvas />}
        rightPanel={<MockRightPanel />}
      />
    )

    // Les sidebars doivent être visibles et fonctionnels
    expect(screen.getByTestId('left-toolbar')).toBeVisible()
    expect(screen.getByTestId('right-panel')).toBeVisible()

    // Le canvas doit aussi être visible
    expect(screen.getByTestId('center-canvas')).toBeVisible()
  })

  it('should have proper overflow settings', () => {
    render(
      <DashtoonLayout
        leftToolbar={<MockLeftToolbar />}
        centerCanvas={<MockCenterCanvas />}
        rightPanel={<MockRightPanel />}
      />
    )

    const mainContainer = document.querySelector('.overflow-hidden')
    expect(mainContainer).toBeInTheDocument()

    const canvasArea = screen.getByTestId('center-canvas').parentElement?.parentElement
    expect(canvasArea).toHaveClass('overflow-hidden')
  })

  it('should support pan/zoom without canvas disappearing', () => {
    render(
      <DashtoonLayout
        leftToolbar={<MockLeftToolbar />}
        centerCanvas={<MockCenterCanvas />}
        rightPanel={<MockRightPanel />}
      />
    )

    const canvasArea = screen.getByTestId('center-canvas').parentElement?.parentElement

    // Le canvas doit pouvoir être transformé sans être masqué
    expect(canvasArea).toHaveClass('absolute', 'inset-0')
    
    // Vérifier qu'il n'y a pas de contraintes qui empêcheraient le pan
    const style = window.getComputedStyle(canvasArea!)
    expect(style.position).toBe('absolute')
  })
})
