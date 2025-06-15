import { Button as UniversalButton, Container, Text } from '@t4/ui-tw'
import { Catalyst } from '@t4/ui-tw'
import { useState } from 'react'

export default function HybridExample() {
  const [email, setEmail] = useState('')
  const [showDialog, setShowDialog] = useState(false)

  return (
    <Container className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <Text variant="h1" className="mb-2">
            Hybrid Component Example
          </Text>
          <Text className="text-gray-600">
            Using both universal and Catalyst components together
          </Text>
        </div>

        {/* Universal components work on both web and native */}
        <div className="bg-gray-50 dark:bg-gray-900 p-6 rounded-lg">
          <Text variant="h3" className="mb-4">
            Universal Components (Web + Native)
          </Text>
          <div className="flex gap-4">
            <UniversalButton variant="primary">
              Universal Primary
            </UniversalButton>
            <UniversalButton variant="secondary">
              Universal Secondary
            </UniversalButton>
          </div>
        </div>

        {/* Catalyst components are web-only */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
          <Catalyst.Heading level={3} className="mb-4">
            Catalyst Components (Web Only)
          </Catalyst.Heading>
          
          <Catalyst.FieldGroup>
            <Catalyst.Field>
              <Catalyst.Label>Email Newsletter</Catalyst.Label>
              <Catalyst.Description>
                Subscribe to get updates about new features
              </Catalyst.Description>
              <div className="flex gap-2 mt-2">
                <Catalyst.Input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="flex-1"
                />
                <Catalyst.Button 
                  color="blue"
                  onClick={() => setShowDialog(true)}
                  disabled={!email}
                >
                  Subscribe
                </Catalyst.Button>
              </div>
            </Catalyst.Field>
          </Catalyst.FieldGroup>
        </div>

        {/* Mixed usage example */}
        <div className="border border-gray-200 dark:border-gray-700 p-6 rounded-lg">
          <Text variant="h3" className="mb-4">
            Mixed Usage
          </Text>
          <Catalyst.Alert color="amber" className="mb-4">
            <Catalyst.Text>
              You can mix universal components with Catalyst components in web apps!
            </Catalyst.Text>
          </Catalyst.Alert>
          
          <div className="flex gap-4 items-center">
            <UniversalButton 
              variant="primary"
              onPress={() => alert('Universal button clicked!')}
            >
              Universal Button
            </UniversalButton>
            <Catalyst.Badge color="emerald">
              Web Only Badge
            </Catalyst.Badge>
          </div>
        </div>

        {/* Catalyst Dialog */}
        <Catalyst.Dialog open={showDialog} onClose={() => setShowDialog(false)}>
          <Catalyst.DialogTitle>
            Newsletter Subscription
          </Catalyst.DialogTitle>
          <Catalyst.DialogDescription>
            You've been subscribed to our newsletter at {email}
          </Catalyst.DialogDescription>
          <Catalyst.DialogActions>
            <Catalyst.Button plain onClick={() => setShowDialog(false)}>
              Cancel
            </Catalyst.Button>
            <Catalyst.Button 
              color="blue" 
              onClick={() => {
                alert(`Subscribed: ${email}`)
                setShowDialog(false)
                setEmail('')
              }}
            >
              Confirm
            </Catalyst.Button>
          </Catalyst.DialogActions>
        </Catalyst.Dialog>
      </div>
    </Container>
  )
}