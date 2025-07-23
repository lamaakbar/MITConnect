import React, { useEffect } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../components/AuthContext';

export default function SplashScreen() {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      const timer = setTimeout(() => {
        if (isAuthenticated) {
          // User is logged in, redirect to appropriate home screen
          // You might want to check user role here and redirect accordingly
          router.replace('/home');
        } else {
          // User is not logged in, redirect to login
          router.replace('/');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [router, isAuthenticated, isLoading]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/icon.png')} // Replace with your logo asset
        style={styles.logo}
        resizeMode="contain"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 180,
    height: 180,
  },
}); 