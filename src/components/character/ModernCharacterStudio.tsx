'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Sparkles, Heart, Download, Copy, Trash2, Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUserCredits } from '@/hooks/useUserCredits'

interface Character {
  id: string
  prompt: string
  image_url: string
  original_prompt?: string
  metadata?: any
  created_at: string
}

interface Message {
  id: string
  type: 'user' | 'assistant' | 'system'
  content: string
  character?: Character
  timestamp: Date
}

interface ModernCharacterStudioProps {
  projectId?: string
  onCharacterGenerated?: (character: Character) => void
}

export default function ModernCharacterStudio({
  projectId,
  onCharacterGenerated
}: ModernCharacterStudioProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'system',
      content: 'Hello! I am your AI assistant for creating manga characters. Describe the character you want to create.',
      timestamp: new Date()
    }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [characters, setCharacters] = useState<Character[]>([])
  const [favorites, setFavorites] = useState<string[]>([])
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null)
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { credits, user, refreshCredits } = useUserCredits()
  const supabase = createClient()

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Charger les personnages existants
  useEffect(() => {
    if (projectId && user) {
      loadCharacters()
      loadFavorites()
    }
  }, [projectId, user])

  const loadCharacters = async () => {
    try {
      const { data, error } = await supabase
        .from('generated_images')
        .select('*')
        .eq('user_id', user?.id)
        .eq('image_type', 'character')
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error
      setCharacters(data || [])
    } catch (error) {
      console.error('Erreur lors du chargement des personnages:', error)
    }
  }

  const loadFavorites = async () => {
    if (!user?.id) return
    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('item_id')
        .eq('user_id', user.id)
        .eq('item_type', 'character')

      if (error) throw error
      setFavorites(data?.map(fav => fav.item_id) || [])
    } catch (error) {
      console.error('Erreur lors du chargement des favoris:', error)
    }
  }

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isGenerating) return

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputValue('')
    setIsGenerating(true)

    try {
      // Générer le personnage
      const character = await generateCharacter(inputValue)
      
      if (character) {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: 'Here is your character! What do you think of the result?',
          character,
          timestamp: new Date()
        }
        
        setMessages(prev => [...prev, assistantMessage])
        setCharacters(prev => [character, ...prev])
        onCharacterGenerated?.(character)
        await refreshCredits()
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `Sorry, an error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`,
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsGenerating(false)
    }
  }

  const generateCharacter = async (prompt: string): Promise<Character | null> => {
    if (!user || !credits || (credits.monthly_generations_limit - credits.monthly_generations_used) < 1) {
      throw new Error('Générations insuffisantes. Passez au plan Pro pour continuer.')
    }

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Non connecté')

    const response = await fetch('/api/generate-image', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({
        prompt: `${prompt}, manga style character, anime art, detailed character design, high quality`,
        type: 'character',
        optimizePrompt: true,
        projectId,
        metadata: {
          originalPrompt: prompt,
          style: 'manga'
        }
      })
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(result.error || 'Erreur lors de la génération')
    }

    if (result.success) {
      return {
        id: result.data.imageId,
        prompt: result.data.optimizedPrompt,
        image_url: result.data.imageUrl,
        original_prompt: prompt,
        metadata: result.data.metadata,
        created_at: new Date().toISOString()
      }
    }

    return null
  }

  const toggleFavorite = async (characterId: string) => {
    const isFavorite = favorites.includes(characterId)
    
    try {
      if (isFavorite) {
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user?.id)
          .eq('item_id', characterId)
          .eq('item_type', 'character')
        
        setFavorites(prev => prev.filter(id => id !== characterId))
      } else {
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user?.id,
            item_id: characterId,
            item_type: 'character'
          })
        
        setFavorites(prev => [...prev, characterId])
      }
    } catch (error) {
      console.error('Erreur lors de la gestion des favoris:', error)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <div className="h-full flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Zone de conversation - Style ChatGPT */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Studio de Personnages IA</h1>
              <p className="text-slate-400">Créez des personnages manga avec l'intelligence artificielle</p>
            </div>
            {credits && (
              <div className="bg-white/10 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-yellow-400" />
                  <span className="text-white font-medium">
                    {credits.monthly_generations_limit - credits.monthly_generations_used} générations
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-3xl rounded-2xl px-6 py-4 ${
                  message.type === 'user'
                    ? 'bg-blue-600 text-white'
                    : message.type === 'system'
                    ? 'bg-white/10 backdrop-blur-sm text-slate-300 border border-white/20'
                    : 'bg-white/5 backdrop-blur-sm text-white border border-white/10'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.content}</p>
                
                {/* Affichage du personnage généré */}
                {message.character && (
                  <div className="mt-4 p-4 bg-black/20 rounded-xl">
                    <div className="relative group">
                      <img
                        src={message.character.image_url}
                        alt={message.character.original_prompt}
                        className="w-full max-w-md mx-auto rounded-lg shadow-2xl cursor-pointer transition-transform hover:scale-105"
                        onClick={() => setSelectedCharacter(message.character!)}
                      />
                      
                      {/* Actions au survol */}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-3">
                        <button
                          onClick={() => toggleFavorite(message.character!.id)}
                          className={`p-2 rounded-full transition-colors ${
                            favorites.includes(message.character!.id)
                              ? 'bg-red-500 text-white'
                              : 'bg-white/20 text-white hover:bg-white/30'
                          }`}
                        >
                          <Heart className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => navigator.clipboard.writeText(message.character!.prompt)}
                          className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                        >
                          <Copy className="w-5 h-5" />
                        </button>
                        <a
                          href={message.character!.image_url}
                          download={`character-${message.character!.id}.png`}
                          className="p-2 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                        >
                          <Download className="w-5 h-5" />
                        </a>
                      </div>
                    </div>
                    
                    {/* Nom du personnage (toujours visible) */}
                    <div className="mt-3 text-center">
                      <h3 className="font-medium text-white">
                        {message.character.metadata?.name || 'Personnage sans nom'}
                      </h3>
                      
                      {/* Prompt au survol */}
                      <div className="group relative">
                        <p className="text-xs text-slate-400 cursor-help">
                          Voir le prompt...
                        </p>
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-black/90 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none max-w-xs">
                          {message.character.original_prompt}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {isGenerating && (
            <div className="flex justify-start">
              <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl px-6 py-4">
                <div className="flex items-center space-x-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span className="text-white">Génération en cours...</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Zone de saisie */}
        <div className="p-6 border-t border-white/10">
          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Décrivez le personnage que vous voulez créer..."
                className="w-full bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
                disabled={isGenerating}
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isGenerating}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white p-3 rounded-xl transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Galerie latérale - Images prominentes */}
      <div className="w-80 bg-black/20 backdrop-blur-sm border-l border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <h2 className="text-lg font-semibold text-white">Vos Personnages</h2>
          <p className="text-sm text-slate-400">{characters.length} créations</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {characters.map((character) => (
            <div
              key={character.id}
              className="relative group cursor-pointer"
              onClick={() => setSelectedCharacter(character)}
            >
              <img
                src={character.image_url}
                alt={character.original_prompt}
                className="w-full aspect-square object-cover rounded-lg shadow-lg transition-transform hover:scale-105"
              />
              
              {/* Overlay avec nom */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent rounded-lg">
                <div className="absolute bottom-2 left-2 right-2">
                  <h3 className="text-white font-medium text-sm truncate">
                    {character.metadata?.name || 'Sans nom'}
                  </h3>
                </div>
              </div>
              
              {/* Indicateur favori */}
              {favorites.includes(character.id) && (
                <div className="absolute top-2 right-2">
                  <Heart className="w-4 h-4 text-red-500 fill-current" />
                </div>
              )}
            </div>
          ))}
          
          {characters.length === 0 && (
            <div className="text-center py-12">
              <Plus className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">Aucun personnage créé</p>
              <p className="text-sm text-slate-500">Commencez par décrire un personnage</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
