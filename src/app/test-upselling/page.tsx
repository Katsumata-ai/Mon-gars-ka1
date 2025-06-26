'use client'

import { useState } from 'react'
import {
  CharacterCreationExample,
  CharacterGalleryExample,
  LimitsSummary,
  useUpsellContext
} from '@/components/upselling'
import { ConditionalUpsellProvider } from '@/components/upselling/ConditionalUpsellProvider'
import { Crown, User, Image, FileText, Download, Zap } from 'lucide-react'

function TestUpsellingContent() {
  const { 
    checkCharacterImageLimit,
    checkDecorImageLimit,
    checkSceneGenerationLimit,
    checkProjectPagesLimit,
    checkTotalProjectsLimit,
    checkProjectExportsLimit,
    checkMonthlyGenerationsLimit,
    checkStorageSpaceLimit,
    checkAdvancedToolsAccess,
    hasActiveSubscription
  } = useUpsellContext()

  const [testResults, setTestResults] = useState<string[]>([])

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testLimitations = [
    {
      name: 'Personnages',
      icon: <User className="w-5 h-5" />,
      check: checkCharacterImageLimit,
      description: 'Teste la limite de création de personnages'
    },
    {
      name: 'Décors',
      icon: <Image className="w-5 h-5" />,
      check: checkDecorImageLimit,
      description: 'Teste la limite de création de décors'
    },
    {
      name: 'Scènes',
      icon: <Zap className="w-5 h-5" />,
      check: checkSceneGenerationLimit,
      description: 'Teste la limite de génération de scènes'
    },
    {
      name: 'Pages projet',
      icon: <FileText className="w-5 h-5" />,
      check: checkProjectPagesLimit,
      description: 'Teste la limite de pages par projet'
    },
    {
      name: 'Projets totaux',
      icon: <FileText className="w-5 h-5" />,
      check: checkTotalProjectsLimit,
      description: 'Teste la limite de projets totaux'
    },
    {
      name: 'Exports',
      icon: <Download className="w-5 h-5" />,
      check: checkProjectExportsLimit,
      description: 'Teste la limite d\'exports'
    },
    {
      name: 'Générations mensuelles',
      icon: <Zap className="w-5 h-5" />,
      check: checkMonthlyGenerationsLimit,
      description: 'Teste la limite de générations mensuelles'
    },
    {
      name: 'Stockage',
      icon: <Image className="w-5 h-5" />,
      check: checkStorageSpaceLimit,
      description: 'Teste la limite d\'espace de stockage'
    },
    {
      name: 'Outils avancés',
      icon: <Crown className="w-5 h-5" />,
      check: checkAdvancedToolsAccess,
      description: 'Teste l\'accès aux outils avancés'
    }
  ]

  const handleTestLimit = (limitation: typeof testLimitations[0]) => {
    const allowed = limitation.check()
    addTestResult(`${limitation.name}: ${allowed ? 'Autorisé' : 'Bloqué (modale affichée)'}`)
  }

  return (
    <div className="min-h-screen bg-dark-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Test du système d'upselling
          </h1>
          <p className="text-gray-300">
            Cette page permet de tester toutes les fonctionnalités du système d'upselling ciblé.
          </p>
          
          {hasActiveSubscription && (
            <div className="mt-4 bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-500/20 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <Crown className="w-5 h-5 text-primary-400" />
                <span className="text-primary-300 font-medium">
                  Vous avez un plan Senior actif - Les modales ne s'afficheront pas
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tests des limitations */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-dark-800 border border-dark-600 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Tests des limitations
              </h2>
              <p className="text-gray-300 mb-6 text-sm">
                Cliquez sur les boutons ci-dessous pour tester chaque type de limitation. 
                Si vous êtes un utilisateur gratuit et que la limite est atteinte, 
                une modale d'upselling s'affichera.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testLimitations.map((limitation) => (
                  <button
                    key={limitation.name}
                    onClick={() => handleTestLimit(limitation)}
                    className="bg-dark-700 hover:bg-dark-600 border border-dark-600 hover:border-primary-500/50 rounded-lg p-4 text-left transition-colors group"
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      <div className="text-primary-400 group-hover:text-primary-300">
                        {limitation.icon}
                      </div>
                      <h3 className="font-medium text-white">{limitation.name}</h3>
                    </div>
                    <p className="text-gray-400 text-sm">{limitation.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Résultats des tests */}
            {testResults.length > 0 && (
              <div className="bg-dark-800 border border-dark-600 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white">
                    Résultats des tests
                  </h2>
                  <button
                    onClick={() => setTestResults([])}
                    className="text-gray-400 hover:text-white text-sm"
                  >
                    Effacer
                  </button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {testResults.map((result, index) => (
                    <div key={index} className="text-sm text-gray-300 font-mono bg-dark-700 p-2 rounded">
                      {result}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Exemples d'intégration */}
            <div className="bg-dark-800 border border-dark-600 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4">
                Exemples d'intégration
              </h2>
              <div className="space-y-6">
                <CharacterCreationExample />
                <CharacterGalleryExample />
              </div>
            </div>
          </div>

          {/* Sidebar avec résumé des limites */}
          <div className="space-y-6">
            <LimitsSummary />
            
            <div className="bg-dark-800 border border-dark-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Guide d'utilisation
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div>
                  <h4 className="font-medium text-white mb-1">Pour les utilisateurs gratuits :</h4>
                  <p>Les modales d'upselling s'affichent automatiquement quand vous atteignez vos limites.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Pour les utilisateurs premium :</h4>
                  <p>Aucune limitation - toutes les fonctionnalités sont illimitées.</p>
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Intégration :</h4>
                  <p>Utilisez les hooks <code className="bg-dark-700 px-1 rounded">useUpsellContext</code> dans vos composants.</p>
                </div>
              </div>
            </div>

            <div className="bg-dark-800 border border-dark-600 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Documentation
              </h3>
              <div className="space-y-2 text-sm">
                <a 
                  href="/docs/UPSELLING_INTEGRATION_GUIDE.md" 
                  className="block text-primary-400 hover:text-primary-300"
                >
                  Guide d'intégration complet
                </a>
                <a 
                  href="/api/docs" 
                  className="block text-primary-400 hover:text-primary-300"
                >
                  Documentation API
                </a>
                <a 
                  href="/components/upselling" 
                  className="block text-primary-400 hover:text-primary-300"
                >
                  Composants disponibles
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TestUpsellingPage() {
  return (
    <ConditionalUpsellProvider>
      <TestUpsellingContent />
    </ConditionalUpsellProvider>
  )
}
