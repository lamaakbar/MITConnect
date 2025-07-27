import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'expo-router';
import { useUserContext } from './UserContext';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { userRole, userProfile, isInitialized, getHomeRoute } = useUserContext();

  useEffect(() => {
    if (!isInitialized) {
      const userName = userProfile?.name || 'Unknown User';
      console.log('RoleGuard: Waiting for initialization for user:', userName);
      return;
    }

    const userName = userProfile?.name || 'Unknown User';
    console.log('RoleGuard: Checking access, user:', userName, 'userRole:', userRole, 'allowedRoles:', allowedRoles, 'pathname:', pathname);

    // Check if user has access to this screen
    if (!allowedRoles.includes(userRole)) {
      const userName = userProfile?.name || 'Unknown User';
      console.log('RoleGuard: Access denied for user:', userName, 'redirecting to correct home');
      const correctHome = getHomeRoute();
      if (pathname !== correctHome) {
        router.replace(correctHome as any);
      }
    }
  }, [userRole, isInitialized, allowedRoles, pathname, router, getHomeRoute]);

  // Don't render children until initialized
  if (!isInitialized) {
    return null;
  }

  // Check if user has access
  if (!allowedRoles.includes(userRole)) {
    return null; // Will redirect in useEffect
  }

  return <>{children}</>;
} 