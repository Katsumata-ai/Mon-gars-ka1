import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import ModernUnifiedEditor from '@/components/editor/ModernUnifiedEditor'
import { ConditionalUpsellProvider } from '@/components/upselling/ConditionalUpsellProvider'

interface ProjectEditPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function ProjectEditPage({ params }: ProjectEditPageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Retrieve project information
  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (error || !project) {
    notFound()
  }

  return (
    <ConditionalUpsellProvider>
      <ModernUnifiedEditor
        projectId={project.id}
        projectName={project.name}
      />
    </ConditionalUpsellProvider>
  )
}
