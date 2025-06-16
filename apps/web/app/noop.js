// Noop file for native dependencies
import React from 'react';

export const cssInterop = () => {};

// Safe area context exports
export const SafeAreaProvider = ({ children }) => children;
export const SafeAreaView = ({ children }) => children;
export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
export const SafeAreaInsetsContext = {};

// Expo modules core exports
export const requireOptionalNativeModule = () => ({});
export const requireNativeModule = () => ({});
export class CodedError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

// Expo constants exports
export const Constants = {
  manifest: {},
  deviceId: 'web',
  platform: { web: {} }
};

// Expo image exports
export const Image = ({ children, ...props }) => children;

// Solito exports
export const useRouter = () => ({
  push: () => {},
  replace: () => {},
  back: () => {},
  pathname: '/'
});

export const useSearchParams = () => ({
  get: (key) => null,
  set: () => {}
});

export const SolitoImageProvider = ({ children }) => children;

export const SolitoImage = ({ src, alt, ...props }) => (
  React.createElement('img', { src, alt, ...props })
);

export const Link = ({ href, children, ...props }) => (
  React.createElement('a', { href, ...props }, children)
);

export const useLink = () => ({
  onPress: () => {},
  href: ''
});

export default {};