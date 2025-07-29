import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // Check if it's an authentication error
    if (error.message?.includes('Refresh Token') || error.message?.includes('refresh token')) {
      console.log('🔄 Authentication error detected, clearing invalid session...');
      this.clearInvalidSession();
    }
  }

  clearInvalidSession = async () => {
    try {
      console.log('🧹 ErrorBoundary: Clearing invalid session data...');
      const keys = await AsyncStorage.getAllKeys();
      const authKeys = keys.filter(key => 
        key.includes('supabase') || 
        key.includes('auth') || 
        key.includes('sb-')
      );
      
      for (const key of authKeys) {
        await AsyncStorage.removeItem(key);
        console.log('🗑️ ErrorBoundary: Removed:', key);
      }
      console.log('✅ ErrorBoundary: Invalid session data cleared');
    } catch (error) {
      console.error('❌ ErrorBoundary: Error clearing session data:', error);
    }
  };

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleClearSession = async () => {
    await this.clearInvalidSession();
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      const isAuthError = this.state.error?.message?.includes('Refresh Token') || 
                         this.state.error?.message?.includes('refresh token');

      return (
        <View style={styles.container}>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.message}>
            {isAuthError 
              ? 'Authentication error detected. This usually happens when session data becomes invalid.'
              : 'An unexpected error occurred.'
            }
          </Text>
          
          {isAuthError && (
            <TouchableOpacity style={styles.clearButton} onPress={this.handleClearSession}>
              <Text style={styles.clearButtonText}>Clear Session & Retry</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
    lineHeight: 24,
  },
  clearButton: {
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  retryButton: {
    backgroundColor: '#4ecdc4',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 