// Tests E2E pour le workflow complet de gestion des pages
import { test, expect, Page } from '@playwright/test'

test.describe('Workflow Gestion des Pages - E2E', () => {
  let page: Page

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage()
    
    // Naviguer vers l'application
    await page.goto('/projects/test-project/assembly')
    
    // Attendre que l'interface soit chargée
    await page.waitForSelector('[data-testid="assembly-canvas"]')
    await page.waitForSelector('[data-testid="pages-sidebar"]')
  })

  test.afterEach(async () => {
    await page.close()
  })

  test('Workflow complet : Créer, modifier, dupliquer et supprimer des pages', async () => {
    // 1. Vérifier l'état initial
    await expect(page.locator('[data-testid="page-count"]')).toHaveText('1')
    await expect(page.locator('[data-testid="current-page-number"]')).toHaveText('1')

    // 2. Ajouter une nouvelle page
    await page.click('[data-testid="add-page-button"]')
    await page.waitForSelector('[data-testid="page-2"]')
    
    await expect(page.locator('[data-testid="page-count"]')).toHaveText('2')
    await expect(page.locator('[data-testid="current-page-number"]')).toHaveText('2')

    // 3. Ajouter des éléments à la page 2
    await page.click('[data-testid="panel-tool"]')
    await page.click('[data-testid="assembly-canvas"]', { position: { x: 200, y: 200 } })
    
    // Vérifier qu'un panel a été ajouté
    await expect(page.locator('[data-testid="assembly-element"]')).toHaveCount(1)

    // 4. Revenir à la page 1
    await page.click('[data-testid="page-1"]')
    await expect(page.locator('[data-testid="current-page-number"]')).toHaveText('1')
    
    // Vérifier que la page 1 est vide (pas d'éléments)
    await expect(page.locator('[data-testid="assembly-element"]')).toHaveCount(0)

    // 5. Retourner à la page 2 et vérifier que les éléments sont préservés
    await page.click('[data-testid="page-2"]')
    await expect(page.locator('[data-testid="current-page-number"]')).toHaveText('2')
    await expect(page.locator('[data-testid="assembly-element"]')).toHaveCount(1)

    // 6. Dupliquer la page 2
    await page.click('[data-testid="page-2-menu"]')
    await page.click('[data-testid="duplicate-page"]')
    await page.waitForSelector('[data-testid="page-3"]')
    
    await expect(page.locator('[data-testid="page-count"]')).toHaveText('3')
    await expect(page.locator('[data-testid="current-page-number"]')).toHaveText('3')
    
    // Vérifier que les éléments ont été copiés
    await expect(page.locator('[data-testid="assembly-element"]')).toHaveCount(1)

    // 7. Supprimer la page 2
    await page.click('[data-testid="page-2"]')
    await page.click('[data-testid="page-2-menu"]')
    await page.click('[data-testid="delete-page"]')
    
    // Confirmer la suppression
    await page.click('[data-testid="confirm-delete"]')
    
    // Vérifier la renumérotation intelligente
    await expect(page.locator('[data-testid="page-count"]')).toHaveText('2')
    await expect(page.locator('[data-testid="page-3"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="page-2"]')).toBeVisible() // L'ancienne page 3 devient page 2

    // 8. Vérifier que la page courante a été ajustée
    await expect(page.locator('[data-testid="current-page-number"]')).toHaveText('2')
    await expect(page.locator('[data-testid="assembly-element"]')).toHaveCount(1)
  })

  test('Persistance de l\'état canvas entre changements de menu', async () => {
    // 1. Configurer l'état du canvas
    await page.click('[data-testid="zoom-25"]')
    await page.click('[data-testid="grid-toggle"]')
    
    // Ajouter un élément
    await page.click('[data-testid="text-tool"]')
    await page.click('[data-testid="assembly-canvas"]', { position: { x: 300, y: 300 } })
    await page.fill('[data-testid="text-input"]', 'Test persistance')
    await page.press('[data-testid="text-input"]', 'Enter')

    // 2. Changer vers le menu script
    await page.click('[data-testid="script-tab"]')
    await page.waitForSelector('[data-testid="script-editor"]')

    // 3. Revenir au menu assemblage
    await page.click('[data-testid="assembly-tab"]')
    await page.waitForSelector('[data-testid="assembly-canvas"]')

    // 4. Vérifier que l'état est restauré
    await expect(page.locator('[data-testid="zoom-level"]')).toHaveText('25%')
    await expect(page.locator('[data-testid="grid-toggle"]')).toHaveClass(/active/)
    await expect(page.locator('[data-testid="assembly-element"]')).toHaveCount(1)
    await expect(page.locator('[data-testid="text-element"]')).toHaveText('Test persistance')
  })

  test('Performance des changements de page', async () => {
    // Créer plusieurs pages avec du contenu
    for (let i = 2; i <= 5; i++) {
      await page.click('[data-testid="add-page-button"]')
      await page.waitForSelector(`[data-testid="page-${i}"]`)
      
      // Ajouter du contenu à chaque page
      await page.click('[data-testid="panel-tool"]')
      for (let j = 0; j < 3; j++) {
        await page.click('[data-testid="assembly-canvas"]', { 
          position: { x: 100 + j * 150, y: 100 + j * 100 } 
        })
      }
    }

    // Mesurer les temps de changement de page
    const changeTimes: number[] = []
    
    for (let i = 1; i <= 5; i++) {
      const startTime = Date.now()
      await page.click(`[data-testid="page-${i}"]`)
      await page.waitForSelector(`[data-testid="current-page-number"]:has-text("${i}")`)
      const endTime = Date.now()
      
      changeTimes.push(endTime - startTime)
    }

    // Vérifier que tous les changements sont sous 200ms
    const averageTime = changeTimes.reduce((a, b) => a + b, 0) / changeTimes.length
    expect(averageTime).toBeLessThan(200)
    
    console.log(`Temps moyen de changement de page: ${averageTime.toFixed(2)}ms`)
    console.log(`Temps individuels: ${changeTimes.map(t => t.toFixed(2)).join(', ')}ms`)
  })

  test('Sauvegarde automatique et manuelle', async () => {
    // 1. Ajouter du contenu
    await page.click('[data-testid="panel-tool"]')
    await page.click('[data-testid="assembly-canvas"]', { position: { x: 200, y: 200 } })

    // 2. Vérifier l'indicateur de sauvegarde automatique
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toBeVisible()
    await expect(page.locator('[data-testid="auto-save-indicator"]')).toHaveText(/Sauvegardé/)

    // 3. Déclencher une sauvegarde manuelle
    await page.click('[data-testid="save-button"]')
    await expect(page.locator('[data-testid="save-status"]')).toHaveText('Sauvegardé')

    // 4. Vérifier que les données persistent après rechargement
    await page.reload()
    await page.waitForSelector('[data-testid="assembly-canvas"]')
    
    await expect(page.locator('[data-testid="assembly-element"]')).toHaveCount(1)
  })

  test('Gestion des erreurs réseau', async () => {
    // Simuler une panne réseau
    await page.route('**/api/projects/*/pages/**', route => {
      route.abort('failed')
    })

    // Tenter d'ajouter une page
    await page.click('[data-testid="add-page-button"]')
    
    // Vérifier qu'un message d'erreur s'affiche
    await expect(page.locator('[data-testid="error-toast"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-toast"]')).toHaveText(/Erreur de connexion/)

    // Vérifier que l'état local n'est pas corrompu
    await expect(page.locator('[data-testid="page-count"]')).toHaveText('1')
    await expect(page.locator('[data-testid="current-page-number"]')).toHaveText('1')

    // Restaurer la connexion
    await page.unroute('**/api/projects/*/pages/**')
    
    // Réessayer l'opération
    await page.click('[data-testid="retry-button"]')
    await page.waitForSelector('[data-testid="page-2"]')
    
    await expect(page.locator('[data-testid="page-count"]')).toHaveText('2')
  })

  test('Réorganisation des pages par drag & drop', async () => {
    // Créer 3 pages
    for (let i = 2; i <= 3; i++) {
      await page.click('[data-testid="add-page-button"]')
      await page.waitForSelector(`[data-testid="page-${i}"]`)
    }

    // Ajouter du contenu différent à chaque page pour les identifier
    for (let i = 1; i <= 3; i++) {
      await page.click(`[data-testid="page-${i}"]`)
      await page.click('[data-testid="text-tool"]')
      await page.click('[data-testid="assembly-canvas"]', { position: { x: 200, y: 200 } })
      await page.fill('[data-testid="text-input"]', `Page ${i} content`)
      await page.press('[data-testid="text-input"]', 'Enter')
    }

    // Réorganiser : déplacer page 3 en première position
    await page.dragAndDrop('[data-testid="page-3"]', '[data-testid="page-1"]')
    
    // Vérifier la nouvelle ordre
    await page.click('[data-testid="page-1"]')
    await expect(page.locator('[data-testid="text-element"]')).toHaveText('Page 3 content')
    
    await page.click('[data-testid="page-2"]')
    await expect(page.locator('[data-testid="text-element"]')).toHaveText('Page 1 content')
    
    await page.click('[data-testid="page-3"]')
    await expect(page.locator('[data-testid="text-element"]')).toHaveText('Page 2 content')
  })
})
