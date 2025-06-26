'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUpsellContext } from '@/components/upselling'
import { useUserLimits } from '@/hooks/useUserLimits'
import { AllImageGenerationLimits } from '@/components/credits/ImageGenerationLimits'
import { PremiumUpgradeModal } from '@/components/upselling/PremiumUpgradeModal'

interface Project {
  id: string
  name: string
  description?: string
  created_at: string
  updated_at: string
}

export default function SimpleProjectDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [showUpgradeModal, setShowUpgradeModal] = useState(false)

  const supabase = createClient()

  // Hook d'upselling pour gérer les limites de projets
  const { checkTotalProjectsLimit, hasActiveSubscription } = useUpsellContext()
  const { incrementUsage } = useUserLimits()

  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      setProjects(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des projets:', error)
    } finally {
      setLoading(false)
    }
  }

  const createProject = async () => {
    if (!newProjectName.trim()) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Vérifier le nombre réel de projets existants
      const { data: existingProjects, error: countError } = await supabase
        .from('projects')
        .select('id')
        .eq('user_id', user.id)

      if (countError) throw countError

      const currentProjectCount = existingProjects?.length || 0

      // Vérifier la limite (1 projet pour le plan gratuit)
      if (currentProjectCount >= 1 && !hasActiveSubscription) {
        checkTotalProjectsLimit()
        return
      }

      const { error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName.trim(),
          user_id: user.id,
          description: ''
        })

      if (error) throw error

      // Incrémenter l'usage après création réussie
      await incrementUsage('total_projects', 1)

      setNewProjectName('')
      setShowCreateModal(false)
      loadProjects()
    } catch (error) {
      console.error('Error creating project:', error)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      loadProjects()
    } catch (error) {
      console.error('Error deleting project:', error)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear().toString().slice(-2)
    return `${day}/${month}/${year}`
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto" suppressHydrationWarning>
          <div className="mb-8" suppressHydrationWarning>
            <div className="h-8 bg-slate-700 rounded w-48 mb-4 animate-pulse" suppressHydrationWarning></div>
            <div className="h-4 bg-slate-700 rounded w-96 animate-pulse" suppressHydrationWarning></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" suppressHydrationWarning>
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-6 animate-pulse" suppressHydrationWarning>
                <div className="h-6 bg-slate-700 rounded mb-4" suppressHydrationWarning></div>
                <div className="h-4 bg-slate-700 rounded w-24 mb-4" suppressHydrationWarning></div>
                <div className="h-10 bg-slate-700 rounded" suppressHydrationWarning></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900" suppressHydrationWarning>
      <div className="p-8" suppressHydrationWarning>
        <div className="max-w-6xl mx-auto" suppressHydrationWarning>
          {/* Header simple */}
          <div className="mb-8" suppressHydrationWarning>
            <div className="flex items-center justify-between" suppressHydrationWarning>
              <div suppressHydrationWarning>
                <h1 className="text-3xl font-bold text-white mb-2 font-comic">MY PROJECTS</h1>
                <p className="text-slate-300">
                  Create, manage and bring your manga stories to life with cutting-edge AI tools
                </p>
              </div>

              {/* Project limit indicator */}
              <div className="text-right">
                <div className="text-sm text-slate-400">
                  {!hasActiveSubscription ? `${projects.length}/1 project` : 'Unlimited projects'}
                </div>
              </div>
            </div>

            {/* Information message about limits */}
            {!hasActiveSubscription && (
              <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Project limits */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-300 text-sm">
                        Free plan: {projects.length}/1 project used
                      </p>
                      {projects.length >= 1 && (
                        <p className="text-yellow-400 text-xs mt-1">
                          You have reached your project limit
                        </p>
                      )}
                    </div>
                    {projects.length >= 1 && (
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg transition-all duration-300 text-sm font-medium"
                      >
                        Upgrade Pro
                      </button>
                    )}
                  </div>
                </div>

                {/* Generation limits */}
                <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                  <AllImageGenerationLimits className="text-slate-300" />
                </div>
              </div>
            )}
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" suppressHydrationWarning>
            {/* Create New Project Card */}
            <div
              onClick={() => {
                // Check if user already has 1 project (free limit)
                if (projects.length >= 1 && !hasActiveSubscription) {
                  setShowUpgradeModal(true)
                  return
                }
                setShowCreateModal(true)
              }}
              className={`
                bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center transition-all duration-300 min-h-[200px]
                ${(!hasActiveSubscription && projects.length >= 1)
                  ? 'cursor-not-allowed opacity-50'
                  : 'cursor-pointer hover:bg-slate-750 hover:border-red-500'
                }
              `}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-4 ${
                (!hasActiveSubscription && projects.length >= 1)
                  ? 'bg-gray-500'
                  : 'bg-red-500'
              }`}>
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-comic">
                {(!hasActiveSubscription && projects.length >= 1)
                  ? 'Limit Reached'
                  : 'New Project'
                }
              </h3>
              <p className="text-slate-400 text-center text-sm">
                {(!hasActiveSubscription && projects.length >= 1)
                  ? 'Upgrade to Senior plan for more projects'
                  : 'Create a new manga'
                }
              </p>
            </div>

            {/* Project Cards */}
            {projects.map((project) => (
              <div
                key={project.id}
                className="bg-slate-800 border border-slate-700 rounded-lg p-6 hover:bg-slate-750 hover:border-slate-600 transition-all duration-300 min-h-[200px] flex flex-col"
              >
                {/* Delete Button */}
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-bold text-white truncate font-comic flex-1">
                    {project.name}
                  </h3>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteProject(project.id)
                    }}
                    className="w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center ml-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Date */}
                <div className="flex items-center text-sm text-slate-400 mb-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  <span>{formatDate(project.updated_at)}</span>
                </div>

                {/* Action Button */}
                <Link
                  href={`/project/${project.id}/edit`}
                  className="mt-auto block w-full bg-red-500 hover:bg-red-600 text-white text-center py-2 rounded-lg font-bold transition-colors"
                  style={{ color: 'white' }}
                >
                  Open Project
                </Link>
              </div>
            ))}
          </div>

          {/* Empty state if no projects */}
          {projects.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-xl font-bold text-white mb-4 font-comic">
                Your manga adventure starts here!
              </h3>
              <p className="text-slate-400 mb-8">
                Create your first project and bring your stories to life with AI
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Create my first manga
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md border border-slate-700">
            <h2 className="text-xl font-bold text-white mb-4 font-comic">
              New Manga Project
            </h2>
            <input
              type="text"
              placeholder="Your manga name..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createProject()
                if (e.key === 'Escape') setShowCreateModal(false)
              }}
              className="w-full bg-slate-700 text-white px-4 py-3 rounded-lg border border-slate-600 focus:border-red-500 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-slate-600 disabled:text-slate-400 text-white py-2 rounded-lg transition-colors font-bold"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Upgrade Modal */}
      <PremiumUpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        limitType="projects"
        currentUsage={{
          used: projects.length,
          limit: 1,
          type: 'projects'
        }}
      />
    </div>
  )
}
