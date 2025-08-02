import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../components/ThemeContext';
import { useThemeColor } from '../../hooks/useThemeColor';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TraineeOverview from './overview';
import TraineeRegistrations from './registrations';
import TraineeProgress from './progress';
import TraineeFeedbackManagement from './feedback';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'progress', label: 'Progress' },
  { key: 'feedback', label: 'Feedback' },
];

export default function TraineeManagementIndex() {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#6B7280';
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E5E7E9';
  const iconColor = useThemeColor({}, 'icon');
  const insets = useSafeAreaInsets();

  let ContentComponent;
  if (selectedTab === 'dashboard') ContentComponent = <TraineeOverview />;
  else if (selectedTab === 'registrations') ContentComponent = <TraineeRegistrations />;
  else if (selectedTab === 'progress') ContentComponent = <TraineeProgress />;
  else if (selectedTab === 'feedback') ContentComponent = <TraineeFeedbackManagement />;
  else ContentComponent = <TraineeOverview />;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top,
        paddingHorizontal: 16,
        paddingBottom: 12,
        backgroundColor: cardBackground,
        borderBottomWidth: 1,
        borderBottomColor: borderColor,
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <TouchableOpacity onPress={() => router.push('/admin-home')} style={{ padding: 4, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{
            fontSize: 18,
            fontWeight: 'bold',
            letterSpacing: 0.5,
            color: textColor,
            textAlign: 'center',
          }}>Trainee Management</Text>
        </View>
        <View style={{ width: 32 }} />
      </View>
      
      {/* Integrated Tab Navigation */}
      <View style={[
        styles.integratedTabContainer,
        {
          backgroundColor: isDarkMode ? '#2A2A2A' : '#F0F0F0',
        }
      ]}>  
          {TABS.map((tab, index) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.integratedTab,
                { 
                  backgroundColor: selectedTab === tab.key 
                    ? '#3CB371' 
                    : 'transparent'
                }
              ]}
              onPress={() => setSelectedTab(tab.key)}
              activeOpacity={0.7}
            >
              <Text 
                style={[
                  styles.integratedTabText,
                  { 
                    color: selectedTab === tab.key 
                      ? '#FFFFFF' 
                      : (isDarkMode ? '#9BA1A6' : '#6B7280'),
                    fontWeight: selectedTab === tab.key ? '600' : '500'
                  }
                ]}
                numberOfLines={1}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
      </View>
      
      <View style={{ flex: 1 }}>
        {ContentComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Enhanced Header Styles
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  headerTitleContainer: {
    flex: 1,
    marginLeft: 16,
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    fontFamily: 'System',
    letterSpacing: 0.1,
  },
  headerSubtitle: {
    fontSize: 13,
    marginTop: 3,
    fontFamily: 'System',
    opacity: 0.7,
    fontWeight: '400',
  },
  
  // Integrated Tab Navigation Styles
  integratedTabContainer: {
    flexDirection: 'row',
    marginTop: 12,
    marginHorizontal: 16,
    padding: 6,
    borderRadius: 14,
    height: 48,
  },
  integratedTab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 6,
    marginHorizontal: 2,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  integratedTabText: {
    fontSize: 12,
    fontFamily: 'System',
    textAlign: 'center',
  },
  
  // Legacy styles (keeping for compatibility)
  segmentedControlWrapper: {
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    shadowOpacity: 0.03,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 24,
    padding: 4,
    justifyContent: 'space-between',
  },
  segmentedTab: {
    flex: 1,
    paddingVertical: 10,
    marginHorizontal: 2,
    borderRadius: 20,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  segmentedTabActive: {
    backgroundColor: '#3CB371',
    shadowColor: '#3CB371',
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  segmentedTabLabel: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'System',
  },
  segmentedTabLabelActive: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
