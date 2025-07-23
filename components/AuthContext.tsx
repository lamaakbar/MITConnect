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
      
      // Initialize session
      const session = await initializeSession();
      
      if (session?.user) {
        console.log('✅ Session restored for user:', session.user.email);
        
        // Convert Supabase user to our User format
        // You might need to fetch additional user data from your database
        const userData: User = {
          id: session.user.id,
          email: session.user.email || '',
          name: session.user.user_metadata?.full_name || session.user.email || '',
          role: session.user.user_metadata?.role || 'trainee', // Default role
        };
        
        setUser(userData);
      } else {
        console.log('ℹ️ No existing session found');
      }
    } catch (error) {
      console.error('❌ Error initializing auth:', error);
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
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error signing out:', error);
      } else {
        console.log('✅ Logout successful');
      }
      setUser(null);
    } catch (error) {
      console.error('❌ Error during logout:', error);
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