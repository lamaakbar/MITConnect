import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

export default function SignupScreen() {
  const { role } = useLocalSearchParams();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignup = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (!email || !password || !confirm) {
        Alert.alert('Error', 'Please fill all fields.');
        return;
      }
      if (password !== confirm) {
        Alert.alert('Error', 'Passwords do not match.');
        return;
      }
      Alert.alert('Success', `Account created for ${role}. Please log in.`);
      router.push('/'); // Redirect to home page
    }, 800);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up as {role ? String(role).charAt(0).toUpperCase() + String(role).slice(1) : ''}</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
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
      <TextInput
        style={styles.input}
        placeholder="Confirm Password"
        secureTextEntry
        value={confirm}
        onChangeText={setConfirm}
      />
      <Pressable style={styles.button} onPress={handleSignup} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Signing up...' : 'Sign Up'}</Text>
      </Pressable>
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
}); 