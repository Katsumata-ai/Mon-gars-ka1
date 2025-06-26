'use client'

import { useState } from 'react'
import { Plus, User, Crown } from 'lucide-react'
import { useUpsellContext } from '../UpsellProvider'
import { LimitIndicator } from '../LimitIndicator'

// Exemple d'intégration du système d'upselling dans un composant de création de personnage
export function CharacterCreationExample() {
  const { 
    checkCharacterImageLimit, 
    hasActiveSubscription,
    getLimitStatus 
  } = useUpsellContext()
  
  const [isCreating, setIsCreating] = useState(false)
  
  const limitStatus = getLimitStatus('character_images')

  const handleCreateCharacter = async () => {
    // Vérifier les limites avant de procéder
    if (!checkCharacterImageLimit()) {
      // La modale d'upselling s'affichera automatiquement
      return
    }

    // Procéder avec la création du personnage
    setIsCreating(true)
    try {
      // Logique de création du personnage ici
      console.log('Création du personnage...')
      
      // Simuler une création
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      console.log('Personnage créé avec succès!')
    } catch (error) {
      console.error('Erreur lors de la création:', error)
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
          <User className="w-6 h-6" />
          <span>Créer un personnage</span>
        </h2>
        
        {/* Indicateur de limite */}
        <LimitIndicator 
          limitationType="character_images"
          className="ml-4"
        />
      </div>

      {/* Informations sur le plan */}
      {hasActiveSubscription ? (
        <div className="bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-500/20 rounded-lg p-4 mb-6">
          <div className="flex items-center space-x-2">
            <Crown className="w-5 h-5 text-primary-400" />
            <span className="text-primary-300 font-medium">
              Créations illimitées avec votre plan Senior !
            </span>
          </div>
        </div>
      ) : (
        <div className="bg-dark-700 border border-dark-600 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-300 text-sm">
                Plan gratuit : {limitStatus?.current || 0}/{limitStatus?.limit || 5} personnages utilisés
              </p>
              {limitStatus?.isApproaching && (
                <p className="text-yellow-400 text-xs mt-1">
                  Vous approchez de votre limite mensuelle
                </p>
              )}
            </div>
            {limitStatus?.isReached && (
              <button
                onClick={() => checkCharacterImageLimit()}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Passer au plan Senior
              </button>
            )}
          </div>
        </div>
      )}

      {/* Bouton de création */}
      <button
        onClick={handleCreateCharacter}
        disabled={isCreating || (!hasActiveSubscription && limitStatus?.isReached)}
        className={`
          w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-lg font-medium transition-colors
          ${(!hasActiveSubscription && limitStatus?.isReached)
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : isCreating
              ? 'bg-primary-600 text-white cursor-wait'
              : 'bg-primary-600 hover:bg-primary-700 text-white'
          }
        `}
      >
        <Plus className="w-5 h-5" />
        <span>
          {isCreating 
            ? 'Création en cours...' 
            : (!hasActiveSubscription && limitStatus?.isReached)
              ? 'Limite atteinte - Passez au plan Senior'
              : 'Créer un nouveau personnage'
          }
        </span>
      </button>

      {/* Message d'encouragement pour les utilisateurs gratuits */}
      {!hasActiveSubscription && !limitStatus?.isReached && (
        <div className="mt-4 text-center">
          <p className="text-gray-400 text-sm">
            Encore {(limitStatus?.limit || 5) - (limitStatus?.current || 0)} créations disponibles ce mois-ci
          </p>
          <button
            onClick={() => checkCharacterImageLimit()}
            className="text-primary-400 hover:text-primary-300 text-sm underline mt-1"
          >
            Passer au plan Senior pour des créations illimitées
          </button>
        </div>
      )}
    </div>
  )
}

// Exemple d'utilisation dans une galerie de personnages
export function CharacterGalleryExample() {
  const { hasActiveSubscription, getLimitStatus } = useUpsellContext()
  
  const limitStatus = getLimitStatus('character_images')
  
  // Simuler une liste de personnages
  const characters = Array.from({ length: limitStatus?.current || 0 }, (_, i) => ({
    id: i + 1,
    name: `Personnage ${i + 1}`,
    image: `/placeholder-character-${i + 1}.jpg`
  }))

  return (
    <div className="bg-dark-800 border border-dark-600 rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-white">Mes personnages</h2>
        <LimitIndicator 
          limitationType="character_images"
          showDetails={true}
        />
      </div>

      {/* Grille de personnages */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {characters.map((character) => (
          <div key={character.id} className="bg-dark-700 rounded-lg p-4 text-center">
            <div className="w-16 h-16 bg-dark-600 rounded-full mx-auto mb-2 flex items-center justify-center">
              <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-sm text-gray-300">{character.name}</p>
          </div>
        ))}
        
        {/* Bouton d'ajout */}
        <CharacterCreationExample />
      </div>

      {/* Statistiques */}
      {!hasActiveSubscription && (
        <div className="border-t border-dark-600 pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-400">
              Personnages créés ce mois-ci
            </span>
            <span className="text-white font-medium">
              {limitStatus?.current || 0}/{limitStatus?.limit || 5}
            </span>
          </div>
          <div className="w-full h-2 bg-dark-600 rounded-full mt-2 overflow-hidden">
            <div 
              className={`h-full transition-all duration-300 ${
                limitStatus?.isReached 
                  ? 'bg-red-500' 
                  : limitStatus?.isApproaching 
                    ? 'bg-yellow-500' 
                    : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(limitStatus?.percentage || 0, 100)}%` }}
            />
          </div>
        </div>
      )}
    </div>
  )
}
