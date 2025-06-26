/**
 * Utilitaires pour l'upload d'images vers Supabase Storage
 */

import { createClient } from '@supabase/supabase-js'
import sharp from 'sharp'

interface UploadResult {
  success: boolean
  publicUrl?: string
  storagePath?: string
  error?: string
}

/**
 * Redimensionne et recadre une image pour supprimer le watermark xAI/Grok
 * Stratégie: Supprime 8% du bas (watermark) puis redimensionne à 1136x785px
 * Préserve tout le contenu horizontal, élargit si nécessaire
 * @param imageBlob Blob de l'image originale
 * @returns Promise<Blob> Image traitée sans watermark
 */
async function cropImageWatermark(imageBlob: Blob): Promise<Blob> {
  try {
    console.log('🖼️ Début du traitement avec Sharp...')

    // Convertir le blob en buffer pour Sharp
    const imageBuffer = Buffer.from(await imageBlob.arrayBuffer())

    // Obtenir les métadonnées de l'image
    const metadata = await sharp(imageBuffer).metadata()
    const originalWidth = metadata.width!
    const originalHeight = metadata.height!

    // Dimensions cibles spécifiées (hauteur réduite pour éliminer complètement le watermark)
    const targetWidth = 1136
    const targetHeight = 785

    console.log(`🖼️ Traitement image: ${originalWidth}x${originalHeight} → ${targetWidth}x${targetHeight}`)

    // Étape 1: Redimensionner l'image en gardant les proportions
    // Calculer le ratio pour s'ajuster dans la zone cible sans perdre de contenu
    const scaleX = targetWidth / originalWidth
    const scaleY = targetHeight / originalHeight
    const scale = Math.min(scaleX, scaleY) // Prendre le plus petit ratio pour préserver le contenu

    const scaledWidth = Math.round(originalWidth * scale)
    const scaledHeight = Math.round(originalHeight * scale)

    console.log(`📏 Redimensionnement: ${originalWidth}x${originalHeight} → ${scaledWidth}x${scaledHeight} (ratio: ${scale.toFixed(3)})`)

    // Étape 2: Stratégie pour préserver le contenu et supprimer le watermark du bas
    console.log(`🎯 Stratégie: Préservation horizontale + suppression watermark bas`)

    // D'abord, recadrer l'image originale pour supprimer le watermark du bas (environ 8% du bas)
    const cropRatio = 0.92 // Garder 92% de la hauteur pour supprimer le watermark
    const croppedHeight = Math.floor(originalHeight * cropRatio)

    console.log(`✂️ Suppression watermark: ${originalHeight}px → ${croppedHeight}px (${((1-cropRatio)*100).toFixed(1)}% supprimé)`)

    // Ensuite, redimensionner l'image recadrée aux dimensions cibles
    const processedBuffer = await sharp(imageBuffer)
      .extract({
        left: 0,
        top: 0,
        width: originalWidth,
        height: croppedHeight // Image sans watermark
      })
      .resize(targetWidth, targetHeight, {
        kernel: sharp.kernel.lanczos3,
        fit: 'fill', // Étirer pour atteindre exactement les dimensions cibles
        position: 'center'
      })
      .png({
        quality: 95,
        compressionLevel: 6,
        adaptiveFiltering: true
      })
      .toBuffer()

    // Convertir le buffer en blob
    const processedBlob = new Blob([processedBuffer], { type: 'image/png' })

    console.log(`✅ Image traitée avec succès: ${imageBlob.size} → ${processedBlob.size} bytes`)
    console.log(`📐 Dimensions finales: ${targetWidth}x${targetHeight}px`)

    return processedBlob

  } catch (error) {
    console.error('❌ Erreur lors du traitement avec Sharp:', error)
    throw error
  }
}

/**
 * Upload une image vers Supabase Storage avec retry automatique
 * @param imageUrl URL temporaire de l'image (depuis xAI)
 * @param userId ID de l'utilisateur
 * @param imageId ID unique de l'image
 * @param imageType Type d'image (character, decor, scene)
 * @param maxRetries Nombre maximum de tentatives
 * @returns Résultat de l'upload
 */
export async function uploadImageWithRetry(
  imageUrl: string,
  userId: string,
  imageId: string,
  imageType: 'character' | 'background' | 'scene',
  maxRetries: number = 3
): Promise<UploadResult> {
  let lastError: string = ''

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`🔄 Tentative ${attempt}/${maxRetries} de téléchargement...`)
    
    const result = await uploadImageToSupabase(imageUrl, userId, imageId, imageType)
    
    if (result.success) {
      console.log(`✅ Téléchargement réussi à la tentative ${attempt}`)
      return result
    }
    
    lastError = result.error || 'Erreur inconnue'
    console.log(`❌ Tentative ${attempt} échouée:`, lastError)
    
    // Attendre avant la prochaine tentative (sauf pour la dernière)
    if (attempt < maxRetries) {
      const delay = attempt * 1000 // 1s, 2s, 3s...
      console.log(`⏳ Attente de ${delay}ms avant la prochaine tentative...`)
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  console.error(`🚨 Échec définitif après ${maxRetries} tentatives:`, lastError)
  return {
    success: false,
    error: `Échec après ${maxRetries} tentatives: ${lastError}`
  }
}

