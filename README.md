# 🎨 MANGAKA AI - Manga Creation Platform

**Transform your ideas into professional manga stories with AI-powered tools.**

## 🚀 Quick Start

```bash
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

Copy `.env.example` to `.env.local` and fill in your values:

```bash
cp .env.example .env.local
```

Required environment variables:
- **Supabase:** Database and authentication
- **XAI Grok 2:** AI image generation
- **Stripe:** Payment processing

## 🏗️ Architecture

### Frontend Architecture
- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Zustand** for state management

### Backend Services
- **Supabase:** PostgreSQL database, authentication, storage
- **XAI Grok 2:** AI image generation API
- **Stripe:** Payment processing and subscriptions

### Key Features
- **Real-time collaboration** via Supabase
- **AI-powered generation** with XAI Grok 2
- **Freemium model** with Stripe integration
- **Canvas-based editor** using Fabric.js
- **Responsive design** for mobile and desktop

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
├── assets/              # Screenshots and images
├── database/            # Database migrations
├── docs/                # Documentation
├── tests/               # Automated tests
└── supabase/           # Supabase configuration
```

## 🚀 Deployment

### Vercel (Recommended)

1. **Prepare for deployment:**
```bash
npm run build
npm run lint
```

2. **Deploy to Vercel:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

3. **Configure environment variables in Vercel dashboard:**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `XAI_API_KEY`
- `STRIPE_SECRET_KEY`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- `STRIPE_WEBHOOK_SECRET`

### Alternative Platforms

- **Netlify:** Compatible with Next.js static export
- **DigitalOcean App Platform:** Full-stack deployment
- **Docker:** Use `output: 'standalone'` in `next.config.ts`

## 🧪 Testing

```bash
# Run Playwright tests
npx playwright test

# Run specific test suites
npx playwright test tests/subscription-e2e.spec.js
```

## 🤝 Contributing

1. **Fork the repository**
2. **Create a feature branch:** `git checkout -b feature/amazing-feature`
3. **Commit changes:** `git commit -m 'Add amazing feature'`
4. **Push to branch:** `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write tests for new features
- Update documentation for API changes
- Ensure all tests pass before submitting PR

## 📊 Performance

- **Lighthouse Score:** 90+ target
- **Core Web Vitals:** Optimized
- **Bundle Size:** Monitored with Next.js analyzer
- **Image Optimization:** Next.js Image component

## 🔒 Security

- Environment variables for sensitive data
- Supabase RLS policies for data protection
- Stripe webhook signature verification
- Input validation and sanitization

## 📄 License

All rights reserved. Proprietary software.

---

**🎨 Built with ❤️ by the MANGAKA AI team**
