import Link from 'next/link'
import { FileX, ArrowLeft } from 'lucide-react'

export default function ProjectNotFound() {
  return (
    <div className="min-h-screen bg-dark-900 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 bg-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileX className="w-12 h-12 text-dark-400" />
        </div>
        
        <h1 className="text-3xl font-bold text-white mb-4">Project not found</h1>
        <p className="text-dark-300 mb-8 max-w-md">
          The project you are looking for does not exist or you do not have permission to access it.
        </p>

        <div className="space-y-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center space-x-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div>
            <Link
              href="/"
              className="text-dark-400 hover:text-primary-400 transition-colors"
            >
              Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
