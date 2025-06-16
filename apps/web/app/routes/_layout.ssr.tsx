import { createFileRoute } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'
import { Catalyst } from '@cai/ui-tw'
import { 
  ServerIcon, 
  CloudIcon, 
  BoltIcon,
  CpuChipIcon,
  ClockIcon,
  GlobeAltIcon
} from '@heroicons/react/24/outline'

const getServerData = createServerFn(
  'GET',
  async () => {
    // Simulate server-side data fetching
    const timestamp = new Date().toISOString()
    const randomLatency = Math.floor(Math.random() * 100) + 50
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, randomLatency))
    
    return { 
      content: 'This content was rendered on the server at Cloudflare edge locations!',
      timestamp,
      latency: randomLatency,
      location: 'Cloudflare Edge',
      nodeVersion: process.version || 'N/A',
      environment: process.env.NODE_ENV || 'production'
    }
  }
)

export const Route = createFileRoute('/_layout/ssr')({
  meta: () => [
    { title: "Server-Side Rendering - CAI App" },
  ],
  loader: () => getServerData(),
  component: SSRComponent,
})

function SSRComponent() {
  const data = Route.useLoaderData()
  
  const features = [
    {
      icon: ServerIcon,
      title: 'Edge Computing',
      description: 'Rendered at Cloudflare edge locations worldwide for minimal latency'
    },
    {
      icon: BoltIcon,
      title: 'Instant Loading',
      description: 'Pre-rendered HTML delivered directly from the server'
    },
    {
      icon: CloudIcon,
      title: 'Global CDN',
      description: 'Cached and served from 300+ data centers globally'
    },
    {
      icon: CpuChipIcon,
      title: 'Optimized Performance',
      description: 'Server-rendered for better SEO and initial page load'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div>
        <Catalyst.Heading>Server-Side Rendering Demo</Catalyst.Heading>
        <Catalyst.Text>
          This page demonstrates SSR with TanStack Start on Cloudflare Workers
        </Catalyst.Text>
      </div>

      {/* Server Info Alert */}
      <Catalyst.Alert color="blue">
        <ServerIcon className="w-5 h-5" />
        <div>
          <Catalyst.AlertTitle>Server-Rendered Content</Catalyst.AlertTitle>
          <Catalyst.AlertDescription>
            {data.content}
          </Catalyst.AlertDescription>
        </div>
      </Catalyst.Alert>

      {/* Server Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Catalyst.Card>
          <Catalyst.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Catalyst.Text className="text-sm text-zinc-500">Render Time</Catalyst.Text>
                <Catalyst.Heading level={3}>{data.latency}ms</Catalyst.Heading>
              </div>
              <ClockIcon className="w-8 h-8 text-blue-500" />
            </div>
          </Catalyst.CardContent>
        </Catalyst.Card>

        <Catalyst.Card>
          <Catalyst.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Catalyst.Text className="text-sm text-zinc-500">Location</Catalyst.Text>
                <Catalyst.Badge color="green">{data.location}</Catalyst.Badge>
              </div>
              <GlobeAltIcon className="w-8 h-8 text-green-500" />
            </div>
          </Catalyst.CardContent>
        </Catalyst.Card>

        <Catalyst.Card>
          <Catalyst.CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <Catalyst.Text className="text-sm text-zinc-500">Environment</Catalyst.Text>
                <Catalyst.Text className="font-semibold capitalize">{data.environment}</Catalyst.Text>
              </div>
              <ServerIcon className="w-8 h-8 text-purple-500" />
            </div>
          </Catalyst.CardContent>
        </Catalyst.Card>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {features.map((feature, index) => (
          <Catalyst.Card key={index}>
            <Catalyst.CardContent className="p-6">
              <div className="flex gap-4">
                <div className="flex-shrink-0">
                  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <feature.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                </div>
                <div>
                  <Catalyst.Heading level={3}>{feature.title}</Catalyst.Heading>
                  <Catalyst.Text className="mt-1 text-zinc-600 dark:text-zinc-400">
                    {feature.description}
                  </Catalyst.Text>
                </div>
              </div>
            </Catalyst.CardContent>
          </Catalyst.Card>
        ))}
      </div>

      {/* Technical Details */}
      <Catalyst.Card>
        <Catalyst.CardHeader>
          <Catalyst.CardTitle>Technical Details</Catalyst.CardTitle>
          <Catalyst.CardDescription>
            Server-side rendering information
          </Catalyst.CardDescription>
        </Catalyst.CardHeader>
        <Catalyst.CardContent>
          <Catalyst.DescriptionList>
            <Catalyst.DescriptionTerm>Rendered At</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>
              {new Date(data.timestamp).toLocaleString()}
            </Catalyst.DescriptionDetails>

            <Catalyst.DescriptionTerm>Node Version</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>{data.nodeVersion}</Catalyst.DescriptionDetails>

            <Catalyst.DescriptionTerm>Server Latency</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>{data.latency}ms</Catalyst.DescriptionDetails>

            <Catalyst.DescriptionTerm>Deployment</Catalyst.DescriptionTerm>
            <Catalyst.DescriptionDetails>Cloudflare Workers</Catalyst.DescriptionDetails>
          </Catalyst.DescriptionList>
        </Catalyst.CardContent>
      </Catalyst.Card>
    </div>
  )
}