import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Modal, Pressable, SafeAreaView } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { useThemeColor } from '@/hooks/useThemeColor';
import AdminTabBar from '../../components/AdminTabBar';
import AdminHeader from '../../components/AdminHeader';

const TABS = ['Dashboard', 'Registrations', 'Progress'];

// Empty data arrays - no mock data
const DEPARTMENTS: any[] = [];

const PROGRAMS = [
  'All Programs',
  'CO-OP',
  'Rowad',
  'Technology',
];

const TRAINEE_PROGRESS: any[] = [];

const REGISTRATIONS: any[] = [];

const OVERVIEW_TRAINEES: any[] = [];

export default function TraineeDashboard() {
  const colorScheme = useColorScheme();
  const isDarkMode = colorScheme === 'dark';
  
  const [selectedTab, setSelectedTab] = useState('Dashboard');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [program, setProgram] = useState('All Programs');
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showProgDropdown, setShowProgDropdown] = useState(false);
  const [showTraineeModal, setShowTraineeModal] = useState(false);

  // Theme colors
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#E0E0E0';
  const searchBackground = isDarkMode ? '#2A2A2A' : '#F2F4F7';
  const modalBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const overlayBackground = isDarkMode ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.3)';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor }}>
      <AdminHeader title="" />
      <View style={[styles.container, { backgroundColor }]}> 
        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
          
          {/* Tabs */}
          {TABS.length > 3 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab, 
                    { backgroundColor: isDarkMode ? '#2A2A2A' : '#F2F4F7' },
                    selectedTab === tab && styles.tabActive
                  ]}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Text style={[
                    styles.tabText, 
                    { color: textColor },
                    selectedTab === tab && styles.tabTextActive
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.tabsRow}>
              {TABS.map(tab => (
                <TouchableOpacity
                  key={tab}
                  style={[
                    styles.tab, 
                    { backgroundColor: isDarkMode ? '#2A2A2A' : '#F2F4F7' },
                    selectedTab === tab && styles.tabActive
                  ]}
                  onPress={() => setSelectedTab(tab)}
                >
                  <Text style={[
                    styles.tabText, 
                    { color: textColor },
                    selectedTab === tab && styles.tabTextActive
                  ]}>
                    {tab}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* Tab Content */}
          {selectedTab === 'Dashboard' && (
            <>
              {OVERVIEW_TRAINEES.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={64} color="#ccc" />
                  <Text style={[styles.emptyStateTitle, { color: textColor }]}>No Trainees Yet</Text>
                  <Text style={[styles.emptyStateText, { color: secondaryTextColor }]}>
                    There are no trainees registered in the system yet. Start by adding trainees to track their progress.
                  </Text>
                </View>
              ) : (
                <>
                  {/* Summary Cards */}
                  <TouchableOpacity 
                    style={[styles.card, { backgroundColor: cardBackground, borderColor }]} 
                    onPress={() => setShowTraineeModal(true)}
                  >
                    <View style={styles.cardRow}>
                      <View>
                        <Text style={[styles.cardTitle, { color: textColor }]}>Total Trainees</Text>
                        <Text style={[styles.cardSubtitle, { color: secondaryTextColor }]}>Across all Programs</Text>
                      </View>
                      <Ionicons name="people-outline" size={28} color="#3CB371" />
                    </View>
                    <Text style={[styles.cardValue, { color: textColor }]}>30</Text>
                  </TouchableOpacity>
              
              {/* Modal for trainee names */}
              <Modal
                visible={showTraineeModal}
                animationType="slide"
                transparent
                onRequestClose={() => setShowTraineeModal(false)}
              >
                <View style={[styles.modalOverlay, { backgroundColor: overlayBackground }]}>
                  <View style={[styles.modalContent, { backgroundColor: modalBackground }]}>
                    <Text style={[styles.modalTitle, { color: textColor }]}>All Trainees</Text>
                    <ScrollView style={{ maxHeight: 300 }}>
                      {REGISTRATIONS.map((reg, idx) => (
                        <Text key={idx} style={[styles.modalItem, { color: textColor }]}>{reg.name}</Text>
                      ))}
                    </ScrollView>
                    <Pressable style={styles.closeBtn} onPress={() => setShowTraineeModal(false)}>
                      <Text style={{ color: '#fff', fontWeight: 'bold' }}>Close</Text>
                    </Pressable>
                  </View>
                </View>
              </Modal>
              
              <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardTitle, { color: textColor }]}>Average Progress</Text>
                  <MaterialIcons name="timelapse" size={28} color="#F4B400" />
                </View>
                <View style={[styles.progressBarBg, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E5E7E9' }]}>
                  <View style={[styles.progressBar, { width: '40%' }]} />
                </View>
                <Text style={[styles.cardValue, { color: textColor }]}>40%</Text>
              </View>
              
              <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardTitle, { color: textColor }]}>Hours Logged</Text>
                  <Ionicons name="time-outline" size={28} color="#00B8D9" />
                </View>
                <Text style={[styles.cardValue, { color: textColor }]}>378</Text>
                <Text style={[styles.cardSubtitle, { color: secondaryTextColor }]}>Total Training Hours</Text>
              </View>
              
              <View style={[styles.card, { backgroundColor: cardBackground, borderColor }]}>
                <View style={styles.cardRow}>
                  <Text style={[styles.cardTitle, { color: textColor }]}>Feedback Rating</Text>
                  <MaterialIcons name="star-rate" size={28} color="#F4B400" />
                </View>
                <Text style={[styles.cardValue, { color: textColor }]}>3.7</Text>
                <Text style={[styles.cardSubtitle, { color: secondaryTextColor }]}>Average Rating</Text>
              </View>
              
              {/* Department Distribution */}
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                <MaterialIcons name="apartment" size={20} color={isDarkMode ? '#3CB371' : '#222'} />  
                Department Distribution
              </Text>
              <View style={[styles.deptBox, { backgroundColor: isDarkMode ? '#1A1A1A' : '#F8FFFA' }]}>
                {DEPARTMENTS.map(dep => (
                  <View key={dep.name} style={styles.deptRow}>
                    <Text style={[styles.deptName, { color: textColor }]}>{dep.name}</Text>
                    <View style={[styles.deptBarBg, { backgroundColor: isDarkMode ? '#2A2A2A' : '#E5E7E9' }]}>
                      <View style={[styles.deptBar, { width: `${dep.value}%` }]} />
                    </View>
                  </View>
                ))}
              </View>
                </>
              )}
            </>
          )}
          
          {selectedTab === 'Registrations' && (
            <View style={{ marginTop: 0, paddingTop: 0 }}>
              <Text style={[styles.sectionTitle, { color: textColor }]}>
                <MaterialIcons name="apartment" size={20} color={isDarkMode ? '#3CB371' : '#222'} />  
                Programs Registrations
              </Text>
              <Text style={[styles.sectionSubtitle, { color: secondaryTextColor }]}>Track Trainees registrations status</Text>
              
              {/* Search and Filters */}
              <View style={[styles.searchRow, { backgroundColor: searchBackground }]}>
                <Ionicons name="search" size={20} color={secondaryTextColor} style={{ marginLeft: 8, marginRight: 4 }} />
                <TextInput
                  style={[styles.searchInput, { color: textColor }]}
                  placeholder="Search"
                  value={search}
                  onChangeText={setSearch}
                  placeholderTextColor={secondaryTextColor}
                />
              </View>
              
              {/* Filters */}
              <View style={styles.filterRow}>
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity 
                    style={[styles.filterBtn, { backgroundColor: searchBackground }]} 
                    onPress={() => setShowDeptDropdown(!showDeptDropdown)}
                  >
                    <Text style={[styles.filterBtnText, { color: textColor }]}>{department}</Text>
                    <Ionicons name="chevron-down" size={16} color="#3CB371" />
                  </TouchableOpacity>
                  {showDeptDropdown && (
                    <View style={[
                      styles.dropdown, 
                      { 
                        backgroundColor: modalBackground,
                        borderColor: borderColor
                      }
                    ]}>
                      <TouchableOpacity 
                        key="All Departments" 
                        style={styles.dropdownItem} 
                        onPress={() => { setDepartment('All Departments'); setShowDeptDropdown(false); }}
                      >
                        <Text style={[styles.dropdownText, { color: textColor }]}>All Departments</Text>
                      </TouchableOpacity>
                      {DEPARTMENTS.map(dep => (
                        <TouchableOpacity 
                          key={dep.name} 
                          style={styles.dropdownItem} 
                          onPress={() => { setDepartment(dep.name); setShowDeptDropdown(false); }}
                        >
                          <Text style={[styles.dropdownText, { color: textColor }]}>{dep.name}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity 
                    style={[styles.filterBtn, { backgroundColor: searchBackground }]} 
                    onPress={() => setShowProgDropdown(!showProgDropdown)}
                  >
                    <Text style={[styles.filterBtnText, { color: textColor }]}>{program}</Text>
                    <Ionicons name="chevron-down" size={16} color="#3CB371" />
                  </TouchableOpacity>
                  {showProgDropdown && (
                    <View style={[
                      styles.dropdown, 
                      { 
                        backgroundColor: modalBackground,
                        borderColor: borderColor
                      }
                    ]}>
                      {PROGRAMS.map(opt => (
                        <TouchableOpacity 
                          key={opt} 
                          style={styles.dropdownItem} 
                          onPress={() => { setProgram(opt); setShowProgDropdown(false); }}
                        >
                          <Text style={[styles.dropdownText, { color: textColor }]}>{opt}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
              
              {/* Registration List */}
              <View style={[styles.tableHeader, { backgroundColor: searchBackground }]}>
                <Text style={[styles.tableHeaderText, { flex: 2, color: textColor }]}>Name</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, color: textColor }]}>Duration</Text>
                <Text style={[styles.tableHeaderText, { flex: 1, color: textColor }]}>Program Type</Text>
              </View>
              {(() => {
                const searchLower = search.toLowerCase();
                const filtered = REGISTRATIONS.filter(reg => {
                  const matchesDept = department === 'All Departments' || reg.department === department;
                  const matchesProg = program === 'All Programs' || reg.type === program;
                  const matchesSearch =
                    reg.name.toLowerCase().includes(searchLower) ||
                    (reg.department && reg.department.toLowerCase().includes(searchLower)) ||
                    (reg.type && reg.type.toLowerCase().includes(searchLower));
                  return matchesDept && matchesProg && matchesSearch;
                });
                if (filtered.length === 0) {
                  return (
                    <View style={{ alignItems: 'center', marginTop: 32 }}>
                      <Text style={[styles.noResults, { color: secondaryTextColor }]}>No results found</Text>
                    </View>
                  );
                }
                return filtered.map((reg, idx) => (
                  <View key={idx} style={[styles.tableRow, { backgroundColor: cardBackground, borderColor }]}>
                    <View style={{ flex: 2 }}>
                      <Text style={[styles.nameText, { color: textColor }]}>{reg.name}</Text>
                      <Text style={[styles.emailText, { color: secondaryTextColor }]}>{reg.email}</Text>
                    </View>
                    <Text style={[styles.tableCell, { flex: 1, color: textColor }]}>{reg.duration}</Text>
                    <Text style={[styles.tableCell, { flex: 1, fontWeight: 'bold', letterSpacing: 1, color: textColor }]}>{reg.type}</Text>
                  </View>
                ));
              })()}
            </View>
          )}
          
          {selectedTab === 'Progress' && (
            <>
              {TRAINEE_PROGRESS.map((trainee, idx) => (
                <View key={trainee.name} style={[styles.progressCard, { backgroundColor: cardBackground, borderColor }]}> 
                  <View style={styles.progressHeader}>
                    <View>
                      <Text style={[styles.progressName, { color: textColor }]}>{trainee.name}</Text>
                      <Text style={[styles.progressDept, { color: secondaryTextColor }]}>{trainee.department}</Text>
                    </View>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[styles.progressPercent, { color: textColor }]}>{trainee.progress}%</Text>
                      <Text style={[styles.progressLabel, { color: secondaryTextColor }]}>Overall progress</Text>
                    </View>
                  </View>
                  <View style={styles.progressWeeksRow}>
                    {trainee.weeks.map((week: any, widx: number) => (
                      <View key={widx} style={styles.progressWeekBox}>
                        <View style={styles.progressWeekIconBox}>
                          {week.status === 'done' && (
                            <Ionicons name="checkmark-circle" size={28} color="#4ECB71" />
                          )}
                          {week.status === 'in-progress' && (
                            <Ionicons name="hourglass" size={28} color="#2196F3" />
                          )}
                          {week.status === 'not-started' && (
                            <Ionicons name="ellipse-outline" size={28} color={secondaryTextColor} />
                          )}
                        </View>
                        <Text style={[styles.progressWeekLabel, { color: textColor }]}>Week {widx + 1}</Text>
                        <Text style={[styles.progressWeekInfo, { color: secondaryTextColor }]}> 
                          {week.hours}h logged{week.tasks > 0 ? `\n${week.tasks} tasks` : ''}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
        {/* Bottom Tab Bar */}
        <AdminTabBar activeTab="trainees" isDarkMode={isDarkMode} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 4,
    paddingHorizontal: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerSubtitle: {
    fontSize: 14,
    marginLeft: 20,
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 20, // add space above the tab buttons
    marginBottom: 16,
    marginLeft: 12,
  },
  tab: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#4ECB71',
  },
  tabText: {
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  cardSubtitle: {
    fontSize: 12,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    marginBottom: 2,
    width: '100%',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F4B400',
    borderRadius: 4,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 15,
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  deptBox: {
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 12,
    marginBottom: 24,
  },
  deptRow: {
    marginBottom: 10,
  },
  deptName: {
    fontSize: 13,
    marginBottom: 2,
  },
  deptBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
  },
  deptBar: {
    height: 8,
    backgroundColor: '#4ECB71',
    borderRadius: 4,
  },
  progressCard: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  progressName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressDept: {
    fontSize: 13,
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressLabel: {
    fontSize: 12,
  },
  progressWeeksRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressWeekBox: {
    alignItems: 'center',
    flex: 1,
  },
  progressWeekIconBox: {
    marginBottom: 2,
  },
  progressWeekLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  progressWeekInfo: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 14,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterBtnText: {
    fontSize: 14,
    marginRight: 4,
  },
  dropdown: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    borderRadius: 8,
    elevation: 4,
    zIndex: 100,
    paddingVertical: 4,
    borderWidth: 1,
  },
  dropdownItem: {
    padding: 10,
  },
  dropdownText: {
    fontSize: 14,
  },
  tableHeader: {
    flexDirection: 'row',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  tableRow: {
    flexDirection: 'row',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    borderWidth: 1,
  },
  nameText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  emailText: {
    fontSize: 13,
    marginTop: 2,
  },
  tableCell: {
    fontSize: 14,
  },
  sectionSubtitle: {
    fontSize: 12,
    marginLeft: 16,
    marginBottom: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    width: 300,
    alignItems: 'center',
  },
  modalTitle: {
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
  },
  modalItem: {
    fontSize: 16,
    marginBottom: 6,
  },
  closeBtn: {
    backgroundColor: '#3CB371',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 24,
    marginTop: 16,
  },
  noResults: {
    fontSize: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
}); 