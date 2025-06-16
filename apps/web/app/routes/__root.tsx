import { Outlet, createRootRoute } from '@tanstack/react-router'
import { Meta, Scripts } from '@tanstack/start'
import type { LinksFunction } from '@tanstack/react-router'
import { Provider } from 'app/provider'
import '../tailwind.css'

export const links: LinksFunction = () => [
  // Icons
  { rel: "icon", href: "/pwa/icons/favicon.ico" },
  { rel: "shortcut icon", href: "/pwa/icons/favicon.ico" },
  { rel: "apple-touch-icon", href: "/pwa/icons/touch-icon-iphone.png" },
  { rel: "apple-touch-icon", sizes: "152x152", href: "/pwa/icons/touch-icon-ipad.png" },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/pwa/icons/touch-icon-iphone-retina.png" },
  { rel: "apple-touch-icon", sizes: "167x167", href: "/pwa/icons/touch-icon-ipad-retina.png" },
  // Fonts
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
]

export const Route = createRootRoute({
  meta: () => [
    {
      charSet: 'utf-8',
    },
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1',
    },
    {
      title: process.env.PUBLIC_METADATA_NAME || "CAI App",
    },
    {
      name: "description",
      content: process.env.PUBLIC_METADATA_DESCRIPTION || "CAI App Description",
    },
    {
      name: "theme-color",
      content: "#FFFFFF",
    },
  ],
  links,
  component: RootComponent,
})

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <Meta />
        <style>
          {`
            body, #root {
              min-width: 100% !important;
            }
          `}
        </style>
      </head>
      <body>
        <Provider>
          <Outlet />
        </Provider>
        <Scripts />
      </body>
    </html>
  )
}