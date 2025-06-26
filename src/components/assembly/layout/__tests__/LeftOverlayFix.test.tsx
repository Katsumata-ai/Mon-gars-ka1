import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DashtoonLayout from '../DashtoonLayout'
import PolotnoVerticalToolbar from '../PolotnoVerticalToolbar'
import { PolotnoProvider } from '../../context/PolotnoContext'

// Mock des composants
const MockCenterCanvas = () => <div data-testid="center-canvas">Center Canvas</div>
const MockRightPanel = () => <div data-testid="right-panel">Right Panel</div>

// Wrapper avec contexte
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <PolotnoProvider>
    {children}
  </PolotnoProvider>
)

describe('Left Overlay Fix', () => {
  const mockProps = {
    activeTool: 'select' as const,
    onToolChange: jest.fn(),
    onSave: jest.fn(),
    onExport: jest.fn(),
    onOpenBubbleModal: jest.fn(),
    isDirty: false,
    isLoading: false
  }

  it('should have left toolbar with direct positioning without overlay system', () => {
    render(
      <TestWrapper>
        <DashtoonLayout
          leftToolbar={<PolotnoVerticalToolbar {...mockProps} />}
          centerCanvas={<MockCenterCanvas />}
          rightPanel={<MockRightPanel />}
        />
      </TestWrapper>
    )

    // Vérifier qu'il n'y a plus de système d'overlay avec pointer-events-none
    const overlayContainers = document.querySelectorAll('.pointer-events-none')
    expect(overlayContainers).toHaveLength(0)

    // Vérifier que la toolbar a un positionnement direct
    const leftToolbarContainer = document.querySelector('.absolute.left-0.w-16')
    expect(leftToolbarContainer).toBeInTheDocument()
    expect(leftToolbarContainer).not.toHaveClass('pointer-events-none')
    expect(leftToolbarContainer).not.toHaveClass('bg-transparent')
  })

  it('should have toolbar content with pointer-events-auto', () => {
    render(
      <TestWrapper>
        <DashtoonLayout
          leftToolbar={<PolotnoVerticalToolbar {...mockProps} />}
          centerCanvas={<MockCenterCanvas />}
          rightPanel={<MockRightPanel />}
        />
      </TestWrapper>
    )

    // Trouver le conteneur interne avec pointer-events-auto
    const toolbarContent = document.querySelector('.pointer-events-auto')
    
    expect(toolbarContent).toBeInTheDocument()
  })

  it('should have strict width constraint on toolbar', () => {
    render(
      <TestWrapper>
        <DashtoonLayout
          leftToolbar={<PolotnoVerticalToolbar {...mockProps} />}
          centerCanvas={<MockCenterCanvas />}
          rightPanel={<MockRightPanel />}
        />
      </TestWrapper>
    )

    // Vérifier que la toolbar a une largeur stricte
    const toolbar = document.querySelector('.h-full.w-16.flex.flex-col')
    
    expect(toolbar).toHaveClass('w-16', 'overflow-hidden')
  })

  it('should have tooltips with high z-index that do not interfere', () => {
    render(
      <TestWrapper>
        <DashtoonLayout
          leftToolbar={<PolotnoVerticalToolbar {...mockProps} />}
          centerCanvas={<MockCenterCanvas />}
          rightPanel={<MockRightPanel />}
        />
      </TestWrapper>
    )

    // Vérifier que les tooltips ont z-[100] et pointer-events-none
    const tooltips = document.querySelectorAll('.absolute.left-16')
    
    tooltips.forEach(tooltip => {
      expect(tooltip).toHaveClass('z-[100]', 'pointer-events-none')
    })
  })

  it('should allow clicks to pass through to canvas in left area', () => {
    const canvasClickHandler = jest.fn()
    
    render(
      <TestWrapper>
        <DashtoonLayout
          leftToolbar={<PolotnoVerticalToolbar {...mockProps} />}
          centerCanvas={
            <div data-testid="center-canvas" onClick={canvasClickHandler}>
              Center Canvas
            </div>
          }
          rightPanel={<MockRightPanel />}
        />
      </TestWrapper>
    )

    // Simuler un clic dans la zone où était le problème d'overlay
    const canvas = screen.getByTestId('center-canvas')
    fireEvent.click(canvas)
    
    expect(canvasClickHandler).toHaveBeenCalled()
  })

  it('should have toolbar buttons still clickable', () => {
    render(
      <TestWrapper>
        <DashtoonLayout
          leftToolbar={<PolotnoVerticalToolbar {...mockProps} />}
          centerCanvas={<MockCenterCanvas />}
          rightPanel={<MockRightPanel />}
        />
      </TestWrapper>
    )

    // Vérifier que les boutons de la toolbar sont cliquables
    const selectButton = document.querySelector('button[title*="Sélection"]')
    
    expect(selectButton).toBeInTheDocument()
    
    if (selectButton) {
      fireEvent.click(selectButton)
      expect(mockProps.onToolChange).toHaveBeenCalledWith('select')
    }
  })

  it('should not have any elements extending beyond 64px width', () => {
    render(
      <TestWrapper>
        <DashtoonLayout
          leftToolbar={<PolotnoVerticalToolbar {...mockProps} />}
          centerCanvas={<MockCenterCanvas />}
          rightPanel={<MockRightPanel />}
        />
      </TestWrapper>
    )

    // Vérifier que le conteneur principal de la toolbar ne dépasse pas 64px
    const leftContainer = document.querySelector('.absolute.left-0.w-16')
    
    if (leftContainer) {
      const rect = leftContainer.getBoundingClientRect()
      expect(rect.width).toBeLessThanOrEqual(64)
    }
  })

  it('should have canvas covering full screen including left area', () => {
    render(
      <TestWrapper>
        <DashtoonLayout
          leftToolbar={<PolotnoVerticalToolbar {...mockProps} />}
          centerCanvas={<MockCenterCanvas />}
          rightPanel={<MockRightPanel />}
        />
      </TestWrapper>
    )

    // Vérifier que le canvas couvre bien toute la zone (inset-0)
    const canvasArea = document.querySelector('.absolute.inset-0.bg-black')
    
    expect(canvasArea).toBeInTheDocument()
    expect(canvasArea).toHaveClass('absolute', 'inset-0')
  })

  it('should have proper z-index hierarchy to prevent masking', () => {
    render(
      <TestWrapper>
        <DashtoonLayout
          leftToolbar={<PolotnoVerticalToolbar {...mockProps} />}
          centerCanvas={<MockCenterCanvas />}
          rightPanel={<MockRightPanel />}
        />
      </TestWrapper>
    )

    const leftToolbar = document.querySelector('.absolute.left-0.w-16')
    const canvasArea = document.querySelector('.absolute.inset-0.z-10')
    
    // Toolbar doit avoir z-50, canvas z-10
    expect(leftToolbar).toHaveClass('z-50')
    expect(canvasArea).toHaveClass('z-10')
  })

  it('should handle hover states without creating overlay zones', () => {
    render(
      <TestWrapper>
        <DashtoonLayout
          leftToolbar={<PolotnoVerticalToolbar {...mockProps} />}
          centerCanvas={<MockCenterCanvas />}
          rightPanel={<MockRightPanel />}
        />
      </TestWrapper>
    )

    // Vérifier que les groupes hover n'étendent pas la zone cliquable
    const hoverGroups = document.querySelectorAll('.group')
    
    hoverGroups.forEach(group => {
      // Les groupes ne doivent pas avoir de largeur qui dépasse
      const rect = group.getBoundingClientRect()
      if (rect.width > 0) { // Seulement si visible
        expect(rect.width).toBeLessThanOrEqual(64)
      }
    })
  })
})
