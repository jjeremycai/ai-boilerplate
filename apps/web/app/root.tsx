import type { LinksFunction, MetaFunction } from "@remix-run/cloudflare";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import { Provider } from "app/provider";

import "./tailwind.css";

export const meta: MetaFunction = () => {
  const title = process.env.PUBLIC_METADATA_NAME || "CAI App";
  const description = process.env.PUBLIC_METADATA_DESCRIPTION || "CAI App Description";
  
  return [
    { title },
    { name: "description", content: description },
    { name: "theme-color", content: "#FFFFFF" },
  ];
};

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
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          {`
            body, #root {
              min-width: 100% !important;
            }
          `}
        </style>
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <Provider>
      <Outlet />
    </Provider>
  );
}
