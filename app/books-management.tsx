
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { NavigationContainer } from '@react-navigation/native';
import { View, Text, StyleSheet, Button } from 'react-native';
import React from 'react';
import AddBookScreen from './add-book';

const Stack = createNativeStackNavigator();

function BooksListScreen({ navigation }: any) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Books Management</Text>
      <Button title="Add Book" onPress={() => navigation.navigate('AddBook')} />
      <Text>Feature coming soon.</Text>
    </View>
  );
}

export default function BooksManagement() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="BooksList" component={BooksListScreen} options={{ title: 'Books Management' }} />
      <Stack.Screen name="AddBook" component={AddBookScreen} options={{ title: 'Add Book' }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
}); 