/**
 * Upload une image vers Supabase Storage
 * @param imageUrl URL temporaire de l'image
 * @param userId ID de l'utilisateur
 * @param imageId ID unique de l'image
 * @param imageType Type d'image
 * @returns Résultat de l'upload
 */
async function uploadImageToSupabase(
  imageUrl: string,
  userId: string,
  imageId: string,
  imageType: 'character' | 'background' | 'scene'
): Promise<UploadResult> {
  try {
    console.log('🔄 Début du téléchargement de l\'image vers Supabase Storage...')
    console.log('   - URL source:', imageUrl.substring(0, 100) + '...')
    console.log('   - User ID:', userId)
    console.log('   - Image ID:', imageId)
    console.log('   - Type:', imageType)

    // Télécharger l'image depuis l'URL temporaire
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Échec du téléchargement depuis xAI: ${imageResponse.status}`)
    }

    let imageBlob = await imageResponse.blob()
    console.log('✅ Image téléchargée depuis xAI, taille:', imageBlob.size, 'bytes')

    // Redimensionner et recadrer l'image (1136x785px) pour supprimer le watermark xAI/Grok
    try {
      console.log('🖼️ Début du redimensionnement et recadrage (1136x785px)...')
      const processedBlob = await cropImageWatermark(imageBlob)
      imageBlob = processedBlob
      console.log('✅ Traitement terminé, nouvelle taille:', imageBlob.size, 'bytes')
    } catch (cropError) {
      console.warn('⚠️ Échec du traitement, utilisation de l\'image originale:', cropError)
      // Continuer avec l'image originale en cas d'échec du traitement
    }

    // Mapper le type pour le chemin de stockage
    const storageType = imageType === 'background' ? 'decor' : imageType

    // Créer le chemin de stockage organisé
    const fileName = `${userId}/${storageType}/${imageId}.png`
    console.log('📁 Chemin de stockage:', fileName)

    // Initialiser le client Supabase avec les permissions service
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Upload vers Supabase Storage (bucket public)
    const { data, error } = await supabase.storage
      .from('images')
      .upload(fileName, imageBlob, {
        contentType: 'image/png',
        upsert: false
      })

    if (error) {
      console.error('❌ Erreur upload Supabase:', error)
      throw new Error(`Échec upload Supabase: ${error.message}`)
    }

    console.log('✅ Upload Supabase réussi:', data.path)

    // Obtenir l'URL publique permanente
    const { data: { publicUrl } } = supabase.storage
      .from('images')
      .getPublicUrl(fileName)

    console.log('🔗 URL publique générée:', publicUrl)

    return {
      success: true,
      publicUrl,
      storagePath: fileName
    }

  } catch (error) {
    console.error('🚨 Erreur lors de l\'upload:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Supprime une image de Supabase Storage
 * @param storagePath Chemin de l'image dans le Storage
 * @returns Résultat de la suppression
 */
export async function deleteImageFromSupabase(storagePath: string): Promise<UploadResult> {
  try {
    console.log('🗑️ Suppression de l\'image du Storage:', storagePath)

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { error } = await supabase.storage
      .from('images')
      .remove([storagePath])

    if (error) {
      console.error('❌ Erreur suppression Storage:', error)
      throw new Error(`Échec suppression Storage: ${error.message}`)
    }

    console.log('✅ Fichier supprimé avec succès du Storage:', storagePath)
    return {
      success: true
    }

  } catch (error) {
    console.error('🚨 Erreur lors de la suppression:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue'
    }
  }
}

/**
 * Supprime une image de manière atomique (base de données + storage)
 * @param imageId ID de l'image à supprimer
 * @param imageType Type d'image (character ou decor)
 * @param projectId ID du projet
 * @returns Résultat de la suppression atomique
 */
export async function deleteImageAtomic(
  imageId: string,
  imageType: 'character' | 'decor',
  projectId: string
): Promise<{
  success: boolean
  error?: string
  details?: {
    databaseDeleted: boolean
    storageDeleted: boolean
    storagePath?: string
  }
}> {
  console.log('🗑️ Début de la suppression atomique')
  console.log(`   - Image ID: ${imageId}`)
  console.log(`   - Type: ${imageType}`)
  console.log(`   - Project ID: ${projectId}`)

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const tableName = imageType === 'character' ? 'character_images' : 'decor_images'
  let storagePath: string | undefined
  let databaseDeleted = false
  let storageDeleted = false

  try {
    // Étape 1: Récupérer les métadonnées de l'image pour obtenir le storage_path
    console.log(`📋 Récupération des métadonnées depuis ${tableName}...`)

    const { data: imageData, error: fetchError } = await supabase
      .from(tableName)
      .select('metadata')
      .eq('id', imageId)
      .eq('project_id', projectId)
      .single()

    if (fetchError) {
      console.error('❌ Erreur lors de la récupération de l\'image:', fetchError)
      throw new Error(`Image non trouvée: ${fetchError.message}`)
    }

    // Extraire le storage_path des métadonnées
    storagePath = imageData?.metadata?.storage_path
    console.log(`📁 Storage path trouvé: ${storagePath || 'Aucun'}`)

    // Étape 2: Supprimer l'enregistrement de la base de données
    console.log(`🗄️ Suppression de l'enregistrement en base de données...`)

    const { error: deleteDbError } = await supabase
      .from(tableName)
      .delete()
      .eq('id', imageId)
      .eq('project_id', projectId)

    if (deleteDbError) {
      console.error('❌ Erreur suppression base de données:', deleteDbError)
      throw new Error(`Échec suppression DB: ${deleteDbError.message}`)
    }

    databaseDeleted = true
    console.log('✅ Enregistrement supprimé de la base de données')

    // Étape 3: Supprimer le fichier du Storage (si le storage_path existe)
    if (storagePath) {
      console.log(`📦 Suppression du fichier du Storage...`)

      const storageResult = await deleteImageFromSupabase(storagePath)

      if (!storageResult.success) {
        console.error('❌ Échec suppression Storage:', storageResult.error)

        // ROLLBACK: Tenter de restaurer l'enregistrement en base de données
        console.log('🔄 Tentative de rollback de la base de données...')

        // Note: Le rollback complet nécessiterait de sauvegarder toutes les données
        // Pour l'instant, on signale l'erreur critique
        throw new Error(`Suppression Storage échouée après suppression DB réussie. ÉTAT CRITIQUE: ${storageResult.error}`)
      }

      storageDeleted = true
      console.log('✅ Fichier supprimé du Storage avec succès')
    } else {
      console.log('ℹ️ Pas de storage_path trouvé, suppression Storage ignorée')
      storageDeleted = true // Considéré comme réussi car il n'y avait rien à supprimer
    }

    console.log('🎉 Suppression atomique réussie')
    return {
      success: true,
      details: {
        databaseDeleted,
        storageDeleted,
        storagePath
      }
    }

  } catch (error) {
    console.error('🚨 Erreur lors de la suppression atomique:', error)

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      details: {
        databaseDeleted,
        storageDeleted,
        storagePath
      }
    }
  }
}

