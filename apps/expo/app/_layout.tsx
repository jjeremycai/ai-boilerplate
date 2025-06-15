import '../global.css'
import { Provider } from 'app/provider'
import { SplashScreen, Stack } from 'expo-router'
import { useEffect } from 'react'

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  const loaded = true // NativeWind doesn't require font loading

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.

  useEffect(() => {
    SplashScreen.hideAsync()
  }, [])

  if (!loaded) {
    return null
  }

  return (
    <Provider initialSession={null}>
      <Stack />
    </Provider>
  )
}
