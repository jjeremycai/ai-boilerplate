import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { ClerkProvider, SignedIn, SignedOut } from '@clerk/clerk-expo';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { tokenCache } from './src/lib/cache';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AuthScreen } from './src/screens/AuthScreen';

const queryClient = new QueryClient();

// Get Clerk publishable key from environment
const clerkPublishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error('Missing Clerk Publishable Key');
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ClerkProvider
          publishableKey={clerkPublishableKey}
          tokenCache={tokenCache}
        >
          <QueryClientProvider client={queryClient}>
            <SignedIn>
              <RootNavigator />
            </SignedIn>
            <SignedOut>
              <AuthScreen />
            </SignedOut>
            <StatusBar style="auto" />
          </QueryClientProvider>
        </ClerkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}