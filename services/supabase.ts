import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUPABASE_URL = 'https://kiijnueatpbsenrtepxp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpaWpudWVhdHBic2VucnRlcHhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjk0NDIsImV4cCI6MjA2ODc0NTQ0Mn0.-o8Wft6Bk6XoS500EpuKAFwNLf9r9uZrkMHMBkUcdgg';

// Create a custom storage adapter that ensures AsyncStorage is ready
const createCustomStorage = () => {
  return {
    getItem: async (key: string) => {
      try {
        const value = await AsyncStorage.getItem(key);
        console.log('🔍 Storage getItem:', key, value ? 'found' : 'not found');
        return value;
      } catch (error) {
        console.error('❌ Storage getItem error:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await AsyncStorage.setItem(key, value);
        console.log('💾 Storage setItem:', key, 'saved');
      } catch (error) {
        console.error('❌ Storage setItem error:', error);
      }
    },
    removeItem: async (key: string) => {
      try {
        await AsyncStorage.removeItem(key);
        console.log('🗑️ Storage removeItem:', key, 'removed');
      } catch (error) {
        console.error('❌ Storage removeItem error:', error);
      }
    },
  };
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: createCustomStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Initialize session on app start with proper timing
export const initializeSession = async () => {
  try {
    console.log('🔄 Initializing session...');
    
    // Wait a bit for AsyncStorage to be ready
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // First try getSession (which reads from storage)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting initial session:', error);
      return null;
    }
    
    if (session) {
      console.log('✅ Session restored successfully:', session.user.email);
      return session;
    } else {
      console.log('ℹ️ No existing session found in storage');
      
      // Try getUser as fallback (but this might fail if session is missing)
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) {
          console.log('ℹ️ No user found (expected if not logged in)');
          return null;
        }
        if (user) {
          console.log('✅ User found via getUser:', user.email);
          // Create a session object from user
          return { user, access_token: '', refresh_token: '', expires_at: 0 };
        }
      } catch (userError) {
        console.log('ℹ️ getUser failed (expected if no session):', userError);
      }
      
      return null;
    }
  } catch (error) {
    console.error('❌ Error initializing session:', error);
    return null;
  }
};

// Enhanced session management
export const ensureAuthenticatedSession = async () => {
  try {
    // First try to get current session
    let { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      return null;
    }
    
    if (session && !session.expires_at) {
      console.log('Session found but no expiry, refreshing...');
      const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        console.error('Refresh error:', refreshError);
        return null;
      }
      
      session = refreshedSession;
    }
    
    // Check if session is expired
    if (session && session.expires_at) {
      const expiryTime = new Date(session.expires_at * 1000);
      const now = new Date();
      
      if (expiryTime <= now) {
        console.log('Session expired, attempting refresh...');
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Failed to refresh expired session:', refreshError);
          return null;
        }
        
        session = refreshedSession;
      }
    }
    
    return session;
  } catch (error) {
    console.error('Error ensuring authenticated session:', error);
    return null;
  }
}; 