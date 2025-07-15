declare module 'expo-status-bar' {
  import { ComponentType } from 'react';
  import { StatusBarProps as RNStatusBarProps } from 'react-native';

  export interface StatusBarProps extends RNStatusBarProps {
    style?: 'light' | 'dark' | 'auto';
  }

  export const StatusBar: ComponentType<StatusBarProps>;
} 