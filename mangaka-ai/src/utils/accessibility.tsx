/**
 * Utilitaires pour améliorer l'accessibilité des composants
 */

import React from 'react'

// Générateur d'IDs uniques pour les éléments de formulaire
let idCounter = 0

export const generateUniqueId = (prefix: string = 'field'): string => {
  idCounter++
  return `${prefix}-${Date.now()}-${idCounter}`
}

// Hook pour générer des IDs stables
export const useFormFieldId = (prefix: string = 'field'): string => {
  // Utiliser une référence stable pour éviter la régénération
  const id = React.useRef<string | null>(null)

  if (!id.current) {
    id.current = generateUniqueId(prefix)
  }

  return id.current
}

// Composant wrapper pour les champs de formulaire avec accessibilité
interface AccessibleFieldProps {
  id?: string
  name?: string
  label?: string
  children: React.ReactElement
  required?: boolean
  description?: string
}

export const AccessibleField: React.FC<AccessibleFieldProps> = ({
  id,
  name,
  label,
  children,
  required = false,
  description
}) => {
  const fieldId = id || generateUniqueId('field')
  const descriptionId = description ? `${fieldId}-desc` : undefined
  
  // Cloner l'élément enfant avec les props d'accessibilité
  const childWithProps = React.cloneElement(children as React.ReactElement<any>, {
    id: fieldId,
    name: name || fieldId,
    'aria-required': required,
    'aria-describedby': descriptionId,
    ...(children.props || {})
  })

  return (
    <div className="form-field">
      {label && (
        <label 
          htmlFor={fieldId}
          className={`block text-sm font-medium ${required ? 'required' : ''}`}
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {childWithProps}
      {description && (
        <div id={descriptionId} className="text-xs text-gray-500 mt-1">
          {description}
        </div>
      )}
    </div>
  )
}


