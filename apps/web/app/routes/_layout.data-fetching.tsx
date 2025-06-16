import { createFileRoute } from '@tanstack/react-router'
import { Catalyst } from '@cai/ui-tw'
import { useState, useEffect } from 'react'
import { 
  ArrowPathIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_layout/data-fetching')({
  meta: () => [
    { title: "Data Fetching - CAI App" },
  ],
  component: DataFetchingScreen,
})

interface User {
  id: number
  name: string
  email: string
  company: {
    name: string
  }
  address: {
    city: string
    street: string
  }
}

function DataFetchingScreen() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  const fetchUsers = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Catalyst.Heading>Data Fetching Demo</Catalyst.Heading>
          <Catalyst.Text>Real-time data fetching with JSONPlaceholder API</Catalyst.Text>
        </div>
        <Catalyst.Button onClick={fetchUsers} disabled={loading}>
          <ArrowPathIcon className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Refreshing...' : 'Refresh Data'}
        </Catalyst.Button>
      </div>

      {/* Status Alert */}
      {error && (
        <Catalyst.Alert color="red">
          <XCircleIcon className="w-5 h-5" />
          <div>
            <Catalyst.AlertTitle>Error loading data</Catalyst.AlertTitle>
            <Catalyst.AlertDescription>{error}</Catalyst.AlertDescription>
          </div>
        </Catalyst.Alert>
      )}

      {loading && users.length === 0 && (
        <Catalyst.Alert color="blue">
          <ClockIcon className="w-5 h-5 animate-pulse" />
          <div>
            <Catalyst.AlertTitle>Loading users...</Catalyst.AlertTitle>
            <Catalyst.AlertDescription>Fetching data from the API</Catalyst.AlertDescription>
          </div>
        </Catalyst.Alert>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Catalyst.Card>
          <Catalyst.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Catalyst.Text className="text-sm text-zinc-500">Total Users</Catalyst.Text>
                <Catalyst.Heading level={3}>{users.length}</Catalyst.Heading>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </Catalyst.CardContent>
        </Catalyst.Card>

        <Catalyst.Card>
          <Catalyst.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Catalyst.Text className="text-sm text-zinc-500">API Status</Catalyst.Text>
                <Catalyst.Badge color={error ? 'red' : 'green'}>
                  {error ? 'Error' : 'Connected'}
                </Catalyst.Badge>
              </div>
              {error ? (
                <ExclamationTriangleIcon className="w-8 h-8 text-red-500" />
              ) : (
                <CheckCircleIcon className="w-8 h-8 text-green-500" />
              )}
            </div>
          </Catalyst.CardContent>
        </Catalyst.Card>

        <Catalyst.Card>
          <Catalyst.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Catalyst.Text className="text-sm text-zinc-500">Last Updated</Catalyst.Text>
                <Catalyst.Text className="font-semibold">
                  {new Date().toLocaleTimeString()}
                </Catalyst.Text>
              </div>
              <ClockIcon className="w-8 h-8 text-blue-500" />
            </div>
          </Catalyst.CardContent>
        </Catalyst.Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Users Table */}
        <div className="lg:col-span-2">
          <Catalyst.Card>
            <Catalyst.CardHeader>
              <Catalyst.CardTitle>Users</Catalyst.CardTitle>
              <Catalyst.CardDescription>
                Click on a user to view details
              </Catalyst.CardDescription>
            </Catalyst.CardHeader>
            <Catalyst.CardContent className="p-0">
              <Catalyst.Table>
                <Catalyst.TableHead>
                  <Catalyst.TableRow>
                    <Catalyst.TableHeader>Name</Catalyst.TableHeader>
                    <Catalyst.TableHeader>Email</Catalyst.TableHeader>
                    <Catalyst.TableHeader>Company</Catalyst.TableHeader>
                    <Catalyst.TableHeader>City</Catalyst.TableHeader>
                  </Catalyst.TableRow>
                </Catalyst.TableHead>
                <Catalyst.TableBody>
                  {users.map((user) => (
                    <Catalyst.TableRow 
                      key={user.id}
                      onClick={() => setSelectedUser(user)}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800"
                    >
                      <Catalyst.TableCell>
                        <Catalyst.Strong>{user.name}</Catalyst.Strong>
                      </Catalyst.TableCell>
                      <Catalyst.TableCell className="text-zinc-500">
                        {user.email}
                      </Catalyst.TableCell>
                      <Catalyst.TableCell>
                        <Catalyst.Badge>{user.company.name}</Catalyst.Badge>
                      </Catalyst.TableCell>
                      <Catalyst.TableCell className="text-zinc-500">
                        {user.address.city}
                      </Catalyst.TableCell>
                    </Catalyst.TableRow>
                  ))}
                </Catalyst.TableBody>
              </Catalyst.Table>
            </Catalyst.CardContent>
          </Catalyst.Card>
        </div>

        {/* User Details */}
        <div>
          <Catalyst.Card>
            <Catalyst.CardHeader>
              <Catalyst.CardTitle>User Details</Catalyst.CardTitle>
            </Catalyst.CardHeader>
            <Catalyst.CardContent>
              {selectedUser ? (
                <Catalyst.DescriptionList>
                  <Catalyst.DescriptionTerm>Name</Catalyst.DescriptionTerm>
                  <Catalyst.DescriptionDetails>{selectedUser.name}</Catalyst.DescriptionDetails>

                  <Catalyst.DescriptionTerm>Email</Catalyst.DescriptionTerm>
                  <Catalyst.DescriptionDetails>{selectedUser.email}</Catalyst.DescriptionDetails>

                  <Catalyst.DescriptionTerm>Company</Catalyst.DescriptionTerm>
                  <Catalyst.DescriptionDetails>{selectedUser.company.name}</Catalyst.DescriptionDetails>

                  <Catalyst.DescriptionTerm>Address</Catalyst.DescriptionTerm>
                  <Catalyst.DescriptionDetails>
                    {selectedUser.address.street}, {selectedUser.address.city}
                  </Catalyst.DescriptionDetails>
                </Catalyst.DescriptionList>
              ) : (
                <Catalyst.Text className="text-zinc-500 text-center py-8">
                  Select a user to view details
                </Catalyst.Text>
              )}
            </Catalyst.CardContent>
          </Catalyst.Card>
        </div>
      </div>
    </div>
  )
}