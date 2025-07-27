import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Alert, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { useUserContext } from '../components/UserContext';
import { supabase } from '../services/supabase';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const ADMIN_EMAIL = 'mitclead@gmail.com';

export default function LoginScreen() {
  const router = useRouter();
  const { setUserRole, getHomeRoute } = useUserContext();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({ email: '', password: '' });

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

  const validate = () => {
    let valid = true;
    let errs = { email: '', password: '' };
    if (!email) {
      errs.email = 'Email is required.';
      valid = false;
    }
    if (!password) {
      errs.password = 'Password is required.';
      valid = false;
    }
    setErrors(errs);
    return valid;
  };

  const handleLogin = async () => {
    if (!validate()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });

      if (error || !data.user) {
        setLoading(false);
        Alert.alert('Login Failed', error?.message || 'Invalid credentials.');
        return;
      }

      // Save credentials if Remember Me is checked
      if (rememberMe) {
        await AsyncStorage.setItem('rememberedCredentials', JSON.stringify({ email, password }));
      } else {
        await AsyncStorage.removeItem('rememberedCredentials');
      }

      // ✅ Fetch role from users table
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('role')
        .eq('id', data.user.id)
        .single();

      if (dbError || !dbUser) {
        setLoading(false);
        Alert.alert('Login Error', 'Could not fetch role from database.');
        return;
      }

      const role = dbUser.role;

      // Validate role
      if (!['admin', 'employee', 'trainee'].includes(role)) {
        setLoading(false);
        Alert.alert('Access Denied', 'Your account role is invalid. Contact support.');
        return;
      }

      if (role === 'admin' && email.toLowerCase().trim() !== ADMIN_EMAIL) {
        setLoading(false);
        Alert.alert('Access Denied', 'Only the designated admin can log in as admin.');
        return;
      }

      // Clear any previous role from AsyncStorage (prevents old redirect)
      await AsyncStorage.removeItem('userRole');

      // Set current role in context
      await setUserRole(role);

      // Optional: clear any previous route storage
      await AsyncStorage.removeItem('navigationState');

      // Redirect to the redirecting screen
      router.replace('/redirecting');
    } catch (err) {
      setLoading(false);
      Alert.alert('Login Error', 'Unexpected error occurred.');
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      Alert.alert('Forgot Password', 'Please enter your email to receive a reset link.');
      return;
    }
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) {
        Alert.alert('Error', error.message);
      } else {
        Alert.alert('Reset Link Sent', `A password reset link has been sent to ${email}.`);
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred.');
    }
  };

  return (
    <LinearGradient
      colors={['#00C9A7', '#1E3A8A']}
      start={{ x: 0.5, y: 1 }}
      end={{ x: 0.5, y: 0 }}
      style={styles.gradient}
    >
      <View style={styles.outerContainer}>
          <View style={styles.branding}>
            <Image source={require('../assets/images/mitconnect-logo.png')} style={styles.logo} />
            <Text style={styles.welcome}>Welcome Back</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.title}>Login</Text>
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
                placeholder="Password"
                placeholderTextColor="#9BA1A6"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword((v) => !v)}>
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={20}
                  color="#1976D2"
                  style={styles.eyeIcon}
                />
              </TouchableOpacity>
            </View>
            {errors.password ? <Text style={styles.error}>{errors.password}</Text> : null}
            <View style={styles.optionsRow}>
              <Pressable style={styles.checkboxContainer} onPress={() => setRememberMe((v) => !v)}>
                <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]} />
                <Text style={styles.checkboxLabel}>Remember me</Text>
              </Pressable>
              <TouchableOpacity onPress={handleForgotPassword}>
                <Text style={styles.forgot}>Forgot password?</Text>
              </TouchableOpacity>
            </View>
            <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? 'Logging in...' : 'Login'}</Text>
            </Pressable>
            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <TouchableOpacity onPress={() => router.push('/signup')}>
                <Text style={styles.signupLink}>Sign up</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  outerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  branding: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 180,
    height: 180,
    marginBottom: 4,
    resizeMode: 'contain',
  },
  appName: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  appNameNavy: {
    color: '#1A2980',
    fontWeight: 'bold',
  },
  appNameGreen: {
    color: '#60C481',
    fontWeight: 'bold',
  },
  welcome: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
    marginTop: 2,
    textShadowColor: 'rgba(0,0,0,0.08)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 28,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 18,
    letterSpacing: 0.5,
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
  eyeIcon: {
    marginLeft: 6,
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
  optionsRow: {
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
    backgroundColor: '#007BFF',
    borderColor: '#007BFF',
  },
  checkboxLabel: {
    fontSize: 15,
    color: '#222',
  },
  forgot: {
    color: '#007BFF',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#007BFF',
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
  signupRow: {
    flexDirection: 'row',
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signupText: {
    fontSize: 16,
    color: '#555',
  },
  signupLink: {
    color: '#007BFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
}); 