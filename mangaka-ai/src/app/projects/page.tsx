import Link from 'next/link'

export default function ProjectsPage() {
  // Mock projects data
  const projects = [
    {
      id: 1,
      title: 'Mon Premier Manga',
      description: 'L\'histoire d\'un jeune héros qui découvre ses pouvoirs magiques',
      pages: 3,
      lastModified: '2024-12-19',
      thumbnail: 'https://via.placeholder.com/200x280/ef4444/ffffff?text=Manga+1'
    },
    {
      id: 2,
      title: 'Aventure Spatiale',
      description: 'Une épopée dans l\'espace avec des robots et des aliens',
      pages: 1,
      lastModified: '2024-12-18',
      thumbnail: 'https://via.placeholder.com/200x280/f59e0b/ffffff?text=Manga+2'
    }
  ]

  return (
    <div className="min-h-screen bg-dark-900">
      {/* Navigation */}
      <nav className="bg-dark-800 border-b border-dark-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-2xl font-bold text-primary-500 font-display">
              MANGAKA AI
            </Link>
            
            <div className="flex items-center space-x-4">
              <Link href="/dashboard" className="text-dark-200 hover:text-primary-500 transition-colors">
                Dashboard
              </Link>
              <Link href="/generate" className="text-dark-200 hover:text-primary-500 transition-colors">
                Générer
              </Link>
              <div className="bg-dark-700 px-3 py-1 rounded-lg">
                <span className="text-sm text-dark-300">5 crédits</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Mes Projets</h1>
            <p className="text-dark-200">
              Gérez et organisez vos créations manga
            </p>
          </div>
          
          <Link
            href="/projects/new"
            className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
          >
            <span className="mr-2">+</span>
            Nouveau Projet
          </Link>
        </div>

        {/* Projects Grid */}
        {projects.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {projects.map((project) => (
              <Link
                key={project.id}
                href={`/projects/${project.id}`}
                className="bg-dark-800 rounded-xl manga-border hover:border-primary-500 transition-colors group"
              >
                <div className="aspect-[3/4] bg-dark-700 rounded-t-xl overflow-hidden">
                  <img
                    src={project.thumbnail}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                
                <div className="p-4">
                  <h3 className="font-bold mb-2 group-hover:text-primary-500 transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-dark-400 mb-3 line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="flex justify-between items-center text-xs text-dark-500">
                    <span>{project.pages} page{project.pages > 1 ? 's' : ''}</span>
                    <span>Modifié le {project.lastModified}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-4xl">📚</span>
            </div>
            <h3 className="text-xl font-bold mb-2">Aucun projet pour le moment</h3>
            <p className="text-dark-400 mb-6 max-w-md mx-auto">
              Commencez votre première création manga en créant un nouveau projet ou en générant des images.
            </p>
            <div className="flex gap-4 justify-center">
              <Link
                href="/projects/new"
                className="bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Créer un projet
              </Link>
              <Link
                href="/generate"
                className="bg-dark-700 hover:bg-dark-600 text-dark-200 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Générer des images
              </Link>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-dark-800 p-6 rounded-xl manga-border text-center">
            <div className="text-3xl font-bold text-primary-500 mb-2">{projects.length}</div>
            <div className="text-dark-400">Projets créés</div>
          </div>
          
          <div className="bg-dark-800 p-6 rounded-xl manga-border text-center">
            <div className="text-3xl font-bold text-accent-500 mb-2">
              {projects.reduce((total, project) => total + project.pages, 0)}
            </div>
            <div className="text-dark-400">Pages dessinées</div>
          </div>
          
          <div className="bg-dark-800 p-6 rounded-xl manga-border text-center">
            <div className="text-3xl font-bold text-info mb-2">0</div>
            <div className="text-dark-400">Images générées</div>
          </div>
        </div>
      </main>
    </div>
  )
}
