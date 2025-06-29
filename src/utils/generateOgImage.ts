// Utility to generate OG image as PNG using Canvas API
export function generateOgImagePNG(): string {
  // Create canvas
  const canvas = document.createElement('canvas')
  canvas.width = 1200
  canvas.height = 630
  const ctx = canvas.getContext('2d')!

  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630)
  gradient.addColorStop(0, '#DC2626')
  gradient.addColorStop(0.5, '#B91C1C')
  gradient.addColorStop(1, '#991B1B')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 1200, 630)

  // Decorative elements
  ctx.globalAlpha = 0.3
  ctx.fillStyle = '#EF4444'
  ctx.beginPath()
  ctx.arc(100, 100, 50, 0, 2 * Math.PI)
  ctx.fill()

  ctx.globalAlpha = 0.2
  ctx.fillStyle = '#F87171'
  ctx.beginPath()
  ctx.arc(1100, 530, 80, 0, 2 * Math.PI)
  ctx.fill()

  ctx.globalAlpha = 0.4
  ctx.fillStyle = '#FCA5A5'
  ctx.beginPath()
  ctx.arc(1050, 150, 30, 0, 2 * Math.PI)
  ctx.fill()

  ctx.globalAlpha = 1

  // Main logo circle
  ctx.globalAlpha = 0.1
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(200, 315, 80, 0, 2 * Math.PI)
  ctx.fill()

  ctx.globalAlpha = 1
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(200, 315, 60, 0, 2 * Math.PI)
  ctx.fill()

  // Logo "M"
  ctx.fillStyle = '#DC2626'
  ctx.font = 'bold 48px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('M', 200, 315)

  // Main title
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 72px Arial'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'
  ctx.fillText('MANGAKA AI', 320, 220)

  // Subtitle
  ctx.fillStyle = '#FEF2F2'
  ctx.font = '600 36px Arial'
  ctx.fillText('Create manga without knowing how to draw', 320, 310)

  // Description
  ctx.fillStyle = '#FCA5A5'
  ctx.font = '400 24px Arial'
  ctx.fillText('The AI that transforms your ideas into professional manga stories', 320, 370)

  // Decorative elements
  ctx.globalAlpha = 0.8
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.moveTo(900, 200)
  ctx.lineTo(950, 180)
  ctx.lineTo(980, 220)
  ctx.lineTo(940, 240)
  ctx.closePath()
  ctx.fill()

  ctx.globalAlpha = 0.6
  ctx.beginPath()
  ctx.moveTo(920, 400)
  ctx.lineTo(970, 380)
  ctx.lineTo(1000, 420)
  ctx.lineTo(960, 440)
  ctx.closePath()
  ctx.fill()

  // Speed lines
  ctx.globalAlpha = 0.3
  ctx.strokeStyle = '#FFFFFF'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(850, 100)
  ctx.lineTo(1100, 50)
  ctx.stroke()

  ctx.globalAlpha = 0.2
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(850, 120)
  ctx.lineTo(1080, 80)
  ctx.stroke()

  ctx.globalAlpha = 0.1
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(850, 140)
  ctx.lineTo(1060, 110)
  ctx.stroke()

  ctx.globalAlpha = 0.3
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(850, 500)
  ctx.lineTo(1100, 550)
  ctx.stroke()

  ctx.globalAlpha = 0.2
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(850, 520)
  ctx.lineTo(1080, 570)
  ctx.stroke()

  ctx.globalAlpha = 0.1
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.moveTo(850, 540)
  ctx.lineTo(1060, 590)
  ctx.stroke()

  // Convert to PNG data URL
  return canvas.toDataURL('image/png', 0.9)
}
