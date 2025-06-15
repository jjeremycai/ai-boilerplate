# Catalyst UI Kit Integration Guide

This boilerplate includes Catalyst UI Kit components with a dual approach for maximum flexibility across platforms.

## Overview

We provide two ways to use Catalyst's beautiful design system:

1. **Web-Only Components** (`@t4/ui-tw/Catalyst`) - Original Catalyst components using Headless UI
2. **Native Components** (`@t4/ui-tw/CatalystNative`) - React Native versions maintaining the same design language

## Web-Only Components

Located in `packages/ui-tw/src/components/catalyst/`, these are the original Catalyst components:

```tsx
import { Catalyst } from '@t4/ui-tw'

// Use in Next.js pages
<Catalyst.Button color="blue">Web Button</Catalyst.Button>
<Catalyst.Dialog>...</Catalyst.Dialog>
<Catalyst.Dropdown>...</Catalyst.Dropdown>
```

### Features:
- Full Headless UI interactions
- All original Catalyst components
- Perfect for web-only features
- Accessibility built-in

### Available Components:
Alert, Avatar, Badge, Button, Checkbox, Combobox, Dialog, Divider, Dropdown, Fieldset, Heading, Input, Link, Listbox, Navbar, Pagination, Radio, Select, Sidebar, Switch, Table, Text, Textarea

## Native Components

Located in `packages/ui-tw/src/catalyst-native/`, these maintain Catalyst's design language on React Native:

```tsx
import { CatalystNative } from '@t4/ui-tw'

// Use in Expo/React Native
<CatalystNative.Button color="blue">Native Button</CatalystNative.Button>
<CatalystNative.Badge color="emerald">Active</CatalystNative.Badge>
```

### Design Token Consistency

Native components use the same color palette as Catalyst:
- Primary colors: blue, indigo, violet, purple
- Accent colors: cyan, teal, emerald, green
- Warm colors: red, orange, amber, yellow
- Cool colors: zinc, slate, gray

### Currently Available:
- **Button** - All color variants, outline, plain styles
- **Badge** - Status indicators with dot
- **Alert** - Notification banners
- **Input** - Text input with error states

### Coming Soon:
- Card, Switch, Checkbox, Radio
- Select (using ActionSheet)
- Dialog (using Modal)
- Table (using FlatList)

## Platform-Specific Development

### Option 1: Conditional Imports

```tsx
import { Platform } from 'react-native'
import { Catalyst, CatalystNative } from '@t4/ui-tw'

function MyComponent() {
  if (Platform.OS === 'web') {
    return <Catalyst.Button>Web Button</Catalyst.Button>
  }
  return <CatalystNative.Button>Native Button</CatalystNative.Button>
}
```

### Option 2: Platform File Extensions

Create platform-specific files:
- `Button.web.tsx` - imports Catalyst component
- `Button.native.tsx` - uses CatalystNative

```tsx
// Button.web.tsx
export { Button } from '@t4/ui-tw/Catalyst'

// Button.native.tsx  
export { Button } from '@t4/ui-tw/CatalystNative'

// Usage
import { Button } from './Button' // Auto-resolves
```

## Styling Consistency

Both component sets use Tailwind classes via NativeWind:

```tsx
// These work on both platforms
className="rounded-lg px-4 py-2"
className="bg-blue-600 text-white"
className="border border-zinc-200"
```

## Best Practices

1. **Use Universal Components First** - Our base components work everywhere
2. **Catalyst for Web Features** - Rich interactions like dropdowns, dialogs
3. **CatalystNative for Mobile** - When you need Catalyst's design on native
4. **Keep Design Tokens Synced** - Update both if you customize colors

## Examples

See working examples:
- `/catalyst-demo` - Web-only Catalyst showcase
- `/hybrid-example` - Using both component sets
- `packages/app/features/catalyst-example` - Native components demo

## Customization

To add more native components:

1. Study the original Catalyst component
2. Extract color/spacing tokens
3. Rebuild with React Native primitives
4. Maintain the same prop API where possible

Example pattern:
```tsx
// Original Catalyst uses Headless UI
<Headless.Switch />

// Native version uses React Native
<Pressable onPress={toggle}>
  <View className={enabled ? 'bg-blue-600' : 'bg-gray-200'}>
    <View className="dot" />
  </View>
</Pressable>
```