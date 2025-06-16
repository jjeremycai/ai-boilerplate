import { reactRouter } from "@react-router/dev/vite";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import path from "path";

export default defineConfig({
  plugins: [
    cloudflareDevProxy(),
    reactRouter({
      ssr: true,
      serverModuleFormat: "esm",
      serverBuildFile: "server/index.js",
      buildDirectory: "build",
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
  server: {
    port: 3000,
  },
});
