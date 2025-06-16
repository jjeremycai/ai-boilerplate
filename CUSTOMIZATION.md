# Customization Guide

This guide helps you customize the Cai Stack boilerplate for your specific project.

## Initial Setup

### 1. Rename Your Project

Update these files with your project name:

**Root `package.json`:**
```json
{
  "name": "your-project-monorepo",
  // ...
}
```

**App names in each `package.json`:**
- `apps/web/package.json` → `@your-project/web`
- `apps/expo/package.json` → `@your-project/expo`
- `apps/desktop/package.json` → `@your-project/desktop`
- `packages/api/package.json` → `@your-project/api`
- `packages/ui-tw/package.json` → `@your-project/ui-tw`

### 2. Update Cloudflare Configuration

**`apps/web/wrangler.toml`:**
```toml
name = "your-project-web"
# Update KV namespace after creating it
[[kv_namespaces]]
binding = "CAI_CACHE"
id = "your-kv-namespace-id"
```

**`packages/api/wrangler.toml`:**
```toml
name = "your-project-api"
# Update D1 database after creating it
[[d1_databases]]
binding = "DB"
database_name = "your-project-db"
database_id = "your-d1-database-id"
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and update:

```env
# Your project-specific variables
PUBLIC_APP_NAME="Your App Name"
PUBLIC_APP_URL="https://your-domain.com"

# API endpoints
PUBLIC_API_URL="https://api.your-domain.com"
# Or for local development
PUBLIC_API_URL="http://localhost:8787"
```

## Branding & Design

### 1. Colors

Update your brand colors in:

**`packages/ui-tw/tailwind.config.js`:**
```javascript
theme: {
  extend: {
    colors: {
      primary: {
        DEFAULT: '#your-primary-color',
        // Add your color scale
      },
      secondary: {
        DEFAULT: '#your-secondary-color',
        // Add your color scale
      }
    }
  }
}
```

### 2. Fonts

**Web (`apps/web/app/root.tsx`):**
```typescript
export const links: LinksFunction = () => [
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=YourFont:wght@400;500;600;700&display=swap",
  },
];
```

### 3. Icons & Images

Replace these files with your assets:
- `apps/web/public/favicon.ico`
- `apps/web/public/pwa/icons/*` (PWA icons)
- `apps/expo/assets/icon.png` (App icon)
- `apps/expo/assets/splash.png` (Splash screen)
- `apps/desktop/app-icon.png` (Desktop icon)

## Feature Customization

### Remove Unused Features

1. **Remove example routes:**
   - Delete files in `apps/web/app/routes/` you don't need
   - Remove corresponding screens from `packages/app/features/`

2. **Remove unused packages:**
   ```bash
   # If not using payments
   bun remove stripe @stripe/stripe-js
   
   # If not using AI
   bun remove @ai-sdk/openai ai
   ```

3. **Clean up navigation:**
   - Update `packages/app/features/home/screen.tsx`
   - Remove links to deleted features

### Add Your Features

1. **Create new routes:**
   ```typescript
   // apps/web/app/routes/your-feature.tsx
   import { YourFeatureScreen } from "app/features/your-feature/screen";
   
   export default function YourFeature() {
     return <YourFeatureScreen />;
   }
   ```

2. **Create feature screens:**
   ```typescript
   // packages/app/features/your-feature/screen.tsx
   import { View, Text } from "@cai/ui-tw";
   
   export function YourFeatureScreen() {
     return (
       <View>
         <Text>Your Feature</Text>
       </View>
     );
   }
   ```

3. **Add API endpoints:**
   ```typescript
   // packages/api/src/routes/your-endpoint.ts
   export const yourRouter = router({
     list: publicProcedure.query(async ({ ctx }) => {
       // Your logic
     }),
   });
   ```

## Database Schema

Update the schema for your needs:

**`packages/db/src/schema/index.ts`:**
```typescript
export const yourTable = sqliteTable("your_table", {
  id: universalId("id").primaryKey(),
  name: text("name").notNull(),
  // Add your fields
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});
```

Run migrations:
```bash
bun run generate
bun run migrate
```

## Deployment Customization

### Custom Domains

1. **Web app:**
   ```toml
   # apps/web/wrangler.toml
   route = "your-domain.com/*"
   workers_dev = false
   ```

2. **API:**
   ```toml
   # packages/api/wrangler.toml
   route = "api.your-domain.com/*"
   workers_dev = false
   ```

### Environment-Specific Config

Create environment-specific configurations:

```toml
# apps/web/wrangler.toml
[env.production]
name = "your-project-web-prod"
route = "your-domain.com/*"

[env.staging]
name = "your-project-web-staging"
route = "staging.your-domain.com/*"
```

## Platform-Specific Customization

### iOS/Android

Update `apps/expo/app.config.ts`:
```typescript
export default {
  name: "Your App Name",
  slug: "your-app-slug",
  owner: "your-expo-username",
  scheme: "yourapp",
  // ... other config
};
```

### Desktop

Update `apps/desktop/src-tauri/tauri.conf.json`:
```json
{
  "productName": "Your App Name",
  "identifier": "com.yourcompany.yourapp",
  // ... other config
}
```

## Checklist

- [ ] Update all package names
- [ ] Configure Cloudflare services
- [ ] Set up environment variables
- [ ] Update brand colors and fonts
- [ ] Replace icons and images
- [ ] Remove unused example features
- [ ] Add your custom features
- [ ] Update database schema
- [ ] Configure deployment domains
- [ ] Update app metadata for each platform

## Need Help?

- Check the [README.md](./README.md) for general documentation
- See platform-specific guides in each app directory
- Join our community for support