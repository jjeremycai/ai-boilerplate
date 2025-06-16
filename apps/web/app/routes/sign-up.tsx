import { createFileRoute } from '@tanstack/react-router'
import { Catalyst } from '@cai/ui-tw'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { UserIcon, EnvelopeIcon, KeyIcon } from '@heroicons/react/24/outline'

export const Route = createFileRoute('/sign-up')({
  meta: () => [
    { title: "Sign Up - CAI App" },
  ],
  component: SignUpScreen,
})

function SignUpScreen() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false,
    subscribeNewsletter: true,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle sign up logic
    console.log(formData)
  }

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Catalyst.Heading level={1} className="text-3xl">
            Create your account
          </Catalyst.Heading>
          <Catalyst.Text className="mt-2">
            Join thousands of users already using our platform
          </Catalyst.Text>
        </div>

        <Catalyst.Card className="mt-8">
          <Catalyst.CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Catalyst.Fieldset>
                <Catalyst.FieldGroup>
                  <Catalyst.Field>
                    <Catalyst.Label>
                      <UserIcon className="w-4 h-4 inline mr-2" />
                      Full Name
                    </Catalyst.Label>
                    <Catalyst.Input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => updateField('fullName', e.target.value)}
                      required
                      autoComplete="name"
                      placeholder="John Doe"
                    />
                  </Catalyst.Field>

                  <Catalyst.Field>
                    <Catalyst.Label>
                      <EnvelopeIcon className="w-4 h-4 inline mr-2" />
                      Email address
                    </Catalyst.Label>
                    <Catalyst.Input
                      type="email"
                      value={formData.email}
                      onChange={(e) => updateField('email', e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                    <Catalyst.Description>
                      We'll use this for login and important notifications
                    </Catalyst.Description>
                  </Catalyst.Field>

                  <Catalyst.Field>
                    <Catalyst.Label>
                      <KeyIcon className="w-4 h-4 inline mr-2" />
                      Password
                    </Catalyst.Label>
                    <Catalyst.Input
                      type="password"
                      value={formData.password}
                      onChange={(e) => updateField('password', e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                    />
                    <Catalyst.Description>
                      Must be at least 8 characters long
                    </Catalyst.Description>
                  </Catalyst.Field>

                  <Catalyst.Field>
                    <Catalyst.Label>Confirm Password</Catalyst.Label>
                    <Catalyst.Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="••••••••"
                    />
                    {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <Catalyst.ErrorMessage>Passwords do not match</Catalyst.ErrorMessage>
                    )}
                  </Catalyst.Field>
                </Catalyst.FieldGroup>
              </Catalyst.Fieldset>

              <Catalyst.Divider />

              <div className="space-y-4">
                <Catalyst.Field>
                  <Catalyst.Checkbox
                    checked={formData.acceptTerms}
                    onChange={(checked) => updateField('acceptTerms', checked)}
                  />
                  <Catalyst.Label>
                    I agree to the{' '}
                    <Catalyst.Link href="/terms">Terms of Service</Catalyst.Link>
                    {' '}and{' '}
                    <Catalyst.Link href="/privacy">Privacy Policy</Catalyst.Link>
                  </Catalyst.Label>
                </Catalyst.Field>

                <Catalyst.Field>
                  <Catalyst.Checkbox
                    checked={formData.subscribeNewsletter}
                    onChange={(checked) => updateField('subscribeNewsletter', checked)}
                  />
                  <Catalyst.Label>
                    Send me product updates and special offers
                  </Catalyst.Label>
                </Catalyst.Field>
              </div>

              <div className="space-y-3">
                <Catalyst.Button 
                  type="submit" 
                  className="w-full"
                  disabled={!formData.acceptTerms || formData.password !== formData.confirmPassword}
                >
                  Create Account
                </Catalyst.Button>

                <Catalyst.Button color="white" className="w-full">
                  Sign up with Google
                </Catalyst.Button>
              </div>
            </form>

            <Catalyst.Divider className="my-8" />

            <div className="text-center">
              <Catalyst.Text>
                Already have an account?{' '}
                <Link to="/sign-in">
                  <Catalyst.Link>Sign in</Catalyst.Link>
                </Link>
              </Catalyst.Text>
            </div>
          </Catalyst.CardContent>
        </Catalyst.Card>

        {/* Benefits */}
        <div className="mt-8 text-center">
          <Catalyst.Text className="text-sm text-zinc-600 dark:text-zinc-400">
            By signing up, you'll get access to:
          </Catalyst.Text>
          <div className="mt-4 flex justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Catalyst.Badge color="green">✓</Catalyst.Badge>
              <span>Free tier</span>
            </div>
            <div className="flex items-center gap-2">
              <Catalyst.Badge color="green">✓</Catalyst.Badge>
              <span>24/7 support</span>
            </div>
            <div className="flex items-center gap-2">
              <Catalyst.Badge color="green">✓</Catalyst.Badge>
              <span>API access</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}