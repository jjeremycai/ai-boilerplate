import { createFileRoute } from '@tanstack/react-router'
import { Catalyst } from '@cai/ui-tw'
import { 
  ChartBarIcon, 
  UsersIcon, 
  CurrencyDollarIcon,
  ArrowTrendingUpIcon,
  DocumentTextIcon,
  BellIcon,
  InboxIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_layout/_index')({
  meta: () => [
    { title: "Dashboard - CAI App" },
  ],
  component: DashboardScreen,
})

function DashboardScreen() {
  const stats = [
    { name: 'Total Revenue', value: '$45,231', change: '+12.5%', icon: CurrencyDollarIcon },
    { name: 'Active Users', value: '2,843', change: '+5.4%', icon: UsersIcon },
    { name: 'Conversion Rate', value: '3.24%', change: '+0.4%', icon: ChartBarIcon },
    { name: 'Avg. Order Value', value: '$68.41', change: '+2.3%', icon: ArrowTrendingUpIcon },
  ]

  const activities = [
    { id: 1, type: 'user', message: 'New user registration', user: 'Sarah Johnson', time: '2 min ago' },
    { id: 2, type: 'order', message: 'New order placed', user: 'Michael Chen', time: '5 min ago' },
    { id: 3, type: 'comment', message: 'Comment on Product #1234', user: 'Emily Davis', time: '12 min ago' },
    { id: 4, type: 'user', message: 'User upgraded to Pro', user: 'Robert Wilson', time: '1 hour ago' },
  ]

  const notifications = [
    { id: 1, title: 'Server maintenance scheduled', message: 'Planned maintenance on Jan 20th', type: 'info' },
    { id: 2, title: 'New feature available', message: 'Dark mode is now available for all users', type: 'success' },
    { id: 3, title: 'Payment method expiring', message: 'Credit card ending in 4242 expires next month', type: 'warning' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <Catalyst.Heading>Dashboard</Catalyst.Heading>
        <Catalyst.Text>Welcome back! Here's what's happening with your business today.</Catalyst.Text>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Catalyst.Card key={stat.name}>
            <Catalyst.CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <Catalyst.Text className="text-sm text-zinc-500">{stat.name}</Catalyst.Text>
                  <Catalyst.Heading level={3} className="mt-1">{stat.value}</Catalyst.Heading>
                  <Catalyst.Badge color={stat.change.startsWith('+') ? 'green' : 'red'} className="mt-2">
                    {stat.change}
                  </Catalyst.Badge>
                </div>
                <stat.icon className="w-8 h-8 text-zinc-400" />
              </div>
            </Catalyst.CardContent>
          </Catalyst.Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <Catalyst.Card>
            <Catalyst.CardHeader>
              <Catalyst.CardTitle>Recent Activity</Catalyst.CardTitle>
              <Catalyst.CardDescription>Latest updates from your platform</Catalyst.CardDescription>
            </Catalyst.CardHeader>
            <Catalyst.CardContent className="p-0">
              <Catalyst.Table>
                <Catalyst.TableHead>
                  <Catalyst.TableRow>
                    <Catalyst.TableHeader>Event</Catalyst.TableHeader>
                    <Catalyst.TableHeader>User</Catalyst.TableHeader>
                    <Catalyst.TableHeader className="text-right">Time</Catalyst.TableHeader>
                  </Catalyst.TableRow>
                </Catalyst.TableHead>
                <Catalyst.TableBody>
                  {activities.map((activity) => (
                    <Catalyst.TableRow key={activity.id}>
                      <Catalyst.TableCell>
                        <div className="flex items-center gap-3">
                          {activity.type === 'user' && <UsersIcon className="w-5 h-5 text-blue-500" />}
                          {activity.type === 'order' && <CurrencyDollarIcon className="w-5 h-5 text-green-500" />}
                          {activity.type === 'comment' && <DocumentTextIcon className="w-5 h-5 text-purple-500" />}
                          <Catalyst.Text>{activity.message}</Catalyst.Text>
                        </div>
                      </Catalyst.TableCell>
                      <Catalyst.TableCell>
                        <Catalyst.Strong>{activity.user}</Catalyst.Strong>
                      </Catalyst.TableCell>
                      <Catalyst.TableCell className="text-right text-zinc-500">
                        {activity.time}
                      </Catalyst.TableCell>
                    </Catalyst.TableRow>
                  ))}
                </Catalyst.TableBody>
              </Catalyst.Table>
            </Catalyst.CardContent>
          </Catalyst.Card>
        </div>

        {/* Notifications */}
        <div>
          <Catalyst.Card>
            <Catalyst.CardHeader>
              <Catalyst.CardTitle>
                <div className="flex items-center gap-2">
                  <BellIcon className="w-5 h-5" />
                  Notifications
                </div>
              </Catalyst.CardTitle>
            </Catalyst.CardHeader>
            <Catalyst.CardContent className="space-y-4">
              {notifications.map((notification) => (
                <Catalyst.Alert key={notification.id} className="relative">
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      {notification.type === 'success' && <CheckCircleIcon className="w-5 h-5 text-green-500" />}
                      {notification.type === 'info' && <InboxIcon className="w-5 h-5 text-blue-500" />}
                      {notification.type === 'warning' && <BellIcon className="w-5 h-5 text-amber-500" />}
                    </div>
                    <div className="flex-1">
                      <Catalyst.Strong>{notification.title}</Catalyst.Strong>
                      <Catalyst.Text className="text-sm text-zinc-600 mt-1">
                        {notification.message}
                      </Catalyst.Text>
                    </div>
                  </div>
                </Catalyst.Alert>
              ))}
            </Catalyst.CardContent>
          </Catalyst.Card>
        </div>
      </div>

      {/* Quick Actions */}
      <Catalyst.Card>
        <Catalyst.CardHeader>
          <Catalyst.CardTitle>Quick Actions</Catalyst.CardTitle>
        </Catalyst.CardHeader>
        <Catalyst.CardContent>
          <div className="flex flex-wrap gap-3">
            <Catalyst.Button>Create New User</Catalyst.Button>
            <Catalyst.Button color="zinc">Generate Report</Catalyst.Button>
            <Catalyst.Button color="white">Export Data</Catalyst.Button>
            <Catalyst.Link href="/settings" className="inline-flex items-center">
              View Settings →
            </Catalyst.Link>
          </div>
        </Catalyst.CardContent>
      </Catalyst.Card>
    </div>
  )
}