import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/useColorScheme';
import { BookProvider } from '../components/BookContext';
import { EventProvider } from '../components/EventContext';
import { View, Text } from 'react-native';

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
    <BookProvider>
      <EventProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack initialRouteName="splash">
            <Stack.Screen name="splash" options={{ headerShown: false }} />
            <Stack.Screen name="get-started" options={{ headerShown: false }} />
            <Stack.Screen name="role-selection" options={{ headerShown: false }} />
            <Stack.Screen name="admin-login" options={{ headerShown: false }} />
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="admin-home" options={{ headerShown: false }} />
            <Stack.Screen name="employee-home" options={{ headerShown: false }} />
            <Stack.Screen name="trainee-home" options={{ headerShown: false }} />
            <Stack.Screen name="events" options={{ headerShown: false }} />
            <Stack.Screen name="event-details" options={{ headerShown: false }} />
            <Stack.Screen name="registration-success" options={{ headerShown: false }} />
            <Stack.Screen name="bookmarks" options={{ headerShown: false }} />
            <Stack.Screen name="user-profile" options={{ headerShown: false }} />
            <Stack.Screen name="gallery" options={{ headerShown: false }} />
            <Stack.Screen name="bookclub" options={{ headerShown: false }} />
            <Stack.Screen name="inspirer-corner" options={{ headerShown: false }} />
            <Stack.Screen name="gallery-management" options={{ headerShown: false }} />
            <Stack.Screen name="books-management" options={{ headerShown: false }} />
            <Stack.Screen name="add-book" options={{ headerShown: false }} />
            <Stack.Screen name="book-added" options={{ headerShown: false }} />
            <Stack.Screen name="book-details" options={{ headerShown: false }} />
            <Stack.Screen name="feature-details" options={{ headerShown: false }} />
            <Stack.Screen name="events-management" options={{ headerShown: false }} />
            <Stack.Screen name="shop-management" options={{ headerShown: false }} />
            <Stack.Screen name="shopdrop" options={{ headerShown: false }} />
            <Stack.Screen name="highlight-management" options={{ headerShown: false }} />
            <Stack.Screen name="ideas-management" options={{ headerShown: false }} />
            <Stack.Screen name="home" options={{ headerShown: false }} />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </EventProvider>
    </BookProvider>
  );
} 