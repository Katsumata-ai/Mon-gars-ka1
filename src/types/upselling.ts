// Types pour le système d'upselling ciblé

export type LimitationType = 
  | 'character_images'
  | 'decor_images' 
  | 'scene_generation'
  | 'project_pages'
  | 'total_projects'
  | 'project_exports'
  | 'monthly_generations'
  | 'storage_space'
  | 'advanced_tools'

export interface UserLimits {
  character_images: number
  decor_images: number
  scene_generation: number
  project_pages: number
  total_projects: number
  project_exports: number
  monthly_generations: number
  storage_space: number // en MB
  advanced_tools: boolean
}

export interface UserUsage {
  character_images: number
  decor_images: number
  scene_generation: number
  project_pages: number
  total_projects: number
  project_exports: number
  monthly_generations: number
  storage_space: number // en MB
}

export interface UpsellContent {
  title: string
  description: string
  benefits: string[]
  urgency?: string
  icon: string
}

export interface UpsellModalProps {
  isOpen: boolean
  onClose: () => void
  limitationType: LimitationType
  currentUsage?: number
  limit?: number
  onUpgrade: (plan: 'monthly' | 'yearly') => void
}

// Configuration des limites par plan
export const PLAN_LIMITS: Record<string, UserLimits> = {
  junior: {
    character_images: 2,      // 2 personnages max
    decor_images: 2,          // 2 décors max
    scene_generation: 1,      // 1 scène max
    project_pages: 10,        // 10 pages par projet
    total_projects: 1,        // 1 projet max
    project_exports: 1,       // 1 export total (limite stricte)
    monthly_generations: 5,   // 5 générations au total par mois (2+2+1)
    storage_space: 100,       // 100MB
    advanced_tools: false
  },
  senior: {
    character_images: -1,     // unlimited
    decor_images: -1,         // unlimited
    scene_generation: -1,     // unlimited
    project_pages: -1,        // unlimited
    total_projects: -1,       // unlimited
    project_exports: -1,      // unlimited
    monthly_generations: -1,  // unlimited
    storage_space: -1,        // unlimited
    advanced_tools: true
  }
}

// Custom upselling messages by limitation type
export const UPSELL_CONTENT: Record<LimitationType, UpsellContent> = {
  character_images: {
    title: "Create unlimited characters!",
    description: "You have reached your limit of custom characters. Upgrade to the Senior plan to create as many characters as you want.",
    benefits: [
      "Unlimited characters",
      "Advanced artistic styles",
      "Advanced customization",
      "Secure cloud backup"
    ],
    urgency: "Unlock your creativity right now!",
    icon: "👤"
  },
  decor_images: {
    title: "Explore all backgrounds!",
    description: "Your background limit has been reached. With the Senior plan, create unlimited universes for your stories.",
    benefits: [
      "Unlimited backgrounds",
      "Extended library",
      "Varied styles",
      "HD quality"
    ],
    urgency: "Bring your imaginary worlds to life!",
    icon: "🏞️"
  },
  scene_generation: {
    title: "Generate infinite scenes!",
    description: "No more credits to combine your elements? The Senior plan offers you unlimited generation of epic scenes.",
    benefits: [
      "Unlimited generation",
      "Advanced combinations",
      "Optimized AI",
      "High quality rendering"
    ],
    urgency: "Create the perfect story without constraints!",
    icon: "🎬"
  },
  project_pages: {
    title: "Extend your stories!",
    description: "Your project has reached the page limit. Upgrade to the Senior plan to create manga of any length.",
    benefits: [
      "Unlimited pages per project",
      "Multiple chapters",
      "Advanced organization",
      "Professional export"
    ],
    urgency: "Tell your complete story!",
    icon: "📖"
  },
  total_projects: {
    title: "Multiply your creations!",
    description: "You have reached your project limit. With the Senior plan, create as many stories as you want.",
    benefits: [
      "Unlimited projects",
      "Advanced management",
      "Collaboration",
      "Automatic backup"
    ],
    urgency: "Explore all your creative ideas!",
    icon: "📚"
  },
  project_exports: {
    title: "Export without limits!",
    description: "You have used your free export! The Senior plan offers you unlimited high-quality exports.",
    benefits: [
      "Unlimited exports",
      "Professional quality",
      "Multiple formats",
      "Fast download"
    ],
    urgency: "Share your works right now!",
    icon: "📤"
  },
  monthly_generations: {
    title: "Generate without counting!",
    description: "Your monthly credits are exhausted. Upgrade to the Senior plan for unlimited generation all year long.",
    benefits: [
      "Unlimited generations",
      "No monthly limit",
      "Processing priority",
      "New features"
    ],
    urgency: "Continue creating without interruption!",
    icon: "⚡"
  },
  storage_space: {
    title: "Unlimited storage!",
    description: "Your storage space is full. The Senior plan offers you unlimited and secure cloud storage.",
    benefits: [
      "Unlimited storage",
      "Automatic backup",
      "Multi-device sync",
      "Enhanced security"
    ],
    urgency: "Save all your creations!",
    icon: "☁️"
  },
  advanced_tools: {
    title: "Professional tools!",
    description: "Access advanced tools reserved for Senior creators to perfect your manga.",
    benefits: [
      "Professional tools",
      "Advanced effects",
      "Premium templates",
      "Priority support"
    ],
    urgency: "Create like a professional!",
    icon: "🛠️"
  }
}
