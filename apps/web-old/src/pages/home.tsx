import { Link } from 'wouter'

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold mb-4">
          Full-Stack Cloudflare Boilerplate
        </h1>
        <p className="text-xl text-muted-foreground mb-8">
          Production-ready monorepo template
        </p>
        
        <div className="mt-8">
          <p>Welcome to your new app\!</p>
        </div>
      </div>
    </div>
  )
}
EOF < /dev/nullgo} className="logo react" alt="React logo" />
        </a>
      </div>
      <div className="flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold mb-8">Vite + React</h1>
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <Button onClick={() => setCount((count) => count + 1)}>Click me</Button>
        <p className="mt-8">
        It’s working!
        </p>
        <p className="mt-8">
        Check out the <Link to="demo/button-demo" className="text-blue-600 underline">Button</Link> and <Link to="demo/form-demo" className="text-blue-600 underline">Form</Link> demo pages.
        </p>
      </div>
    </>
  )
}

export default Home
