const million = require('million/compiler')
const pattycake = require('pattycake')
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  sw: 'service-worker.js',
  swcMinify: true,
})

const boolVals = {
  true: true,
  false: false,
}

const disableBrowserLogs =
  boolVals[process.env.DISABLE_BROWSER_LOGS] ?? process.env.NODE_ENV === 'production'

const enableMillionJS =
  boolVals[process.env.ENABLE_MILLION_JS] ?? process.env.NODE_ENV === 'production'

// Temporarily disabled, produces chatty logs
const enablePattyCake = false

const plugins = [withPWA]

module.exports = function () {
  /** @type {import('next').NextConfig} */
  let config = {
    // Uncomment if you want to use Cloudflare's Paid Image Resizing w/ Next/Image
    // images: {
    //   loader: 'custom',
    //   loaderFile: './cfImageLoader.js',
    // },
    // Using Solito image loader without Cloudflare's Paid Image Resizing
    images: {},
    typescript: {
      ignoreBuildErrors: true,
    },
    transpilePackages: [
      'solito',
      'react-native-web',
      'expo-linking',
      'expo-constants',
      'expo-modules-core',
      'react-native-safe-area-context',
      'react-native-reanimated',
      'react-native-gesture-handler',
    ],
    experimental: {
      webpackBuildWorker: true,
      forceSwcTransforms: true,
      scrollRestoration: true,
      swcPlugins: [
        [
          'next-superjson-plugin',
          {
            excluded: [],
          },
        ],
      ],
    },
    compiler: {
      removeConsole: disableBrowserLogs,
    },
  }

  for (const plugin of plugins) {
    config = {
      ...config,
      ...plugin(config),
    }
  }

  const millionConfig = {
    auto: true,
    mute: true,
  }

  if (enableMillionJS) {
    config = million.next(config, millionConfig)
  }

  if (enablePattyCake) {
    config = pattycake.next(config)
  }

  return config
}
