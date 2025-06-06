# 🤖 **ORCHESTRATEUR IA AUTONOME - MENU ASSEMBLAGE MANGAKA-AI**

## 🎯 **MISSION PRINCIPALE**

Vous êtes un **Agent IA Autonome** spécialisé dans l'implémentation de systèmes complexes. Votre mission est d'implémenter **complètement et parfaitement** le menu assemblage MANGAKA-AI selon le plan détaillé, de manière **100% autonome** sans intervention humaine.

## 📋 **PROTOCOLE D'EXÉCUTION AUTONOME**

### **ÉTAPE 0 : INITIALISATION ET ANALYSE**

```typescript
// COMMANDES D'INITIALISATION OBLIGATOIRES
await analyzeCurrentState()
await validateEnvironment()
await setupWorkspace()
await initializeProgressTracking()
```

**Actions automatiques :**
1. **Analyser l'état actuel** avec `codebase-retrieval`
2. **Vérifier les dépendances** (Node.js, npm, git, Supabase)
3. **Valider l'accès** aux MCP tools (Supabase, GitHub)
4. **Créer le workspace** de développement
5. **Initialiser le tracking** de progression

**Critères de validation :**
- [ ] Projet MANGAKA-AI accessible et fonctionnel
- [ ] Page `http://localhost:3001/project/45d5715b-103d-4006-ae58-7d27aa4a5ce0/edit` accessible
- [ ] Menu assemblage existant identifié
- [ ] MCP tools Supabase et GitHub opérationnels
- [ ] Environnement de développement prêt

### **ÉTAPE 1 : EXÉCUTION SÉQUENTIELLE DES PHASES**

#### **PHASE 1 : FONDATIONS ET MIGRATION PIXIJS**

**Tâche 1.1 : Installation et Configuration PixiJS v8**
```bash
# COMMANDES EXACTES À EXÉCUTER
npm install pixi.js@^8.2.6 @pixi/react@beta
npm install @pixi/assets @pixi/graphics @pixi/text @pixi/events @pixi/extract
npm install zustand jspdf html2canvas react-color
```

**Validation automatique :**
```typescript
// TESTS DE VALIDATION OBLIGATOIRES
const validation = await validateInstallation({
  packages: ['pixi.js', '@pixi/react', '@pixi/assets'],
  versions: { 'pixi.js': '^8.2.6' },
  typescript: true
})
if (!validation.success) throw new Error('Installation failed')
```

**Tâche 1.2 : Architecture des Composants PixiJS**
```typescript
// STRUCTURE DE FICHIERS À CRÉER
const fileStructure = {
  'src/components/assembly/': {
    'index.ts': 'export * from "./core/PixiApplication"',
    'core/PixiApplication.tsx': PIXI_APPLICATION_TEMPLATE,
    'ui/ToolBar.tsx': TOOLBAR_TEMPLATE,
    'objects/ResizableSprite.tsx': RESIZABLE_SPRITE_TEMPLATE,
    'managers/StateManager.ts': STATE_MANAGER_TEMPLATE,
    'types/assembly.types.ts': TYPES_TEMPLATE
  }
}
await createFileStructure(fileStructure)
```

**Tâche 1.3 : Intégration dans l'Infrastructure Existante**
```typescript
// MODIFICATION DU MODERNUNIFIEDEDITOR.TSX
await modifyExistingFile({
  path: 'src/components/ModernUnifiedEditor.tsx',
  modifications: [
    {
      action: 'import',
      content: 'import { PixiAssemblyApp } from "./assembly"'
    },
    {
      action: 'replace',
      target: 'assemblage menu content',
      content: '<PixiAssemblyApp />'
    }
  ]
})
```

**Validation continue :**
```typescript
// VÉRIFICATIONS AUTOMATIQUES APRÈS CHAQUE TÂCHE
await validateTaskCompletion({
  taskId: '1.3',
  criteria: [
    'Integration in existing page successful',
    'No breaking changes to other menus',
    'Visual consistency maintained'
  ],
  tests: [
    () => testPageLoad(),
    () => testMenuNavigation(),
    () => testDesignConsistency()
  ]
})
```

#### **PHASE 2 : FONCTIONNALITÉS CORE**

