import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { Feather, MaterialIcons, MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import AdminTabBar from '../components/AdminTabBar';

// Mock user data for admin
const mockAdminUser = {
  name: 'Admin User',
  email: 'admin@company.com'
};

export default function AdminHome() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [showAccountModal, setShowAccountModal] = useState(false);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // In a real app, you would update the global theme here
  };

  const getThemeColors = () => {
    return isDarkMode ? {
      background: '#151718',
      cardBackground: '#1E1E1E',
      text: '#ECEDEE',
      textSecondary: '#9BA1A6',
      border: '#2A2A2A',
      icon: '#9BA1A6',
      activeIcon: '#3CB371'
    } : {
      background: '#F8F9F9',
      cardBackground: '#fff',
      text: '#222',
      textSecondary: '#888',
      border: '#E0E0E0',
      icon: '#222',
      activeIcon: '#3CB371'
    };
  };

  const colors = getThemeColors();

  return (
    <View style={[styles.mainContainer, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.headerContainer, { backgroundColor: colors.cardBackground }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.logoCircle, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E8F8F5' }]}>
            <Feather name="users" size={18} color="#004080" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            MIT<Text style={{ color: '#3CB371' }}>Connect</Text>
          </Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={toggleDarkMode} style={styles.headerIcon}>
            <Feather 
              name={isDarkMode ? "sun" : "moon"} 
              size={18} 
              color={colors.icon} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowAccountModal(true)} style={styles.headerIcon}>
            <Feather name="user" size={18} color={colors.icon} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={true}
      >
        <Text style={[styles.welcome, { color: colors.text }]}>
          <Text style={{ color: '#3CB371', fontWeight: 'bold' }}>Welcome</Text> MITConnect Admin
        </Text>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Portal Access</Text>
        
        {/* Highlight Management Card */}
        <TouchableOpacity onPress={() => router.push('/highlight-management')} activeOpacity={0.8}>
          <View style={[styles.card, { 
            backgroundColor: colors.cardBackground, 
            borderColor: '#3CB371', 
            borderWidth: 1 
          }]}> 
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#E8F8F5' }]}> 
                <Feather name="map-pin" size={22} color="#3CB371" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Highlight Management</Text>
                <Text style={[styles.cardSubtitle, { color: '#3CB371', fontWeight: '500' }]}>The Winner of Table Tennis Competition</Text>
              </View>
              <Feather name="bookmark" size={22} color="#3CB371" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Events Management Card */}
        <TouchableOpacity onPress={() => router.push('/admin-events')} activeOpacity={0.8}>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#F5EEF8' }]}> 
                <MaterialCommunityIcons name="calendar-star" size={22} color="#7D3C98" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Events Management</Text>
                <Text style={[styles.cardNumber, { color: colors.text }]}>8</Text>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Events</Text>
                <Text style={[styles.cardLink, { color: '#3CB371' }]}>87 registrations</Text>
              </View>
              <Feather name="calendar" size={22} color="#7D3C98" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Ideas Management Card */}
        <TouchableOpacity onPress={() => router.push('/ideas-management')} activeOpacity={0.8}>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#F5EEF8' }]}> 
                <Feather name="activity" size={22} color="#7D3C98" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Ideas Management</Text>
                <Text style={[styles.cardNumber, { color: colors.text }]}>8</Text>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Ideas</Text>
                <Text style={[styles.cardLink, { color: '#7D3C98' }]}>15% implemented</Text>
              </View>
              <Feather name="zap" size={22} color="#7D3C98" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Trainee Management Card */}
        <TouchableOpacity onPress={() => router.push('/trainee-management')} activeOpacity={0.8}>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF5E7' }]}> 
                <FontAwesome5 name="user-friends" size={20} color="#F39C12" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Trainee Management</Text>
                <Text style={[styles.cardNumber, { color: colors.text }]}>30</Text>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Trainees</Text>
              </View>
              <Feather name="user" size={22} color="#F39C12" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Gallery Management Card */}
        <TouchableOpacity onPress={() => router.push('/gallery-management')} activeOpacity={0.8}>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FEF5E7' }]}> 
                <Feather name="image" size={22} color="#E67E22" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Gallery Management</Text>
                <Text style={[styles.cardNumber, { color: colors.text }]}>156</Text>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Total Images</Text>
                <Feather name="upload" size={16} color={colors.icon} style={{ marginTop: 2 }} />
              </View>
              <Feather name="image" size={22} color="#E67E22" />
            </View>
          </View>
        </TouchableOpacity>

        {/* Books Management Card */}
        <TouchableOpacity onPress={() => router.push('/books-management')} activeOpacity={0.8}>
          <View style={[styles.card, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: '#FCF3CF' }]}> 
                <MaterialIcons name="menu-book" size={22} color="#F4D03F" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Books Management</Text>
                <Text style={[styles.cardNumber, { color: colors.text }]}>19</Text>
                <Text style={[styles.cardLabel, { color: colors.textSecondary }]}>Books Recommended</Text>
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
      <AdminTabBar activeTab="home" isDarkMode={isDarkMode} />

      {/* Account Modal */}
      <Modal
        visible={showAccountModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAccountModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setShowAccountModal(false)}
        >
          <View style={[styles.accountModal, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.accountHeader}>
              <View style={[styles.accountAvatar, { backgroundColor: '#3CB371' }]}>
                <Feather name="user" size={24} color="#fff" />
              </View>
              <Text style={[styles.accountName, { color: colors.text }]}>{mockAdminUser.name}</Text>
              <Text style={[styles.accountEmail, { color: colors.textSecondary }]}>{mockAdminUser.email}</Text>
            </View>
            <TouchableOpacity 
              style={[styles.closeButton, { backgroundColor: colors.border }]}
              onPress={() => setShowAccountModal(false)}
            >
              <Text style={[styles.closeButtonText, { color: colors.text }]}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 48,
    paddingBottom: 10,
    paddingHorizontal: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginLeft: 16,
    padding: 4,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100, // Extra padding for tab bar
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
  },
  card: {
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
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    marginBottom: 2,
  },
  cardNumber: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 2,
    marginBottom: 0,
  },
  cardLabel: {
    fontSize: 13,
    marginBottom: 2,
  },
  cardLink: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 2,
    textDecorationLine: 'underline',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountModal: {
    width: '80%',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  accountHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  accountAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  accountName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  accountEmail: {
    fontSize: 14,
  },
  closeButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
}); 