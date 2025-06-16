// Noop file for native dependencies
export const cssInterop = () => {};

// Safe area context exports
export const SafeAreaProvider = ({ children }) => children;
export const SafeAreaView = ({ children }) => children;
export const useSafeAreaInsets = () => ({ top: 0, bottom: 0, left: 0, right: 0 });
export const SafeAreaInsetsContext = {};

export default {};