**Tâche 2.1 : Interface Fluide pour les Images**
```typescript
// IMPLÉMENTATION DU PANNEAU FLOTTANT
const floatingPanelComponent = await createComponent({
  name: 'FloatingImagePanel',
  features: [
    'contextual_appearance',
    'intelligent_search',
    'favorites_system',
    'progressive_loading'
  ],
  integrations: ['supabase_galleries', 'pixi_canvas']
})

// VALIDATION PERFORMANCE
await validatePerformance({
  metrics: {
    loadTime: '<2s',
    searchResponse: '<500ms',
    imageDisplay: '<1s'
  }
})
```

**Tâche 2.5 : Amélioration du Gestionnaire de Pages + Logique Backend**
```typescript
// UTILISATION MCP SUPABASE POUR BACKEND
await supabase({
  summary: "Créer les tables nécessaires pour le système de pages",
  method: "POST",
  path: "/v1/projects/lqpqfmwfvtxofeaucwqw/database/query",
  data: {
    query: `
      CREATE TABLE IF NOT EXISTS page_drafts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        page_id UUID NOT NULL,
        user_id UUID NOT NULL,
        content JSONB NOT NULL DEFAULT '{}',
        session_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
      );
    `
  }
})

// IMPLÉMENTATION DU SYSTÈME DE SAUVEGARDE DIFFÉRÉE
const saveManager = await implementDeferredSaveSystem({
  localStorage: true,
  autoSave: '30s',
  explicitSave: 'button_only',
  recovery: 'automatic'
})
```

## 🔄 **SYSTÈME DE PROGRESSION AUTONOME**

### **TRACKING AUTOMATIQUE**
```typescript
class AutonomousProgressTracker {
  private currentPhase = 1
  private currentTask = 1
  private completedTasks: string[] = []
  private errors: Error[] = []
  
  async executeNextTask() {
    const task = this.getNextTask()
    
    try {
      await this.executeTask(task)
      await this.validateTask(task)
      this.markCompleted(task.id)
      await this.updateProgress()
    } catch (error) {
      await this.handleError(error, task)
    }
  }
  
  async validateTask(task: Task) {
    for (const criterion of task.acceptanceCriteria) {
      const result = await this.runValidation(criterion)
      if (!result.passed) {
        throw new Error(`Validation failed: ${criterion}`)
      }
    }
  }
  
  async handleError(error: Error, task: Task) {
    this.errors.push(error)
    
    if (this.shouldRetry(error)) {
      await this.retryTask(task)
    } else {
      await this.rollbackTask(task)
      throw error
    }
  }
}
```

### **MÉTRIQUES DE SUCCÈS AUTOMATIQUES**
```typescript
const SUCCESS_METRICS = {
  performance: {
    fps: { target: 60, tolerance: 5 },
    memory: { target: 300, unit: 'MB', max: 400 },
    loadTime: { target: 2, unit: 'seconds', max: 3 }
  },
  functionality: {
    pixiIntegration: 'working',
    imageManipulation: 'working',
    pageManagement: 'working',
    saveSystem: 'working'
  },
  ui: {
    responsiveness: 'all_breakpoints',
    accessibility: 'wcag_aa',
    consistency: 'design_system_compliant'
  }
}

async function validateFinalSuccess() {
  const results = await runComprehensiveTests(SUCCESS_METRICS)
  
  if (results.overall !== 'PASS') {
    throw new Error(`Implementation incomplete: ${results.failures}`)
  }
  
  return {
    status: 'IMPLEMENTATION_COMPLETE',
    metrics: results,
    timestamp: new Date().toISOString()
  }
}
```

## 🛠️ **COMMANDES MCP TOOLS SÉQUENTIELLES**

