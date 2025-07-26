const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add polyfills for Node.js modules
// config.resolver.alias = {
//   ...config.resolver.alias,
//   buffer: require.resolve('buffer'),
//   crypto: require.resolve('react-native-crypto'),
//   stream: require.resolve('readable-stream'),
//   util: require.resolve('util'),
//   'react-native-randombytes': require.resolve('react-native-get-random-values'),
// };

// Ensure Buffer is available globally
// config.transformer.globalPrefix = `
//   global.Buffer = require('buffer').Buffer;
//   require('react-native-get-random-values');
// `;

module.exports = config; 