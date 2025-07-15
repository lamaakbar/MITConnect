import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [role, setRole] = useState('employee'); // default to employee

  React.useEffect(() => {
    AsyncStorage.getItem('rememberedCredentials').then((data) => {
      if (data) {
        const creds = JSON.parse(data);
        setEmail(creds.email);
        setPassword(creds.password);
        setRememberMe(true);
      }
    });
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    setTimeout(async () => {
      setLoading(false);
      if (!email || !password) {
        Alert.alert('Error', 'Please enter both email and password.');
        return;
      }
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedCredentials', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('rememberedCredentials');
      }
      // Navigate to the correct home screen based on role
      if (role === 'admin') {
        router.replace('/admin-home');
      } else if (role === 'employee') {
        router.replace('/employee-home');
      } else {
        router.replace('/trainee-home');
      }
    }, 800);
  };

  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert('Forgot Password', 'Please enter your email to receive a reset link.');
      return;
    }
    Alert.alert('Reset Link Sent', `A password reset link has been sent to ${email}.`);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <View style={styles.roleRow}>
        {['admin', 'employee', 'trainee'].map(r => (
          <Pressable key={r} onPress={() => setRole(r)} style={[styles.roleButton, role === r && styles.roleButtonActive]}>
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
      <View style={styles.row}>
        <Pressable style={styles.checkboxContainer} onPress={() => setRememberMe((v) => !v)}>
          <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
          <Text style={styles.checkboxLabel}>Remember me</Text>
        </Pressable>
        <TouchableOpacity onPress={handleForgotPassword}>
          <Text style={styles.forgot}>Forgot Password?</Text>
        </TouchableOpacity>
      </View>
      <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
        <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
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
  roleRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  roleButton: {
    marginHorizontal: 8,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
    backgroundColor: '#f0f4f8',
  },
  roleButtonActive: {
    backgroundColor: '#e0eaff',
    borderColor: '#004080',
    borderWidth: 1,
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginVertical: 8,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 4,
    marginRight: 6,
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#004080',
    borderColor: '#004080',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#222',
  },
  forgot: {
    color: '#007AFF',
    fontSize: 15,
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