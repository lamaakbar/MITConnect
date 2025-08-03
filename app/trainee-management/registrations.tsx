import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import RNPickerSelect from 'react-native-picker-select';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../components/ThemeContext';
import { useThemeColor } from '../../hooks/useThemeColor';

const DEPARTMENTS = [
  'All Departments',
  'IT Governance and Architecture',
  'Enterprise Project Delivery',
  'Development and Testing',
  'Production',
  'IT Services',
  'IT Transformation',
];
const PROGRAMS = [
  'All Programs',
  'CO-OP',
  'Technology',
];

interface Week {
  week: number;
  from: string;
  to: string;
  department: string;
  hours: number;
}

interface TraineePlan {
  id: string;
  trainee_id: string;
  trainee_name: string;
  program_name: string;
  start_date: string;
  end_date: string;
  weeks: Week[];
  created_at: string;
}

function formatDate(date: string) {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' });
}

// Theme tokens for consistent design
const getThemeTokens = (isDark: boolean) => ({
  boxBg: isDark ? "#111316" : "#F5F7FA",
  boxBorder: isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.10)",
  boxBorderActive: isDark ? "#22c55e" : "#0ea5e9",
  text: isDark ? "#F4F6F8" : "#0B0F14",
  placeholder: isDark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.45)",
});

