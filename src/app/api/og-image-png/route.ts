import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    // Créer une image PNG simple avec du HTML/CSS converti
    const html = `
      <div style="
        width: 1200px;
        height: 630px;
        background: linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%);
        display: flex;
        align-items: center;
        padding: 60px;
        font-family: Arial, sans-serif;
        position: relative;
        overflow: hidden;
      ">
        <!-- Decorative circles -->
        <div style="
          position: absolute;
          top: 50px;
          left: 50px;
          width: 100px;
          height: 100px;
          background: #EF4444;
          border-radius: 50%;
          opacity: 0.3;
        "></div>
        
        <div style="
          position: absolute;
          bottom: 100px;
          right: 100px;
          width: 160px;
          height: 160px;
          background: #F87171;
          border-radius: 50%;
          opacity: 0.2;
        "></div>
        
        <div style="
          position: absolute;
          top: 100px;
          right: 150px;
          width: 60px;
          height: 60px;
          background: #FCA5A5;
          border-radius: 50%;
          opacity: 0.4;
        "></div>

        <!-- Main content -->
        <div style="display: flex; align-items: center; gap: 60px;">
          <!-- Logo -->
          <div style="
            width: 120px;
            height: 120px;
            background: white;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 48px;
            font-weight: 900;
            color: #DC2626;
            flex-shrink: 0;
          ">M</div>
          
          <!-- Text content -->
          <div style="color: white;">
            <h1 style="
              font-size: 72px;
              font-weight: 900;
              margin: 0 0 20px 0;
              background: linear-gradient(90deg, #FFFFFF 0%, #FEF2F2 100%);
              -webkit-background-clip: text;
              -webkit-text-fill-color: transparent;
              background-clip: text;
            ">MANGAKA AI</h1>
            
            <h2 style="
              font-size: 36px;
              font-weight: 600;
              margin: 0 0 20px 0;
              color: #FEF2F2;
            ">Create manga without knowing how to draw</h2>
            
            <p style="
              font-size: 24px;
              font-weight: 400;
              margin: 0;
              color: #FCA5A5;
            ">The AI that transforms your ideas into professional manga stories</p>
          </div>
        </div>
        
        <!-- Decorative elements -->
        <div style="
          position: absolute;
          top: 150px;
          right: 200px;
          width: 0;
          height: 0;
          border-left: 25px solid transparent;
          border-right: 25px solid transparent;
          border-bottom: 40px solid rgba(255, 255, 255, 0.8);
          transform: rotate(45deg);
        "></div>
        
        <div style="
          position: absolute;
          bottom: 200px;
          right: 180px;
          width: 0;
          height: 0;
          border-left: 20px solid transparent;
          border-right: 20px solid transparent;
          border-bottom: 30px solid rgba(255, 255, 255, 0.6);
          transform: rotate(-30deg);
        "></div>
      </div>
    `

    // Pour l'instant, retournons le SVG existant en tant que PNG
    // Dans un vrai environnement, on utiliserait puppeteer ou une autre solution
    return new NextResponse('PNG generation not implemented yet', { 
      status: 501,
      headers: {
        'Content-Type': 'text/plain'
      }
    })
    
  } catch (error) {
    console.error('Erreur génération PNG:', error)
    return new NextResponse('Error generating PNG', { status: 500 })
  }
}
