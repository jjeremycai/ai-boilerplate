import React, { useState } from 'react'
import { View, Platform } from 'react-native'
import { Container, ScrollView, Text } from '@t4/ui-tw'
import { CatalystNative } from '@t4/ui-tw'

export function CatalystExampleScreen() {
  const [email, setEmail] = useState('')

  return (
    <ScrollView>
      <Container className="flex-1 p-4">
        <Text variant="h1" className="mb-2">
          Catalyst Native Components
        </Text>
        <Text className="text-gray-600 mb-6">
          These components maintain Catalyst's design language on React Native
        </Text>

        {/* Buttons */}
        <View className="mb-8">
          <Text variant="h3" className="mb-4">Buttons</Text>
          <View className="flex-row flex-wrap gap-2">
            <CatalystNative.Button color="blue">Blue</CatalystNative.Button>
            <CatalystNative.Button color="emerald">Emerald</CatalystNative.Button>
            <CatalystNative.Button color="red">Red</CatalystNative.Button>
            <CatalystNative.Button color="amber">Amber</CatalystNative.Button>
            <CatalystNative.Button outline>Outline</CatalystNative.Button>
            <CatalystNative.Button plain>Plain</CatalystNative.Button>
          </View>
        </View>

        {/* Badges */}
        <View className="mb-8">
          <Text variant="h3" className="mb-4">Badges</Text>
          <View className="flex-row flex-wrap gap-2">
            <CatalystNative.Badge>Default</CatalystNative.Badge>
            <CatalystNative.Badge color="emerald">Active</CatalystNative.Badge>
            <CatalystNative.Badge color="amber">Pending</CatalystNative.Badge>
            <CatalystNative.Badge color="red">Error</CatalystNative.Badge>
            <CatalystNative.Badge color="blue">Info</CatalystNative.Badge>
          </View>
        </View>

        {/* Alerts */}
        <View className="mb-8">
          <Text variant="h3" className="mb-4">Alerts</Text>
          <View className="space-y-2">
            <CatalystNative.Alert>
              Default alert message
            </CatalystNative.Alert>
            <CatalystNative.Alert color="green">
              Success! Your changes have been saved.
            </CatalystNative.Alert>
            <CatalystNative.Alert color="amber">
              Warning: This action cannot be undone.
            </CatalystNative.Alert>
            <CatalystNative.Alert color="red">
              Error: Something went wrong.
            </CatalystNative.Alert>
          </View>
        </View>

        {/* Input */}
        <View className="mb-8">
          <Text variant="h3" className="mb-4">Input</Text>
          <CatalystNative.Input
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View className="mt-2">
            <CatalystNative.Input
              placeholder="Invalid input example"
              invalid
            />
          </View>
        </View>

        {/* Platform Info */}
        <CatalystNative.Alert color="blue">
          <Text className="text-sm">
            Running on {Platform.OS} {Platform.Version}
          </Text>
        </CatalystNative.Alert>
      </Container>
    </ScrollView>
  )
}