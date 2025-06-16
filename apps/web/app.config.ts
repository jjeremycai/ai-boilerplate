import { createApp } from 'vinxi'
import { cloudflare } from 'unenv'
import nitroCloudflareBindings from "nitro-cloudflare-dev"
import path from 'path'
import { fileURLToPath } from 'url'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import tsConfigPaths from 'vite-tsconfig-paths'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const viteConfig = {
  resolve: {
    alias: [
      { find: "@cai/ui/src", replacement: path.resolve(__dirname, "../../packages/ui-tw/src") },
      { find: "@cai/ui", replacement: path.resolve(__dirname, "../../packages/ui-tw/src/index.web.tsx") },
      { find: "@cai/ui-tw", replacement: path.resolve(__dirname, "../../packages/ui-tw/src/index.web.tsx") },
      { find: "app", replacement: path.resolve(__dirname, "../../packages/app") },
      { find: "react-native", replacement: "react-native-web" },
      { find: /^nativewind$/, replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: "react-native-safe-area-context", replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: /^expo-image$/, replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: /^expo-modules-core$/, replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: "react-native-web/Libraries/Image/resolveAssetSource", replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: "solito/image", replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: "solito/router", replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: "solito/navigation", replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: "solito/link", replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: /^expo-constants$/, replacement: path.resolve(__dirname, "./app/noop.js") },
    ],
  },
  optimizeDeps: {
    exclude: ["react-native", "nativewind", "react-native-css-interop", "expo-image", "expo-modules-core", "solito"],
  },
  ssr: {
    noExternal: ["react-native-web"],
    target: "webworker",
    resolve: {
      conditions: ["workerd", "worker", "browser"],
      externalConditions: ["workerd", "worker"],
    },
  },
}

export default createApp({
  routers: [
    {
      name: 'public',
      type: 'static',
      dir: './public',
    },
    {
      name: 'ssr',
      type: 'http',
      handler: './app/server.tsx',
      target: 'server',
      vite: viteConfig,
      plugins: () => [
        TanStackRouterVite({
          routesDirectory: './app/routes',
          generatedRouteTree: './app/routeTree.gen.ts',
          quoteStyle: 'single',
        }),
        react(),
        tsConfigPaths({
          projects: ['./tsconfig.json'],
        }),
      ],
    },
    {
      name: 'client',
      type: 'client',
      handler: './app/client.tsx',
      target: 'browser',
      vite: viteConfig,
      plugins: () => [
        TanStackRouterVite({
          routesDirectory: './app/routes',
          generatedRouteTree: './app/routeTree.gen.ts',
          quoteStyle: 'single',
        }),
        react(),
        tsConfigPaths({
          projects: ['./tsconfig.json'],
        }),
      ],
    },
  ],
  server: {
    preset: 'cloudflare-module',
    unenv: cloudflare,
    modules: [nitroCloudflareBindings],
  },
})