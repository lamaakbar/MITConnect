import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type UserRole = 'employee' | 'trainee' | 'admin';

interface UserContextType {
  userRole: UserRole;
  setUserRole: (role: UserRole) => Promise<void>;
  getHomeRoute: () => string;
  isInitialized: boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [userRole, setUserRole] = useState<UserRole>('employee');
  const [isInitialized, setIsInitialized] = useState(false);

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

  return (
    <UserContext.Provider
      value={{
        userRole,
        setUserRole: setUserRoleWithStorage,
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