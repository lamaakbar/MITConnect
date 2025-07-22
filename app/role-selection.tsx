import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const roles = [
  {
    label: 'Employee',
    value: 'employee',
    icon: <Ionicons name="briefcase" size={44} color="#1976D2" />,
    description: 'Access employee features and resources.',
    color: '#1976D2',
  },
  {
    label: 'Trainee',
    value: 'trainee',
    icon: <MaterialIcons name="school" size={44} color="#43A047" />,
    description: 'Participate in training and learning.',
    color: '#43A047',
  },
];

export default function RoleSelectionScreen() {
  const router = useRouter();
  const [pressedIndex, setPressedIndex] = useState<number | null>(null);

  const handleSelect = (role: string) => {
    router.replace({ pathname: '/signup', params: { role } });
  };

  return (
    <LinearGradient
      colors={["#e3f0ff", "#f7fafc"]}
      style={styles.gradient}
    >
      <View style={styles.container}>
        <Text style={styles.title}>Select Your Role</Text>
        <Text style={styles.subtitle}>Please choose your role to continue</Text>
        <View style={styles.cardsRow}>
          {roles.map((role, idx) => (
            <Pressable
              key={role.value}
              style={({ pressed }) => [
                styles.card,
                { borderColor: role.color },
                pressed && styles.cardPressed,
                pressedIndex === idx && styles.cardSelected,
              ]}
              onPress={() => handleSelect(role.value)}
              onPressIn={() => setPressedIndex(idx)}
              onPressOut={() => setPressedIndex(null)}
            >
              <View style={styles.iconContainer}>{role.icon}</View>
              <Text style={[styles.cardText, { color: role.color }]}>{role.label}</Text>
              <Text style={styles.cardDesc}>{role.description}</Text>
            </Pressable>
          ))}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 36,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 28,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 30,
    alignItems: 'center',
    marginHorizontal: 12,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 6,
    width: 160,
    borderWidth: 2,
    borderColor: 'transparent',
    transform: [{ scale: 1 }],
  },
  cardPressed: {
    backgroundColor: '#f0f7ff',
    shadowOpacity: 0.18,
    transform: [{ scale: 1.04 }],
  },
  cardSelected: {
    shadowColor: '#1976D2',
    shadowOpacity: 0.25,
    shadowRadius: 18,
    elevation: 10,
    transform: [{ scale: 1.07 }],
  },
  iconContainer: {
    marginBottom: 18,
  },
  cardText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  cardDesc: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 18,
  },
}); 