import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminHome() {
  const router = useRouter();
  const cards = [
    {
      title: 'Highlighttttggv Management',
      subtitle: 'The Winner of Table Tennis Competition',
      icon: <Feather name="map-pin" size={24} color="#3CB371" />,
      color: '#E8F8F5',
      onPress: () => router.push('/highlight-management'),
    },
    {
      title: 'Events Management',
      subtitle: '8 Total Events\n87 registrations',
      icon: <MaterialIcons name="event" size={24} color="#7D3C98" />,
      color: '#F5EEF8',
      onPress: () => router.push('/admin-events'),
    },
    {
      title: 'Ideas Management',
      subtitle: '8 Total Ideas\n15% implemented',
      icon: <Feather name="activity" size={24} color="#7D3C98" />,
      color: '#F5EEF8',
      onPress: () => router.push('/ideas-management'),
    },
    {
      title: 'Shop Management',
      subtitle: '9 Total Ads',
      icon: <MaterialCommunityIcons name="sale" size={24} color="#F39C12" />,
      color: '#FEF5E7',
      onPress: () => router.push('/shop-management'),
    },
    {
      title: 'Trainee Management',
      subtitle: '30 Total Trainees',
      icon: <FontAwesome5 name="user-friends" size={22} color="#F39C12" />,
      color: '#FEF5E7',
      onPress: () => router.push('/trainee-management'),
      progress: 0.7,
    },
    {
      title: 'Gallery Management',
      subtitle: '156 Total Images',
      icon: <Ionicons name="images-outline" size={24} color="#E67E22" />,
      color: '#FEF5E7',
      onPress: () => router.push('/gallery-management'),
    },
    {
      title: 'Books Management',
      subtitle: '19 Books Recommended',
      icon: <MaterialIcons name="menu-book" size={24} color="#F4D03F" />,
      color: '#FCF3CF',
      onPress: () => router.push('/books-management'),
      action: 'Add Book',
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.logo}>MITConnect</Text>
          <Ionicons name="person-circle-outline" size={32} color="#004080" />
        </View>
        <Text style={styles.welcome}><Text style={{ color: '#3CB371', fontWeight: 'bold' }}>Welcome</Text> MITConnect Admin</Text>
        <Text style={styles.sectionTitle}>Portal Access</Text>
        {cards.map((card, i) => (
          <TouchableOpacity key={i} style={[styles.card, { backgroundColor: card.color }]} onPress={card.onPress}>
            <View style={styles.cardRow}>
              <View style={styles.iconBox}>{card.icon}</View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{card.title}</Text>
                <Text style={styles.cardSubtitle}>{card.subtitle}</Text>
                {card.progress !== undefined && (
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBar, { width: `${card.progress * 100}%` }]} />
                  </View>
                )}
                {card.action && (
                  <Text style={styles.cardAction}>{card.action}</Text>
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <View style={styles.footer}>
        <TouchableOpacity style={styles.footerTab} onPress={() => router.push('/admin-home')}>
          <Ionicons name="home" size={24} color="#004080" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTab} onPress={() => router.push('/admin-events')}>
          <MaterialIcons name="event" size={24} color="#7D3C98" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTab} onPress={() => router.push('/ideas-management')}>
          <Feather name="activity" size={24} color="#7D3C98" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTab} onPress={() => router.push('/shop-management')}>
          <MaterialCommunityIcons name="sale" size={24} color="#F39C12" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTab} onPress={() => router.push('/gallery-management')}>
          <Ionicons name="images-outline" size={24} color="#E67E22" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.footerTab} onPress={() => router.push('/books-management')}>
          <MaterialIcons name="menu-book" size={24} color="#F4D03F" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: '#F8F9F9',
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  logo: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#004080',
  },
  welcome: {
    fontSize: 16,
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#222',
  },
  card: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  progressBarBg: {
    height: 6,
    backgroundColor: '#E5E7E9',
    borderRadius: 3,
    marginTop: 6,
    marginBottom: 2,
    width: '100%',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#004080',
    borderRadius: 3,
  },
  cardAction: {
    color: '#004080',
    fontWeight: 'bold',
    marginTop: 6,
    fontSize: 13,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    height: 60,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 8,
  },
  footerTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
}); 