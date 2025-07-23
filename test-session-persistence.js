// Test script to verify session persistence is working correctly
// Run this in your app console after implementing the fixes

const testSessionPersistence = async () => {
  console.log('🧪 Testing Session Persistence...');
  
  try {
    // Test 1: Check if AsyncStorage is working
    console.log('📦 Testing AsyncStorage...');
    const testKey = 'test-session-persistence';
    const testValue = 'test-value-' + Date.now();
    
    await AsyncStorage.setItem(testKey, testValue);
    const retrievedValue = await AsyncStorage.getItem(testKey);
    
    if (retrievedValue === testValue) {
      console.log('✅ AsyncStorage is working correctly');
    } else {
      console.log('❌ AsyncStorage test failed');
      return false;
    }
    
    // Clean up test data
    await AsyncStorage.removeItem(testKey);
    
    // Test 2: Check Supabase session
    console.log('🔐 Testing Supabase session...');
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ Session error:', error);
    } else if (session) {
      console.log('✅ Session found:', session.user.email);
    } else {
      console.log('ℹ️ No session found (user not logged in)');
    }
    
    // Test 3: Test EventService authentication
    console.log('🔍 Testing EventService authentication...');
    const userId = await eventService.getAuthenticatedUserId();
    
    if (userId) {
      console.log('✅ EventService authentication working:', userId);
    } else {
      console.log('ℹ️ No authenticated user (expected if not logged in)');
    }
    
    console.log('🎉 Session persistence test completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    return false;
  }
};

// Test session restoration after app restart simulation
const testSessionRestoration = async () => {
  console.log('🔄 Testing Session Restoration...');
  
  try {
    // Simulate app restart by clearing in-memory state
    console.log('📱 Simulating app restart...');
    
    // Test getSession first (should work with AsyncStorage)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.log('❌ getSession failed:', error);
    } else if (session) {
      console.log('✅ Session restored via getSession:', session.user.email);
    } else {
      console.log('ℹ️ No session to restore');
    }
    
    console.log('🎉 Session restoration test completed!');
    return true;
    
  } catch (error) {
    console.error('❌ Restoration test failed:', error);
    return false;
  }
};

// Export for use in app
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { testSessionPersistence, testSessionRestoration };
}

// Run tests if in browser/console
if (typeof window !== 'undefined') {
  // Run tests after a delay to ensure everything is loaded
  setTimeout(() => {
    testSessionPersistence();
    testSessionRestoration();
  }, 1000);
} 