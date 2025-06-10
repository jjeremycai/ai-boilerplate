import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useOAuth } from '@clerk/clerk-expo';
import { useWarmUpBrowser } from '../hooks/useWarmUpBrowser';

export function AuthScreen() {
  useWarmUpBrowser();

  const { startOAuthFlow: startGoogleFlow } = useOAuth({ strategy: 'oauth_google' });
  const { startOAuthFlow: startGithubFlow } = useOAuth({ strategy: 'oauth_github' });

  const handleOAuth = async (provider: 'google' | 'github') => {
    try {
      const flow = provider === 'google' ? startGoogleFlow : startGithubFlow;
      const { createdSessionId, setActive } = await flow();
      
      if (createdSessionId) {
        setActive!({ session: createdSessionId });
      }
    } catch (err) {
      console.error('OAuth error:', err);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Boilerplate</Text>
        <Text style={styles.subtitle}>Sign in to get started</Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.googleButton]}
          onPress={() => handleOAuth('google')}
        >
          <Text style={styles.buttonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.githubButton]}
          onPress={() => handleOAuth('github')}
        >
          <Text style={styles.buttonText}>Continue with GitHub</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.footer}>
        By signing in, you agree to our Terms of Service and Privacy Policy
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 8,
  },
  buttonContainer: {
    gap: 12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  googleButton: {
    backgroundColor: '#4285F4',
  },
  githubButton: {
    backgroundColor: '#24292E',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    textAlign: 'center',
    fontSize: 12,
    color: '#6B7280',
    marginTop: 32,
  },
});