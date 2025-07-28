import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase';

export type UserRole = 'employee' | 'trainee' | 'admin';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
}

interface UserContextType {
  userRole: UserRole;
  userProfile: UserProfile | null;
  viewAs: UserRole | null;
  effectiveRole: UserRole;
  setUserRole: (role: UserRole) => Promise<void>;
  setUserProfile: (profile: UserProfile) => void;
  setViewAs: (role: UserRole | null) => void;
  loadUserProfile: () => Promise<void>;
  getHomeRoute: () => string;
  isInitialized: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [viewAs, setViewAs] = useState<UserRole | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Use this instead of role in components - viewAs takes precedence if set
  const effectiveRole = viewAs || userRole;

  // Add debugging for viewAs state changes
  const setViewAsWithLogging = (role: UserRole | null) => {
    console.log('UserContext: setViewAs called with:', role);
    console.log('UserContext: Previous viewAs state:', viewAs);
    console.log('UserContext: Current userRole:', userRole);
    setViewAs(role);
    console.log('UserContext: New effectiveRole will be:', role || userRole);
  };

  // Load user role from storage on app start
  useEffect(() => {
    const loadUserRole = async () => {
      try {
        const storedRole = await AsyncStorage.getItem('userRole');
        if (storedRole) {
          setUserRole(storedRole as UserRole);
          console.log('UserContext: Loaded role from storage:', storedRole);
        }
      } catch (error) {
        console.error('UserContext: Error loading user role:', error);
      } finally {
        setIsInitialized(true);
      }
    };
    loadUserRole();
  }, []);

  const setUserRoleWithStorage = async (role: UserRole) => {
    try {
      await AsyncStorage.setItem('userRole', role);
      setUserRole(role);
      console.log('UserContext: Set user role to:', role);
    } catch (error) {
      console.error('UserContext: Error saving user role:', error);
      setUserRole(role);
    }
  };

  const getHomeRoute = (): string => {
    // If not initialized yet, return a safe default
    if (!isInitialized) {
      console.log('UserContext: getHomeRoute called before initialization, returning default');
      return '/employee-home';
    }
    
    const route = (() => {
      switch (userRole) {
        case 'trainee':
          return '/trainee-home';
        case 'admin':
          return '/admin-home';
        case 'employee':
        default:
          return '/employee-home';
      }
    })();
    console.log('UserContext: getHomeRoute called, role:', userRole, 'route:', route, 'isInitialized:', isInitialized);
    return route;
  };

  const loadUserProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('UserContext: No authenticated user found');
        return;
      }

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('UserContext: Error loading user profile:', error);
        return;
      }

      setUserProfile(data);
      console.log('UserContext: User profile loaded:', data);
    } catch (error) {
      console.error('UserContext: Error loading user profile:', error);
    }
  };

  return (
    <UserContext.Provider
      value={{
        userRole,
        userProfile,
        viewAs,
        effectiveRole,
        setUserRole: setUserRoleWithStorage,
        setUserProfile,
        setViewAs: setViewAsWithLogging,
        loadUserProfile,
        getHomeRoute,
        isInitialized,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUserContext must be used within UserProvider');
  return ctx;
}; 