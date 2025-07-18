import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

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
  'Rowad',
  'Technology',
];

const REGISTRATIONS = [
  { name: 'Lama Akbar', department: 'IT Governance and Architecture', email: '903204@alahli.com', duration: '8 weeks', type: 'CO-OP' },
  { name: 'Sara Ahmed', department: 'Enterprise Project Delivery', email: 'sara@alahli.com', duration: '6 weeks', type: 'Rowad' },
  { name: 'Ali Hassan', department: 'Development and Testing', email: 'ali@alahli.com', duration: '10 weeks', type: 'Technology' },
  { name: 'Mona Saleh', department: 'Production', email: 'mona@alahli.com', duration: '8 weeks', type: 'CO-OP' },
  { name: 'Fahad Nasser', department: 'IT Services', email: 'fahad@alahli.com', duration: '12 weeks', type: 'Rowad' },
  { name: 'Aisha Noor', department: 'IT Transformation', email: 'aisha@alahli.com', duration: '8 weeks', type: 'Technology' },
];

export default function TraineeRegistrations() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [program, setProgram] = useState(PROGRAMS[0]);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showProgDropdown, setShowProgDropdown] = useState(false);

  // Filtering logic
  const filtered = REGISTRATIONS.filter(reg => {
    const matchesDept = department === 'All Departments' || reg.department === department;
    const matchesProg = program === 'All Programs' || reg.type === program;
    const searchLower = search.toLowerCase();
    const matchesSearch =
      reg.name.toLowerCase().includes(searchLower) ||
      reg.department.toLowerCase().includes(searchLower) ||
      reg.type.toLowerCase().includes(searchLower);
    return matchesDept && matchesProg && matchesSearch;
  });

  return (
    <View style={{ marginTop: 0, paddingTop: 0 }}>
      {/* Title */}
      <Text style={styles.sectionTitle}><MaterialIcons name="apartment" size={20} color="#222" />  Programs Registrations</Text>
      <Text style={styles.sectionSubtitle}>Track Trainees registrations status</Text>
      {/* Search and Filters */}
      <View style={styles.searchRow}>
        <Ionicons name="search" size={20} color="#B0B0B0" style={{ marginLeft: 8, marginRight: 4 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#B0B0B0"
        />
      </View>
      {/* Filters */}
      <View style={styles.filterRow}>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowDeptDropdown(!showDeptDropdown)}>
            <Text style={styles.filterBtnText}>{department}</Text>
            <Ionicons name="chevron-down" size={16} color="#3CB371" />
          </TouchableOpacity>
          {showDeptDropdown && (
            <View style={styles.dropdownMenu}>
              {DEPARTMENTS.slice(1).map(opt => (
                <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => { setDepartment(opt); setShowDeptDropdown(false); }}>
                  <Text style={styles.dropdownText}>{opt}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setDepartment('All Departments'); setShowDeptDropdown(false); }}>
                <Text style={styles.dropdownText}>All Departments</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity style={styles.filterBtn} onPress={() => setShowProgDropdown(!showProgDropdown)}>
            <Text style={styles.filterBtnText}>{program}</Text>
            <Ionicons name="chevron-down" size={16} color="#3CB371" />
          </TouchableOpacity>
          {showProgDropdown && (
            <View style={styles.dropdownMenu}>
              {PROGRAMS.slice(1).map(opt => (
                <TouchableOpacity key={opt} style={styles.dropdownItem} onPress={() => { setProgram(opt); setShowProgDropdown(false); }}>
                  <Text style={styles.dropdownText}>{opt}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.dropdownItem} onPress={() => { setProgram('All Programs'); setShowProgDropdown(false); }}>
                <Text style={styles.dropdownText}>All Programs</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
      {/* Registration List */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Duration</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Program Type</Text>
      </View>
      {filtered.map((reg, idx) => (
        <View key={idx} style={styles.tableRow}>
          <View style={{ flex: 2 }}>
            <Text style={styles.nameText}>{reg.name}</Text>
            <Text style={styles.emailText}>{reg.email}</Text>
          </View>
          <Text style={[styles.tableCell, { flex: 1 }]}>{reg.duration}</Text>
          <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold', letterSpacing: 1 }]}>{reg.type}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 18,
    marginBottom: 2,
    marginLeft: 16,
    color: '#222',
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginLeft: 16,
    marginBottom: 8,
  },
  stickyBar: {
    backgroundColor: '#fff',
    zIndex: 10,
    elevation: 3,
    paddingBottom: 8,
    paddingTop: 0,
    // position: 'sticky', // Not supported in React Native
    // top: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7E9',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 8,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#222',
    paddingHorizontal: 8,
  },
  filterRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    zIndex: 30,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginRight: 8,
  },
  filterBtnText: {
    color: '#3CB371',
    fontWeight: '500',
    marginRight: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FFFA',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginHorizontal: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7E9',
  },
  tableHeaderText: {
    fontWeight: 'bold',
    color: '#004080',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7E9',
    borderRadius: 8,
  },
  nameText: {
    color: '#3CB371',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emailText: {
    color: '#888',
    fontSize: 12,
    marginTop: 2,
  },
  tableCell: {
    fontSize: 15,
    color: '#222',
    textAlign: 'center',
  },
  expandedSection: {
    backgroundColor: '#F8FFFA',
    borderRadius: 8,
    marginTop: 8,
    padding: 8,
    marginLeft: 0,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 4,
    zIndex: 100,
    paddingVertical: 4,
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: '#222',
  },
}); 