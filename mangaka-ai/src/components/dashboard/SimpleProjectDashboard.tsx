'use client'

import { useState, useEffect } from 'react'
import { Plus, MoreVertical, Edit2, Trash2, BookOpen, Calendar, Image } from 'lucide-react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  name: string
  description?: string
  cover_image?: string
  pages_count: number
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
          description: '',
          pages_count: 0
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
      <div className="p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-dark-800 rounded-xl p-6 animate-pulse">
              <div className="w-full h-32 bg-dark-700 rounded-lg mb-4"></div>
              <div className="h-4 bg-dark-700 rounded mb-2"></div>
              <div className="h-3 bg-dark-700 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Mes Projets</h1>
        <p className="text-dark-200">
          Gérez vos créations manga et donnez vie à vos histoires
        </p>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {/* Create New Project Card */}
        <div
          onClick={() => setShowCreateModal(true)}
          className="bg-dark-800/50 border-2 border-dashed border-dark-600 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer hover:border-primary-500 hover:bg-dark-800/70 transition-all duration-300 group min-h-[280px]"
        >
          <div className="w-16 h-16 bg-primary-500/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-500/30 transition-colors">
            <Plus className="w-8 h-8 text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Nouveau Projet</h3>
          <p className="text-dark-300 text-center text-sm">
            Créez un nouveau manga et commencez votre aventure créative
          </p>
        </div>

        {/* Project Cards */}
        {projects.map((project) => (
          <div
            key={project.id}
            className="bg-dark-800 rounded-xl overflow-hidden hover:bg-dark-750 transition-all duration-300 group border border-dark-700 hover:border-dark-600"
          >
            {/* Project Cover */}
            <div className="relative h-40 bg-gradient-to-br from-primary-500/20 to-primary-600/20 flex items-center justify-center">
              {project.cover_image ? (
                <img
                  src={project.cover_image}
                  alt={project.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="text-center">
                  <BookOpen className="w-12 h-12 text-primary-400 mx-auto mb-2" />
                  <span className="text-primary-300 text-sm">Pas de couverture</span>
                </div>
              )}
              
              {/* Delete Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  deleteProject(project.id)
                }}
                className="absolute top-3 right-3 w-8 h-8 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <Trash2 className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Project Info */}
            <div className="p-4">
              <h3 className="text-lg font-semibold text-white mb-3 truncate">
                {project.name}
              </h3>

              <div className="flex items-center justify-between text-sm text-dark-300 mb-4">
                <div className="flex items-center space-x-1">
                  <Image className="w-4 h-4" />
                  <span>{project.pages_count} pages</span>
                </div>
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(project.updated_at)}</span>
                </div>
              </div>

              <Link
                href={`/project/${project.id}/edit`}
                className="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center py-2 rounded-lg transition-colors"
              >
                Ouvrir le projet
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-800 rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold text-white mb-4">Nouveau Projet</h2>
            <input
              type="text"
              placeholder="Nom du projet..."
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') createProject()
                if (e.key === 'Escape') setShowCreateModal(false)
              }}
              className="w-full bg-dark-700 text-white px-4 py-3 rounded-lg border border-dark-600 focus:border-primary-500 focus:outline-none mb-4"
              autoFocus
            />
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 bg-dark-700 hover:bg-dark-600 text-white py-2 rounded-lg transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={createProject}
                disabled={!newProjectName.trim()}
                className="flex-1 bg-primary-500 hover:bg-primary-600 disabled:bg-dark-600 disabled:text-dark-400 text-white py-2 rounded-lg transition-colors"
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
