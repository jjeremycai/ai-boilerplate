# Mobile App - React Native + Expo

Cross-platform mobile application built with React Native, Expo, and TypeScript.

## 🚀 Tech Stack

- **Framework**: React Native + Expo
- **Language**: TypeScript
- **Navigation**: React Navigation
- **State**: Zustand + React Query
- **Authentication**: WorkOS AuthKit with Expo Auth Session
- **Styling**: React Native StyleSheet

## 📁 Project Structure

```
src/
├── context/
│   └── AuthContext.tsx    # WorkOS authentication
├── screens/
│   ├── AuthScreen.tsx     # Sign in screen
│   ├── ProjectsScreen.tsx # Projects list
│   ├── TasksScreen.tsx    # Tasks management
│   ├── ChatScreen.tsx     # Real-time chat
│   └── ProfileScreen.tsx  # User profile
├── navigation/
│   └── RootNavigator.tsx  # Tab navigation
├── services/
│   └── api.ts            # API client
├── hooks/
│   └── useWarmUpBrowser.ts # OAuth browser prep
└── lib/
    └── cache.ts          # Secure token storage
```

## 🔧 Development

```bash
# Install dependencies
bun install

# Start Expo dev server
bun run start

# Run on iOS simulator
bun run ios

# Run on Android emulator
bun run android

# Type checking
bun run typecheck

# Linting
bun run lint
```

## 🔐 Authentication

Custom WorkOS integration using Expo Auth Session:

1. User taps "Sign In with WorkOS"
2. Opens in-app browser for WorkOS auth
3. Redirects back with authorization code
4. Exchange code for token with backend
5. Store token securely with expo-secure-store

## 📱 Features

- **Projects**: Create and manage projects
- **Tasks**: Task lists with status tracking
- **Chat**: Real-time messaging
- **Profile**: User settings and sign out

## 🌐 Environment Variables

```bash
# API Configuration
EXPO_PUBLIC_API_URL=http://localhost:8787
EXPO_PUBLIC_WORKOS_CLIENT_ID=client_...
EXPO_PUBLIC_WORKOS_REDIRECT_URI=exp://localhost:8081/auth/callback
```

## 📦 Building for Production

### iOS
```bash
# Build for iOS
eas build --platform ios

# Submit to App Store
eas submit -p ios
```

### Android
```bash
# Build for Android
eas build --platform android

# Submit to Play Store
eas submit -p android
```

## 🧪 Testing

```bash
# Run tests
bun run test

# Watch mode
bun run test --watch
```

## 🎨 Styling

Uses React Native's built-in StyleSheet API:

```typescript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  // ...
})
```

## 🔗 Deep Linking

Configured for OAuth callbacks:
- Scheme: `boilerplate`
- Auth callback: `boilerplate://auth/callback`

## 📲 Over-the-Air Updates

Expo EAS Update enabled for quick fixes:

```bash
# Publish update
eas update --branch production
```

## 🛠️ Troubleshooting

### Auth Issues
- Ensure redirect URI matches exactly
- Check that WorkOS client ID is correct
- Verify API URL is accessible from device

### Build Issues
- Clear Metro cache: `expo start -c`
- Reset dependencies: `rm -rf node_modules && bun install`
- Check Expo SDK version compatibility