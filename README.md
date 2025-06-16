# 🎨 MANGAKA AI - Manga Creation Platform

**Transform your ideas into professional manga stories with AI-powered tools.**

## 🚀 Quick Start

```bash
# Navigate to the project
cd mangaka-ai

# Install dependencies
npm install

# Start development server
npm run dev
```

**🌐 Application URL:** http://localhost:3001

## ✨ Features

- **🤖 AI Image Generation** - Create characters, backgrounds, and scenes
- **🎭 Scene Creator** - Combine assets into cohesive scenes
- **📄 Page Editor** - Advanced canvas for manga page assembly
- **📝 Script Editor** - Organize your story with structured chapters
- **💳 Credit System** - Integrated freemium/pro model
- **🔐 Authentication** - Secure user management with Supabase

## 🛠️ Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Styling:** Tailwind CSS
- **Canvas:** Fabric.js, PixiJS
- **State Management:** Zustand
- **AI Integration:** Xai Grok 2 API

## 📱 Key Pages

- **Dashboard:** `/dashboard` - Project overview
- **Character Generator:** `/dashboard` - Create manga characters
- **Scene Creator:** `/dashboard` - Combine assets into scenes
- **Page Editor:** `/project/[id]/edit` - Assemble manga pages
- **Script Editor:** `/dashboard` - Structure your story

## 🔧 Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
XAI_API_KEY=your_xai_api_key
```

## 📦 Build & Deploy

```bash
# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint
```

## 🎯 Project Structure

```
mangaka-ai/
├── src/
│   ├── app/              # Next.js App Router
│   ├── components/       # React components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities and configurations
│   ├── stores/          # Zustand state management
│   └── styles/          # Global styles
├── public/              # Static assets
├── database/            # Database migrations
└── supabase/           # Supabase configuration
```

## 📄 License

All rights reserved. Proprietary software.

---

**🎨 Built with ❤️ by the MANGAKA AI team**
