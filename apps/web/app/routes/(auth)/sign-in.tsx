import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Catalyst } from '@cai/ui-tw'
import { signIn } from '@cai/app/utils/auth/client'
import { SEO } from '~/components/SEO'
import { LoadingSpinner } from '~/components/LoadingSpinner'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { z } from 'zod'

// Route configuration
export const Route = createFileRoute('/(auth)/sign-in')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: async ({ context, search }) => {
    // Check if user is already authenticated
    const session = await context.auth?.getSession()
    if (session) {
      throw new Error('redirect:' + (search.redirect || '/dashboard'))
    }
  },
  errorComponent: ({ error }) => {
    if (error.message.startsWith('redirect:')) {
      const redirectUrl = error.message.replace('redirect:', '')
      window.location.href = redirectUrl
      return null
    }
    return <ErrorBoundary><div>Error: {error.message}</div></ErrorBoundary>
  },
  component: SignInPage,
})

function SignInPage() {
  const router = useRouter()
  const { redirect } = Route.useSearch()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setIsLoading(true)

    try {
      const result = await signIn.email({
        email,
        password,
        rememberMe,
      })

      if (result.error) {
        setError(result.error.message || 'Invalid email or password')
      } else {
        // Successful sign in
        router.navigate({ to: redirect || '/dashboard' })
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Sign in error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignIn = async (provider: 'google' | 'github') => {
    setError(null)
    setIsLoading(true)

    try {
      if (provider === 'google') {
        await signIn.social({
          provider: 'google',
          callbackURL: redirect || '/dashboard',
        })
      } else {
        await signIn.social({
          provider: 'github',
          callbackURL: redirect || '/dashboard',
        })
      }
    } catch (err) {
      setError(`Failed to sign in with ${provider}. Please try again.`)
      console.error(`${provider} sign in error:`, err)
      setIsLoading(false)
    }
  }

  return (
    <>
      <SEO 
        title="Sign In"
        description="Sign in to your account to access your dashboard and manage your content"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          {/* Logo and Header */}
          <div className="text-center mb-8">
            <Link to="/" className="inline-block mb-6">
              <img 
                src="/logo-dark.png" 
                alt="Logo" 
                className="h-12 w-auto mx-auto dark:hidden"
              />
              <img 
                src="/logo-light.png" 
                alt="Logo" 
                className="h-12 w-auto mx-auto hidden dark:block"
              />
            </Link>
            <Catalyst.Heading level={1} className="text-3xl font-bold">
              Welcome back
            </Catalyst.Heading>
            <Catalyst.Text className="mt-2 text-gray-600 dark:text-gray-400">
              Sign in to continue to your account
            </Catalyst.Text>
          </div>

          {/* Sign In Form */}
          <Catalyst.Card className="shadow-xl">
            <Catalyst.CardContent className="p-8">
              {error && (
                <Catalyst.Alert color="red" className="mb-6">
                  <Catalyst.AlertTitle>Error</Catalyst.AlertTitle>
                  <Catalyst.AlertDescription>{error}</Catalyst.AlertDescription>
                </Catalyst.Alert>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <Catalyst.Fieldset>
                  <Catalyst.FieldGroup>
                    <Catalyst.Field>
                      <Catalyst.Label htmlFor="email">Email address</Catalyst.Label>
                      <Catalyst.Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        disabled={isLoading}
                      />
                    </Catalyst.Field>

                    <Catalyst.Field>
                      <div className="flex items-center justify-between">
                        <Catalyst.Label htmlFor="password">Password</Catalyst.Label>
                        <Link to="/password-reset" className="text-sm">
                          <Catalyst.Link>Forgot password?</Catalyst.Link>
                        </Link>
                      </div>
                      <Catalyst.Input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="current-password"
                        placeholder="••••••••"
                        disabled={isLoading}
                      />
                    </Catalyst.Field>
                  </Catalyst.FieldGroup>
                </Catalyst.Fieldset>

                <div className="flex items-center">
                  <Catalyst.Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onChange={setRememberMe}
                    disabled={isLoading}
                  />
                  <Catalyst.Label htmlFor="remember-me" className="ml-2">
                    Remember me for 30 days
                  </Catalyst.Label>
                </div>

                <Catalyst.Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    'Sign in'
                  )}
                </Catalyst.Button>
              </form>

              <Catalyst.Divider className="my-6">
                <Catalyst.DividerLabel>Or continue with</Catalyst.DividerLabel>
              </Catalyst.Divider>

              <div className="grid grid-cols-2 gap-3">
                <Catalyst.Button
                  color="white"
                  onClick={() => handleSocialSignIn('google')}
                  disabled={isLoading}
                  className="relative"
                >
                  <img
                    src="/auth/google-logo.png"
                    alt="Google"
                    className="absolute left-3 h-5 w-5"
                  />
                  <span className="ml-3">Google</span>
                </Catalyst.Button>

                <Catalyst.Button
                  color="white"
                  onClick={() => handleSocialSignIn('github')}
                  disabled={isLoading}
                  className="relative"
                >
                  <img
                    src="/auth/github-logo.png"
                    alt="GitHub"
                    className="absolute left-3 h-5 w-5"
                  />
                  <span className="ml-3">GitHub</span>
                </Catalyst.Button>
              </div>

              <div className="mt-6 text-center">
                <Catalyst.Text>
                  Don't have an account?{' '}
                  <Link to="/sign-up" className="font-medium">
                    <Catalyst.Link>Create account</Catalyst.Link>
                  </Link>
                </Catalyst.Text>
              </div>
            </Catalyst.CardContent>
          </Catalyst.Card>

          {/* Terms and Privacy */}
          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            By signing in, you agree to our{' '}
            <Link to="/terms">
              <Catalyst.Link className="text-sm">Terms of Service</Catalyst.Link>
            </Link>{' '}
            and{' '}
            <Link to="/privacy">
              <Catalyst.Link className="text-sm">Privacy Policy</Catalyst.Link>
            </Link>
          </p>
        </div>
      </div>
    </>
  )
}