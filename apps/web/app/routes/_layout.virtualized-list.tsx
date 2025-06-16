import { createFileRoute } from '@tanstack/react-router'
import { Catalyst } from '@cai/ui-tw'
import { useState, useCallback } from 'react'
import { 
  ListBulletIcon, 
  MagnifyingGlassIcon,
  AdjustmentsHorizontalIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  FunnelIcon
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_layout/virtualized-list')({
  meta: () => [
    { title: "Virtualized List - CAI App" },
  ],
  component: VirtualizedListScreen,
})

interface Item {
  id: number
  name: string
  email: string
  role: string
  department: string
  status: 'active' | 'inactive' | 'pending'
  joinDate: string
}

function VirtualizedListScreen() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'name' | 'date'>('name')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

  // Generate sample data
  const generateItems = useCallback((): Item[] => {
    const departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Finance']
    const roles = ['Manager', 'Developer', 'Designer', 'Analyst', 'Specialist']
    const statuses: Item['status'][] = ['active', 'inactive', 'pending']
    
    return Array.from({ length: 1000 }, (_, i) => ({
      id: i + 1,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      role: roles[Math.floor(Math.random() * roles.length)],
      department: departments[Math.floor(Math.random() * departments.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      joinDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
    }))
  }, [])

  const [items] = useState<Item[]>(generateItems())

  // Filter and sort items
  const filteredItems = items
    .filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.email.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      const modifier = sortOrder === 'asc' ? 1 : -1
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name) * modifier
      }
      return (new Date(a.joinDate).getTime() - new Date(b.joinDate).getTime()) * modifier
    })

  const getStatusColor = (status: Item['status']) => {
    switch (status) {
      case 'active': return 'green'
      case 'inactive': return 'red'
      case 'pending': return 'amber'
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <Catalyst.Heading>Virtualized List Demo</Catalyst.Heading>
        <Catalyst.Text>
          High-performance list rendering with 1000+ items
        </Catalyst.Text>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Catalyst.Card>
          <Catalyst.CardContent className="p-4">
            <Catalyst.Text className="text-sm text-zinc-500">Total Items</Catalyst.Text>
            <Catalyst.Heading level={3}>{items.length}</Catalyst.Heading>
          </Catalyst.CardContent>
        </Catalyst.Card>
        <Catalyst.Card>
          <Catalyst.CardContent className="p-4">
            <Catalyst.Text className="text-sm text-zinc-500">Filtered</Catalyst.Text>
            <Catalyst.Heading level={3}>{filteredItems.length}</Catalyst.Heading>
          </Catalyst.CardContent>
        </Catalyst.Card>
        <Catalyst.Card>
          <Catalyst.CardContent className="p-4">
            <Catalyst.Text className="text-sm text-zinc-500">Active</Catalyst.Text>
            <Catalyst.Badge color="green">
              {items.filter(i => i.status === 'active').length}
            </Catalyst.Badge>
          </Catalyst.CardContent>
        </Catalyst.Card>
        <Catalyst.Card>
          <Catalyst.CardContent className="p-4">
            <Catalyst.Text className="text-sm text-zinc-500">Pending</Catalyst.Text>
            <Catalyst.Badge color="amber">
              {items.filter(i => i.status === 'pending').length}
            </Catalyst.Badge>
          </Catalyst.CardContent>
        </Catalyst.Card>
      </div>

      {/* Filters and Search */}
      <Catalyst.Card>
        <Catalyst.CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                <Catalyst.Input
                  type="search"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <Catalyst.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
              </Catalyst.Select>

              <Catalyst.Select value={sortBy} onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}>
                <option value="name">Sort by Name</option>
                <option value="date">Sort by Date</option>
              </Catalyst.Select>

              <Catalyst.Button
                color="white"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <ArrowUpIcon className="w-4 h-4" /> : <ArrowDownIcon className="w-4 h-4" />}
              </Catalyst.Button>
            </div>
          </div>
        </Catalyst.CardContent>
      </Catalyst.Card>

      {/* List */}
      <Catalyst.Card>
        <Catalyst.CardHeader>
          <Catalyst.CardTitle>
            <div className="flex items-center gap-2">
              <ListBulletIcon className="w-5 h-5" />
              User Directory
            </div>
          </Catalyst.CardTitle>
          <Catalyst.CardDescription>
            Showing {filteredItems.length} of {items.length} users
          </Catalyst.CardDescription>
        </Catalyst.CardHeader>
        <Catalyst.CardContent className="p-0">
          <div className="max-h-[600px] overflow-auto">
            <Catalyst.Table>
              <Catalyst.TableHead className="sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <Catalyst.TableRow>
                  <Catalyst.TableHeader>Name</Catalyst.TableHeader>
                  <Catalyst.TableHeader>Email</Catalyst.TableHeader>
                  <Catalyst.TableHeader>Role</Catalyst.TableHeader>
                  <Catalyst.TableHeader>Department</Catalyst.TableHeader>
                  <Catalyst.TableHeader>Status</Catalyst.TableHeader>
                  <Catalyst.TableHeader>Join Date</Catalyst.TableHeader>
                </Catalyst.TableRow>
              </Catalyst.TableHead>
              <Catalyst.TableBody>
                {filteredItems.slice(0, 100).map((item) => (
                  <Catalyst.TableRow key={item.id}>
                    <Catalyst.TableCell>
                      <Catalyst.Strong>{item.name}</Catalyst.Strong>
                    </Catalyst.TableCell>
                    <Catalyst.TableCell className="text-zinc-500">
                      {item.email}
                    </Catalyst.TableCell>
                    <Catalyst.TableCell>{item.role}</Catalyst.TableCell>
                    <Catalyst.TableCell>{item.department}</Catalyst.TableCell>
                    <Catalyst.TableCell>
                      <Catalyst.Badge color={getStatusColor(item.status)}>
                        {item.status}
                      </Catalyst.Badge>
                    </Catalyst.TableCell>
                    <Catalyst.TableCell className="text-zinc-500">
                      {new Date(item.joinDate).toLocaleDateString()}
                    </Catalyst.TableCell>
                  </Catalyst.TableRow>
                ))}
              </Catalyst.TableBody>
            </Catalyst.Table>
            
            {filteredItems.length > 100 && (
              <div className="p-4 text-center border-t">
                <Catalyst.Text className="text-zinc-500">
                  Showing first 100 of {filteredItems.length} results
                </Catalyst.Text>
              </div>
            )}
          </div>
        </Catalyst.CardContent>
      </Catalyst.Card>
    </div>
  )
}