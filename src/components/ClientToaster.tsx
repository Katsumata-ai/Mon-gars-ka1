'use client'

import dynamic from 'next/dynamic'

// Dynamic import pour éviter l'hydratation du Toaster
const Toaster = dynamic(() => import('react-hot-toast').then(mod => ({ default: mod.Toaster })), {
  ssr: false
})

export default function ClientToaster() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3000,
        style: {
          background: '#1f2937',
          color: '#f9fafb',
          border: '1px solid #374151'
        }
      }}
    />
  )
}
