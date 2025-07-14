import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';

const roles = [
  { label: 'Admin', value: 'admin' },
  { label: 'Employee', value: 'employee' },
  { label: 'Trainee', value: 'trainee' },
];

export default function RoleSelectionScreen() {
  const router = useRouter();

  const handleSelect = (role: string) => {
    if (role === 'admin') {
      router.replace('/admin-login');
    } else {
      router.replace({ pathname: '/signup', params: { role } });
    }
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/images/icon.png')} // Replace with your logo asset
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>MITConnect</Text>
      <Text style={styles.subtitle}>To proceed, please identify your role</Text>
      <View style={styles.cardsRow}>
        {roles.map((role) => (
          <Pressable
            key={role.value}
            style={styles.card}
            onPress={() => handleSelect(role.value)}
          >
            <Image
              source={require('../assets/images/icon.png')} // Replace with your logo asset
              style={styles.cardLogo}
              resizeMode="contain"
            />
            <Text style={styles.cardText}>{role.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f7fafc',
    paddingHorizontal: 16,
  },
  logo: {
    width: 70,
    height: 70,
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
    marginBottom: 24,
  },
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginHorizontal: 6,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
    width: 90,
  },
  cardLogo: {
    width: 36,
    height: 36,
    marginBottom: 8,
  },
  cardText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
}); 