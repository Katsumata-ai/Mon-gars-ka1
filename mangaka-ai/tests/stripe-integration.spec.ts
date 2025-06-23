import { test, expect } from '@playwright/test'

test.describe('Intégration Stripe - Mangaka AI', () => {
  test.beforeEach(async ({ page }) => {
    // Aller à la page d'accueil
    await page.goto('/')
  })

  test('Affichage des plans tarifaires', async ({ page }) => {
    // Vérifier que la section pricing est visible
    await expect(page.locator('#pricing')).toBeVisible()
    
    // Vérifier que les plans sont affichés
    await expect(page.locator('text=Mangaka Junior')).toBeVisible()
    await expect(page.locator('text=Mangaka Senior')).toBeVisible()

    // Vérifier les prix
    await expect(page.locator('text=0€')).toBeVisible() // Plan gratuit
    await expect(page.locator('text=25€')).toBeVisible() // Plan Senior mensuel
    await expect(page.locator('text=80€')).toBeVisible() // Plan Senior annuel
  })

  test('CTA Hero Section - Utilisateur non connecté', async ({ page }) => {
    // Vérifier que le bouton "Commencer" est visible
    const ctaButton = page.locator('button:has-text("Commencer")')
    await expect(ctaButton).toBeVisible()
    
    // Cliquer sur le bouton devrait rediriger vers signup ou ouvrir Stripe
    await ctaButton.click()
    
    // Attendre la redirection ou l'ouverture d'un nouvel onglet
    await page.waitForTimeout(1000)
  })

  test('Boutons de pricing - Plan gratuit', async ({ page }) => {
    // Aller à la section pricing
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    
    // Trouver le bouton "Essayer gratuitement" du plan Junior
    const freeButton = page.locator('button:has-text("Essayer gratuitement")').first()
    await expect(freeButton).toBeVisible()
    
    // Cliquer devrait rediriger vers signup
    await freeButton.click()
    await page.waitForTimeout(1000)
  })

  test('Boutons de pricing - Plans payants', async ({ page }) => {
    // Aller à la section pricing
    await page.locator('#pricing').scrollIntoViewIfNeeded()

    // Trouver le bouton "Commencer maintenant" du plan Senior
    const seniorButton = page.locator('button:has-text("Commencer maintenant")').first()
    await expect(seniorButton).toBeVisible()

    // Cliquer devrait ouvrir Stripe dans un nouvel onglet
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      seniorButton.click()
    ])

    // Vérifier que la nouvelle page est bien Stripe
    await newPage.waitForLoadState()
    expect(newPage.url()).toContain('buy.stripe.com')

    await newPage.close()
  })

  test('Navigation - Liens vers pricing', async ({ page }) => {
    // Vérifier que les liens vers pricing fonctionnent
    const pricingLinks = page.locator('a[href="#pricing"]')
    const firstLink = pricingLinks.first()
    
    if (await firstLink.isVisible()) {
      await firstLink.click()
      await page.waitForTimeout(500)
      
      // Vérifier que la section pricing est visible
      await expect(page.locator('#pricing')).toBeInViewport()
    }
  })

  test('Toggle mensuel/annuel', async ({ page }) => {
    // Aller à la section pricing
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    
    // Vérifier que le toggle est visible
    const monthlyButton = page.locator('button:has-text("Mensuel")')
    const yearlyButton = page.locator('button:has-text("Annuel")')
    
    await expect(monthlyButton).toBeVisible()
    await expect(yearlyButton).toBeVisible()
    
    // Cliquer sur annuel
    await yearlyButton.click()
    await page.waitForTimeout(500)
    
    // Vérifier que les prix ont changé pour l'offre annuelle
    await expect(page.locator('text=80€')).toBeVisible() // Senior annuel
    await expect(page.locator('text=Offre spéciale de lancement')).toBeVisible() // Message promo

    // Revenir au mensuel
    await monthlyButton.click()
    await page.waitForTimeout(500)

    // Vérifier que les prix sont revenus
    await expect(page.locator('text=25€')).toBeVisible()
  })

  test('Responsive design - Mobile', async ({ page }) => {
    // Tester en mode mobile
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Vérifier que la section pricing est toujours accessible
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    await expect(page.locator('#pricing')).toBeVisible()
    
    // Vérifier que les boutons sont cliquables
    const buttons = page.locator('button:has-text("Commencer")')
    const firstButton = buttons.first()
    await expect(firstButton).toBeVisible()
    
    // Vérifier que le layout est adapté
    const pricingCards = page.locator('[class*="grid"]').first()
    await expect(pricingCards).toBeVisible()
  })

  test('Accessibilité - Navigation clavier', async ({ page }) => {
    // Tester la navigation au clavier
    await page.keyboard.press('Tab')
    
    // Naviguer jusqu'aux boutons de pricing
    let tabCount = 0
    while (tabCount < 20) {
      await page.keyboard.press('Tab')
      tabCount++
      
      // Vérifier si on a atteint un bouton de pricing
      const focusedElement = page.locator(':focus')
      const text = await focusedElement.textContent()
      
      if (text?.includes('Commencer') || text?.includes('Essayer')) {
        // Appuyer sur Entrée pour activer
        await page.keyboard.press('Enter')
        await page.waitForTimeout(1000)
        break
      }
    }
  })

  test('Performance - Temps de chargement', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    
    // Vérifier que la page se charge en moins de 3 secondes
    expect(loadTime).toBeLessThan(3000)
    
    // Vérifier que les éléments critiques sont visibles
    await expect(page.locator('text=MANGAKA AI')).toBeVisible()
    await expect(page.locator('#pricing')).toBeVisible()
  })

  test('Gestion des erreurs - Liens Stripe invalides', async ({ page }) => {
    // Simuler une erreur réseau ou un lien invalide
    await page.route('**/buy.stripe.com/**', route => {
      route.abort()
    })
    
    // Aller à la section pricing
    await page.locator('#pricing').scrollIntoViewIfNeeded()
    
    // Cliquer sur un bouton payant
    const proButton = page.locator('button:has-text("Commencer maintenant")').first()
    await proButton.click()
    
    // Vérifier qu'il n'y a pas d'erreur JavaScript critique
    const errors: string[] = []
    page.on('pageerror', error => {
      errors.push(error.message)
    })
    
    await page.waitForTimeout(2000)
    
    // Les erreurs de réseau sont acceptables, mais pas les erreurs JS
    const jsErrors = errors.filter(error => 
      !error.includes('net::') && !error.includes('Failed to fetch')
    )
    expect(jsErrors).toHaveLength(0)
  })
})
