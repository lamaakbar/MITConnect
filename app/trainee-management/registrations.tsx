import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

const DEPARTMENTS = ['All Departments', 'IT', 'HR', 'Finance'];
const PROGRAMS = ['All Programs', 'CO-OP', 'Internship'];

const REGISTRATIONS = Array(6).fill({
  name: 'Lama Akbar',
  email: '903204@alahli.com',
  duration: '8 weeks',
  type: 'CO-OP',
});

export default function TraineeRegistrations() {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState(DEPARTMENTS[0]);
  const [program, setProgram] = useState(PROGRAMS[0]);
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showProgDropdown, setShowProgDropdown] = useState(false);

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
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowDeptDropdown(!showDeptDropdown)}>
          <Text style={styles.filterBtnText}>{department}</Text>
          <Ionicons name="chevron-down" size={16} color="#3CB371" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowProgDropdown(!showProgDropdown)}>
          <Text style={styles.filterBtnText}>{program}</Text>
          <Ionicons name="chevron-down" size={16} color="#3CB371" />
        </TouchableOpacity>
      </View>
      {/* Registration List */}
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, { flex: 2 }]}>Name</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Duration</Text>
        <Text style={[styles.tableHeaderText, { flex: 1 }]}>Program Type</Text>
      </View>
      {REGISTRATIONS.map((reg, idx) => (
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
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7E9',
  },
  nameText: {
    color: '#3CB371',
    fontWeight: 'bold',
    fontSize: 15,
  },
  emailText: {
    color: '#888',
    fontSize: 12,
  },
  tableCell: {
    fontSize: 15,
    color: '#222',
    textAlign: 'center',
  },
}); 