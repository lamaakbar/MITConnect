import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase, initializeSession, ensureAuthenticatedSession } from '../services/supabase';

export type UserRole = 'admin' | 'employee' | 'trainee';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasRole: (role: UserRole) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on app start
  useEffect(() => {
    initializeAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', event, session?.user?.email);
        
        if (event === 'SIGNED_IN' && session?.user) {
          const userData: User = {
            id: session.user.id,
            email: session.user.email || '',
            name: session.user.user_metadata?.full_name || session.user.email || '',
            role: session.user.user_metadata?.role || 'trainee',
          };
          setUser(userData);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Update user data if needed
          console.log('✅ Token refreshed for user:', session.user.email);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Initializing authentication...');
      
      // Wait for AsyncStorage to be ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check for existing session first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        console.log('✅ Session found for user:', session.user.email);
        
        // Convert Supabase user to our User format
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email || '',
          role: session.user.user_metadata?.role || 'trainee', // Default role
        };
        
        setUser(userData);
      } else {
        console.log('ℹ️ No existing session found');
        setUser(null);
      }
    } catch (error) {
      console.log('⚠️ Error initializing auth (non-critical):', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (userData: User) => {
    try {
      setUser(userData);
      
      // Ensure session is properly set
      const session = await ensureAuthenticatedSession();
      if (session) {
        console.log('✅ Login successful, session confirmed');
      }
    } catch (error) {
      console.error('❌ Error during login:', error);
    }
  };

  const logout = async () => {
    try {
      console.log('🔄 Starting logout process...');
      
      // Check if there's a valid session first
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.log('ℹ️ No active session found, skipping signOut');
          setUser(null);
          return;
        }
      } catch (sessionError) {
        console.log('ℹ️ Session check failed, proceeding with signOut anyway');
      }
      
      // Try to sign out with timeout
      const signOutPromise = supabase.auth.signOut();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Sign out timeout')), 5000)
      );
      
      const { error } = await Promise.race([signOutPromise, timeoutPromise]) as any;
      
      if (error) {
        // Log the error but don't throw - we still want to clear local state
        console.log('⚠️ Sign out error (non-critical):', error.message);
      } else {
        console.log('✅ Logout successful');
      }
      
      // Always clear user state regardless of signOut result
      setUser(null);
      console.log('✅ User state cleared');
      
    } catch (error) {
      console.log('⚠️ Logout error (non-critical):', error);
      // Always clear user state even if signOut fails
      setUser(null);
    }
  };

  const isAuthenticated = !!user;

  const hasRole = (role: UserRole) => {
    return user?.role === role;
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated, isLoading, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
} 