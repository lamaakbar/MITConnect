import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Modal, StatusBar, Alert } from 'react-native';
import { Feather, MaterialIcons, MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useColorScheme } from '@/hooks/useColorScheme';
import AdminTabBar from '../components/AdminTabBar';
import { useTheme } from '../components/ThemeContext';
import ProfileModal from '../components/ProfileModal';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useUserContext } from '../components/UserContext';
import { supabase } from '../services/supabase';

// Mock user data for admin
const mockAdminUser = {
  name: 'Admin User',
  email: 'admin@company.com'
};

export default function AdminHome() {
  const router = useRouter();
  const { isDarkMode, toggleTheme } = useTheme();
  const [profileVisible, setProfileVisible] = useState(false);
  const { fromLogin } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { effectiveRole, viewAs, setViewAs, userRole } = useUserContext();

  // State for dynamic data
  const [latestHighlightTitle, setLatestHighlightTitle] = useState('Loading...');
  const [availableEventsCount, setAvailableEventsCount] = useState(0);
  const [approvedIdeasCount, setApprovedIdeasCount] = useState(0);
  const [traineeCount, setTraineeCount] = useState(0);

  // Fetch real data from database
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch latest highlight
        const { data: highlights, error: highlightsError } = await supabase
          .from('highlights')
          .select('title')
          .order('created_at', { ascending: false })
          .limit(1);
        
        if (!highlightsError && highlights && highlights.length > 0) {
          setLatestHighlightTitle(highlights[0].title);
        } else {
          setLatestHighlightTitle('No highlights available');
        }

        // Fetch available events count
        const { count: events, error: eventsError } = await supabase
          .from('events')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'upcoming');
        
        if (!eventsError && events !== null) {
          setAvailableEventsCount(events);
        }

        // Fetch approved ideas count
        const { count: approvedIdeas, error: ideasError } = await supabase
          .from('ideas')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'Approved');
        
        if (!ideasError && approvedIdeas !== null) {
          setApprovedIdeasCount(approvedIdeas);
        }

        // Fetch trainee count (registered trainees with ongoing progress)
        const { count: trainees, error: traineesError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'trainee');
        
        if (!traineesError && trainees !== null) {
          setTraineeCount(trainees);
        }

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  React.useEffect(() => {
    if (fromLogin) {
      // Optionally reset navigation or scroll to top, etc.
      // For now, just log for debug
      console.log('Navigated from login, ignoring previous route state.');
    }
  }, [fromLogin]);

  const handleViewAs = (role: 'admin' | 'employee' | 'trainee') => {
    console.log('handleViewAs called with role:', role);
    console.log('Current viewAs state before setViewAs:', viewAs);
    setViewAs(role);
    console.log('viewAs state set to:', role);
    
    // Navigate immediately without setTimeout
    if (role === 'employee') {
      console.log('Navigating to employee-home');
      router.push('/employee-home');
    } else if (role === 'trainee') {
      console.log('Navigating to trainee-home');
      router.push('/trainee-home');
    }
    // For admin role, stay on current page
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
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      
                           {/* Header */}
        <View style={[styles.header, { 
          backgroundColor: colors.cardBackground,
          borderBottomColor: colors.border
        }]}>
          <Image source={require('../assets/images/mitconnect-logo.png')} style={styles.logo} />
          <Text style={[styles.appName, { color: colors.text }]}>
            <Text style={{ color: colors.text }}>MIT</Text>
            <Text style={{ color: '#43C6AC' }}>Connect</Text>
          </Text>
          <View style={styles.headerButtons}>
            <TouchableOpacity 
              style={[styles.themeButton, { backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F0F0' }]}
              onPress={toggleTheme}
            >
              <Ionicons 
                name={isDarkMode ? 'sunny' : 'moon'} 
                size={20} 
                color={isDarkMode ? '#FFD700' : '#666'} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: '#3CB371' }]}
              onPress={() => setProfileVisible(true)}
            >
              <Ionicons name="person-circle-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

      {/* Return to Admin View Banner - Show when in viewAs mode */}
      {viewAs && (
        <View style={{
          backgroundColor: '#FF6B6B',
          paddingVertical: 12,
          paddingHorizontal: 16,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          <Ionicons name="warning" size={20} color="#fff" />
          <Text style={{
            color: '#fff',
            fontSize: 16,
            fontWeight: '600',
            marginLeft: 8,
            flex: 1,
            textAlign: 'center',
          }}>
            Preview Mode - Viewing as {viewAs}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 12,
              paddingVertical: 6,
              borderRadius: 8,
            }}
            onPress={() => {
              console.log('Banner: Reset to Admin View pressed');
              setViewAs(null);
              router.replace('/admin-home');
            }}
          >
            <Text style={{ color: '#fff', fontSize: 14, fontWeight: '600' }}>
              Exit Preview
            </Text>
          </TouchableOpacity>
        </View>
      )}

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
        
        {/* View As Section - Only visible to admins */}
        {userRole === 'admin' && (
          <View style={[styles.viewAsContainer, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.viewAsHeader}>
              <Ionicons name="eye" size={20} color="#3CB371" />
              <Text style={[styles.viewAsTitle, { color: colors.text }]}>👁️ View as</Text>
            </View>
            <Text style={[styles.viewAsSubtitle, { color: colors.textSecondary }]}>
              Preview how the app looks for different user roles
            </Text>
            
            <View style={styles.viewAsButtons}>
              <TouchableOpacity
                style={[
                  styles.viewAsButton,
                  { backgroundColor: viewAs === 'employee' || (!viewAs && effectiveRole === 'employee') ? '#3CB371' : colors.border }
                ]}
                onPress={() => handleViewAs('employee')}
              >
                <Text style={[styles.viewAsButtonText, { color: viewAs === 'employee' || (!viewAs && effectiveRole === 'employee') ? '#fff' : colors.text }]}>
                  Employee
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.viewAsButton,
                  { backgroundColor: viewAs === 'trainee' || (!viewAs && effectiveRole === 'trainee') ? '#3CB371' : colors.border }
                ]}
                onPress={() => handleViewAs('trainee')}
              >
                <Text style={[styles.viewAsButtonText, { color: viewAs === 'trainee' || (!viewAs && effectiveRole === 'trainee') ? '#fff' : colors.text }]}>
                  Trainee
                </Text>
              </TouchableOpacity>
            </View>
                         {viewAs && (
               <TouchableOpacity
                 style={styles.resetViewButton}
                 onPress={() => {
                   console.log('Reset to Admin View button pressed');
                   console.log('Current viewAs state:', viewAs);
                   setViewAs(null);
                   console.log('viewAs state set to null');
                   router.replace('/admin-home');
                 }}
               >
                 <Text style={[styles.resetViewText, { color: '#3CB371' }]}>
                   🔁 Reset to Admin View
                 </Text>
               </TouchableOpacity>
             )}
          </View>
        )}
        
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
                <Text style={[styles.cardSubtitle, { color: '#3CB371', fontWeight: '500' }]}>{latestHighlightTitle}</Text>
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
                 <Text style={[styles.cardLink, { color: '#3CB371' }]}>{availableEventsCount} available events</Text>
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
                 <Text style={[styles.cardLink, { color: '#7D3C98' }]}>{approvedIdeasCount} approved</Text>
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
                 <Text style={[styles.cardLink, { color: '#F39C12' }]}>{traineeCount} trainees in progress</Text>
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
       <ProfileModal visible={profileVisible} onClose={() => setProfileVisible(false)} />
     </View>
   );
 }

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 27,
    paddingBottom: 16,
    borderBottomWidth: 1,
    marginTop: 35,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 8,
  },
  logo: {
    width: 32,
    height: 32,
    marginRight: 8,
    marginLeft: 24,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    letterSpacing: 0.5,
    flex: 1,
    textAlign: 'center',
    marginLeft: 32, // Move text more to the right
  },
  viewAsContainer: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 18,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#3CB371',
  },
  viewAsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  viewAsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  viewAsSubtitle: {
    fontSize: 13,
    marginBottom: 16,
  },
  viewAsButtons: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  viewAsButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewAsButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  resetViewButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resetViewText: {
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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