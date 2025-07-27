import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../../components/ThemeContext';
import { useThemeColor } from '../../hooks/useThemeColor';
import TraineeOverview from './overview';
import TraineeRegistrations from './registrations';
import TraineeProgress from './progress';

const TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'registrations', label: 'Registrations' },
  { key: 'progress', label: 'Progress' },
];

export default function TraineeManagementIndex() {
  const [selectedTab, setSelectedTab] = useState('dashboard');
  const router = useRouter();
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E5E7E9';
  const iconColor = useThemeColor({}, 'icon');

  let ContentComponent;
  if (selectedTab === 'dashboard') ContentComponent = <TraineeOverview />;
  else if (selectedTab === 'registrations') ContentComponent = <TraineeRegistrations />;
  else if (selectedTab === 'progress') ContentComponent = <TraineeProgress />;
  else ContentComponent = <TraineeOverview />;

  return (
    <View style={{ flex: 1, backgroundColor }}>
      <View style={{ height: 48 }} />
      <View style={[styles.headerRow, { backgroundColor: cardBackground }]}> 
        <TouchableOpacity style={[styles.backButton, { backgroundColor: isDarkMode ? '#23272b' : '#F2F4F7' }]} onPress={() => router.push('/admin-home')}>
          <Ionicons name="chevron-back" size={28} color={iconColor} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: textColor }]}>Trainee Management</Text>
        <View style={{ width: 36 }} />
      </View>
      <View style={[styles.segmentedControlWrapper, { backgroundColor: cardBackground, shadowColor: isDarkMode ? '#000' : '#000' }]}> 
        <View style={[styles.segmentedControl, { backgroundColor: isDarkMode ? '#23272b' : '#F2F4F7' }]}> 
          {TABS.map(tab => (
            <TouchableOpacity
              key={tab.key}
              style={[styles.segmentedTab, selectedTab === tab.key && { ...styles.segmentedTabActive, backgroundColor: '#3CB371', shadowColor: '#3CB371' }]}
              onPress={() => setSelectedTab(tab.key)}
              activeOpacity={0.8}
            >
              <Text style={[styles.segmentedTabLabel, { color: textColor }, selectedTab === tab.key && styles.segmentedTabLabelActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View style={{ flex: 1 }}>
        {ContentComponent}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
    letterSpacing: 0.2,
  },
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
