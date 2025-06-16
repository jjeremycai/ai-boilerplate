import { createFileRoute } from '@tanstack/react-router'
import { Catalyst } from '@cai/ui-tw'
import { useState } from 'react'
import { Link } from '@tanstack/react-router'

export const Route = createFileRoute('/sign-in')({
  meta: () => [
    { title: "Sign In - CAI App" },
  ],
  component: SignInScreen,
})

function SignInScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle sign in logic
    console.log({ email, password, rememberMe })
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Catalyst.Heading level={1} className="text-3xl">
            Welcome back
          </Catalyst.Heading>
          <Catalyst.Text className="mt-2">
            Sign in to your account to continue
          </Catalyst.Text>
        </div>

        <Catalyst.Card className="mt-8">
          <Catalyst.CardContent className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <Catalyst.Fieldset>
                <Catalyst.FieldGroup>
                  <Catalyst.Field>
                    <Catalyst.Label>Email address</Catalyst.Label>
                    <Catalyst.Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                      placeholder="you@example.com"
                    />
                  </Catalyst.Field>

                  <Catalyst.Field>
                    <Catalyst.Label>Password</Catalyst.Label>
                    <Catalyst.Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      placeholder="••••••••"
                    />
                  </Catalyst.Field>
                </Catalyst.FieldGroup>
              </Catalyst.Fieldset>

              <div className="flex items-center justify-between">
                <Catalyst.Field>
                  <Catalyst.Checkbox
                    checked={rememberMe}
                    onChange={setRememberMe}
                  />
                  <Catalyst.Label>Remember me</Catalyst.Label>
                </Catalyst.Field>

                <Link to="/password-reset" className="text-sm">
                  <Catalyst.Link>Forgot your password?</Catalyst.Link>
                </Link>
              </div>

              <div className="space-y-3">
                <Catalyst.Button type="submit" className="w-full">
                  Sign in
                </Catalyst.Button>

                <Catalyst.Button color="white" className="w-full">
                  Continue with Google
                </Catalyst.Button>
              </div>
            </form>

            <Catalyst.Divider className="my-8" />

            <div className="text-center">
              <Catalyst.Text>
                Don't have an account?{' '}
                <Link to="/sign-up">
                  <Catalyst.Link>Sign up</Catalyst.Link>
                </Link>
              </Catalyst.Text>
            </div>
          </Catalyst.CardContent>
        </Catalyst.Card>
      </div>
    </div>
  )
}