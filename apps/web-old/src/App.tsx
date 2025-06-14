import { Router, Route, Redirect } from 'wouter'
import { ClerkProvider, SignedIn, SignedOut, SignInButton } from '@clerk/clerk-react'

// Single page app
import Dashboard from './pages/Dashboard'
import BlogPost from './pages/BlogPost'

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing Clerk Publishable Key')
}

function App() {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <div className="min-h-screen bg-gray-50">
        <Router>
          <Route path="/">
            <SignedIn>
              <Redirect to="/dashboard" />
            </SignedIn>
            <SignedOut>
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <h1 className="text-4xl font-bold text-gray-900 mb-4">Welcome</h1>
                  <p className="text-gray-600 mb-6">Sign in to access the dashboard</p>
                  <SignInButton>
                    <button className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700">
                      Sign In
                    </button>
                  </SignInButton>
                </div>
              </div>
            </SignedOut>
          </Route>
          <Route path="/dashboard" component={Dashboard} />
          <Route path="/blog/:slug">
            {params => <BlogPost slug={params.slug} />}
          </Route>
        </Router>
      </div>
    </ClerkProvider>
  )
}

export default App