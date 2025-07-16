import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Feather, MaterialIcons, MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function AdminHome() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: '#F8F9F9' }}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          {/* Placeholder logo */}
          <View style={styles.logoCircle}>
            <Feather name="users" size={22} color="#004080" />
          </View>
          <Text style={styles.headerTitle}>MIT<Text style={{ color: '#3CB371' }}>Connect</Text></Text>
        </View>
        <View style={styles.headerRight}>
          <Feather name="globe" size={20} color="#222" style={styles.headerIcon} />
          <Feather name="search" size={20} color="#222" style={styles.headerIcon} />
          <Feather name="bell" size={20} color="#222" style={styles.headerIcon} />
          <Feather name="menu" size={20} color="#222" style={styles.headerIcon} />
        </View>
      </View>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.welcome}><Text style={{ color: '#3CB371', fontWeight: 'bold' }}>Welcome</Text> MITConnect Admin</Text>
        <Text style={styles.sectionTitle}>Portal Access</Text>
        {/* Highlight Management Card */}
        <TouchableOpacity onPress={() => router.push('/highlight-management')} activeOpacity={0.8}>
          <View style={[styles.card, { borderColor: '#3CB371', borderWidth: 1 }]}> 
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F8F5' }]}> 
                <Feather name="map-pin" size={22} color="#3CB371" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Highlight Management</Text>
                <Text style={[styles.cardSubtitle, { color: '#3CB371', fontWeight: '500' }]}>The Winner of Table Tennis Competition</Text>
              </View>
              <Feather name="bookmark" size={22} color="#3CB371" />
            </View>
          </View>
        </TouchableOpacity>
        {/* Events Management Card */}
        <TouchableOpacity onPress={() => router.push('/admin-events')} activeOpacity={0.8}>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#F5EEF8' }]}> 
                <MaterialCommunityIcons name="calendar-star" size={22} color="#7D3C98" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Events Management</Text>
                <Text style={styles.cardNumber}>8</Text>
                <Text style={styles.cardLabel}>Total Events</Text>
                <Text style={[styles.cardLink, { color: '#3CB371' }]}>87 registrations</Text>
              </View>
              <Feather name="calendar" size={22} color="#7D3C98" />
            </View>
          </View>
        </TouchableOpacity>
        {/* Ideas Management Card */}
        <TouchableOpacity onPress={() => router.push('/ideas-management')} activeOpacity={0.8}>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#F5EEF8' }]}> 
                <Feather name="activity" size={22} color="#7D3C98" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Ideas Management</Text>
                <Text style={styles.cardNumber}>8</Text>
                <Text style={styles.cardLabel}>Total Ideas</Text>
                <Text style={[styles.cardLink, { color: '#7D3C98' }]}>15% implemented</Text>
              </View>
              <Feather name="zap" size={22} color="#7D3C98" />
            </View>
          </View>
        </TouchableOpacity>
        {/* Trainee Management Card */}
        <TouchableOpacity onPress={() => router.push('/trainee-management')} activeOpacity={0.8}>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF5E7' }]}> 
                <FontAwesome5 name="user-friends" size={20} color="#F39C12" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Trainee Management</Text>
                <Text style={styles.cardNumber}>30</Text>
                <Text style={styles.cardLabel}>Total Trainees</Text>
              </View>
              <Feather name="user" size={22} color="#F39C12" />
            </View>
          </View>
        </TouchableOpacity>
        {/* Gallery Management Card */}
        <TouchableOpacity onPress={() => router.push('/gallery-management')} activeOpacity={0.8}>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF5E7' }]}> 
                <Feather name="image" size={22} color="#E67E22" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Gallery Management</Text>
                <Text style={styles.cardNumber}>156</Text>
                <Text style={styles.cardLabel}>Total Images</Text>
                <Feather name="upload" size={16} color="#222" style={{ marginTop: 2 }} />
              </View>
              <Feather name="image" size={22} color="#E67E22" />
            </View>
          </View>
        </TouchableOpacity>
        {/* Books Management Card */}
        <TouchableOpacity onPress={() => router.push('/books-management')} activeOpacity={0.8}>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FCF3CF' }]}> 
                <MaterialIcons name="menu-book" size={22} color="#F4D03F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>Books Management</Text>
                <Text style={styles.cardNumber}>19</Text>
                <Text style={styles.cardLabel}>Books Recommended</Text>
                <TouchableOpacity onPress={() => router.push('/add-book')} activeOpacity={0.7}>
                  <Text style={[styles.cardLink, { color: '#004080' }]}>Add Book</Text>
                </TouchableOpacity>
              </View>
              <MaterialIcons name="menu-book" size={22} color="#F4D03F" />
            </View>
          </View>
        </TouchableOpacity>
      </ScrollView>
      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="home" size={22} color="#004080" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="calendar" size={22} color="#7D3C98" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="star" size={22} color="#004080" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="user" size={22} color="#F39C12" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <Feather name="image" size={22} color="#E67E22" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.tabItem}>
          <MaterialIcons name="menu-book" size={22} color="#F4D03F" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 10,
    paddingHorizontal: 20,
    backgroundColor: '#F8F9F9',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E8F8F5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004080',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 16,
  },
  container: {
    padding: 20,
    paddingBottom: 40,
  },
  welcome: {
    fontSize: 15,
    marginBottom: 8,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 14,
    color: '#222',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 0,
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
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#3CB371',
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 2,
    marginBottom: 0,
  },
  cardLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  cardLink: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  tabBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
    paddingVertical: 10,
    paddingBottom: 18,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
  },
}); 