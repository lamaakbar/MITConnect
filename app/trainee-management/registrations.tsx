import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
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

export default function TraineeRegistrations() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [program, setProgram] = useState(PROGRAMS[0]);
  const [registrations, setRegistrations] = useState<TraineePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const dividerColor = isDarkMode ? '#23272b' : '#F2F4F7';
  const dropdownTextColor = '#222';

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
      <View style={[styles.searchRow, { backgroundColor: cardBackground, shadowColor: isDarkMode ? '#000' : '#000' }] }>
        <Ionicons name="search" size={20} color={secondaryTextColor} style={{ marginLeft: 8, marginRight: 4 }} />
        <TextInput
          style={[styles.searchInput, { color: textColor }]}
          placeholder="Search by name, department, or program"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={secondaryTextColor}
        />
      </View>
      <View style={styles.filterRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
          <RNPickerSelect
            onValueChange={setDepartment}
            value={department}
            placeholder={{ label: 'Select Department...', value: '', color: dropdownTextColor }}
            items={DEPARTMENTS.map(dep => ({ label: dep, value: dep, color: dropdownTextColor }))}
            style={{
              inputAndroid: { height: 44, padding: 10, color: dropdownTextColor, flex: 1 },
              inputIOS: { height: 44, padding: 10, color: dropdownTextColor, flex: 1 },
              placeholder: { color: dropdownTextColor },
              iconContainer: { top: 0, right: 10, height: 44, justifyContent: 'center', alignItems: 'center', position: 'absolute', flexDirection: 'row' },
            }}
            useNativeAndroidPickerStyle={false}
            Icon={() => (
              <View style={{ height: 44, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                <Ionicons name="chevron-down" size={20} color={dropdownTextColor} />
              </View>
            )}
          />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <TouchableOpacity activeOpacity={1} style={{ flex: 1 }}>
          <RNPickerSelect
            onValueChange={setProgram}
            value={program}
            placeholder={{ label: 'Select Program...', value: '', color: dropdownTextColor }}
            items={PROGRAMS.map(prog => ({ label: prog, value: prog, color: dropdownTextColor }))}
            style={{
              inputAndroid: { height: 44, padding: 10, color: dropdownTextColor, flex: 1 },
              inputIOS: { height: 44, padding: 10, color: dropdownTextColor, flex: 1 },
              placeholder: { color: dropdownTextColor },
              iconContainer: { top: 0, right: 10, height: 44, justifyContent: 'center', alignItems: 'center', position: 'absolute', flexDirection: 'row' },
            }}
            useNativeAndroidPickerStyle={false}
            Icon={() => (
              <View style={{ height: 44, justifyContent: 'center', alignItems: 'center', flexDirection: 'row' }}>
                <Ionicons name="chevron-down" size={20} color={dropdownTextColor} />
              </View>
            )}
          />
          </TouchableOpacity>
        </View>
      </View>
      {filtered.length === 0 && (
        <Text style={{ color: secondaryTextColor, textAlign: 'center', marginTop: 32 }}>No trainees found.</Text>
      )}
      {filtered.map((reg, idx) => (
        <View key={reg.id} style={[styles.card, { backgroundColor: cardBackground, shadowColor: isDarkMode ? '#000' : '#000' }] }>
          <View style={styles.cardRow}>
            <Ionicons name="person-circle-outline" size={28} color="#3CB371" style={{ marginRight: 10 }} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.nameText, { color: '#3CB371' }]}>{reg.trainee_name}</Text>
              <Text style={[styles.programText, { color: secondaryTextColor }]}>{reg.program_name}</Text>
            </View>
          </View>
          <View style={[styles.cardDivider, { backgroundColor: dividerColor }]} />
          <View style={styles.cardInfoRow}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={16} color={secondaryTextColor} style={{ marginRight: 4 }} />
              <Text style={[styles.infoText, { color: textColor }]}>{formatDate(reg.start_date)} - {formatDate(reg.end_date)}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="business-outline" size={16} color={secondaryTextColor} style={{ marginRight: 4 }} />
              <Text style={[styles.infoText, { color: textColor }]}>{reg.weeks?.[0]?.department || '-'}</Text>
            </View>
            <View style={styles.infoItem}>
              <Ionicons name="time-outline" size={16} color={secondaryTextColor} style={{ marginRight: 4 }} />
              <Text style={[styles.infoText, { color: textColor }]}>{reg.weeks?.length || 0} weeks</Text>
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
    height: 40,
    paddingHorizontal: 8,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
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
  card: {
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  nameText: {
    fontWeight: 'bold',
    fontSize: 16,
    fontFamily: 'System',
  },
  programText: {
    fontSize: 13,
    fontFamily: 'System',
  },
  cardDivider: {
    height: 1,
    borderRadius: 1,
    marginVertical: 8,
  },
  cardInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  infoText: {
    fontSize: 13,
    fontFamily: 'System',
  },
}); 