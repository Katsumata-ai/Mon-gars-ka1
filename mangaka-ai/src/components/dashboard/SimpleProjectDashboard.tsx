'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, Calendar } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

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

  const supabase = createClient()

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

      const { error } = await supabase
        .from('projects')
        .insert({
          name: newProjectName.trim(),
          user_id: user.id,
          description: ''
        })

      if (error) throw error

      setNewProjectName('')
      setShowCreateModal(false)
      loadProjects()
    } catch (error) {
      console.error('Erreur lors de la création du projet:', error)
    }
  }

  const deleteProject = async (projectId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce projet ?')) return

    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectId)

      if (error) throw error
      loadProjects()
    } catch (error) {
      console.error('Erreur lors de la suppression du projet:', error)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <div className="h-8 bg-slate-700 rounded w-48 mb-4 animate-pulse"></div>
            <div className="h-4 bg-slate-700 rounded w-96 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-slate-800 rounded-lg p-6 animate-pulse">
                <div className="h-6 bg-slate-700 rounded mb-4"></div>
                <div className="h-4 bg-slate-700 rounded w-24 mb-4"></div>
                <div className="h-10 bg-slate-700 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="p-8">
        <div className="max-w-6xl mx-auto">
          {/* Header simple */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2 font-comic">MES PROJETS</h1>
            <p className="text-slate-300">
              Créez, gérez et donnez vie à vos histoires manga avec des outils IA de pointe
            </p>
          </div>

          {/* Projects Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {/* Create New Project Card */}
            <div
              onClick={() => setShowCreateModal(true)}
              className="bg-slate-800 border border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-slate-750 hover:border-red-500 transition-all duration-300 min-h-[200px]"
            >
              <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mb-4">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 font-comic">Nouveau Projet</h3>
              <p className="text-slate-400 text-center text-sm">
                Créez un nouveau manga
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
                  Ouvrir le projet
                </Link>
              </div>
            ))}
          </div>

          {/* Empty state si aucun projet */}
          {projects.length === 0 && (
            <div className="text-center py-16">
              <h3 className="text-xl font-bold text-white mb-4 font-comic">
                Votre aventure manga commence ici !
              </h3>
              <p className="text-slate-400 mb-8">
                Créez votre premier projet et donnez vie à vos histoires avec l'IA
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-bold transition-colors"
              >
                Créer mon premier manga
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
              Nouveau Projet Manga
            </h2>
            <input
              type="text"
              placeholder="Nom de votre manga..."
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
                Annuler
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-slate-600 disabled:text-slate-400 text-white py-2 rounded-lg transition-colors font-bold"
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
