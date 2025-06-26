// 🎨 MANGAKA AI - Hooks Index
// Centralized exports for all custom hooks

// Authentication & User
export { useAuth } from './useAuth'
export { useUserCredits } from './useUserCredits'
export { useUserLimits } from './useUserLimits'
export { useUserLimitsSimple } from './useUserLimitsSimple'

// Subscription & Payments
export { useStripe } from './useStripe'
export { useSubscriptionSafe } from './useSubscriptionSafe'

// Upselling & Limits
export { useUpselling } from './useUpselling'
export { useUpsellingSafe } from './useUpsellingSafe'
export { useGenerationLimits } from './useGenerationLimits'

// Canvas & Assembly
export { useCanvasStateSync } from './useCanvasStateSync'
export { useCanvasTransform } from './useCanvasTransform'
export { useAssemblyInitialization } from './useAssemblyInitialization'
export { useAssemblyPersistence } from './useAssemblyPersistence'

// Project & Data
export { useProjectPersistence } from './useProjectPersistence'
export { useScriptData } from './useScriptData'

// Accessibility
export { useAccessibilityFix } from './useAccessibilityFix'
