import { useEffect } from 'react'

/**
 * Hook pour corriger automatiquement les problèmes d'accessibilité
 * dans un composant spécifique
 */
export const useAccessibilityFix = () => {
  useEffect(() => {
    const fixAccessibilityInComponent = () => {
      // Corriger les inputs sans id/name
      const inputs = document.querySelectorAll('input:not([id]), textarea:not([id]), select:not([id])')
      
      inputs.forEach((element, index) => {
        const input = element as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        
        // Générer un ID unique basé sur le placeholder ou le type
        const placeholder = input.getAttribute('placeholder')
        const type = input.type || input.tagName.toLowerCase()
        const uniqueId = `${type}-${Date.now()}-${index}`
        
        // Ajouter id si manquant
        if (!input.id) {
          input.id = uniqueId
        }
        
        // Ajouter name si manquant
        if (!input.name) {
          input.name = input.id
        }
        
        // Ajouter aria-label si pas de label associé
        const associatedLabel = document.querySelector(`label[for="${input.id}"]`)
        if (!associatedLabel && !input.getAttribute('aria-label')) {
          // Essayer de trouver un label parent
          const parentLabel = input.closest('label')
          if (!parentLabel) {
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
            const type = input.type || input.tagName.toLowerCase()
            input.id = `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
          }
          
          // Associer le label à l'input
          label.setAttribute('for', input.id)
        }
      })

      // Ajouter des attributs ARIA aux boutons sans label
      const buttons = document.querySelectorAll('button:not([aria-label])')
      buttons.forEach((button) => {
        if (!button.textContent?.trim()) {
          // Essayer de trouver une icône ou un titre
          const icon = button.querySelector('svg, [class*="icon"]')
          const title = button.getAttribute('title')
          
          if (title) {
            button.setAttribute('aria-label', title)
          } else if (icon) {
            button.setAttribute('aria-label', 'Bouton')
          }
        }
      })
    }

    // Exécuter immédiatement
    fixAccessibilityInComponent()

    // Exécuter après un délai pour les éléments chargés dynamiquement
    const timeoutId = setTimeout(fixAccessibilityInComponent, 500)

    return () => {
      clearTimeout(timeoutId)
    }
  }, [])
}

/**
 * Version simplifiée pour les composants de formulaire
 */
export const useFormAccessibility = () => {
  useEffect(() => {
    const fixFormFields = () => {
      // Cibler spécifiquement les champs de formulaire sans attributs
      const formFields = document.querySelectorAll(`
        input:not([id]):not([name]),
        textarea:not([id]):not([name]),
        select:not([id]):not([name])
      `)
      
      formFields.forEach((field, index) => {
        const element = field as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        const fieldType = element.type || element.tagName.toLowerCase()
        const placeholder = element.getAttribute('placeholder') || ''
        
        // Générer un ID unique
        const uniqueId = `form-${fieldType}-${Date.now()}-${index}`
        
        if (!element.id) element.id = uniqueId
        if (!element.name) element.name = element.id
        
        // Ajouter aria-label si nécessaire
        if (!element.getAttribute('aria-label') && !document.querySelector(`label[for="${element.id}"]`)) {
          element.setAttribute('aria-label', placeholder || `Champ ${fieldType}`)
        }
      })
    }

    fixFormFields()
    
    // Re-exécuter après un court délai
    const timer = setTimeout(fixFormFields, 100)
    
    return () => clearTimeout(timer)
  }, [])
}
