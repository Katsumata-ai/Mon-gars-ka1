'use client'

import { useState } from 'react'
import { Mail, MessageSquare, User, Send, CheckCircle, AlertCircle } from 'lucide-react'
import Navigation from '@/components/navigation/Navigation'
import { createClient } from '@/lib/supabase/client'

interface ContactForm {
  name: string
  email: string
  subject: string
  message: string
}

interface FormErrors {
  name?: string
  email?: string
  subject?: string
  message?: string
  general?: string
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>({
    name: '',
    email: '',
    subject: '',
    message: ''
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const supabase = createClient()

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'Le nom est requis'
    }

    if (!form.email.trim()) {
      newErrors.email = 'L\'email est requis'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = 'Format d\'email invalide'
    }

    if (!form.subject.trim()) {
      newErrors.subject = 'Le sujet est requis'
    }

    if (!form.message.trim()) {
      newErrors.message = 'Le message est requis'
    } else if (form.message.trim().length < 10) {
      newErrors.message = 'Le message doit contenir au moins 10 caractères'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)
    setErrors({})

    try {
      // Insérer le message de contact dans Supabase
      const { error } = await supabase
        .from('contact_messages')
        .insert({
          name: form.name.trim(),
          email: form.email.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          created_at: new Date().toISOString()
        })

      if (error) {
        throw error
      }

      setIsSubmitted(true)
      setForm({ name: '', email: '', subject: '', message: '' })
    } catch (error) {
      console.error('Erreur lors de l\'envoi du message:', error)
      setErrors({
        general: 'Une erreur est survenue lors de l\'envoi du message. Veuillez réessayer.'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof ContactForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }))
    // Effacer l'erreur du champ quand l'utilisateur commence à taper
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen bg-slate-900">
        <Navigation variant="landing" />
        
        <div className="pt-20 pb-16">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8 text-center">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-white mb-4 font-comic">
                Message Envoyé !
              </h1>
              <p className="text-slate-300 mb-6">
                Merci pour votre message. Notre équipe vous répondra dans les plus brefs délais.
              </p>
              <button
                onClick={() => setIsSubmitted(false)}
                className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-lg font-bold transition-colors"
              >
                Envoyer un autre message
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <Navigation variant="landing" />
      
      <div className="pt-20 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4 font-comic">
              CONTACTEZ-NOUS
            </h1>
            <p className="text-xl text-slate-300 max-w-2xl mx-auto">
              Une question ? Un problème ? Notre équipe est là pour vous aider à créer vos mangas avec MANGAKA AI.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Informations de contact */}
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6 font-comic">
                  Parlons de votre projet
                </h2>
                <p className="text-slate-300 mb-8">
                  Que vous soyez un mangaka débutant ou expérimenté, nous sommes là pour vous accompagner dans votre création artistique.
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Mail className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Support Technique</h3>
                    <p className="text-slate-300">
                      Problèmes techniques, bugs, ou questions sur l'utilisation de la plateforme.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MessageSquare className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Suggestions</h3>
                    <p className="text-slate-300">
                      Idées d'amélioration, nouvelles fonctionnalités, ou retours d'expérience.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">Partenariats</h3>
                    <p className="text-slate-300">
                      Collaborations, intégrations, ou opportunités business.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Formulaire de contact */}
            <div className="bg-slate-800 border border-slate-700 rounded-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {errors.general && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-center space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-red-400 text-sm">{errors.general}</p>
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-bold text-white mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={form.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      errors.name 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-600 focus:ring-red-500 focus:border-red-500'
                    }`}
                    placeholder="Votre nom et prénom"
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-bold text-white mb-2">
                    Email *
                  </label>
                  <input
                    type="email"
                    id="email"
                    value={form.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      errors.email 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-600 focus:ring-red-500 focus:border-red-500'
                    }`}
                    placeholder="votre@email.com"
                  />
                  {errors.email && (
                    <p className="text-red-400 text-sm mt-1">{errors.email}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-bold text-white mb-2">
                    Sujet *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    value={form.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors ${
                      errors.subject 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-600 focus:ring-red-500 focus:border-red-500'
                    }`}
                    placeholder="De quoi souhaitez-vous parler ?"
                  />
                  {errors.subject && (
                    <p className="text-red-400 text-sm mt-1">{errors.subject}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-bold text-white mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    rows={6}
                    value={form.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className={`w-full px-4 py-3 bg-slate-700 border rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 transition-colors resize-none ${
                      errors.message 
                        ? 'border-red-500 focus:ring-red-500' 
                        : 'border-slate-600 focus:ring-red-500 focus:border-red-500'
                    }`}
                    placeholder="Décrivez votre demande en détail..."
                  />
                  {errors.message && (
                    <p className="text-red-400 text-sm mt-1">{errors.message}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-500/50 text-white py-3 px-6 rounded-lg font-bold transition-colors flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Envoi en cours...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Envoyer le message</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