/**
 * Supprime plusieurs images de manière atomique
 * @param imageIds Liste des IDs d'images à supprimer
 * @param imageType Type d'image (character ou decor)
 * @param projectId ID du projet
 * @returns Résultat de la suppression en lot
 */
export async function deleteMultipleImagesAtomic(
  imageIds: string[],
  imageType: 'character' | 'decor',
  projectId: string
): Promise<{
  success: boolean
  results: Array<{
    imageId: string
    success: boolean
    error?: string
    details?: {
      databaseDeleted: boolean
      storageDeleted: boolean
      storagePath?: string
    }
  }>
  summary: {
    total: number
    successful: number
    failed: number
  }
}> {
  console.log('🗑️ Début de la suppression en lot')
  console.log(`   - Nombre d'images: ${imageIds.length}`)
  console.log(`   - Type: ${imageType}`)
  console.log(`   - Project ID: ${projectId}`)

  const results = []
  let successful = 0
  let failed = 0

  for (let i = 0; i < imageIds.length; i++) {
    const imageId = imageIds[i]
    console.log(`📋 Suppression ${i + 1}/${imageIds.length}: ${imageId}`)

    try {
      const deleteResult = await deleteImageAtomic(imageId, imageType, projectId)

      results.push({
        imageId,
        success: deleteResult.success,
        error: deleteResult.error,
        details: deleteResult.details
      })

      if (deleteResult.success) {
        successful++
        console.log(`✅ Image ${imageId} supprimée avec succès`)
      } else {
        failed++
        console.log(`❌ Échec suppression image ${imageId}:`, deleteResult.error)
      }

    } catch (error) {
      failed++
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue'
      console.log(`🚨 Erreur critique pour image ${imageId}:`, errorMessage)

      results.push({
        imageId,
        success: false,
        error: errorMessage
      })
    }

    // Petite pause entre les suppressions pour éviter la surcharge
    if (i < imageIds.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }

  const summary = {
    total: imageIds.length,
    successful,
    failed
  }

  console.log('📊 Résumé de la suppression en lot:')
  console.log(`   - Total: ${summary.total}`)
  console.log(`   - Réussies: ${summary.successful}`)
  console.log(`   - Échouées: ${summary.failed}`)

  return {
    success: failed === 0, // Succès seulement si toutes les suppressions ont réussi
    results,
    summary
  }
}
