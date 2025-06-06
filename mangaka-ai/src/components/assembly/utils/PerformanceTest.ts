// Tests de performance pour PixiJS v8 WebGL
import { Application, Container, Graphics } from 'pixi.js'

// Interface pour les résultats de test
interface PerformanceTestResult {
  testName: string
  fps: number
  averageFps: number
  minFps: number
  maxFps: number
  memoryUsage: number
  duration: number
  elementsCount: number
  success: boolean
  errors: string[]
}

// Interface pour les options de test
interface TestOptions {
  duration: number // Durée du test en millisecondes
  elementsCount: number // Nombre d'éléments à tester
  updateFrequency: number // Fréquence de mise à jour en ms
}

// Classe pour les tests de performance
export class PerformanceTest {
  private app: Application | null = null
  private testContainer: Container | null = null
  private isRunning = false
  private frameCount = 0
  private startTime = 0
  private fpsHistory: number[] = []
  private lastFrameTime = 0

  constructor(app: Application) {
    this.app = app
  }

  // Test avec 100+ éléments simultanés
  async testManyElements(options: TestOptions = {
    duration: 10000,
    elementsCount: 100,
    updateFrequency: 16
  }): Promise<PerformanceTestResult> {
    const result: PerformanceTestResult = {
      testName: 'Test 100+ éléments',
      fps: 0,
      averageFps: 0,
      minFps: Infinity,
      maxFps: 0,
      memoryUsage: 0,
      duration: options.duration,
      elementsCount: options.elementsCount,
      success: false,
      errors: []
    }

    try {
      if (!this.app) throw new Error('Application PixiJS non disponible')

      // Créer le conteneur de test
      this.testContainer = new Container()
      this.app.stage.addChild(this.testContainer)

      // Créer les éléments de test
      const elements = this.createTestElements(options.elementsCount)
      elements.forEach(element => this.testContainer!.addChild(element))

      // Démarrer le test
      await this.runPerformanceTest(options, result)

      result.success = true
      console.log('Test de performance réussi:', result)

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue')
      console.error('Erreur test performance:', error)
    } finally {
      this.cleanup()
    }

    return result
  }

  // Test de stress avec drag-and-drop continu
  async testDragAndDrop(options: TestOptions = {
    duration: 5000,
    elementsCount: 50,
    updateFrequency: 16
  }): Promise<PerformanceTestResult> {
    const result: PerformanceTestResult = {
      testName: 'Test Drag & Drop',
      fps: 0,
      averageFps: 0,
      minFps: Infinity,
      maxFps: 0,
      memoryUsage: 0,
      duration: options.duration,
      elementsCount: options.elementsCount,
      success: false,
      errors: []
    }

    try {
      if (!this.app) throw new Error('Application PixiJS non disponible')

      // Créer le conteneur de test
      this.testContainer = new Container()
      this.app.stage.addChild(this.testContainer)

      // Créer les éléments mobiles
      const elements = this.createMovingElements(options.elementsCount)
      elements.forEach(element => this.testContainer!.addChild(element))

      // Démarrer le test avec mouvement
      await this.runMovementTest(options, result, elements)

      result.success = true
      console.log('Test drag & drop réussi:', result)

    } catch (error) {
      result.errors.push(error instanceof Error ? error.message : 'Erreur inconnue')
      console.error('Erreur test drag & drop:', error)
    } finally {
      this.cleanup()
    }

    return result
  }

