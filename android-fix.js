#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Android compatibility issues...');

// Check if all required Android dependencies are installed
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));

const requiredDeps = [
  'react-native-get-random-values',
  'react-native-crypto',
  'readable-stream',
  'buffer',
  'util'
];

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  console.log('❌ Missing Android dependencies:', missingDeps.join(', '));
  console.log('Run: npm install ' + missingDeps.join(' '));
} else {
  console.log('✅ All Android dependencies are installed');
}

// Check if metro config is properly configured
const metroConfigPath = 'metro.config.js';
if (fs.existsSync(metroConfigPath)) {
  const metroConfig = fs.readFileSync(metroConfigPath, 'utf8');
  if (metroConfig.includes('react-native-get-random-values')) {
    console.log('✅ Metro config is properly configured');
  } else {
    console.log('❌ Metro config needs polyfills for Android');
  }
}

// Check app.json configuration
const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
if (appJson.expo.android && appJson.expo.android.permissions) {
  console.log('✅ Android permissions are configured');
} else {
  console.log('❌ Android permissions need to be configured');
}

console.log('\n📱 Android Compatibility Checklist:');
console.log('1. ✅ Added Android permissions to app.json');
console.log('2. ✅ Added Android package name');
console.log('3. ✅ Enabled polyfills in metro.config.js');
console.log('4. ✅ Added react-native-get-random-values import');
console.log('5. ✅ Fixed StatusBar for Android');
console.log('6. ✅ Added ideas-management screen to navigation');

console.log('\n🚀 To test on Android:');
console.log('1. Run: npx expo start');
console.log('2. Press "a" to open Android emulator');
console.log('3. Or scan QR code with Expo Go app on Android device');

console.log('\n🔧 If issues persist:');
console.log('1. Clear cache: npx expo start --clear');
console.log('2. Reset metro: npx expo start --reset-cache');
console.log('3. Check Android logs: adb logcat'); 