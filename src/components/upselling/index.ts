// Export de tous les composants et hooks d'upselling

// Composants principaux
export { UpsellModal } from './UpsellModal'
export { UpsellProvider, useUpsellContext } from './UpsellProvider'
export { ConditionalUpsellProvider } from './ConditionalUpsellProvider'
export { LimitIndicator, LimitsSummary } from './LimitIndicator'

// Exemples d'utilisation
export { 
  CharacterCreationExample, 
  CharacterGalleryExample 
} from './examples/CharacterCreationExample'

// Hooks
export { useUpselling } from '@/hooks/useUpselling'
export { useUserLimits } from '@/hooks/useUserLimits'

// Types
export type {
  LimitationType,
  UserLimits,
  UserUsage,
  UpsellContent,
  UpsellModalProps
} from '@/types/upselling'

// Configuration
export { 
  PLAN_LIMITS, 
  UPSELL_CONTENT 
} from '@/types/upselling'
