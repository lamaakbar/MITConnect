import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BookProvider } from '../components/BookContext';
import { EventProvider } from '../components/EventContext';
import { UserProvider } from '../components/UserContext';
import { View, Text } from 'react-native';
import { ThemeProvider as CustomThemeProvider } from '../components/ThemeContext';
import { AuthProvider } from '../components/AuthContext';

export const unstable_settings = {
  initialRouteName: '/',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  if (!loaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <Text style={{ fontSize: 18, color: '#222' }}>Loading...</Text>
      </View>
    );
  }

  return (
    <AuthProvider>
      <UserProvider>
        <BookProvider>
          <EventProvider>
            <CustomThemeProvider>
              <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
                <Stack
                  screenOptions={{
                    headerShown: false, // Hide the default header for all screens
                    animation: 'fade_from_bottom',
                    animationDuration: 400,
                    animationTypeForReplace: 'push',
                  }}
                >
                  <Stack.Screen name="splash" options={{ headerShown: false }} />
                  <Stack.Screen name="get-started" options={{ headerShown: false }} />
                  <Stack.Screen name="role-selection" options={{ headerShown: false }} />
                  <Stack.Screen name="admin-login" options={{ headerShown: false }} />
                  <Stack.Screen name="signup" options={{ headerShown: false }} />
                  <Stack.Screen name="index" options={{ headerShown: false }} />
                  <Stack.Screen name="admin-home" options={{ headerShown: false }} />
                  <Stack.Screen name="employee-home" options={{ headerShown: false }} />
                  <Stack.Screen name="trainee-home" options={{ headerShown: false }} />
                  <Stack.Screen name="events" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                  <Stack.Screen name="event-details" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                  <Stack.Screen name="registration-success" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                  <Stack.Screen name="bookmarks" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                  <Stack.Screen name="user-profile" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                  <Stack.Screen name="gallery" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                  <Stack.Screen name="bookclub" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                  <Stack.Screen name="inspirer-corner" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                  <Stack.Screen name="gallery-management" options={{ headerShown: false }} />
                  <Stack.Screen name="books-management" options={{ headerShown: false }} />
                  <Stack.Screen name="add-book" options={{ headerShown: false }} />
                  <Stack.Screen name="book-added" options={{ headerShown: false }} />
                  <Stack.Screen name="book-details" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                  <Stack.Screen name="feature-details" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                  <Stack.Screen name="events-management" options={{ headerShown: false }} />
                  <Stack.Screen name="admin-events/index" options={{ headerShown: false }} />
                  <Stack.Screen name="admin-events/add" options={{ headerShown: false }} />
                  <Stack.Screen name="admin-events/[id]/details" options={{ headerShown: false }} />
                  <Stack.Screen name="admin-events/[id]/edit" options={{ headerShown: false }} />
                  <Stack.Screen name="trainee-management/index" options={{ headerShown: false }} />
                  <Stack.Screen name="trainee-management/overview" options={{ headerShown: false }} />
                  <Stack.Screen name="trainee-management/progress" options={{ headerShown: false }} />
                  <Stack.Screen name="trainee-management/registrations" options={{ headerShown: false }} />
                  <Stack.Screen name="trainee-hub" options={{ headerShown: false }} />
                  <Stack.Screen name="trainee-checklist" options={{ headerShown: false }} />
                  <Stack.Screen name="books-management/[id]/details" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                  <Stack.Screen name="shop-management" options={{ headerShown: false }} />
                  <Stack.Screen name="shopdrop" options={{ headerShown: false }} />
                  <Stack.Screen name="highlight-management" options={{ headerShown: false }} />
                  <Stack.Screen name="ideas-management" options={{ headerShown: false }} />
                  <Stack.Screen name="home" options={{ headerShown: false }} />
                  <Stack.Screen name="my-events" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />

                  <Stack.Screen name="library/[id]/details" options={{ 
                    headerShown: false, 
                    gestureEnabled: false,
                    animation: 'fade',
                    animationDuration: 400,
                    animationTypeForReplace: 'push'
                  }} />
                </Stack>
                <StatusBar style="auto" />
              </ThemeProvider>
            </CustomThemeProvider>
          </EventProvider>
        </BookProvider>
      </UserProvider>
    </AuthProvider>
  );
} 