import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useUserContext } from '../components/UserContext';
import { supabase } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const ROLES = [
  { label: 'Employee', value: 'employee' },
  { label: 'Trainee', value: 'trainee' },
];

export default function SignupScreen() {
  const { role: initialRole } = useLocalSearchParams();
  const router = useRouter();
  const { setUserRole, getHomeRoute } = useUserContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState(initialRole || 'employee');
  const [errors, setErrors] = useState({ email: '', password: '', confirm: '' });

  const validate = () => {
    let valid = true;
    let errs = { email: '', password: '', confirm: '' };
    if (!email) {
      errs.email = 'Email is required.';
      valid = false;
    } else if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      errs.email = 'Enter a valid email address.';
      valid = false;
    }
    if (!password) {
      errs.password = 'Password is required.';
      valid = false;
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
      valid = false;
    }
    if (!confirm) {
      errs.confirm = 'Please confirm your password.';
      valid = false;
    } else if (password !== confirm) {
      errs.confirm = 'Passwords do not match.';
      valid = false;
    }
    setErrors(errs);
    return valid;
  };

  const handleSignup = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { role },
        },
      });
      setLoading(false);
      if (error) {
        Alert.alert('Signup Failed', error.message);
        return;
      }
      if (!data.user) {
        Alert.alert('Signup Failed', 'No user returned from Supabase.');
        return;
      }
      Alert.alert(
        'Success',
        'Account created! Please check your email to confirm your account before logging in.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/'),
          },
        ]
      );
    } catch (err) {
      setLoading(false);
      Alert.alert('Signup Error', 'An unexpected error occurred.');
    }
  };

  return (
    <LinearGradient colors={["#e3f0ff", "#f7fafc"]} style={styles.gradient}>
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>
          <View style={styles.roleRow}>
            {ROLES.map((r) => (
              <Pressable
                key={r.value}
                onPress={() => setRole(r.value)}
                style={[styles.roleButton, role === r.value && styles.roleButtonActive]}
              >
                <Ionicons
                  name={r.value === 'employee' ? 'briefcase' : 'school'}
                  size={20}
                  color={role === r.value ? '#fff' : '#1976D2'}
                  style={{ marginRight: 6 }}
                />
                <Text style={{ color: role === r.value ? '#fff' : '#1976D2', fontWeight: 'bold' }}>{r.label}</Text>
              </Pressable>
            ))}
          </View>
          <View style={styles.inputGroup}>
            <Ionicons name="mail" size={20} color="#1976D2" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Email address"
              placeholderTextColor="#9BA1A6"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          {errors.email ? <Text style={styles.error}>{errors.email}</Text> : null}
          <View style={styles.inputGroup}>
            <Ionicons name="lock-closed" size={20} color="#1976D2" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Password (min 6 characters)"
              placeholderTextColor="#9BA1A6"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
          </View>
          {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
          <View style={styles.inputGroup}>
            <MaterialIcons name="lock" size={20} color="#1976D2" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Confirm password"
              placeholderTextColor="#9BA1A6"
              secureTextEntry
              value={confirm}
              onChangeText={setConfirm}
            />
          </View>
          {errors.confirm ? <Text style={styles.error}>{errors.confirm}</Text> : null}
          <Pressable style={styles.button} onPress={handleSignup} disabled={loading}>
            <Text style={styles.buttonText}>{loading ? 'Signing up...' : 'Sign Up'}</Text>
          </Pressable>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 36,
    paddingHorizontal: 28,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#1976D2',
    shadowOpacity: 0.10,
    shadowRadius: 16,
    elevation: 8,
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1976D2',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 22,
  },
  roleRow: {
    flexDirection: 'row',
    marginBottom: 18,
    gap: 12,
  },
  roleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e3f0ff',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginHorizontal: 4,
  },
  roleButtonActive: {
    backgroundColor: '#1976D2',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7fafc',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e0eaff',
    marginBottom: 8,
    paddingHorizontal: 10,
    width: '100%',
  },
  inputIcon: {
    marginRight: 6,
  },
  input: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: '#222',
    backgroundColor: 'transparent',
  },
  error: {
    color: '#d32f2f',
    fontSize: 13,
    alignSelf: 'flex-start',
    marginBottom: 4,
    marginLeft: 6,
  },
  button: {
    backgroundColor: '#1976D2',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 32,
    marginTop: 18,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#1976D2',
    shadowOpacity: 0.13,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
}); 