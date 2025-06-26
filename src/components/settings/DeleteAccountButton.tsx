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
    if (confirmText !== 'DELETE') {
      toast.error('Please type "DELETE" to confirm')
      return
    }

    setIsDeleting(true)

    try {
      // Call API route to delete account
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Important : inclure les cookies de session
      })

      if (!response.ok) {
        throw new Error('Error deleting account')
      }

      // Sign out
      await supabase.auth.signOut()

      toast.success('Your account has been successfully deleted')
      
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
        Delete Account
      </button>

      {/* Premier dialogue de confirmation */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full border border-dark-700">
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
              <h3 className="text-xl font-bold text-white">Delete Your Account</h3>
            </div>
            
            <p className="text-dark-200 mb-6">
              Are you sure you want to delete your account? This action is irreversible and will delete:
            </p>
            
            <ul className="text-dark-300 text-sm space-y-2 mb-6">
              <li>• All your created characters</li>
              <li>• All your backgrounds and scenes</li>
              <li>• Your ongoing manga projects</li>
              <li>• Your credit history</li>
              <li>• All your personal data</li>
            </ul>

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                className="flex-1 bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleFirstConfirm}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Continue
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Final confirmation dialog */}
      {showFinalConfirmDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-6 max-w-md w-full border border-red-500">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <Trash2 className="w-6 h-6 text-red-500" />
                <h3 className="text-xl font-bold text-white">Final Confirmation</h3>
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
                ⚠️ WARNING: This action is final and irreversible!
              </p>
            </div>
            
            <p className="text-dark-200 mb-4">
              To confirm account deletion, type <strong className="text-red-400">DELETE</strong> below:
            </p>
            
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-dark-700 text-white px-4 py-2 rounded-lg border border-dark-600 focus:border-red-500 focus:outline-none mb-6"
              disabled={isDeleting}
            />

            <div className="flex space-x-3">
              <button
                onClick={handleCancel}
                disabled={isDeleting}
                className="flex-1 bg-dark-700 hover:bg-dark-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isDeleting || confirmText !== 'DELETE'}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
