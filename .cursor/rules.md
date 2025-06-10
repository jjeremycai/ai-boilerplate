# Cursor Rules for AI-First Full-Stack Boilerplate

## Tech Stack & Architecture
- **Frontend Web**: React 19 + TypeScript + Vite + Tailwind CSS v3 + shadcn/ui
- **Mobile**: React Native + Expo + TypeScript  
- **Backend**: Cloudflare Workers + Hono framework
- **Database**: Cloudflare D1 (SQLite) + KV Store
- **Auth**: Clerk (web and mobile)
- **Deployment**: Cloudflare Pages/Workers + Expo EAS

## Critical Rules
- **NO Next.js** - This is a Vite + React project by design
- **Edge-first architecture** - Always use Cloudflare Workers, not Node.js
- **Shared types** - Use shared/ directory for types across web/mobile/backend
- **Consistent API client** - Same pattern for web and mobile

## TypeScript Best Practices
- Write concise, technical TypeScript code with accurate examples
- Use TypeScript for all code, avoid `any`
- Prefer interfaces over types
- Enable strict typing: `noUnusedLocals`, `noUnusedParameters`
- Use descriptive variable names with auxiliary verbs (`isLoading`, `hasError`)

## React Performance & Patterns
- Use functional and declarative programming patterns
- Minimize `useEffect` and `useState` usage
- Use `React.memo()` to prevent unnecessary re-renders
- Implement code splitting with dynamic imports
- Prefer iteration and modularization over code duplication
- Structure components with hooks first, then handlers, then render

## UI & Styling
- Use Tailwind CSS v3 for utility-first, maintainable styling
- Mobile-first responsive design approach
- Use existing shadcn/ui components from `src/components/ui/`
- Keep components small and focused
- Implement proper error boundaries

## File & Code Organization

### Naming Conventions
- **Components**: PascalCase (`UserProfile.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Directories**: lowercase with dashes (`user-management/`)
- **Types**: PascalCase with `.types.ts` extension
- **Tests**: Same name with `.test.ts` or `.spec.ts`

### Import Order
```tsx
// 1. React imports
import { useState, useEffect } from 'react'

// 2. Third-party libraries
import { Button } from '@/components/ui/button'
import { useAuth } from '@clerk/clerk-react'

// 3. Internal components
import { UserCard } from '@/components/UserCard'

// 4. Internal utilities
import { formatDate } from '@/lib/utils'

// 5. Types
import type { User } from '@/shared/types'
```

### Component Structure
```tsx
interface Props {
  user: User
  onUpdate?: (user: User) => void
}

export function UserProfile({ user, onUpdate }: Props) {
  // 1. Hooks first
  const [isEditing, setIsEditing] = useState(false)
  const { user: authUser } = useAuth()
  
  // 2. Early returns for error conditions
  if (!user) return null
  if (!authUser) return <div>Please log in</div>
  
  // 3. Handlers
  const handleEdit = () => setIsEditing(true)
  const handleSave = async () => {
    // Implementation
  }
  
  // 4. Render
  return (
    <div className="space-y-4">
      {/* JSX content */}
    </div>
  )
}
```

## API & Backend Patterns
- Use `/api/v1/` prefix for all endpoints
- Return consistent error objects: `{ error: string, code: string }`
- Prioritize error handling at the beginning of functions
- Use early returns and guard clauses
- Always validate input data with Zod
- Use proper HTTP status codes
- Handle Cloudflare Workers environment properly

## Database Best Practices
- Use prepared statements for D1 queries
- Keep queries in service layer (`worker/services/`)
- Handle errors gracefully with try/catch
- Use transactions for related operations
- Structure SQL with proper indexes

## Error Handling & Validation
- Use Zod for form validation and API input validation
- Implement error boundaries for React components
- Handle async operations with proper error states
- Use consistent error response format across APIs

## Performance Optimization
- Implement proper caching strategies for D1 and KV
- Use React.memo for expensive components
- Lazy load routes and heavy components
- Optimize bundle size with proper tree-shaking
- Use Cloudflare edge caching appropriately

## Mobile-Specific Patterns
- Share business logic between web and mobile
- Use platform-specific styling when needed
- Implement proper navigation patterns for React Native
- Handle platform differences gracefully

## Common Shortcuts & Patterns
- **Create CRUD endpoint**: "Generate CRUD endpoints for [resource] with D1 database integration"
- **Add new page**: "Create a new page for [feature] with proper routing and types"
- **Database migration**: "Create D1 migration for [table/change] with proper schema"
- **Form component**: "Create form component for [entity] with Zod validation and error handling"
- **API client method**: "Add API client method for [endpoint] with proper typing"

## Development Workflow
- Use ESLint and TypeScript for code quality
- Run `npm run typecheck` before commits
- Test API endpoints locally with Wrangler
- Use proper Git commit messages with emojis
- Deploy to Cloudflare for testing

## Security Best Practices  
- Never expose secrets in client-side code
- Use Clerk for authentication, never roll your own
- Validate all inputs server-side with Zod
- Use CORS properly for API endpoints
- Implement rate limiting where appropriate