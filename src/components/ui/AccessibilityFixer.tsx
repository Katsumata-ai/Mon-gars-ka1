'use client'

import { useEffect } from 'react'

/**
 * Composant qui corrige automatiquement les problèmes d'accessibilité
 * en ajoutant les attributs manquants aux éléments de formulaire
 */
export default function AccessibilityFixer() {
  useEffect(() => {
    const fixAccessibilityIssues = () => {
      // Corriger les inputs sans id/name
      const inputs = document.querySelectorAll('input:not([id]):not([name]), textarea:not([id]):not([name]), select:not([id]):not([name])')
      
      inputs.forEach((element, index) => {
        const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        
        // Générer un ID unique
        const uniqueId = `form-field-${Date.now()}-${index}`
        
        // Ajouter id et name si manquants
        if (!input.id) {
          input.id = uniqueId
        }
        if (!input.name) {
          input.name = input.id
        }
        
        // Ajouter aria-label si pas de label associé
        const associatedLabel = document.querySelector(`label[for="${input.id}"]`)
        if (!associatedLabel && !input.getAttribute('aria-label')) {
          // Essayer de trouver un label parent
          const parentLabel = input.closest('label')
          if (!parentLabel) {
            // Générer un aria-label basé sur le placeholder ou le type
            const placeholder = input.getAttribute('placeholder')
            const type = input.type || input.tagName.toLowerCase()
            
            if (placeholder) {
              input.setAttribute('aria-label', placeholder)
            } else {
              input.setAttribute('aria-label', `Champ ${type}`)
            }
          }
        }
      })

      // Corriger les labels non associés
      const labels = document.querySelectorAll('label:not([for])')
      
      labels.forEach((label) => {
        // Chercher un input dans le label
        const inputInLabel = label.querySelector('input, textarea, select')
        if (inputInLabel) {
          const input = inputInLabel as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
          
          // Assurer que l'input a un ID
          if (!input.id) {
            input.id = `form-field-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
          
          // Associer le label à l'input
          label.setAttribute('for', input.id)
        }
      })

      // Ajouter des rôles ARIA appropriés
      const buttons = document.querySelectorAll('button:not([role]):not([aria-label])')
      buttons.forEach((button) => {
        if (!button.getAttribute('aria-label') && !button.textContent?.trim()) {
          button.setAttribute('aria-label', 'Bouton')
        }
      })
    }

    // Exécuter immédiatement
    fixAccessibilityIssues()

    // Exécuter après un délai pour les éléments chargés dynamiquement
    const timeoutId = setTimeout(fixAccessibilityIssues, 1000)

    // Observer les changements DOM pour les nouveaux éléments
    const observer = new MutationObserver((mutations) => {
      let shouldFix = false
      
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              const element = node as Element
              if (element.matches('input, textarea, select, label, button') || 
                  element.querySelector('input, textarea, select, label, button')) {
                shouldFix = true
              }
            }
          })
        }
      })
      
      if (shouldFix) {
        // Debounce pour éviter les appels excessifs
        clearTimeout(timeoutId)
        setTimeout(fixAccessibilityIssues, 100)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true
    })

    return () => {
      clearTimeout(timeoutId)
      observer.disconnect()
    }
  }, [])

  return null // Ce composant ne rend rien visuellement
}

// Hook pour utiliser le fixer dans des composants spécifiques
export const useAccessibilityFixer = () => {
  useEffect(() => {
    const fixCurrentComponent = () => {
      // Logique similaire mais limitée au composant actuel
      const inputs = document.querySelectorAll('input:not([id]):not([name]), textarea:not([id]):not([name]), select:not([id]):not([name])')
      
      inputs.forEach((element, index) => {
        const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        const uniqueId = `field-${Date.now()}-${index}`
        
        if (!input.id) input.id = uniqueId
        if (!input.name) input.name = input.id
        
        if (!input.getAttribute('aria-label') && !document.querySelector(`label[for="${input.id}"]`)) {
          const placeholder = input.getAttribute('placeholder')
          input.setAttribute('aria-label', placeholder || `Champ ${input.type || input.tagName.toLowerCase()}`)
        }
      })
    }

    fixCurrentComponent()
  }, [])
}
