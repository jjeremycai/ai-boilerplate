import { createFileRoute, Link } from '@tanstack/react-router'
import { Catalyst } from '@cai/ui-tw'
import { SEO } from '~/components/SEO'
import { UserAvatar } from '~/components/UserAvatar'

// Static data that could be cached at the edge
const teamMembers = [
  {
    id: '1',
    name: 'Sarah Chen',
    role: 'Founder & CEO',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop',
    bio: 'Sarah has over 10 years of experience in building scalable web applications.',
    socials: {
      twitter: 'sarahchen',
      linkedin: 'sarahchen',
    },
  },
  {
    id: '2',
    name: 'Alex Rodriguez',
    role: 'CTO',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop',
    bio: 'Alex is passionate about edge computing and distributed systems.',
    socials: {
      github: 'alexrodriguez',
      linkedin: 'alexrodriguez',
    },
  },
  {
    id: '3',
    name: 'Emily Johnson',
    role: 'Head of Design',
    image: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop',
    bio: 'Emily creates beautiful, accessible designs that users love.',
    socials: {
      twitter: 'emilyjohnson',
      dribbble: 'emilyjohnson',
    },
  },
  {
    id: '4',
    name: 'Marcus Kim',
    role: 'Lead Engineer',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop',
    bio: 'Marcus specializes in React and TypeScript development.',
    socials: {
      github: 'marcuskim',
      twitter: 'marcuskim',
    },
  },
]

const stats = [
  { label: 'Active Users', value: '100K+' },
  { label: 'Requests/sec', value: '50K' },
  { label: 'Global Regions', value: '12' },
  { label: 'Uptime', value: '99.99%' },
]

const values = [
  {
    title: 'Performance First',
    description: 'We believe in building applications that are fast by default, leveraging edge computing for the best user experience.',
    icon: '⚡',
  },
  {
    title: 'Developer Experience',
    description: 'Our tools are designed to make developers productive and happy, with great documentation and intuitive APIs.',
    icon: '💻',
  },
  {
    title: 'Open Source',
    description: 'We contribute to and maintain open source projects, believing in the power of community-driven development.',
    icon: '🌍',
  },
  {
    title: 'Security & Privacy',
    description: 'User data protection is paramount. We implement best practices and regular security audits.',
    icon: '🔒',
  },
]

// Route configuration
export const Route = createFileRoute('/about')({
  // Static page - great for edge caching
  meta: () => [
    { title: 'About Us - TanStack D1 Stack' },
    { name: 'description', content: 'Learn about our mission, team, and values' },
  ],
  component: AboutPage,
})

function AboutPage() {
  return (
    <>
      <SEO 
        title="About Us"
        description="Learn about our mission to build the future of edge-first applications with TanStack and Cloudflare"
      />
      
      <div className="min-h-screen bg-white dark:bg-gray-900">
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-600 to-purple-700 text-white">
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
            <Catalyst.Heading level={1} className="text-5xl font-bold mb-6 text-white">
              Building the Future of Edge Computing
            </Catalyst.Heading>
            <Catalyst.Text className="text-xl max-w-3xl mx-auto text-blue-100">
              We're on a mission to make web applications faster, more scalable, and easier to build
              by leveraging the power of edge computing and modern development tools.
            </Catalyst.Text>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {stat.value}
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section className="py-20">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Catalyst.Heading level={2} className="text-3xl font-bold mb-6">
              Our Mission
            </Catalyst.Heading>
            <Catalyst.Text className="text-lg text-gray-600 dark:text-gray-400 mb-8">
              We believe that modern web applications should be fast, secure, and scalable by default.
              By combining the power of TanStack's cutting-edge frontend tools with Cloudflare's global
              edge network, we're making it easier than ever to build applications that deliver
              exceptional user experiences worldwide.
            </Catalyst.Text>
            <div className="flex justify-center gap-4">
              <Link to="/sign-up">
                <Catalyst.Button size="lg">Get Started</Catalyst.Button>
              </Link>
              <Link to="/docs">
                <Catalyst.Button color="white" size="lg">Read Docs</Catalyst.Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 bg-gray-50 dark:bg-gray-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Catalyst.Heading level={2} className="text-3xl font-bold text-center mb-12">
              Our Values
            </Catalyst.Heading>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {values.map((value) => (
                <Catalyst.Card key={value.title} className="text-center">
                  <Catalyst.CardContent className="p-6">
                    <div className="text-4xl mb-4">{value.icon}</div>
                    <Catalyst.Heading level={3} className="mb-3">
                      {value.title}
                    </Catalyst.Heading>
                    <Catalyst.Text className="text-gray-600 dark:text-gray-400">
                      {value.description}
                    </Catalyst.Text>
                  </Catalyst.CardContent>
                </Catalyst.Card>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <Catalyst.Heading level={2} className="text-3xl font-bold mb-4">
                Meet Our Team
              </Catalyst.Heading>
              <Catalyst.Text className="text-lg text-gray-600 dark:text-gray-400">
                The passionate people behind TanStack D1 Stack
              </Catalyst.Text>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {teamMembers.map((member) => (
                <Catalyst.Card key={member.id} className="text-center">
                  <Catalyst.CardContent className="p-6">
                    <div className="mb-4">
                      <UserAvatar
                        user={member}
                        size="xl"
                        className="mx-auto"
                      />
                    </div>
                    <Catalyst.Heading level={3} className="mb-1">
                      {member.name}
                    </Catalyst.Heading>
                    <Catalyst.Text className="text-blue-600 dark:text-blue-400 mb-3">
                      {member.role}
                    </Catalyst.Text>
                    <Catalyst.Text className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      {member.bio}
                    </Catalyst.Text>
                    <div className="flex justify-center gap-3">
                      {member.socials.twitter && (
                        <Catalyst.Link
                          href={`https://twitter.com/${member.socials.twitter}`}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <span className="sr-only">Twitter</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                          </svg>
                        </Catalyst.Link>
                      )}
                      {member.socials.github && (
                        <Catalyst.Link
                          href={`https://github.com/${member.socials.github}`}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <span className="sr-only">GitHub</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                          </svg>
                        </Catalyst.Link>
                      )}
                      {member.socials.linkedin && (
                        <Catalyst.Link
                          href={`https://linkedin.com/in/${member.socials.linkedin}`}
                          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          <span className="sr-only">LinkedIn</span>
                          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                          </svg>
                        </Catalyst.Link>
                      )}
                    </div>
                  </Catalyst.CardContent>
                </Catalyst.Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <Catalyst.Heading level={2} className="text-3xl font-bold mb-4 text-white">
              Ready to Get Started?
            </Catalyst.Heading>
            <Catalyst.Text className="text-xl mb-8 text-blue-100">
              Join thousands of developers building the next generation of web applications
            </Catalyst.Text>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/sign-up">
                <Catalyst.Button color="white" size="lg">
                  Start Building
                </Catalyst.Button>
              </Link>
              <Link to="/contact">
                <Catalyst.Button 
                  size="lg" 
                  className="bg-transparent border-2 border-white hover:bg-white/10"
                >
                  Contact Sales
                </Catalyst.Button>
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  )
}