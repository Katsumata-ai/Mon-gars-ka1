'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'react-hot-toast'

interface DeleteAccountButtonProps {
  className?: string
}

export default function DeleteAccountButton({ className }: DeleteAccountButtonProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showFinalConfirmDialog, setShowFinalConfirmDialog] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleDeleteAccount = async () => {
    if (confirmText !== 'SUPPRIMER') {
      toast.error('Veuillez taper "SUPPRIMER" pour confirmer')
      return
    }

    setIsDeleting(true)

    try {
      // Appeler une API route pour supprimer le compte
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression du compte')
      }

      // Déconnexion
      await supabase.auth.signOut()

      toast.success('Votre compte a été supprimé avec succès')

      // Redirection vers la landing page
      router.push('/')
      router.refresh()

    } catch (error: any) {
      console.error('Erreur lors de la suppression du compte:', error)
      toast.error('Erreur lors de la suppression du compte. Veuillez réessayer.')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleFirstConfirm = () => {
    setShowConfirmDialog(false)
    setShowFinalConfirmDialog(true)
  }

  const handleCancel = () => {
    setShowConfirmDialog(false)
    setShowFinalConfirmDialog(false)
    setConfirmText('')
  }

  return (
    <>
      <button 
        onClick={() => setShowConfirmDialog(true)}
        className={className}
      >
        Supprimer le compte
      </button>

      {/* Premier dialogue de confirmation */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full border border-dark-700">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-bold text-white">Supprimer votre compte</h3>
            </div>
            
            <p className="text-dark-200 mb-6">
              Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible et supprimera :
            </p>
            
            <ul className="text-dark-300 text-sm space-y-2 mb-6">
              <li>• Tous vos personnages créés</li>
              <li>• Tous vos décors et scènes</li>
              <li>• Vos projets manga en cours</li>
              <li>• Votre historique de crédits</li>
              <li>• Toutes vos données personnelles</li>
            </ul>

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleFirstConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Continuer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dialogue de confirmation finale */}
      {showFinalConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full border border-red-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-white">Confirmation finale</h3>
              </div>
              <button
                onClick={handleCancel}
                className="text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-6">
              <p className="text-red-400 text-sm font-medium">
                ⚠️ ATTENTION : Cette action est définitive et irréversible !
              </p>
            </div>
            
            <p className="text-dark-200 mb-4">
              Pour confirmer la suppression de votre compte, tapez <strong className="text-red-400">SUPPRIMER</strong> ci-dessous :
            </p>
            
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Tapez SUPPRIMER"
              className="w-full bg-dark-700 text-white px-4 py-2 rounded-lg border border-dark-600 focus:border-red-500 focus:outline-none mb-6"
              disabled={isDeleting}
            />

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="flex-1 bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== 'SUPPRIMER'}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Suppression...' : 'Supprimer définitivement'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
