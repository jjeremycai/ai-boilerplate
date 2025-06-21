import { createFileRoute, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Catalyst } from '@cai/ui-tw'
import { useSession, signOut } from '@cai/app/utils/auth/client'
import { SEO } from '~/components/SEO'
import { UserAvatar } from '~/components/UserAvatar'
import { LoadingSpinner } from '~/components/LoadingSpinner'
import { ErrorBoundary } from '~/components/ErrorBoundary'

// Route configuration
export const Route = createFileRoute('/(app)/settings')({
  beforeLoad: async ({ context }) => {
    // Ensure user is authenticated
    const session = await context.auth?.getSession()
    if (!session) {
      throw new Error('redirect:/sign-in?redirect=/settings')
    }
  },
  loader: async ({ context }) => {
    // Load user preferences and settings in parallel
    const [profile, preferences, sessions] = await Promise.all([
      context.trpc.user.getProfile.query(),
      context.trpc.user.getPreferences.query(),
      context.trpc.user.getSessions.query(),
    ])
    
    return { profile, preferences, sessions }
  },
  errorComponent: ({ error }) => {
    if (error.message.startsWith('redirect:')) {
      const redirectUrl = error.message.replace('redirect:', '')
      window.location.href = redirectUrl
      return null
    }
    return <ErrorBoundary><div>Error: {error.message}</div></ErrorBoundary>
  },
  component: SettingsPage,
})

