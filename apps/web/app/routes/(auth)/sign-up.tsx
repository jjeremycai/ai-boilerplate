import { createFileRoute, Link, useRouter } from '@tanstack/react-router'
import { useState } from 'react'
import { Catalyst } from '@cai/ui-tw'
import { signUp } from '@cai/app/utils/auth/client'
import { SEO } from '~/components/SEO'
import { LoadingSpinner } from '~/components/LoadingSpinner'
import { ErrorBoundary } from '~/components/ErrorBoundary'
import { z } from 'zod'

// Password validation schema
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')

// Route configuration
export const Route = createFileRoute('/(auth)/sign-up')({
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
  component: SignUpPage,
})

function SignUpPage() {
  const router = useRouter()
  const { redirect } = Route.useSearch()
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required'
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address'
    }
    
    try {
      passwordSchema.parse(formData.password)
    } catch (err) {
      if (err instanceof z.ZodError) {
        errors.password = err.errors[0].message
      }
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match'
    }
    
    if (!acceptTerms) {
      errors.terms = 'You must accept the terms and conditions'
    }
    
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    
    if (!validateForm()) {
      return
    }
    
    setIsLoading(true)

    try {
      const result = await signUp.email({
        email: formData.email,
        password: formData.password,
        name: formData.name,
      })

      if (result.error) {
        setError(result.error.message || 'Failed to create account')
      } else {
        // Successful sign up
        router.navigate({ to: redirect || '/dashboard' })
      }
    } catch (err) {
      setError('An unexpected error occurred. Please try again.')
      console.error('Sign up error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignUp = async (provider: 'google' | 'github') => {
    if (!acceptTerms) {
      setFieldErrors({ terms: 'You must accept the terms and conditions' })
      return
    }
    
    setError(null)
    setIsLoading(true)

    try {
      if (provider === 'google') {
        await signUp.social({
          provider: 'google',
          callbackURL: redirect || '/dashboard',
        })
      } else {
        await signUp.social({
          provider: 'github',
          callbackURL: redirect || '/dashboard',
        })
      }
    } catch (err) {
      setError(`Failed to sign up with ${provider}. Please try again.`)
      console.error(`${provider} sign up error:`, err)
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: keyof typeof formData) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({ ...formData, [field]: e.target.value })
    // Clear field error when user starts typing
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' })
    }
  }

  return (
    <>
      <SEO 
        title="Sign Up"
        description="Create your account to get started with our platform"
      />
      
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
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
              Create your account
            </Catalyst.Heading>
            <Catalyst.Text className="mt-2 text-gray-600 dark:text-gray-400">
              Join thousands of users already using our platform
            </Catalyst.Text>
          </div>

          {/* Sign Up Form */}
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
                      <Catalyst.Label htmlFor="name">Full name</Catalyst.Label>
                      <Catalyst.Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={handleInputChange('name')}
                        required
                        autoComplete="name"
                        placeholder="John Doe"
                        disabled={isLoading}
                        invalid={!!fieldErrors.name}
                      />
                      {fieldErrors.name && (
                        <Catalyst.ErrorMessage>{fieldErrors.name}</Catalyst.ErrorMessage>
                      )}
                    </Catalyst.Field>

                    <Catalyst.Field>
                      <Catalyst.Label htmlFor="email">Email address</Catalyst.Label>
                      <Catalyst.Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange('email')}
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        disabled={isLoading}
                        invalid={!!fieldErrors.email}
                      />
                      {fieldErrors.email && (
                        <Catalyst.ErrorMessage>{fieldErrors.email}</Catalyst.ErrorMessage>
                      )}
                    </Catalyst.Field>

                    <Catalyst.Field>
                      <Catalyst.Label htmlFor="password">Password</Catalyst.Label>
                      <Catalyst.Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange('password')}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        invalid={!!fieldErrors.password}
                      />
                      {fieldErrors.password && (
                        <Catalyst.ErrorMessage>{fieldErrors.password}</Catalyst.ErrorMessage>
                      )}
                      <Catalyst.Description>
                        Must be at least 8 characters with uppercase, lowercase, and numbers
                      </Catalyst.Description>
                    </Catalyst.Field>

                    <Catalyst.Field>
                      <Catalyst.Label htmlFor="confirmPassword">Confirm password</Catalyst.Label>
                      <Catalyst.Input
                        id="confirmPassword"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange('confirmPassword')}
                        required
                        autoComplete="new-password"
                        placeholder="••••••••"
                        disabled={isLoading}
                        invalid={!!fieldErrors.confirmPassword}
                      />
                      {fieldErrors.confirmPassword && (
                        <Catalyst.ErrorMessage>{fieldErrors.confirmPassword}</Catalyst.ErrorMessage>
                      )}
                    </Catalyst.Field>
                  </Catalyst.FieldGroup>
                </Catalyst.Fieldset>

                <div className="space-y-4">
                  <div className="flex items-start">
                    <Catalyst.Checkbox
                      id="accept-terms"
                      checked={acceptTerms}
                      onChange={setAcceptTerms}
                      disabled={isLoading}
                      className="mt-1"
                    />
                    <Catalyst.Label htmlFor="accept-terms" className="ml-2">
                      I agree to the{' '}
                      <Link to="/terms">
                        <Catalyst.Link>Terms of Service</Catalyst.Link>
                      </Link>{' '}
                      and{' '}
                      <Link to="/privacy">
                        <Catalyst.Link>Privacy Policy</Catalyst.Link>
                      </Link>
                    </Catalyst.Label>
                  </div>
                  {fieldErrors.terms && (
                    <p className="text-sm text-red-600 dark:text-red-400">{fieldErrors.terms}</p>
                  )}
                </div>

                <Catalyst.Button 
                  type="submit" 
                  className="w-full" 
                  disabled={isLoading || !acceptTerms}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" color="white" />
                  ) : (
                    'Create account'
                  )}
                </Catalyst.Button>
              </form>

              <Catalyst.Divider className="my-6">
                <Catalyst.DividerLabel>Or sign up with</Catalyst.DividerLabel>
              </Catalyst.Divider>

              <div className="grid grid-cols-2 gap-3">
                <Catalyst.Button
                  color="white"
                  onClick={() => handleSocialSignUp('google')}
                  disabled={isLoading || !acceptTerms}
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
                  onClick={() => handleSocialSignUp('github')}
                  disabled={isLoading || !acceptTerms}
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
                  Already have an account?{' '}
                  <Link to="/sign-in" className="font-medium">
                    <Catalyst.Link>Sign in</Catalyst.Link>
                  </Link>
                </Catalyst.Text>
              </div>
            </Catalyst.CardContent>
          </Catalyst.Card>
        </div>
      </div>
    </>
  )
}