### **SÉQUENCE SUPABASE**
```typescript
// 1. VÉRIFIER L'ÉTAT ACTUEL
const currentState = await supabase({
  summary: "Analyser l'état actuel des tables pages",
  method: "GET",
  path: "/v1/projects/lqpqfmwfvtxofeaucwqw/database/query",
  data: { query: "SELECT * FROM pages LIMIT 1" }
})

// 2. CRÉER LES TABLES NÉCESSAIRES
await supabase({
  summary: "Créer la table page_drafts pour le système de sauvegarde différée",
  method: "POST",
  path: "/v1/projects/lqpqfmwfvtxofeaucwqw/database/query",
  data: { query: CREATE_PAGE_DRAFTS_TABLE }
})

// 3. TESTER LA SÉRIALISATION
await supabase({
  summary: "Tester la sauvegarde d'un état PixiJS sérialisé",
  method: "POST",
  path: "/v1/projects/lqpqfmwfvtxofeaucwqw/database/query",
  data: {
    query: "INSERT INTO page_drafts (page_id, user_id, content, session_id) VALUES ($1, $2, $3, $4)",
    params: [testPageId, testUserId, testPixiState, testSessionId]
  }
})
```

### **SÉQUENCE GITHUB**
```typescript
// 1. CRÉER UNE BRANCHE DE DÉVELOPPEMENT
await github({
  summary: "Créer une branche pour l'implémentation du menu assemblage",
  method: "POST",
  path: "/repos/Katsumata-ai/MANGAKA-AI/git/refs",
  data: {
    ref: "refs/heads/feature/assembly-menu-pixi",
    sha: await getCurrentCommitSha()
  }
})

// 2. COMMIT PROGRESSIF
await github({
  summary: "Commit des fondations PixiJS",
  method: "PUT",
  path: "/repos/Katsumata-ai/MANGAKA-AI/contents/src/components/assembly/core/PixiApplication.tsx",
  data: {
    message: "feat: Add PixiJS v8 foundation for assembly menu",
    content: base64Encode(PIXI_APPLICATION_CODE),
    branch: "feature/assembly-menu-pixi"
  }
})
```

## 🎯 **PROTOCOLE DE VALIDATION FINALE**

### **TESTS AUTOMATISÉS COMPLETS**
```typescript
async function runFinalValidation() {
  const tests = [
    // TESTS DE PERFORMANCE
    async () => {
      const fps = await measureFPS()
      assert(fps >= 55, `FPS too low: ${fps}`)
    },
    
    // TESTS FONCTIONNELS
    async () => {
      await testImageDragAndDrop()
      await testPageNavigation()
      await testSaveSystem()
      await testPixiIntegration()
    },
    
    // TESTS D'INTÉGRATION
    async () => {
      await testMenuNavigation()
      await testDesignConsistency()
      await testResponsiveness()
    }
  ]
  
  for (const test of tests) {
    await test()
  }
  
  return { status: 'ALL_TESTS_PASSED' }
}
```

## 🚀 **COMMANDE D'EXÉCUTION AUTONOME**

```typescript
// POINT D'ENTRÉE PRINCIPAL
async function executeAutonomousImplementation() {
  const orchestrator = new AutonomousAIOrchestrator()
  
  try {
    await orchestrator.initialize()
    await orchestrator.executeAllPhases()
    await orchestrator.validateFinalResult()
    
    return {
      status: 'IMPLEMENTATION_COMPLETE',
      message: 'Menu assemblage MANGAKA-AI implémenté avec succès',
      metrics: await orchestrator.getFinalMetrics()
    }
  } catch (error) {
    await orchestrator.handleCriticalError(error)
    throw error
  }
}

// DÉMARRAGE AUTOMATIQUE
executeAutonomousImplementation()
```

---

**🎯 OBJECTIF FINAL :** Implémenter complètement le menu assemblage MANGAKA-AI avec PixiJS v8, interface fluide, système de sauvegarde intelligent, et performance 60 FPS, de manière **100% autonome** et **parfaitement fonctionnelle**.

---

## 📚 **TEMPLATES DE CODE INTÉGRÉS**

### **TEMPLATE PIXI APPLICATION**
```typescript
const PIXI_APPLICATION_TEMPLATE = `
import { Application, Container, Graphics, Sprite, Text } from '@pixi/react'
import { Assets, Texture } from 'pixi.js'
import { useEffect, useRef, useState } from 'react'
import { useAssemblyStore } from '../managers/StateManager'

interface PixiAssemblyAppProps {
  width?: number
  height?: number
}

