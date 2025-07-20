import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserContext } from '../components/UserContext';

export default function SignupScreen() {
  const { role: initialRole } = useLocalSearchParams();
  const router = useRouter();
  const { setUserRole, getHomeRoute } = useUserContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(initialRole || 'employee');

  const handleSignup = async () => {
    setLoading(true);
    setTimeout(async () => {
      setLoading(false);
      if (!email || !password || !confirm) {
        Alert.alert('Error', 'Please fill all fields.');
        return;
      }
      if (password !== confirm) {
        Alert.alert('Error', 'Passwords do not match.');
        return;
      }
      // Set the user role in context
      await setUserRole(role as 'admin' | 'employee' | 'trainee');
      
      Alert.alert('Success', `Account created for ${role}. Please log in.`);
      // Navigate to the correct home screen based on role
      router.replace(getHomeRoute() as any);
    }, 800);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up as {role ? String(role).charAt(0).toUpperCase() + String(role).slice(1) : ''}</Text>
      <View style={{ flexDirection: 'row', marginBottom: 16 }}>
        {['admin', 'employee', 'trainee'].map(r => (
          <Pressable key={r} onPress={() => setRole(r)} style={{ marginHorizontal: 8 }}>
            <Text style={{ color: role === r ? '#004080' : '#888', fontWeight: 'bold' }}>{r.charAt(0).toUpperCase() + r.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
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