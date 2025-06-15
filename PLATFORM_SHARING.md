# Cross-Platform Component Sharing Guide

This guide explains how components are shared across Tauri (desktop), Next.js (web), and Expo (mobile) in this boilerplate.

## Platform Capabilities

### Web Platforms (Next.js + Tauri)
Both use standard web technologies:
- ✅ HTML elements (`div`, `button`, `input`)
- ✅ Full CSS and Tailwind classes
- ✅ Headless UI components
- ✅ Framer Motion animations
- ✅ Web APIs (DOM, fetch, etc.)

### Native Platform (Expo/React Native)
Uses React Native primitives:
- ❌ No HTML elements
- ✅ React Native components (`View`, `Text`, `Pressable`)
- ✅ NativeWind (Tailwind compiled to StyleSheet)
- ❌ No Headless UI
- ❌ No web-specific APIs

## Component Architecture

### 1. Platform-Specific Files

```
components/
├── Button.tsx           # Main export (picks platform file)
├── Button.web.tsx       # Web version (Next.js + Tauri)
└── Button.native.tsx    # Native version (Expo)
```

The bundler automatically selects:
- `.web.tsx` for webpack (Next.js/Tauri)
- `.native.tsx` for Metro (React Native)

### 2. Shared Styling with Tailwind

Both platforms use the same Tailwind classes:

```tsx
// Works on ALL platforms
className="bg-blue-500 text-white rounded-lg px-4 py-2"
```

- **Web**: Tailwind CSS processes these normally
- **Native**: NativeWind converts to React Native StyleSheet

### 3. Platform-Specific Features

#### Web-Only (Next.js + Tauri)
```tsx
// Button.web.tsx
export function Button({ onClick, ...props }) {
  return (
    <button
      onClick={onClick}
      className="hover:bg-blue-600 focus:ring-2"
      {...props}
    />
  )
}
```

#### Native-Only (Expo)
```tsx
// Button.native.tsx
import { Pressable, Text } from 'react-native'

export function Button({ onPress, children }) {
  return (
    <Pressable 
      onPress={onPress}
      className="bg-blue-500 active:bg-blue-600 rounded-lg px-4 py-2"
    >
      <Text className="text-white">{children}</Text>
    </Pressable>
  )
}
```

## Component Categories

### 1. Universal Components ✅
Located in `packages/ui-tw/src/components/`
- Work on ALL platforms (web + native)
- Use platform-specific implementations
- Examples: Button, Card, Input, Text

### 2. Catalyst Web Components 🌐
Located in `packages/ui-tw/src/components/catalyst/`
- Web-only (Next.js + Tauri)
- Use Headless UI
- Examples: Dialog, Dropdown, Combobox

### 3. Catalyst Native Components 📱
Located in `packages/ui-tw/src/catalyst-native/`
- Native-only (Expo)
- Recreate Catalyst design with RN primitives
- Examples: Button, Badge, Alert

## Usage Examples

### In Next.js Pages (Web)
```tsx
import { Button } from '@t4/ui-tw'              // Universal button
import { Catalyst } from '@t4/ui-tw'           // Catalyst web components

export default function WebPage() {
  return (
    <>
      <Button onClick={() => {}}>Universal Button</Button>
      <Catalyst.Dialog>Web-only Dialog</Catalyst.Dialog>
    </>
  )
}
```

### In Tauri App (Desktop)
```tsx
// EXACTLY the same as Next.js!
import { Button } from '@t4/ui-tw'
import { Catalyst } from '@t4/ui-tw'

export default function DesktopApp() {
  return (
    <>
      <Button onClick={() => {}}>Universal Button</Button>
      <Catalyst.Dropdown>Desktop Dropdown</Catalyst.Dropdown>
    </>
  )
}
```

### In Expo App (Mobile)
```tsx
import { Button } from '@t4/ui-tw'              // Universal button
import { CatalystNative } from '@t4/ui-tw'     // Native Catalyst

export function MobileScreen() {
  return (
    <>
      <Button onPress={() => {}}>Universal Button</Button>
      <CatalystNative.Badge>Native Badge</CatalystNative.Badge>
    </>
  )
}
```

## Best Practices

1. **Use Universal Components First**
   - They work everywhere
   - Consistent API across platforms
   - Less code to maintain

2. **Platform Extensions When Needed**
   ```
   MyComponent.tsx
   MyComponent.web.tsx      # Web-specific features
   MyComponent.native.tsx   # Native-specific features
   ```

3. **Share Tailwind Classes**
   ```tsx
   // Define once, use everywhere
   const buttonStyles = "bg-blue-500 text-white rounded-lg px-4 py-2"
   ```

4. **Handle Platform Differences**
   ```tsx
   // Different event names
   const eventProp = Platform.OS === 'web' ? 'onClick' : 'onPress'
   
   // Different components
   const Container = Platform.OS === 'web' ? 'div' : View
   ```

## Tauri-Specific Considerations

Since Tauri is a web view:
- ✅ Uses the exact same components as Next.js
- ✅ Full Catalyst component library available
- ✅ All web APIs work
- ✅ Can use `window.__TAURI__` for native features

```tsx
// Tauri-specific features
import { invoke } from '@tauri-apps/api'

function TauriButton() {
  return (
    <Button onClick={() => invoke('my_rust_command')}>
      Call Rust Function
    </Button>
  )
}
```

## Summary

- **Tauri + Next.js**: Share 100% of components (both are web)
- **Expo**: Shares universal components via platform-specific files
- **Tailwind**: Works everywhere via NativeWind
- **Catalyst**: Web-only, but design tokens shared with native versions