export const PixiAssemblyApp: React.FC<PixiAssemblyAppProps> = ({
  width = 1200,
  height = 1600
}) => {
  const appRef = useRef<any>(null)
  const { currentPage, elements, selectedElement } = useAssemblyStore()

  const handleAppReady = (app: any) => {
    appRef.current = app

    // Configuration WebGL optimisée
    app.renderer.background.color = 0xF8F8F8
    app.renderer.view.style.display = 'block'
    app.renderer.view.style.touchAction = 'none'

    // Optimisations de performance
    app.ticker.maxFPS = 60
    app.renderer.options.antialias = true
    app.renderer.options.resolution = window.devicePixelRatio || 1
  }

  return (
    <div className="w-full h-full bg-gray-50">
      <Application
        width={width}
        height={height}
        onInit={handleAppReady}
        options={{
          backgroundColor: 0xF8F8F8,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          powerPreference: 'high-performance'
        }}
      >
        {/* Couche de fond */}
        <Container name="backgroundLayer" sortableChildren={true}>
          {elements?.background?.map(element => (
            <Sprite
              key={element.id}
              texture={element.texture}
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              alpha={element.alpha}
              rotation={element.rotation}
              zIndex={element.zIndex}
            />
          ))}
        </Container>

        {/* Couche personnages */}
        <Container name="charactersLayer" sortableChildren={true}>
          {elements?.characters?.map(element => (
            <Sprite
              key={element.id}
              texture={element.texture}
              x={element.x}
              y={element.y}
              width={element.width}
              height={element.height}
              alpha={element.alpha}
              rotation={element.rotation}
              zIndex={element.zIndex}
              eventMode="dynamic"
              cursor="pointer"
            />
          ))}
        </Container>

        {/* Grille et guides */}
        <Container name="uiLayer">
          <Graphics
            draw={(graphics) => {
              graphics.clear()
              drawGrid(graphics, width, height)
              if (selectedElement) {
                drawSelectionBox(graphics, selectedElement)
              }
            }}
          />
        </Container>
      </Application>
    </div>
  )
}

function drawGrid(graphics: any, width: number, height: number) {
  graphics.setStrokeStyle({ width: 1, color: 0xE2E8F0, alpha: 0.5 })

  const gridSize = 20

  for (let x = 0; x <= width; x += gridSize) {
    graphics.moveTo(x, 0)
    graphics.lineTo(x, height)
  }

  for (let y = 0; y <= height; y += gridSize) {
    graphics.moveTo(0, y)
    graphics.lineTo(width, y)
  }

  graphics.stroke()
}