  // Test de compatibilité navigateurs
  async testBrowserCompatibility(): Promise<{
    webgl: boolean
    webgl2: boolean
    webgpu: boolean
    canvas: boolean
    devicePixelRatio: number
    maxTextureSize: number
    vendor: string
    renderer: string
  }> {
    const result = {
      webgl: false,
      webgl2: false,
      webgpu: false,
      canvas: true, // Toujours supporté
      devicePixelRatio: typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1,
      maxTextureSize: 0,
      vendor: '',
      renderer: ''
    }

    try {
      // Test WebGL (côté client uniquement)
      if (typeof document === 'undefined') return result

      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')

      if (gl && gl instanceof WebGLRenderingContext) {
        result.webgl = true
        result.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          result.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || ''
          result.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || ''
        }
      }

      // Test WebGL2
      const gl2 = canvas.getContext('webgl2')
      if (gl2) {
        result.webgl2 = true
      }

      // Test WebGPU (expérimental)
      if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
        try {
          const adapter = await (navigator as any).gpu.requestAdapter()
          result.webgpu = !!adapter
        } catch (e) {
          result.webgpu = false
        }
      }

    } catch (error) {
      console.error('Erreur test compatibilité:', error)
    }

    return result
  }

  // Créer des éléments de test statiques
  private createTestElements(count: number): Container[] {
    const elements: Container[] = []

    for (let i = 0; i < count; i++) {
      const container = new Container()
      const graphics = new Graphics()

      // Créer différents types d'éléments
      const type = i % 4
      switch (type) {
        case 0: // Rectangle
          graphics.rect(0, 0, 50, 50)
          graphics.fill(Math.random() * 0xFFFFFF)
          break
        case 1: // Cercle
          graphics.circle(25, 25, 25)
          graphics.fill(Math.random() * 0xFFFFFF)
          break
        case 2: // Triangle
          graphics.poly([0, 50, 25, 0, 50, 50])
          graphics.fill(Math.random() * 0xFFFFFF)
          break
        case 3: // Étoile
          const points = []
          for (let j = 0; j < 10; j++) {
            const angle = (j / 10) * Math.PI * 2
            const radius = j % 2 === 0 ? 25 : 12
            points.push(25 + Math.cos(angle) * radius, 25 + Math.sin(angle) * radius)
          }
          graphics.poly(points)
          graphics.fill(Math.random() * 0xFFFFFF)
          break
      }

      container.addChild(graphics)
      container.x = Math.random() * (this.app!.screen.width - 50)
      container.y = Math.random() * (this.app!.screen.height - 50)

      elements.push(container)
    }

    return elements
  }

  // Créer des éléments mobiles pour le test de mouvement
  private createMovingElements(count: number): Container[] {
    const elements = this.createTestElements(count)
    
    // Ajouter des propriétés de mouvement
    elements.forEach(element => {
      (element as any).vx = (Math.random() - 0.5) * 4;
      (element as any).vy = (Math.random() - 0.5) * 4;
    });

    return elements
  }

  // Exécuter le test de performance
  private async runPerformanceTest(options: TestOptions, result: PerformanceTestResult): Promise<void> {
    return new Promise((resolve) => {
      this.isRunning = true
      this.frameCount = 0
      this.startTime = performance.now()
      this.lastFrameTime = this.startTime
      this.fpsHistory = []

      const ticker = this.app!.ticker
      const testTick = () => {
        if (!this.isRunning) return

        const currentTime = performance.now()
        const deltaTime = currentTime - this.lastFrameTime
        
        if (deltaTime > 0) {
          const fps = 1000 / deltaTime
          this.fpsHistory.push(fps)
          
          result.minFps = Math.min(result.minFps, fps)
          result.maxFps = Math.max(result.maxFps, fps)
        }

        this.lastFrameTime = currentTime
        this.frameCount++

        // Vérifier si le test est terminé
        if (currentTime - this.startTime >= options.duration) {
          this.isRunning = false
          ticker.remove(testTick)

          // Calculer les résultats
          result.averageFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
          result.fps = result.averageFps
          result.memoryUsage = this.getMemoryUsage()

          resolve()
        }
      }

      ticker.add(testTick)
    })
  }

  // Exécuter le test avec mouvement
  private async runMovementTest(options: TestOptions, result: PerformanceTestResult, elements: Container[]): Promise<void> {
    return new Promise((resolve) => {
      this.isRunning = true
      this.frameCount = 0
      this.startTime = performance.now()
      this.lastFrameTime = this.startTime
      this.fpsHistory = []

      const ticker = this.app!.ticker
      const testTick = () => {
        if (!this.isRunning) return

        // Animer les éléments
        elements.forEach(element => {
          element.x += (element as any).vx
          element.y += (element as any).vy

          // Rebond sur les bords
          if (element.x <= 0 || element.x >= this.app!.screen.width - 50) {
            (element as any).vx *= -1
          }
          if (element.y <= 0 || element.y >= this.app!.screen.height - 50) {
            (element as any).vy *= -1
          }
        })

        const currentTime = performance.now()
        const deltaTime = currentTime - this.lastFrameTime
        
        if (deltaTime > 0) {
          const fps = 1000 / deltaTime
          this.fpsHistory.push(fps)
          
          result.minFps = Math.min(result.minFps, fps)
          result.maxFps = Math.max(result.maxFps, fps)
        }

        this.lastFrameTime = currentTime
        this.frameCount++

        // Vérifier si le test est terminé
        if (currentTime - this.startTime >= options.duration) {
          this.isRunning = false
          ticker.remove(testTick)

          // Calculer les résultats
          result.averageFps = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length
          result.fps = result.averageFps
          result.memoryUsage = this.getMemoryUsage()

          resolve()
        }
      }

      ticker.add(testTick)
    })
  }

  // Obtenir l'utilisation mémoire
  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / (1024 * 1024) // MB
    }
    return 0
  }

  // Nettoyer les ressources de test
  private cleanup() {
    if (this.testContainer && this.app) {
      this.app.stage.removeChild(this.testContainer)
      this.testContainer.destroy({ children: true })
      this.testContainer = null
    }
    this.isRunning = false
  }
}

// Fonction utilitaire pour exécuter tous les tests
export async function runAllPerformanceTests(app: Application): Promise<PerformanceTestResult[]> {
  const tester = new PerformanceTest(app)
  const results: PerformanceTestResult[] = []

  console.log('🚀 Démarrage des tests de performance PixiJS...')

  // Test compatibilité
  const compatibility = await tester.testBrowserCompatibility()
  console.log('Compatibilité navigateur:', compatibility)

  // Test 100 éléments
  console.log('Test 1: 100 éléments statiques...')
  const test1 = await tester.testManyElements({ duration: 5000, elementsCount: 100, updateFrequency: 16 })
  results.push(test1)

  // Test 200 éléments
  console.log('Test 2: 200 éléments statiques...')
  const test2 = await tester.testManyElements({ duration: 5000, elementsCount: 200, updateFrequency: 16 })
  results.push(test2)

  // Test drag & drop
  console.log('Test 3: Drag & Drop avec 50 éléments...')
  const test3 = await tester.testDragAndDrop({ duration: 5000, elementsCount: 50, updateFrequency: 16 })
  results.push(test3)

  console.log('✅ Tests de performance terminés')
  return results
}
