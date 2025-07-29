# Refresh Token Error Fix

## Problem
You're seeing the error: "Invalid Refresh Token: Refresh Token Not Found"

This error occurs when Supabase tries to refresh an authentication token that doesn't exist in AsyncStorage. This typically happens when:

1. The app was previously logged in but the session data got corrupted
2. There's a timing issue with AsyncStorage initialization
3. The refresh token expired or was invalidated

## Immediate Fix

### Option 1: Use the Console Script
1. Open your app's developer console
2. Run the following command:
```javascript
clearInvalidSession()
```

### Option 2: Manual Clear
1. Go to your device's Settings
2. Find your app in the Apps list
3. Clear the app's data/cache
4. Restart the app

### Option 3: Use the Error Boundary
If you see an error screen with a "Clear Session & Retry" button, tap it to automatically clear the invalid session data.

## Code Changes Made

### 1. Enhanced Error Handling in `services/supabase.ts`
- Added automatic detection of refresh token errors
- Implemented graceful session clearing when invalid tokens are detected
- Increased AsyncStorage initialization delay to 200ms

### 2. Improved AuthContext in `components/AuthContext.tsx`
- Added session clearing functionality
- Enhanced error handling during authentication initialization
- Better handling of refresh token errors during login/logout

### 3. Updated ErrorBoundary in `components/ErrorBoundary.tsx`
- Added specific handling for authentication errors
- Provides a "Clear Session & Retry" button for auth errors
- Automatic session clearing when auth errors are detected

## Prevention

The updated code now:
- Automatically detects and handles refresh token errors
- Clears invalid session data when needed
- Provides better error recovery mechanisms
- Has increased timing delays for AsyncStorage initialization

## Testing

After implementing these fixes:
1. Restart your app
2. Try logging in again
3. The error should be resolved and authentication should work normally

If you continue to see the error, the automatic session clearing should handle it gracefully and prompt you to log in again. 