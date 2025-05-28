# Project Idea Pre-Writing Template
*For initializing the PRD "Streamlined Agentic AI Workflow" with the Agentic Agent*

**Creation Date:** 2024-12-19  
**Idea Author:** User/ProjectArchitect

## SECTION A: THE CORE IDEA
*Purpose: Capture the essence of the project for Sections 1.2 and 3.1 of the PRD*

### 1. Project Working Title

```
MANGAKA AI
```

### 2. The Idea in a Few Words (Pitch/Central Concept)

```
Une plateforme SaaS qui rend la création de manga accessible à n'importe qui grâce à la génération d'images IA, permettant aux jeunes passionnés de créer des manga/BD professionnels sans savoir dessiner.
```

### 3. Main Problem this Project Solves

```
Les jeunes passionnés de manga/BD ont des histoires créatives à raconter mais sont bloqués par leur incapacité à dessiner. Les outils de création existants nécessitent des compétences artistiques avancées, créant une barrière d'entrée énorme pour la création de contenu manga/BD de qualité.
```

### 4. Proposed Solution (How the Project Solves the Problem)

```
MANGAKA AI utilise l'IA générative (Xai Grok 2) avec des prompts internes optimisés pour créer des visuels manga/BD de qualité professionnelle. La plateforme combine génération d'images, assemblage de scènes, et un éditeur de pages type Canva pour créer des manga complets sans compétences en dessin.
```

## SECTION B: KEY FEATURES (INITIAL MVP)
*Purpose: Feed Section 3.1 of the PRD*

### 1. Essential Feature #1

- **Name:** Générateur d'Images Manga/BD Optimisé
- **Description (what the user can do):** Générer des personnages, décors et scènes avec des prompts simples, boostés par des prompts internes optimisés pour le style manga/BD
- **Key Result for the User:** Obtenir des visuels manga de qualité professionnelle sans compétences en dessin
- **Desired "Vibe"/Experience (Optional):** Magique, instantané, résultats impressionnants

### 2. Essential Feature #2

- **Name:** Créateur de Scènes Combinées
- **Description:** Combiner plusieurs personnages et décors générés en une seule scène cohérente via un prompt unifié
- **Key Result for the User:** Créer des scènes complexes et narratives facilement
- **Desired "Vibe"/Experience (Optional):** Fluide, intuitif, créatif

### 3. Essential Feature #3

- **Name:** Éditeur de Pages Manga (Type Canva)
- **Description:** Assembler des pages complètes avec cases, bulles de dialogue, et placement libre des images générées
- **Key Result for the User:** Créer des pages de manga professionnelles et publiables
- **Desired "Vibe"/Experience (Optional):** Professionnel, flexible, satisfaisant

### 4. Essential Feature #4

- **Name:** Script Editor
- **Description:** Écrire et organiser scènes, panels et dialogues dans un espace dédié pour structurer l'histoire
- **Key Result for the User:** Planifier et organiser efficacement son manga avant la création visuelle
- **Desired "Vibe"/Experience (Optional):** Organisé, inspirant, productif

## SECTION C: INITIAL DESIGN & TECHNOLOGY PREFERENCES
*Purpose: Guide AI proposals for Sections 1.10, 5.1, 5.2, 5.4 of the PRD*

### 1. General "Vibe" and Desired Aesthetics

```
Branding noir et rouge avec une esthétique manga/anime/comics mainstream. Interface moderne et dynamique qui évoque l'univers créatif du manga. Inspiration : mélange entre l'énergie visuelle de Crunchyroll et la fonctionnalité de Canva, avec des touches de rouge accent sur fond noir pour un look premium et créatif.
```

### 2. Primary Target Audience (First Intuition)

```
Jeunes créatifs (16-30 ans) passionnés de manga/anime qui ont des histoires à raconter mais manquent de compétences en dessin. Incluant les aspirants mangakas, créateurs de contenu, étudiants en art, et fans de manga qui veulent créer leurs propres histoires.
```

### 3. Technology Stack (If you have strong preferences or constraints)

```
Next.js pour le frontend avec une interface réactive et moderne
Supabase pour la base de données, authentification et stockage
Xai Grok 2 Image Gen API pour la génération d'images (coût : 0.07€/image)
Tailwind CSS pour le styling avec le thème noir/rouge
```

### 4. Anticipated Third-Party Integrations / MCPs (If clear ideas already exist)

```
- Xai API pour la génération d'images (budget : 150€ crédit gratuit/mois)
- Système de paiement pour les abonnements (Stripe)
- Stockage cloud pour les images générées (Supabase Storage)
- Possibles intégrations futures : export PDF, partage social, marketplace de créations
```

## SECTION D: INITIAL QUESTIONS FOR YOURSELF (AND FOR ROO LATER)
*Purpose: Anticipate points to explore further*

### 1. What are the biggest risks or uncertainties for this project at this stage?

```
- Gestion des coûts d'API (0.07€/image) vs modèle d'abonnement rentable
- Qualité et cohérence des images générées pour maintenir un style manga professionnel
- Adoption utilisateur dans un marché créatif compétitif
- Complexité technique de l'éditeur de pages type Canva
```

### 2. How could this project generate value (for users, for you/the company)?

```
Pour les utilisateurs : Démocratisation de la création manga, gain de temps énorme, possibilité de concrétiser leurs histoires
Pour l'entreprise : Modèle SaaS récurrent, marché de niche passionnée, potentiel de croissance avec la popularité croissante du manga
```

### 3. Are there any direct or indirect competitors that you already know of?

```
- Midjourney/DALL-E (génération d'images génériques)
- Comic Life (assemblage de BD basique)
- Canva (éditeur graphique général)
- Clip Studio Paint (outil professionnel complexe)
- Aucun concurrent direct combinant IA + spécialisation manga + éditeur intégré
```

### 4. On a scale of 1 to 10, how clear is this idea to you (1=very vague, 10=very clear)? Which aspects are the most unclear?

```
8/10 - L'idée est claire sur le concept et les fonctionnalités principales. 
Aspects moins clairs : 
- Stratégie de pricing optimale pour équilibrer coûts API et rentabilité
- Spécifications techniques exactes pour l'éditeur de pages
- Stratégie de go-to-market pour atteindre la cible jeune
```
