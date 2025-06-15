import { Button, Container, ScrollView, Text } from '@t4/ui-tw'
import { useSupabase } from 'app/utils/supabase/hooks/useSupabase'
import { useUser } from 'app/utils/supabase/hooks/useUser'
import { trpc } from 'app/utils/trpc'
import React from 'react'
import { Linking, View } from 'react-native'
import { SolitoImage } from 'solito/image'
import { useLink } from 'solito/link'

export function HomeScreen() {
  const utils = trpc.useContext()
  const supabase = useSupabase()
  const { user } = useUser()

  const signInLink = useLink({
    href: '/sign-in',
  })

  const signUpLink = useLink({
    href: '/sign-up',
  })

  const dataFetchingLink = useLink({
    href: '/data-fetching',
  })

  const virtualizedListLink = useLink({
    href: '/virtualized-list',
  })

  const paramsLink = useLink({
    href: '/params/tim',
  })

  return (
    <ScrollView>
      <Container className="flex-1 justify-center items-center py-8">
        <View className="items-center space-y-6">
          <SolitoImage src="/t4-logo.png" width={128} height={128} alt="T4 Logo" />
          
          <Text variant="h1" className="text-center">
            👋 Hello, T4 App
          </Text>
          
          <View className="w-full h-px bg-gray-200 my-4" />
          
          <Text className="text-center text-gray-600">
            Unifying React Native + Web.
          </Text>
          
          <Text className="text-center text-gray-600">
            The T4 Stack is made by{' '}
            <Text 
              className="text-primary-500 underline"
              onPress={() => Linking.openURL('https://twitter.com/ogtimothymiller')}
            >
              Tim Miller
            </Text>
            , give it a star{' '}
            <Text 
              className="text-primary-500 underline"
              onPress={() => Linking.openURL('https://github.com/timothymiller/t4-app')}
            >
              on Github.
            </Text>
          </Text>
          
          <Text className="text-center text-gray-600">
            Now using Tailwind CSS + NativeWind instead of Tamagui!
          </Text>

          <View className="flex-row space-x-4">
            <Button onPress={() => Linking.openURL('https://t4stack.com/')}>
              Learn More...
            </Button>
          </View>

          <Text variant="h3" className="text-center mt-8">
            🦮🐴 App Demos
          </Text>
          
          <View className="space-y-2 w-full max-w-xs">
            <Button {...virtualizedListLink} className="w-full">
              Virtualized List
            </Button>
            <Button {...dataFetchingLink} className="w-full">
              Fetching Data
            </Button>
            <Button {...paramsLink} className="w-full">
              Params
            </Button>
            <Button 
              onPress={() => {
                // Toast functionality would need to be implemented
                console.log('Toast functionality not implemented yet')
              }}
              className="w-full"
            >
              Show Toast
            </Button>
          </View>
          
          {user ? (
            <Button
              onPress={async () => {
                supabase.auth.signOut()
                // Clear tanstack query cache of authenticated routes
                utils.auth.secretMessage.reset()
              }}
              variant="destructive"
              className="mt-4"
            >
              Sign Out
            </Button>
          ) : (
            <View className="flex-row space-x-2 mt-4">
              <Button {...signInLink}>
                Sign In
              </Button>
              <Button {...signUpLink} variant="secondary">
                Sign Up
              </Button>
            </View>
          )}
        </View>
      </Container>
    </ScrollView>
  )
}