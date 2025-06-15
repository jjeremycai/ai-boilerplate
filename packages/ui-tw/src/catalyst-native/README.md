# Catalyst-Inspired Native Components

This directory contains React Native versions of Catalyst UI components that maintain the same design language and styling while being fully native-compatible.

## Overview

Since Catalyst components are web-only (using Headless UI and DOM events), we've created React Native equivalents that:
- Use the same Tailwind utility classes via NativeWind
- Maintain Catalyst's design tokens (colors, spacing, typography)
- Provide similar APIs where possible
- Work seamlessly on iOS and Android

## Available Components

- **Button** - Native version with all Catalyst color variants
- **Badge** - Simple status indicators
- **Alert** - Notification banners
- **Input** - Text input with consistent styling
- **Card** - Container component
- More coming soon...

## Usage

```tsx
// Import native versions
import { Button, Badge, Alert } from '@t4/ui-tw/catalyst-native'

// Use with same styling as Catalyst
<Button color="blue">Native Button</Button>
<Badge color="emerald">Active</Badge>
```

## Platform-Specific Imports

For universal apps, use platform extensions:
- `Component.web.tsx` - Imports original Catalyst component
- `Component.native.tsx` - Uses the native implementation

This allows the same import to work across platforms.