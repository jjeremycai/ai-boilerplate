export * from './components'
export * from './lib/utils'
export { cssInterop } from 'nativewind'

// Catalyst components (web-only)
// Note: These components use @headlessui/react which only works on web
// Import them directly when building web-only features
export * as Catalyst from './components/catalyst'

// Catalyst-inspired native components
// These maintain Catalyst's design language but work on React Native
export * as CatalystNative from './catalyst-native'
