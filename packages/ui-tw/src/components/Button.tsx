// Platform-specific exports
// The bundler will automatically choose the right file:
// - Button.web.tsx for Next.js and Tauri
// - Button.native.tsx for React Native/Expo

// For TypeScript, we need to export from one of them
export { Button } from './Button.web'
export type { ButtonProps } from './Button.web'