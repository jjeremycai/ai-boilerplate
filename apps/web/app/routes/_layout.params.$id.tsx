import { createFileRoute } from '@tanstack/react-router'
import { Catalyst } from '@cai/ui-tw'
import { 
  UserIcon, 
  EnvelopeIcon, 
  PhoneIcon,
  MapPinIcon,
  BriefcaseIcon,
  CalendarIcon,
  CheckBadgeIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline'

export const Route = createFileRoute('/_layout/params/$id')({
  meta: () => [
    { title: "User Details - CAI App" },
  ],
  component: UserDetailScreen,
})

function UserDetailScreen() {
  const { id } = Route.useParams()
  
  // Mock user data based on ID
  const user = {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
    phone: '+1 (555) 123-4567',
    role: 'Senior Developer',
    department: 'Engineering',
    location: 'San Francisco, CA',
    joinDate: '2023-01-15',
    status: 'active',
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${id}`,
    bio: 'Passionate developer with expertise in React, TypeScript, and cloud technologies. Love building scalable applications and mentoring junior developers.',
    skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker', 'GraphQL'],
    stats: {
      projects: 24,
      commits: 1847,
      reviews: 392,
      mentees: 8
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <Catalyst.Heading>User Profile</Catalyst.Heading>
          <Catalyst.Text>Viewing details for user ID: {id}</Catalyst.Text>
        </div>
        <div className="flex gap-2">
          <Catalyst.Button color="white">Edit Profile</Catalyst.Button>
          <Catalyst.Button>Send Message</Catalyst.Button>
        </div>
      </div>

      {/* Profile Header */}
      <Catalyst.Card>
        <Catalyst.CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-24 h-24 rounded-full bg-zinc-100"
            />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <Catalyst.Heading level={2}>{user.name}</Catalyst.Heading>
                  <Catalyst.Text className="text-lg text-zinc-600 dark:text-zinc-400">
                    {user.role} • {user.department}
                  </Catalyst.Text>
                  <div className="flex items-center gap-2 mt-2">
                    <Catalyst.Badge color="green">
                      <CheckBadgeIcon className="w-4 h-4 mr-1" />
                      {user.status}
                    </Catalyst.Badge>
                    <Catalyst.Text className="text-sm text-zinc-500">
                      Joined {new Date(user.joinDate).toLocaleDateString()}
                    </Catalyst.Text>
                  </div>
                </div>
              </div>
              <Catalyst.Text className="mt-4 text-zinc-600 dark:text-zinc-400">
                {user.bio}
              </Catalyst.Text>
            </div>
          </div>
        </Catalyst.CardContent>
      </Catalyst.Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact Information */}
        <div className="lg:col-span-1">
          <Catalyst.Card>
            <Catalyst.CardHeader>
              <Catalyst.CardTitle>Contact Information</Catalyst.CardTitle>
            </Catalyst.CardHeader>
            <Catalyst.CardContent>
              <Catalyst.DescriptionList>
                <Catalyst.DescriptionTerm>
                  <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                  Email
                </Catalyst.DescriptionTerm>
                <Catalyst.DescriptionDetails>
                  <Catalyst.Link href={`mailto:${user.email}`}>{user.email}</Catalyst.Link>
                </Catalyst.DescriptionDetails>

                <Catalyst.DescriptionTerm>
                  <PhoneIcon className="w-4 h-4 inline mr-2" />
                  Phone
                </Catalyst.DescriptionTerm>
                <Catalyst.DescriptionDetails>{user.phone}</Catalyst.DescriptionDetails>

                <Catalyst.DescriptionTerm>
                  <MapPinIcon className="w-4 h-4 inline mr-2" />
                  Location
                </Catalyst.DescriptionTerm>
                <Catalyst.DescriptionDetails>{user.location}</Catalyst.DescriptionDetails>

                <Catalyst.DescriptionTerm>
                  <BriefcaseIcon className="w-4 h-4 inline mr-2" />
                  Department
                </Catalyst.DescriptionTerm>
                <Catalyst.DescriptionDetails>{user.department}</Catalyst.DescriptionDetails>

                <Catalyst.DescriptionTerm>
                  <CalendarIcon className="w-4 h-4 inline mr-2" />
                  Join Date
                </Catalyst.DescriptionTerm>
                <Catalyst.DescriptionDetails>
                  {new Date(user.joinDate).toLocaleDateString()}
                </Catalyst.DescriptionDetails>
              </Catalyst.DescriptionList>
            </Catalyst.CardContent>
          </Catalyst.Card>

          {/* Skills */}
          <Catalyst.Card className="mt-6">
            <Catalyst.CardHeader>
              <Catalyst.CardTitle>Skills</Catalyst.CardTitle>
            </Catalyst.CardHeader>
            <Catalyst.CardContent>
              <div className="flex flex-wrap gap-2">
                {user.skills.map((skill) => (
                  <Catalyst.Badge key={skill} color="blue">
                    {skill}
                  </Catalyst.Badge>
                ))}
              </div>
            </Catalyst.CardContent>
          </Catalyst.Card>
        </div>

        {/* Stats and Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Catalyst.Card>
              <Catalyst.CardContent className="p-4 text-center">
                <Catalyst.Text className="text-2xl font-bold">{user.stats.projects}</Catalyst.Text>
                <Catalyst.Text className="text-sm text-zinc-500">Projects</Catalyst.Text>
              </Catalyst.CardContent>
            </Catalyst.Card>
            <Catalyst.Card>
              <Catalyst.CardContent className="p-4 text-center">
                <Catalyst.Text className="text-2xl font-bold">{user.stats.commits}</Catalyst.Text>
                <Catalyst.Text className="text-sm text-zinc-500">Commits</Catalyst.Text>
              </Catalyst.CardContent>
            </Catalyst.Card>
            <Catalyst.Card>
              <Catalyst.CardContent className="p-4 text-center">
                <Catalyst.Text className="text-2xl font-bold">{user.stats.reviews}</Catalyst.Text>
                <Catalyst.Text className="text-sm text-zinc-500">Reviews</Catalyst.Text>
              </Catalyst.CardContent>
            </Catalyst.Card>
            <Catalyst.Card>
              <Catalyst.CardContent className="p-4 text-center">
                <Catalyst.Text className="text-2xl font-bold">{user.stats.mentees}</Catalyst.Text>
                <Catalyst.Text className="text-sm text-zinc-500">Mentees</Catalyst.Text>
              </Catalyst.CardContent>
            </Catalyst.Card>
          </div>

          {/* Recent Activity */}
          <Catalyst.Card>
            <Catalyst.CardHeader>
              <Catalyst.CardTitle>Recent Activity</Catalyst.CardTitle>
              <Catalyst.CardDescription>Latest contributions and updates</Catalyst.CardDescription>
            </Catalyst.CardHeader>
            <Catalyst.CardContent>
              <div className="space-y-4">
                {[
                  { action: 'Pushed code to', project: 'web-app', time: '2 hours ago', icon: ChartBarIcon },
                  { action: 'Reviewed PR in', project: 'api-service', time: '5 hours ago', icon: CheckBadgeIcon },
                  { action: 'Created issue in', project: 'mobile-app', time: '1 day ago', icon: UserIcon },
                  { action: 'Merged PR in', project: 'design-system', time: '2 days ago', icon: CheckBadgeIcon },
                ].map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 py-3 border-b last:border-0">
                    <activity.icon className="w-5 h-5 text-zinc-400" />
                    <div className="flex-1">
                      <Catalyst.Text>
                        {activity.action} <Catalyst.Strong>{activity.project}</Catalyst.Strong>
                      </Catalyst.Text>
                      <Catalyst.Text className="text-sm text-zinc-500">{activity.time}</Catalyst.Text>
                    </div>
                  </div>
                ))}
              </div>
            </Catalyst.CardContent>
          </Catalyst.Card>
        </div>
      </div>
    </div>
  )
}