function SettingsPage() {
  const router = useRouter()
  const { data: session } = useSession()
  const { profile, preferences, sessions } = Route.useLoaderData()
  
  const [activeTab, setActiveTab] = useState<'profile' | 'account' | 'notifications' | 'privacy'>('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  
  // Profile form state
  const [profileForm, setProfileForm] = useState({
    name: profile.name || '',
    bio: profile.bio || '',
    website: profile.website || '',
    location: profile.location || '',
  })
  
  // Notification preferences
  const [notifications, setNotifications] = useState({
    emailNewsletter: preferences.emailNewsletter ?? true,
    emailComments: preferences.emailComments ?? true,
    emailMentions: preferences.emailMentions ?? true,
    pushNotifications: preferences.pushNotifications ?? false,
  })
  
  // Privacy settings
  const [privacy, setPrivacy] = useState({
    profileVisibility: preferences.profileVisibility || 'public',
    showEmail: preferences.showEmail ?? false,
    allowMessages: preferences.allowMessages ?? true,
  })

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccessMessage(null)
    
    try {
      await context.trpc.user.updateProfile.mutate(profileForm)
      setSuccessMessage('Profile updated successfully!')
    } catch (error) {
      console.error('Failed to update profile:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleNotificationUpdate = async () => {
    setIsLoading(true)
    setSuccessMessage(null)
    
    try {
      await context.trpc.user.updatePreferences.mutate({ notifications })
      setSuccessMessage('Notification preferences updated!')
    } catch (error) {
      console.error('Failed to update notifications:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePrivacyUpdate = async () => {
    setIsLoading(true)
    setSuccessMessage(null)
    
    try {
      await context.trpc.user.updatePreferences.mutate({ privacy })
      setSuccessMessage('Privacy settings updated!')
    } catch (error) {
      console.error('Failed to update privacy settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.navigate({ to: '/' })
  }

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await context.trpc.user.revokeSession.mutate({ sessionId })
      // Refresh sessions list
      router.invalidate()
    } catch (error) {
      console.error('Failed to revoke session:', error)
    }
  }

  return (
    <>
      <SEO 
        title="Settings"
        description="Manage your account settings, preferences, and privacy"
      />
      
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <Catalyst.Heading level={1} className="text-3xl font-bold">
              Settings
            </Catalyst.Heading>
            <Catalyst.Text className="mt-2 text-gray-600 dark:text-gray-400">
              Manage your account settings and preferences
            </Catalyst.Text>
          </div>

          {/* Success Message */}
          {successMessage && (
            <Catalyst.Alert color="green" className="mb-6">
              <Catalyst.AlertTitle>Success</Catalyst.AlertTitle>
              <Catalyst.AlertDescription>{successMessage}</Catalyst.AlertDescription>
            </Catalyst.Alert>
          )}

          {/* Tabs */}
          <div className="flex space-x-1 mb-8 border-b border-gray-200 dark:border-gray-700">
            {[
              { id: 'profile', label: 'Profile' },
              { id: 'account', label: 'Account' },
              { id: 'notifications', label: 'Notifications' },
              { id: 'privacy', label: 'Privacy' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <Catalyst.Card>
            <Catalyst.CardContent className="p-6">
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <form onSubmit={handleProfileUpdate} className="space-y-6">
                  <div className="flex items-center gap-6 mb-6">
                    <UserAvatar user={session?.user} size="xl" />
                    <div>
                      <Catalyst.Button type="button" color="white">
                        Change Avatar
                      </Catalyst.Button>
                      <Catalyst.Text className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        JPG, GIF or PNG. Max size 2MB.
                      </Catalyst.Text>
                    </div>
                  </div>

                  <Catalyst.Fieldset>
                    <Catalyst.FieldGroup>
                      <Catalyst.Field>
                        <Catalyst.Label htmlFor="name">Display Name</Catalyst.Label>
                        <Catalyst.Input
                          id="name"
                          value={profileForm.name}
                          onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </Catalyst.Field>

                      <Catalyst.Field>
                        <Catalyst.Label htmlFor="bio">Bio</Catalyst.Label>
                        <Catalyst.Textarea
                          id="bio"
                          value={profileForm.bio}
                          onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                          placeholder="Tell us about yourself..."
                          rows={4}
                        />
                        <Catalyst.Description>
                          Brief description for your profile. Max 160 characters.
                        </Catalyst.Description>
                      </Catalyst.Field>

                      <Catalyst.Field>
                        <Catalyst.Label htmlFor="website">Website</Catalyst.Label>
                        <Catalyst.Input
                          id="website"
                          type="url"
                          value={profileForm.website}
                          onChange={(e) => setProfileForm({ ...profileForm, website: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </Catalyst.Field>

                      <Catalyst.Field>
                        <Catalyst.Label htmlFor="location">Location</Catalyst.Label>
                        <Catalyst.Input
                          id="location"
                          value={profileForm.location}
                          onChange={(e) => setProfileForm({ ...profileForm, location: e.target.value })}
                          placeholder="San Francisco, CA"
                        />
                      </Catalyst.Field>
                    </Catalyst.FieldGroup>
                  </Catalyst.Fieldset>

                  <div className="flex justify-end">
                    <Catalyst.Button type="submit" disabled={isLoading}>
                      {isLoading ? <LoadingSpinner size="sm" color="white" /> : 'Save Changes'}
                    </Catalyst.Button>
                  </div>
                </form>
              )}

              {/* Account Tab */}
              {activeTab === 'account' && (
                <div className="space-y-8">
                  {/* Email Section */}
                  <div>
                    <Catalyst.Heading level={3} className="mb-4">
                      Email Address
                    </Catalyst.Heading>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div>
                        <Catalyst.Text className="font-medium">{session?.user.email}</Catalyst.Text>
                        <Catalyst.Text className="text-sm text-gray-600 dark:text-gray-400">
                          Your primary email address
                        </Catalyst.Text>
                      </div>
                      <Catalyst.Button color="white" size="sm">
                        Change Email
                      </Catalyst.Button>
                    </div>
                  </div>

                  {/* Password Section */}
                  <div>
                    <Catalyst.Heading level={3} className="mb-4">
                      Password
                    </Catalyst.Heading>
                    <Catalyst.Button color="white">
                      Change Password
                    </Catalyst.Button>
                  </div>

                  {/* Active Sessions */}
                  <div>
                    <Catalyst.Heading level={3} className="mb-4">
                      Active Sessions
                    </Catalyst.Heading>
                    <div className="space-y-3">
                      {sessions.map((sess) => (
                        <div
                          key={sess.id}
                          className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg"
                        >
                          <div>
                            <Catalyst.Text className="font-medium">
                              {sess.device || 'Unknown Device'}
                            </Catalyst.Text>
                            <Catalyst.Text className="text-sm text-gray-600 dark:text-gray-400">
                              {sess.location || 'Unknown Location'} • Last active {new Date(sess.lastActive).toLocaleDateString()}
                            </Catalyst.Text>
                          </div>
                          {sess.id !== session?.sessionId && (
                            <Catalyst.Button
                              color="red"
                              size="sm"
                              onClick={() => handleRevokeSession(sess.id)}
                            >
                              Revoke
                            </Catalyst.Button>
                          )}
                          {sess.id === session?.sessionId && (
                            <Catalyst.Badge color="green">Current</Catalyst.Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="pt-8 border-t border-gray-200 dark:border-gray-700">
                    <Catalyst.Heading level={3} className="mb-4 text-red-600 dark:text-red-400">
                      Danger Zone
                    </Catalyst.Heading>
                    <div className="flex items-center justify-between p-4 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
                      <div>
                        <Catalyst.Text className="font-medium">Delete Account</Catalyst.Text>
                        <Catalyst.Text className="text-sm text-gray-600 dark:text-gray-400">
                          Permanently delete your account and all data
                        </Catalyst.Text>
                      </div>
                      <Catalyst.Button color="red">
                        Delete Account
                      </Catalyst.Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Notifications Tab */}
              {activeTab === 'notifications' && (
                <div className="space-y-6">
                  <div>
                    <Catalyst.Heading level={3} className="mb-4">
                      Email Notifications
                    </Catalyst.Heading>
                    <div className="space-y-4">
                      <Catalyst.Field>
                        <div className="flex items-center justify-between">
                          <div>
                            <Catalyst.Label>Newsletter</Catalyst.Label>
                            <Catalyst.Description>
                              Receive our weekly newsletter with updates and tips
                            </Catalyst.Description>
                          </div>
                          <Catalyst.Switch
                            checked={notifications.emailNewsletter}
                            onChange={(checked) => setNotifications({ ...notifications, emailNewsletter: checked })}
                          />
                        </div>
                      </Catalyst.Field>

                      <Catalyst.Field>
                        <div className="flex items-center justify-between">
                          <div>
                            <Catalyst.Label>Comments</Catalyst.Label>
                            <Catalyst.Description>
                              Get notified when someone comments on your posts
                            </Catalyst.Description>
                          </div>
                          <Catalyst.Switch
                            checked={notifications.emailComments}
                            onChange={(checked) => setNotifications({ ...notifications, emailComments: checked })}
                          />
                        </div>
                      </Catalyst.Field>

                      <Catalyst.Field>
                        <div className="flex items-center justify-between">
                          <div>
                            <Catalyst.Label>Mentions</Catalyst.Label>
                            <Catalyst.Description>
                              Get notified when someone mentions you
                            </Catalyst.Description>
                          </div>
                          <Catalyst.Switch
                            checked={notifications.emailMentions}
                            onChange={(checked) => setNotifications({ ...notifications, emailMentions: checked })}
                          />
                        </div>
                      </Catalyst.Field>
                    </div>
                  </div>

                  <div>
                    <Catalyst.Heading level={3} className="mb-4">
                      Push Notifications
                    </Catalyst.Heading>
                    <Catalyst.Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <Catalyst.Label>Enable Push Notifications</Catalyst.Label>
                          <Catalyst.Description>
                            Receive notifications in your browser
                          </Catalyst.Description>
                        </div>
                        <Catalyst.Switch
                          checked={notifications.pushNotifications}
                          onChange={(checked) => setNotifications({ ...notifications, pushNotifications: checked })}
                        />
                      </div>
                    </Catalyst.Field>
                  </div>

                  <div className="flex justify-end pt-6">
                    <Catalyst.Button onClick={handleNotificationUpdate} disabled={isLoading}>
                      {isLoading ? <LoadingSpinner size="sm" color="white" /> : 'Save Preferences'}
                    </Catalyst.Button>
                  </div>
                </div>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <div className="space-y-6">
                  <div>
                    <Catalyst.Heading level={3} className="mb-4">
                      Profile Visibility
                    </Catalyst.Heading>
                    <Catalyst.RadioGroup
                      value={privacy.profileVisibility}
                      onChange={(value) => setPrivacy({ ...privacy, profileVisibility: value })}
                    >
                      <Catalyst.Radio value="public">
                        <Catalyst.Label>Public</Catalyst.Label>
                        <Catalyst.Description>
                          Anyone can view your profile
                        </Catalyst.Description>
                      </Catalyst.Radio>
                      <Catalyst.Radio value="private">
                        <Catalyst.Label>Private</Catalyst.Label>
                        <Catalyst.Description>
                          Only logged-in users can view your profile
                        </Catalyst.Description>
                      </Catalyst.Radio>
                    </Catalyst.RadioGroup>
                  </div>

                  <div className="space-y-4">
                    <Catalyst.Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <Catalyst.Label>Show Email Address</Catalyst.Label>
                          <Catalyst.Description>
                            Display your email on your public profile
                          </Catalyst.Description>
                        </div>
                        <Catalyst.Switch
                          checked={privacy.showEmail}
                          onChange={(checked) => setPrivacy({ ...privacy, showEmail: checked })}
                        />
                      </div>
                    </Catalyst.Field>

                    <Catalyst.Field>
                      <div className="flex items-center justify-between">
                        <div>
                          <Catalyst.Label>Allow Direct Messages</Catalyst.Label>
                          <Catalyst.Description>
                            Let other users send you direct messages
                          </Catalyst.Description>
                        </div>
                        <Catalyst.Switch
                          checked={privacy.allowMessages}
                          onChange={(checked) => setPrivacy({ ...privacy, allowMessages: checked })}
                        />
                      </div>
                    </Catalyst.Field>
                  </div>

                  <div className="pt-6">
                    <Catalyst.Heading level={3} className="mb-4">
                      Data & Privacy
                    </Catalyst.Heading>
                    <div className="space-y-3">
                      <Catalyst.Button color="white" className="w-full justify-start">
                        Download My Data
                      </Catalyst.Button>
                      <Catalyst.Button color="white" className="w-full justify-start">
                        View Privacy Policy
                      </Catalyst.Button>
                    </div>
                  </div>

                  <div className="flex justify-end pt-6">
                    <Catalyst.Button onClick={handlePrivacyUpdate} disabled={isLoading}>
                      {isLoading ? <LoadingSpinner size="sm" color="white" /> : 'Save Privacy Settings'}
                    </Catalyst.Button>
                  </div>
                </div>
              )}
            </Catalyst.CardContent>
          </Catalyst.Card>

          {/* Sign Out Button */}
          <div className="mt-8 text-center">
            <Catalyst.Button color="white" onClick={handleSignOut}>
              Sign Out
            </Catalyst.Button>
          </div>
        </div>
      </div>
    </>
  )
}