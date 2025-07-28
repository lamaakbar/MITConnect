const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Minimal polyfills to avoid C++ exceptions
config.resolver.alias = {
  ...config.resolver.alias,
  buffer: require.resolve('buffer'),
  crypto: require.resolve('react-native-crypto'),
};

module.exports = config; 