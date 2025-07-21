import React, { ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth, UserRole } from './AuthContext';
import { Ionicons } from '@expo/vector-icons';

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
  fallbackRoute?: string;
}

export default function ProtectedRoute({ 
  children, 
  allowedRoles, 
  fallbackRoute = '/role-selection' 
}: ProtectedRouteProps) {
  const { user, isAuthenticated, hasRole } = useAuth();
  const router = useRouter();

  // Check if user is authenticated
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <Ionicons name="lock-closed" size={64} color="#FF6B6B" />
        <Text style={styles.title}>Access Denied</Text>
        <Text style={styles.message}>Please log in to access this page.</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => router.push(fallbackRoute as any)}
        >
          <Text style={styles.buttonText}>Go to Login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Check if user has required role
  const hasRequiredRole = allowedRoles.some(role => hasRole(role));
  
  if (!hasRequiredRole) {
    return (
      <View style={styles.container}>
        <Ionicons name="shield-checkmark" size={64} color="#FF6B6B" />
        <Text style={styles.title}>Access Restricted</Text>
        <Text style={styles.message}>
          You don't have permission to access this page. 
          Required roles: {allowedRoles.join(', ')}
        </Text>
        <Text style={styles.userRole}>Your role: {user?.role}</Text>
        <TouchableOpacity 
          style={styles.button} 
          onPress={() => {
            // Redirect to appropriate home page based on user role
            switch (user?.role) {
              case 'admin':
                router.push('/admin-home');
                break;
              case 'employee':
                router.push('/employee-home');
                break;
              case 'trainee':
                router.push('/trainee-home');
                break;
              default:
                router.push('/role-selection');
            }
          }}
        >
          <Text style={styles.buttonText}>Go to Your Dashboard</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f6f7f9',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 16,
  },
  userRole: {
    fontSize: 14,
    color: '#888',
    fontStyle: 'italic',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#43C6AC',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 