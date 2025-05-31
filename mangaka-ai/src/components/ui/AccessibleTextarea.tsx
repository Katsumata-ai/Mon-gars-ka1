'use client'

import React, { forwardRef } from 'react'

interface AccessibleTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  description?: string
  error?: string
  required?: boolean
  fieldId?: string
}

const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  ({ label, description, error, required = false, fieldId, className, ...props }, ref) => {
    // Générer un ID unique si pas fourni
    const id = fieldId || props.id || `textarea-${Math.random().toString(36).substr(2, 9)}`
    const descriptionId = description ? `${id}-desc` : undefined
    const errorId = error ? `${id}-error` : undefined
    
    // Construire aria-describedby
    const ariaDescribedBy = [descriptionId, errorId].filter(Boolean).join(' ') || undefined

    return (
      <div className="w-full">
        {label && (
          <label 
            htmlFor={id}
            className="block text-sm font-medium text-white mb-1"
          >
            {label}
            {required && <span className="text-red-500 ml-1" aria-label="requis">*</span>}
          </label>
        )}
        
        <textarea
          ref={ref}
          id={id}
          name={props.name || id}
          aria-required={required}
          aria-describedby={ariaDescribedBy}
          aria-invalid={error ? 'true' : 'false'}
          className={className}
          {...props}
        />
        
        {description && (
          <div id={descriptionId} className="text-xs text-gray-400 mt-1">
            {description}
          </div>
        )}
        
        {error && (
          <div id={errorId} className="text-xs text-red-400 mt-1" role="alert">
            {error}
          </div>
        )}
      </div>
    )
  }
)

AccessibleTextarea.displayName = 'AccessibleTextarea'

export default AccessibleTextarea
