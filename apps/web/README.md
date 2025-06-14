# Web App - Remix + Radix UI

A modern web application built with Remix, React, TypeScript, and Radix UI components.

## 🚀 Tech Stack

- **Framework**: [Remix](https://remix.run) - Full-stack React framework
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Components**: Radix UI - Unstyled, accessible components
- **Authentication**: WorkOS AuthKit
- **Build Tool**: Vite

## 📁 Project Structure

```
app/
├── components/
│   └── ui/           # Radix UI components (Button, Card, etc.)
├── lib/
│   ├── auth.ts       # AuthKit configuration
│   └── utils.ts      # Utility functions
├── routes/
│   ├── _index.tsx    # Home page with auth
│   ├── dashboard.tsx # Protected dashboard
│   └── auth.callback.tsx # Auth callback handler
├── services/
│   └── api.ts        # API client
├── root.tsx          # App root with providers
└── tailwind.css      # Global styles
```

## 🔧 Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Type checking
bun run typecheck

# Linting
bun run lint
```

## 🔐 Authentication

The app uses WorkOS AuthKit for authentication:

1. User clicks "Sign In" on home page
2. Redirected to WorkOS hosted auth page
3. After sign in, redirected back to `/auth/callback`
4. User session established, redirected to dashboard

## 🎨 UI Components

Using Radix UI with Tailwind CSS for styling:

- **Button**: Various styles (default, outline, ghost, etc.)
- **Card**: Container component with header/content sections
- **Dialog**: Modal dialogs
- **Dropdown Menu**: Context menus
- **Toast**: Notification system
- **Tooltip**: Help text on hover

## 🌐 Environment Variables

```bash
VITE_WORKOS_CLIENT_ID=client_...
VITE_WORKOS_REDIRECT_URI=http://localhost:5173/auth/callback
VITE_API_URL=http://localhost:8787
```

## 📦 Building for Production

```bash
# Build the app
bun run build

# Preview production build
bun run start
```

## 🚀 Deployment

The app is configured to deploy with the main project via GitHub Actions. The built files are served by Cloudflare Workers.

## 🔗 API Integration

The app communicates with the backend API at `/api/v1/*`. All API calls require authentication via Bearer token.

Available endpoints:
- `/api/v1/projects` - Project management
- `/api/v1/tasks` - Task management
- `/api/v1/users/me` - Current user info
- `/api/v1/chat` - Real-time chat