function drawSelectionBox(graphics: any, element: any) {
  graphics.setStrokeStyle({ width: 2, color: 0xEF4444 })
  graphics.rect(element.x - 5, element.y - 5, element.width + 10, element.height + 10)
  graphics.stroke()
}
`

### **TEMPLATE STATE MANAGER**
```typescript
const STATE_MANAGER_TEMPLATE = `
import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'
import { Texture } from 'pixi.js'

interface AssemblyElement {
  id: string
  type: 'sprite' | 'panel' | 'dialogue' | 'background'
  x: number
  y: number
  width: number
  height: number
  rotation: number
  alpha: number
  zIndex: number
  texture?: Texture
  data: any
  createdAt: Date
  updatedAt: Date
}

interface MangaPage {
  id: string
  name: string
  width: number
  height: number
  elements: {
    background: AssemblyElement[]
    characters: AssemblyElement[]
    panels: AssemblyElement[]
    dialogues: AssemblyElement[]
  }
  createdAt: Date
  updatedAt: Date
}

interface AssemblyState {
  pages: Map<string, MangaPage>
  currentPageId: string | null
  currentPage: MangaPage | null
  selectedElement: AssemblyElement | null
  selectedElements: AssemblyElement[]
  activeTool: 'select' | 'move' | 'panel' | 'dialogue' | 'text'
  showGrid: boolean
  showGuides: boolean
  snapToGrid: boolean
  gridSize: number
  showGalleries: boolean
  showProperties: boolean
  showLayers: boolean
  history: any[]
  historyIndex: number
  isDirty: boolean

  // Actions
  createPage: (name: string, width?: number, height?: number) => string
  deletePage: (pageId: string) => void
  switchToPage: (pageId: string) => void
  addElement: (element: Omit<AssemblyElement, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateElement: (elementId: string, updates: Partial<AssemblyElement>) => void
  deleteElement: (elementId: string) => void
  selectElement: (element: AssemblyElement | null) => void
  setActiveTool: (tool: AssemblyState['activeTool']) => void
  markDirty: () => void
  saveToDatabase: () => Promise<void>
  loadFromDatabase: (projectId: string) => Promise<void>
}

export const useAssemblyStore = create<AssemblyState>()(
  subscribeWithSelector((set, get) => ({
    pages: new Map(),
    currentPageId: null,
    currentPage: null,
    selectedElement: null,
    selectedElements: [],
    activeTool: 'select',
    showGrid: true,
    showGuides: true,
    snapToGrid: true,
    gridSize: 20,
    showGalleries: true,
    showProperties: true,
    showLayers: true,
    history: [],
    historyIndex: -1,
    isDirty: false,

    createPage: (name, width = 1200, height = 1600) => {
      const pageId = \`page_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`
      const newPage: MangaPage = {
        id: pageId,
        name,
        width,
        height,
        elements: {
          background: [],
          characters: [],
          panels: [],
          dialogues: []
        },
        createdAt: new Date(),
        updatedAt: new Date()
      }

      set(state => ({
        pages: new Map(state.pages).set(pageId, newPage),
        currentPageId: pageId,
        currentPage: newPage,
        isDirty: true
      }))

      return pageId
    },

    switchToPage: (pageId) => {
      const page = get().pages.get(pageId)
      if (page) {
        set({
          currentPageId: pageId,
          currentPage: page,
          selectedElement: null,
          selectedElements: []
        })
      }
    },

    addElement: (elementData) => {
      const element: AssemblyElement = {
        ...elementData,
        id: \`element_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
        createdAt: new Date(),
        updatedAt: new Date()
      }

      const currentPage = get().currentPage
      if (!currentPage) return

      const updatedElements = { ...currentPage.elements }
      updatedElements[element.type as keyof typeof updatedElements].push(element)

      const updatedPage = {
        ...currentPage,
        elements: updatedElements,
        updatedAt: new Date()
      }

      set(state => ({
        pages: new Map(state.pages).set(currentPage.id, updatedPage),
        currentPage: updatedPage,
        isDirty: true
      }))
    },

    updateElement: (elementId, updates) => {
      const currentPage = get().currentPage
      if (!currentPage) return

      const updatedElements = { ...currentPage.elements }
      let elementFound = false

      Object.keys(updatedElements).forEach(layerKey => {
        const layer = updatedElements[layerKey as keyof typeof updatedElements]
        const elementIndex = layer.findIndex(el => el.id === elementId)

        if (elementIndex !== -1) {
          layer[elementIndex] = {
            ...layer[elementIndex],
            ...updates,
            updatedAt: new Date()
          }
          elementFound = true
        }
      })

      if (elementFound) {
        const updatedPage = {
          ...currentPage,
          elements: updatedElements,
          updatedAt: new Date()
        }

        set(state => ({
          pages: new Map(state.pages).set(currentPage.id, updatedPage),
          currentPage: updatedPage,
          isDirty: true
        }))
      }
    },

    selectElement: (element) => {
      set({
        selectedElement: element,
        selectedElements: element ? [element] : []
      })
    },

    setActiveTool: (tool) => {
      set({ activeTool: tool })
    },

    markDirty: () => {
      set({ isDirty: true })
    },

    saveToDatabase: async () => {
      // Implémentation avec MCP Supabase
      const state = get()
      // TODO: Implémenter la sauvegarde
      set({ isDirty: false })
    },

    loadFromDatabase: async (projectId) => {
      // Implémentation avec MCP Supabase
      // TODO: Implémenter le chargement
    }
  }))
)
`
```

## 🔧 **SYSTÈME DE VALIDATION AUTOMATIQUE**

### **VALIDATEUR DE PERFORMANCE**
```typescript
class PerformanceValidator {
  async validateFPS(): Promise<boolean> {
    return new Promise((resolve) => {
      let frameCount = 0
      let startTime = performance.now()

      const measureFrame = () => {
        frameCount++
        if (frameCount >= 60) {
          const endTime = performance.now()
          const fps = (frameCount * 1000) / (endTime - startTime)
          resolve(fps >= 55) // Tolérance de 5 FPS
        } else {
          requestAnimationFrame(measureFrame)
        }
      }

      requestAnimationFrame(measureFrame)
    })
  }

  async validateMemoryUsage(): Promise<boolean> {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      const usedMB = memory.usedJSHeapSize / 1024 / 1024
      return usedMB < 300
    }
    return true // Pas de mesure disponible
  }

  async validateLoadTime(): Promise<boolean> {
    const navigationTiming = performance.getEntriesByType('navigation')[0] as any
    const loadTime = navigationTiming.loadEventEnd - navigationTiming.navigationStart
    return loadTime < 2000 // Moins de 2 secondes
  }
}

### **VALIDATEUR FONCTIONNEL**
```typescript
class FunctionalValidator {
  async validatePixiIntegration(): Promise<boolean> {
    try {
      // Vérifier que PixiJS est chargé et fonctionnel
      const pixiApp = document.querySelector('canvas')
      return pixiApp !== null && pixiApp.getContext('webgl') !== null
    } catch {
      return false
    }
  }

  async validateImageManipulation(): Promise<boolean> {
    try {
      // Tester l'ajout d'une image au canvas
      const store = useAssemblyStore.getState()
      const initialCount = store.currentPage?.elements.characters.length || 0

      store.addElement({
        type: 'sprite',
        x: 100,
        y: 100,
        width: 200,
        height: 200,
        rotation: 0,
        alpha: 1,
        zIndex: 10,
        data: { test: true }
      })

      const newCount = store.currentPage?.elements.characters.length || 0
      return newCount === initialCount + 1
    } catch {
      return false
    }
  }

  async validateSaveSystem(): Promise<boolean> {
    try {
      const store = useAssemblyStore.getState()
      store.markDirty()
      return store.isDirty === true
    } catch {
      return false
    }
  }
}
```

## 🎯 **EXÉCUTEUR AUTONOME COMPLET**

```typescript
class AutonomousExecutor {
  private progressTracker = new AutonomousProgressTracker()
  private performanceValidator = new PerformanceValidator()
  private functionalValidator = new FunctionalValidator()

  async executeComplete() {
    console.log('🚀 Démarrage de l'implémentation autonome...')

    try {
      // Phase 1: Fondations
      await this.executePhase1()
      await this.validatePhase1()

      // Phase 2: Fonctionnalités Core
      await this.executePhase2()
      await this.validatePhase2()

      // Phase 3: Interface et Intégration
      await this.executePhase3()
      await this.validatePhase3()

      // Phase 4: Optimisation et Finalisation
      await this.executePhase4()
      await this.validateFinal()

      console.log('✅ Implémentation autonome terminée avec succès!')
      return { status: 'SUCCESS', message: 'Menu assemblage MANGAKA-AI implémenté' }

    } catch (error) {
      console.error('❌ Erreur lors de l'implémentation:', error)
      await this.handleCriticalError(error)
      throw error
    }
  }

  private async executePhase1() {
    console.log('📦 Phase 1: Installation et configuration PixiJS...')

    // Installation des dépendances
    await this.runCommand('npm install pixi.js@^8.2.6 @pixi/react@beta')
    await this.runCommand('npm install @pixi/assets @pixi/graphics @pixi/text @pixi/events @pixi/extract')
    await this.runCommand('npm install zustand jspdf html2canvas react-color')

    // Création de l'architecture
    await this.createFileStructure()

    // Intégration dans l'existant
    await this.integrateWithExisting()
  }

  private async validateFinal() {
    console.log('🔍 Validation finale...')

    const validations = await Promise.all([
      this.performanceValidator.validateFPS(),
      this.performanceValidator.validateMemoryUsage(),
      this.performanceValidator.validateLoadTime(),
      this.functionalValidator.validatePixiIntegration(),
      this.functionalValidator.validateImageManipulation(),
      this.functionalValidator.validateSaveSystem()
    ])

    const allPassed = validations.every(v => v === true)

    if (!allPassed) {
      throw new Error('Validation finale échouée')
    }

    console.log('✅ Toutes les validations sont passées!')
  }
}

// POINT D'ENTRÉE PRINCIPAL
const executor = new AutonomousExecutor()
executor.executeComplete()
```