export default function TraineeRegistrations() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [program, setProgram] = useState(PROGRAMS[0]);
  const [registrations, setRegistrations] = useState<TraineePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchFocused, setSearchFocused] = useState(false);
  const [deptFocused, setDeptFocused] = useState(false);
  const [progFocused, setProgFocused] = useState(false);
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const dividerColor = isDarkMode ? '#23272b' : '#F2F4F7';
  
  const theme = getThemeTokens(isDarkMode);

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('trainee_plans').select('*');
      if (error) {
        setError('Failed to fetch trainee registrations');
        setLoading(false);
        return;
      }
      setRegistrations(data || []);
      console.log('Trainee registrations:', data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  // Filtering logic
  const filtered = registrations.filter(reg => {
    const matchesDept = department === 'All Departments' || reg.weeks?.[0]?.department === department;
    const matchesProg = program === 'All Programs' || reg.program_name === program;
    const searchLower = search.toLowerCase();
    const matchesSearch =
      reg.trainee_name.toLowerCase().includes(searchLower) ||
      (reg.weeks?.[0]?.department || '').toLowerCase().includes(searchLower) ||
      reg.program_name.toLowerCase().includes(searchLower);
    return matchesDept && matchesProg && matchesSearch;
  });

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}><ActivityIndicator size="large" color="#3CB371" /></View>;
  }
  if (error) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor }} contentContainerStyle={{ padding: 16 }}>
      {/* Search Box */}
      <View style={[
        styles.searchRow, 
        { 
          backgroundColor: theme.boxBg,
          borderColor: searchFocused ? theme.boxBorderActive : theme.boxBorder,
          borderWidth: 1,
          shadowColor: searchFocused ? "#000" : "transparent",
          shadowOpacity: searchFocused ? 0.2 : 0,
          shadowRadius: searchFocused ? 6 : 0,
          elevation: searchFocused ? 3 : 0,
        }
      ]}>
        <Ionicons name="search" size={20} color={theme.text} style={{ marginLeft: 8, marginRight: 4 }} />
        <TextInput
          style={[styles.searchInput, { color: theme.text }]}
          placeholder="Search by name, department, or program"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={theme.placeholder}
          onFocus={() => setSearchFocused(true)}
          onBlur={() => setSearchFocused(false)}
        />
      </View>
      
      {/* Filter Row */}
      <View style={styles.filterRow}>
        {/* Department Filter */}
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={[
            styles.filterBox,
            {
              backgroundColor: theme.boxBg,
              borderColor: deptFocused ? theme.boxBorderActive : theme.boxBorder,
              borderWidth: 1,
              shadowColor: deptFocused ? "#000" : "transparent",
              shadowOpacity: deptFocused ? 0.2 : 0,
              shadowRadius: deptFocused ? 6 : 0,
              elevation: deptFocused ? 3 : 0,
            }
          ]}>
            <RNPickerSelect
              onValueChange={setDepartment}
              value={department}
              onOpen={() => setDeptFocused(true)}
              onClose={() => setDeptFocused(false)}
              placeholder={{ 
                label: 'Select Department...', 
                value: '', 
                color: theme.placeholder
              }}
              items={DEPARTMENTS.map(dep => ({ 
                label: dep, 
                value: dep, 
                color: theme.text,
                style: Platform.OS === 'android' && isDarkMode ? {
                  backgroundColor: theme.boxBg,
                  color: theme.text,
                } : undefined,
              }))}
              modalProps={{
                style: Platform.OS === 'android' && isDarkMode ? {
                  backgroundColor: theme.boxBg,
                } : undefined,
              }}
              style={{
                inputAndroid: { 
                  height: 56, 
                  paddingHorizontal: 16, 
                  paddingVertical: 8,
                  color: theme.text, 
                  flex: 1,
                  fontSize: 16,
                  fontWeight: '500',
                  textAlignVertical: 'center',
                  includeFontPadding: false,
                  backgroundColor: 'transparent',
                },
                inputIOS: { 
                  height: 44, 
                  padding: 10, 
                  color: theme.text, 
                  flex: 1,
                  fontSize: 16,
                  fontWeight: '500',
                },
                placeholder: { 
                  color: theme.placeholder,
                  fontSize: 16,
                  fontWeight: '500',
                },
                iconContainer: { 
                  top: 0, 
                  right: 12, 
                  height: 56, 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  position: 'absolute',
                  width: 40,
                },
                viewContainer: {
                  flex: 1,
                },
                headlessAndroidContainer: {
                  flex: 1,
                },
              }}
              useNativeAndroidPickerStyle={false}
              touchableWrapperProps={{
                activeOpacity: 0.7,
                style: Platform.OS === 'android' ? {
                  flex: 1,
                  height: 56,
                  justifyContent: 'center',
                } : undefined,
              }}
              Icon={() => (
                <View style={{
                  width: 40,
                  height: 56,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'transparent',
                }}>
                  <Ionicons name="chevron-down" size={24} color={theme.text} />
                </View>
              )}
            />
          </View>
        </View>
        
        {/* Program Filter */}
        <View style={{ flex: 1 }}>
          <View style={[
            styles.filterBox,
            {
              backgroundColor: theme.boxBg,
              borderColor: progFocused ? theme.boxBorderActive : theme.boxBorder,
              borderWidth: 1,
              shadowColor: progFocused ? "#000" : "transparent",
              shadowOpacity: progFocused ? 0.2 : 0,
              shadowRadius: progFocused ? 6 : 0,
              elevation: progFocused ? 3 : 0,
            }
          ]}>
            <RNPickerSelect
              onValueChange={setProgram}
              value={program}
              onOpen={() => setProgFocused(true)}
              onClose={() => setProgFocused(false)}
              placeholder={{ 
                label: 'Select Program...', 
                value: '', 
                color: theme.placeholder
              }}
              items={PROGRAMS.map(prog => ({ 
                label: prog, 
                value: prog, 
                color: theme.text,
                style: Platform.OS === 'android' && isDarkMode ? {
                  backgroundColor: theme.boxBg,
                  color: theme.text,
                } : undefined,
              }))}
              modalProps={{
                style: Platform.OS === 'android' && isDarkMode ? {
                  backgroundColor: theme.boxBg,
                } : undefined,
              }}
              style={{
                inputAndroid: { 
                  height: 56, 
                  paddingHorizontal: 16, 
                  paddingVertical: 8,
                  color: theme.text, 
                  flex: 1,
                  fontSize: 16,
                  fontWeight: '500',
                  textAlignVertical: 'center',
                  includeFontPadding: false,
                  backgroundColor: 'transparent',
                },
                inputIOS: { 
                  height: 44, 
                  padding: 10, 
                  color: theme.text, 
                  flex: 1,
                  fontSize: 16,
                  fontWeight: '500',
                },
                placeholder: { 
                  color: theme.placeholder,
                  fontSize: 16,
                  fontWeight: '500',
                },
                iconContainer: { 
                  top: 0, 
                  right: 12, 
                  height: 56, 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  position: 'absolute',
                  width: 40,
                },
                viewContainer: {
                  flex: 1,
                },
                headlessAndroidContainer: {
                  flex: 1,
                },
              }}
              useNativeAndroidPickerStyle={false}
              touchableWrapperProps={{
                activeOpacity: 0.7,
                style: Platform.OS === 'android' ? {
                  flex: 1,
                  height: 56,
                  justifyContent: 'center',
                } : undefined,
              }}
              Icon={() => (
                <View style={{
                  width: 40,
                  height: 56,
                  justifyContent: 'center',
                  alignItems: 'center',
                  backgroundColor: 'transparent',
                }}>
                  <Ionicons name="chevron-down" size={24} color={theme.text} />
                </View>
              )}
            />
          </View>
        </View>
      </View>
      {filtered.length === 0 && (
        <Text style={{ color: secondaryTextColor, textAlign: 'center', marginTop: 32 }}>No trainees found.</Text>
      )}
      {filtered.map((reg, idx) => (
        <View key={reg.id} style={[
          styles.card, 
          { 
            backgroundColor: cardBackground,
            shadowColor: isDarkMode ? '#000' : '#000',
            borderWidth: isDarkMode ? 0 : 1,
            borderColor: isDarkMode ? 'transparent' : '#E5E7EB',
          }
        ]}>
          {/* Header: Name + Program */}
          <View style={styles.cardRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="person-circle-outline" size={28} color="#3CB371" />
            </View>
            <View style={styles.textContainer}>
              <Text 
                style={[styles.nameText, { color: '#3CB371' }]}
                numberOfLines={1}
                ellipsizeMode="tail"
                allowFontScaling={true}
              >
                {reg.trainee_name}
              </Text>
              <Text 
                style={[styles.programText, { color: secondaryTextColor }]}
                numberOfLines={2}
                ellipsizeMode="tail"
                allowFontScaling={true}
              >
                {reg.program_name}
              </Text>
            </View>
          </View>
          
          {/* Divider */}
          <View style={[styles.cardDivider, { backgroundColor: dividerColor }]} />
          
          {/* Info Rows */}
          <View style={styles.cardInfoRow}>
            {/* Date Row */}
            <View style={styles.infoItem}>
              <View style={styles.iconWrapper}>
                <Ionicons name="calendar-outline" size={16} color={secondaryTextColor} />
              </View>
              <View style={styles.textWrapper}>
                <Text 
                  style={[styles.infoText, { color: textColor }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  allowFontScaling={true}
                >
                  {formatDate(reg.start_date)} - {formatDate(reg.end_date)}
                </Text>
              </View>
            </View>
            
            {/* Department Row */}
            <View style={styles.infoItem}>
              <View style={styles.iconWrapper}>
                <Ionicons name="business-outline" size={16} color={secondaryTextColor} />
              </View>
              <View style={styles.textWrapper}>
                <Text 
                  style={[styles.infoText, { color: textColor }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  allowFontScaling={true}
                >
                  {reg.weeks?.[0]?.department || '-'}
                </Text>
              </View>
            </View>
            
            {/* Duration Row */}
            <View style={styles.infoItem}>
              <View style={styles.iconWrapper}>
                <Ionicons name="time-outline" size={16} color={secondaryTextColor} />
              </View>
              <View style={styles.textWrapper}>
                <Text 
                  style={[styles.infoText, { color: textColor }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  allowFontScaling={true}
                >
                  {reg.weeks?.length || 0} weeks
                </Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginBottom: 10,
    height: 56,
    paddingHorizontal: 16,
    minHeight: 56,
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 8,
  },
  filterRow: {
    flexDirection: 'row',
    marginBottom: 16,
    zIndex: 30,
  },
  filterBox: {
    borderRadius: 8,
    elevation: Platform.OS === 'android' ? 2 : 0,
    shadowColor: Platform.OS === 'android' ? '#000' : undefined,
    shadowOpacity: Platform.OS === 'android' ? 0.1 : undefined,
    shadowRadius: Platform.OS === 'android' ? 2 : undefined,
    shadowOffset: Platform.OS === 'android' ? { width: 0, height: 1 } : undefined,
  },
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameText: {
    fontWeight: 'bold',
    fontSize: 16,
    lineHeight: 20,
    fontFamily: 'System',
  },
  programText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'System',
  },
  cardDivider: {
    height: 1,
    borderRadius: 1,
    marginVertical: 8,
  },
  cardInfoRow: {
    flexDirection: 'column',
    gap: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  infoText: {
    fontSize: 13,
    lineHeight: 16,
    fontFamily: 'System',
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  textContainer: {
    flex: 1,
  },
  iconWrapper: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 4,
  },
  textWrapper: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    maxWidth: '100%',
  },
}); 