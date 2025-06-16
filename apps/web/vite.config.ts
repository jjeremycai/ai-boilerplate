import {
  vitePlugin as remix,
  cloudflareDevProxyVitePlugin as remixCloudflareDevProxy,
} from "@remix-run/dev";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

declare module "@remix-run/cloudflare" {
  interface Future {
    v3_singleFetch: true;
  }
}

export default defineConfig({
  plugins: [
    remixCloudflareDevProxy(),
    remix({
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_singleFetch: true,
        v3_lazyRouteDiscovery: true,
      },
      serverModuleFormat: "esm",
      serverBuildFile: "server/index.js",
    }),
    tsconfigPaths(),
  ],
  css: {
    postcss: './postcss.config.js',
  },
  resolve: {
    alias: [
      { find: "@cai/ui", replacement: "@cai/ui-tw" },
      { find: "react-native", replacement: "react-native-web" },
      { find: /^nativewind$/, replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: "react-native-safe-area-context", replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: /^expo-image$/, replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: /^expo-modules-core$/, replacement: path.resolve(__dirname, "./app/noop.js") },
      { find: "react-native-web/Libraries/Image/resolveAssetSource", replacement: path.resolve(__dirname, "./app/noop.js") },
    ],
  },
  optimizeDeps: {
    exclude: ["react-native", "nativewind", "react-native-css-interop", "expo-image", "expo-modules-core"],
  },
  ssr: {
    noExternal: ["react-native-web"],
    resolve: {
      conditions: ["workerd", "worker", "browser"],
    },
  },
  server: {
    port: 3000,
  },
});
