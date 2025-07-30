
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';

const ADMIN_PASSWORD = 'AdminSecret123';
const ADMIN_EMAILS = ['admin@company.com'];

export default function AdminLoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (!ADMIN_EMAILS.includes(email.trim().toLowerCase())) {
        Alert.alert('Invalid Email', 'This email is not authorized for admin access.');
        return;
      }
      if (password !== ADMIN_PASSWORD) {
        Alert.alert('Invalid Password', 'Incorrect admin password.');
        return;
      }
      
      Alert.alert('Success', 'Admin logged in!', [
        { text: 'OK', onPress: () => router.replace('/admin-home') }
      ]);
    }, 800);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Admin Email"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
      </Pressable>
      
      {/* Team Credit */}
      <Text style={styles.creditText}>Made by IT Pulse Team – Summer 2025</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  input: {
    width: '100%',
    padding: 12,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#004080',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  creditText: {
    color: '#888',
    fontSize: 11,
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontStyle: 'italic',
    opacity: 0.8,
    paddingHorizontal: 16,
  },
}); 