// Polyfills for Android compatibility
import 'react-native-get-random-values';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

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

// Clear invalid session data
const clearInvalidSession = async () => {
  try {
    console.log('🧹 Clearing invalid session data...');
    const keys = await AsyncStorage.getAllKeys();
    const authKeys = keys.filter(key => key.includes('supabase') || key.includes('auth'));
    
    for (const key of authKeys) {
      await AsyncStorage.removeItem(key);
      console.log('🗑️ Removed:', key);
    }
    console.log('✅ Invalid session data cleared');
  } catch (error) {
    console.error('❌ Error clearing session data:', error);
  }
};

// Export the function so it can be used elsewhere
export const clearInvalidSessionData = clearInvalidSession;

// Initialize session on app start with proper timing
export const initializeSession = async () => {
  try {
    console.log('🔄 Initializing session...');
    
    // Wait a bit for AsyncStorage to be ready
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // First try getSession (which reads from storage)
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('❌ Error getting initial session:', error);
      
      // If it's a refresh token error, clear invalid session data
      if (error.message?.includes('Refresh Token') || error.message?.includes('refresh token')) {
        console.log('🔄 Refresh token error detected, clearing invalid session...');
        await clearInvalidSession();
        return null;
      }
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

// Enhanced session management with better error handling
export const ensureAuthenticatedSession = async () => {
  try {
    // First try to get current session
    let { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Session error:', error);
      
      // Handle refresh token errors gracefully
      if (error.message?.includes('Refresh Token') || error.message?.includes('refresh token')) {
        console.log('🔄 Refresh token error, clearing invalid session...');
        await clearInvalidSession();
        return null;
      }
      return null;
    }
    
    if (session && !session.expires_at) {
      console.log('Session found but no expiry, refreshing...');
      try {
        const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
        
        if (refreshError) {
          console.error('Refresh error:', refreshError);
          
          // Handle refresh token errors gracefully
          if (refreshError.message?.includes('Refresh Token') || refreshError.message?.includes('refresh token')) {
            console.log('🔄 Refresh token error during refresh, clearing invalid session...');
            await clearInvalidSession();
            return null;
          }
          return null;
        }
        
        session = refreshedSession;
      } catch (refreshError) {
        console.error('Refresh exception:', refreshError);
        return null;
      }
    }
    
    // Check if session is expired
    if (session && session.expires_at) {
      const expiryTime = new Date(session.expires_at * 1000);
      const now = new Date();
      
      if (expiryTime <= now) {
        console.log('Session expired, attempting refresh...');
        try {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
          
          if (refreshError) {
            console.error('Failed to refresh expired session:', refreshError);
            
            // Handle refresh token errors gracefully
            if (refreshError.message?.includes('Refresh Token') || refreshError.message?.includes('refresh token')) {
              console.log('🔄 Refresh token error during expired session refresh, clearing invalid session...');
              await clearInvalidSession();
              return null;
            }
            return null;
          }
          
          session = refreshedSession;
        } catch (refreshError) {
          console.error('Refresh exception for expired session:', refreshError);
          return null;
        }
      }
    }
    
    return session;
  } catch (error) {
    console.error('Error ensuring authenticated session:', error);
    return null;
  }
};

// Network connectivity check
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    // Try a simple ping to Supabase
    const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      method: 'HEAD',
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    return response.ok;
  } catch (error) {
    console.error('Network connectivity check failed:', error);
    return false;
  }
};

// Retry wrapper for network operations
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1); // Exponential backoff
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError;
};

// Highlight management functions
export const fetchHighlights = async () => {
  try {
    console.log('🔄 Fetching highlights from database...');
    
    const { data, error } = await supabase
      .from('highlights')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching highlights:', error);
      throw error;
    }

    console.log('✅ Highlights fetched successfully:', data?.length || 0, 'items');
    return data || [];
  } catch (error) {
    console.error('❌ Error in fetchHighlights:', error);
    throw error;
  }
};

export const addHighlight = async (title: string, image_url: string | null) => {
  try {
    const { data, error } = await supabase
      .from('highlights')
      .insert([
        {
          title,
          image_url,
        }
      ])
      .select()
      .single();

    if (error) {
      console.error('Error adding highlight:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addHighlight:', error);
    throw error;
  }
};

export const updateHighlight = async (id: string, title: string, image_url: string | null) => {
  try {
    const { data, error } = await supabase
      .from('highlights')
      .update({
        title,
        image_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating highlight:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateHighlight:', error);
    throw error;
  }
};

export const deleteHighlight = async (id: string) => {
  try {
    const { error } = await supabase
      .from('highlights')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting highlight:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in deleteHighlight:', error);
    throw error;
  }
}; 