import { useState } from 'react'
// Import universal components - they work in Tauri!
import { Button, Container, Text, Input, Card } from '@cai/ui-tw'
// Import Catalyst components - they also work in Tauri!
import { Catalyst } from '@cai/ui-tw'
// Tauri specific imports
import { invoke } from '@tauri-apps/api/tauri'

function App() {
  const [greetMsg, setGreetMsg] = useState('')
  const [name, setName] = useState('')
  const [showDialog, setShowDialog] = useState(false)

  async function greet() {
    // Call Rust backend
    setGreetMsg(await invoke('greet', { name }))
  }

  return (
    <Container className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Using universal Text component */}
        <Text variant="h1" className="text-center">
          Cai Stack Desktop App with Tauri 2.0
        </Text>

        {/* Using universal Card component */}
        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            All Components Work in Tauri!
          </Text>
          
          <div className="space-y-4">
            {/* Using Catalyst components - they work because Tauri is web-based */}
            <Catalyst.Field>
              <Catalyst.Label>Your Name</Catalyst.Label>
              <Catalyst.Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name..."
              />
            </Catalyst.Field>

            {/* Mix of universal and Catalyst buttons */}
            <div className="flex gap-4">
              <Button onPress={greet} variant="primary">
                Greet (Universal Button)
              </Button>
              
              <Catalyst.Button color="blue" onClick={() => setShowDialog(true)}>
                Open Dialog (Catalyst Button)
              </Catalyst.Button>
            </div>

            {greetMsg && (
              <Catalyst.Alert color="emerald">
                {greetMsg}
              </Catalyst.Alert>
            )}
          </div>
        </Card>

        {/* Catalyst components showcase */}
        <Card className="p-6">
          <Text variant="h3" className="mb-4">
            Catalyst Components in Desktop
          </Text>
          
          <div className="space-y-4">
            {/* Badges */}
            <div className="flex gap-2">
              <Catalyst.Badge color="emerald">Online</Catalyst.Badge>
              <Catalyst.Badge color="amber">Desktop Mode</Catalyst.Badge>
              <Catalyst.Badge color="blue">Tauri 2.0</Catalyst.Badge>
            </div>

            {/* Buttons */}
            <div className="flex flex-wrap gap-2">
              <Catalyst.Button color="cyan">Cyan</Catalyst.Button>
              <Catalyst.Button color="indigo">Indigo</Catalyst.Button>
              <Catalyst.Button color="rose">Rose</Catalyst.Button>
              <Catalyst.Button outline>Outline</Catalyst.Button>
            </div>

            {/* Table */}
            <Catalyst.Table>
              <Catalyst.TableHead>
                <Catalyst.TableRow>
                  <Catalyst.TableHeader>Platform</Catalyst.TableHeader>
                  <Catalyst.TableHeader>Components</Catalyst.TableHeader>
                  <Catalyst.TableHeader>Status</Catalyst.TableHeader>
                </Catalyst.TableRow>
              </Catalyst.TableHead>
              <Catalyst.TableBody>
                <Catalyst.TableRow>
                  <Catalyst.TableCell>Tauri</Catalyst.TableCell>
                  <Catalyst.TableCell>All Web Components</Catalyst.TableCell>
                  <Catalyst.TableCell>
                    <Catalyst.Badge color="emerald">✓ Supported</Catalyst.Badge>
                  </Catalyst.TableCell>
                </Catalyst.TableRow>
                <Catalyst.TableRow>
                  <Catalyst.TableCell>Next.js</Catalyst.TableCell>
                  <Catalyst.TableCell>All Web Components</Catalyst.TableCell>
                  <Catalyst.TableCell>
                    <Catalyst.Badge color="emerald">✓ Supported</Catalyst.Badge>
                  </Catalyst.TableCell>
                </Catalyst.TableRow>
                <Catalyst.TableRow>
                  <Catalyst.TableCell>Expo</Catalyst.TableCell>
                  <Catalyst.TableCell>Universal + Native Only</Catalyst.TableCell>
                  <Catalyst.TableCell>
                    <Catalyst.Badge color="amber">Partial</Catalyst.Badge>
                  </Catalyst.TableCell>
                </Catalyst.TableRow>
              </Catalyst.TableBody>
            </Catalyst.Table>
          </div>
        </Card>

        {/* Catalyst Dialog */}
        <Catalyst.Dialog open={showDialog} onClose={() => setShowDialog(false)}>
          <Catalyst.DialogTitle>
            Tauri + Catalyst = ❤️
          </Catalyst.DialogTitle>
          <Catalyst.DialogDescription>
            This dialog component from Catalyst works perfectly in Tauri because
            Tauri apps use web views. You get all the benefits of Headless UI
            including accessibility and keyboard navigation!
          </Catalyst.DialogDescription>
          <Catalyst.DialogActions>
            <Catalyst.Button plain onClick={() => setShowDialog(false)}>
              Cancel
            </Catalyst.Button>
            <Catalyst.Button color="blue" onClick={() => setShowDialog(false)}>
              Awesome!
            </Catalyst.Button>
          </Catalyst.DialogActions>
        </Catalyst.Dialog>
      </div>
    </Container>
  )
}

export default App