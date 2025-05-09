const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('cjs'); // required for Firebase modules
config.resolver.unstable_enablePackageExports = false; // 🔧 Fix for "Component auth has not been registered"

module.exports = config;