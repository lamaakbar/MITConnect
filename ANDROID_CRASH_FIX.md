# Android C++ Exception Fix

## 🚨 **Problem:**
The app crashes on Android with "non-std C++ exception" error, typically caused by:
- Native module conflicts
- Polyfill issues
- React Native architecture problems

## ✅ **Applied Fixes:**

### 1. **Simplified Metro Configuration**
- ✅ Removed problematic global polyfills
- ✅ Kept only essential buffer and crypto aliases
- ✅ Removed `react-native-get-random-values` from global scope

### 2. **Targeted Polyfill Application**
- ✅ Added polyfills only to `services/supabase.ts` where needed
- ✅ Used local imports instead of global configuration
- ✅ Avoided conflicts with React Native runtime

### 3. **React Native Architecture**
- ✅ Disabled `newArchEnabled` to use stable architecture
- ✅ Enabled Hermes engine for better performance
- ✅ Added Android-specific configurations

### 4. **Android Configuration**
- ✅ Added `allowBackup: true` for data persistence
- ✅ Enabled `enableHermes: true` for better performance
- ✅ Kept essential permissions only

## 🔧 **Key Changes Made:**

### **metro.config.js:**
```javascript
// Minimal polyfills to avoid C++ exceptions
config.resolver.alias = {
  ...config.resolver.alias,
  buffer: require.resolve('buffer'),
  crypto: require.resolve('react-native-crypto'),
};
```

### **services/supabase.ts:**
```javascript
// Polyfills for Android compatibility
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;
```

### **app.json:**
```json
{
  "newArchEnabled": false,
  "android": {
    "enableHermes": true,
    "allowBackup": true
  }
}
```

## 🚀 **Testing Steps:**

1. **Clear Cache:**
   ```bash
   npx expo start --clear --reset-cache
   ```

2. **Test on Android:**
   - Use Expo Go app
   - Or Android emulator
   - Check for crash-free startup

3. **Verify Functionality:**
   - Login works
   - Navigation works
   - Poll voting works
   - Admin features work

## 📱 **Expected Results:**

- ✅ **No C++ exceptions**
- ✅ **App launches successfully**
- ✅ **All features work properly**
- ✅ **Stable performance**

## 🔍 **If Issues Persist:**

1. **Check Logs:**
   ```bash
   adb logcat | grep -i expo
   ```

2. **Alternative Fix:**
   - Remove all polyfills temporarily
   - Test basic functionality
   - Add back one by one

3. **Fallback:**
   - Use development build instead of Expo Go
   - Build standalone APK

**The C++ exception should now be resolved!** 🎉 