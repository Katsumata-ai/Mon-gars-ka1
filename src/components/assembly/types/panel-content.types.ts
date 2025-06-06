/**
 * Types pour la gestion du contenu des panels
 */

// Import des types existants
import { AssemblyElement } from './assembly.types'

export interface PanelContentAssociation {
  /** ID du panel */
  panelId: string
  /** IDs des images associées à ce panel */
  imageIds: string[]
  /** Type d'association */
  associationType: 'automatic' | 'manual'
  /** Si le masquage est activé */
  maskEnabled: boolean
  /** Métadonnées additionnelles */
  metadata?: {
    /** Timestamp de création de l'association */
    createdAt: number
    /** Timestamp de dernière modification */
    updatedAt: number
    /** Utilisateur qui a créé l'association */
    createdBy?: string
  }
}

export interface ImagePanelIntersection {
  /** ID de l'image */
  imageId: string
  /** ID du panel */
  panelId: string
  /** Zone d'intersection */
  intersectionBounds: {
    x: number
    y: number
    width: number
    height: number
  }
  /** Pourcentage de l'image qui est dans le panel */
  coveragePercentage: number
  /** Si l'intersection est significative (>10% par exemple) */
  isSignificant: boolean
}

export interface PanelContentManager {
  /** Associations actuelles */
  associations: Map<string, PanelContentAssociation>
  
  /** Détecter automatiquement les images sous un panel */
  detectImagesUnderPanel: (panelId: string, elements: AssemblyElement[]) => ImagePanelIntersection[]
  
  /** Créer une association automatique */
  createAutomaticAssociation: (panelId: string, imageIds: string[]) => void
  
  /** Créer une association manuelle */
  createManualAssociation: (panelId: string, imageIds: string[]) => void
  
  /** Supprimer une association */
  removeAssociation: (panelId: string) => void
  
  /** Ajouter une image à un panel existant */
  addImageToPanel: (panelId: string, imageId: string) => void
  
  /** Supprimer une image d'un panel */
  removeImageFromPanel: (panelId: string, imageId: string) => void
  
  /** Obtenir les images associées à un panel */
  getImagesForPanel: (panelId: string) => string[]
  
  /** Obtenir les panels qui contiennent une image */
  getPanelsForImage: (imageId: string) => string[]
  
  /** Activer/désactiver le masquage pour un panel */
  toggleMasking: (panelId: string, enabled: boolean) => void
}

export interface PanelMaskingOptions {
  /** Type de masquage */
  maskType: 'rectangular' | 'rounded' | 'custom'
  /** Rayon des coins pour le masquage arrondi */
  cornerRadius?: number
  /** Marge intérieure du masque */
  padding?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  /** Opacité du masque */
  maskOpacity?: number
  /** Couleur de bordure du masque */
  borderColor?: number
  /** Épaisseur de bordure du masque */
  borderWidth?: number
}
