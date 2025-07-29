// Clear invalid session data script
// Run this in your app console to fix the "Invalid Refresh Token" error

const clearInvalidSession = async () => {
  try {
    console.log('🧹 Clearing invalid session data...');
    
    // Get all keys from AsyncStorage
    const keys = await AsyncStorage.getAllKeys();
    console.log('📦 All AsyncStorage keys:', keys);
    
    // Filter for auth-related keys
    const authKeys = keys.filter(key => 
      key.includes('supabase') || 
      key.includes('auth') || 
      key.includes('sb-')
    );
    
    console.log('🔐 Auth-related keys found:', authKeys);
    
    // Remove each auth key
    for (const key of authKeys) {
      await AsyncStorage.removeItem(key);
      console.log('🗑️ Removed:', key);
    }
    
    console.log('✅ Invalid session data cleared successfully!');
    console.log('🔄 Please restart your app or try logging in again.');
    
    return true;
  } catch (error) {
    console.error('❌ Error clearing session data:', error);
    return false;
  }
};

// Export for use in console
global.clearInvalidSession = clearInvalidSession;

// Auto-run the function
clearInvalidSession().then(success => {
  if (success) {
    console.log('🎉 Session cleanup completed!');
  } else {
    console.log('❌ Session cleanup failed!');
  }
}); 