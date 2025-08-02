import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Platform } from 'react-native';
import { useTheme } from './ThemeContext';

interface AddEventButtonProps {
  onPress: () => void;
  label: string;
  disabled?: boolean;
  loading?: boolean;
}

export const AddEventButton: React.FC<AddEventButtonProps> = ({
  onPress,
  label,
  disabled = false,
  loading = false,
}) => {
  const { isDarkMode } = useTheme();

  const buttonStyle = [
    styles.button,
    isDarkMode ? styles.buttonDark : styles.buttonLight,
    disabled && styles.buttonDisabled,
  ];

  const textStyle = [
    styles.text,
    isDarkMode ? styles.textDark : styles.textLight,
    disabled && styles.textDisabled,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
      accessibilityLabel={label}
      accessibilityRole="button"
    >
      {loading ? (
        <Text style={textStyle}>Loading...</Text>
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 48,
    paddingHorizontal: 20,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '90%',
    alignSelf: 'center',
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: {
        elevation: 6,
      },
    }),
  },
  buttonLight: {
    backgroundColor: '#0369a1', // Dark blue for light theme (meets WCAG AA)
  },
  buttonDark: {
    backgroundColor: '#15803d', // Dark green for dark theme (meets WCAG AA)
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  textLight: {
    color: '#ffffff', // White text for light theme
  },
  textDark: {
    color: '#ffffff', // White text for dark theme
  },
  textDisabled: {
    opacity: 0.8,
  },
}); 