import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';

const TABS = ['Dashboard', 'Registrations', 'Progress', 'Overview'];

const DEPARTMENTS = [
  { name: 'IT Governance and Architecture', value: 30 },
  { name: 'IT Transformation', value: 60 },
  { name: 'IT Services', value: 40 },
  { name: 'Production', value: 70 },
  { name: 'Enterprise Project Delivery', value: 50 },
  { name: 'Development', value: 80 },
];

const TRAINEE_PROGRESS = [
  {
    name: 'Bayan Alsahafi',
    department: 'IT Production',
    progress: 90,
    weeks: [
      { status: 'done', hours: 40, tasks: 8 },
      { status: 'done', hours: 40, tasks: 9 },
      { status: 'done', hours: 40, tasks: 8 },
      { status: 'done', hours: 40, tasks: 7 },
      { status: 'in-progress', hours: 25, tasks: 3 },
    ],
  },
  {
    name: 'Deema Alsini',
    department: 'EPD',
    progress: 70,
    weeks: [
      { status: 'done', hours: 20, tasks: 4 },
      { status: 'done', hours: 22, tasks: 5 },
      { status: 'done', hours: 18, tasks: 6 },
      { status: 'in-progress', hours: 15, tasks: 5 },
      { status: 'not-started', hours: 0, tasks: 0 },
    ],
  },
  {
    name: 'Hadeel Kufiah',
    department: 'IT Services',
    progress: 45,
    weeks: [
      { status: 'done', hours: 40, tasks: 8 },
      { status: 'done', hours: 40, tasks: 9 },
      { status: 'in-progress', hours: 25, tasks: 6 },
      { status: 'not-started', hours: 0, tasks: 0 },
      { status: 'not-started', hours: 0, tasks: 0 },
    ],
  },
];

const REGISTRATIONS = Array(6).fill({
  name: 'Lama Akbar',
  email: '903204@alahli.com',
  duration: '8 weeks',
  type: 'CO-OP',
});

const OVERVIEW_TRAINEES = [
  {
    name: 'Bayan Alsahafi',
    department: 'IT Production',
    weeksDone: 4,
    totalWeeks: 5,
    hoursLogged: 192,
    totalHours: 200,
    progress: 96,
    color: '#4ECB71',
  },
  {
    name: 'Hadeel Kufiah',
    department: 'IT Services',
    weeksDone: 2,
    totalWeeks: 5,
    hoursLogged: 88,
    totalHours: 200,
    progress: 44,
    color: '#F4D03F',
  },
  {
    name: 'Khalid Alkhaibari',
    department: 'Enterprise Project Delivery',
    weeksDone: 3,
    totalWeeks: 5,
    hoursLogged: 102,
    totalHours: 200,
    progress: 51,
    color: '#4A90E2',
  },
  {
    name: 'Lama Akbar',
    department: 'Enterprise Project Delivery',
    weeksDone: 4,
    totalWeeks: 5,
    hoursLogged: 160,
    totalHours: 200,
    progress: 80,
    color: '#4ECB71',
  },
];

export default function TraineeDashboard() {
  const [selectedTab, setSelectedTab] = useState('Dashboard');
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState('All Departments');
  const [program, setProgram] = useState('All Programs');
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [showProgDropdown, setShowProgDropdown] = useState(false);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: 32 }}>
      {/* Header */}
      <View style={styles.header}>
        <FontAwesome5 name="project-diagram" size={32} color="#004080" style={{ marginRight: 8 }} />
        <Text style={styles.headerTitle}><Text style={{ color: '#3CB371' }}>Tracking</Text> Trainee Hub</Text>
      </View>
      <Text style={styles.headerSubtitle}>Check your Trainees!</Text>
      {/* Tabs */}
      <View style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.tabActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {/* Tab Content */}
      {selectedTab === 'Dashboard' && (
        <>
          {/* Summary Cards */}
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <View>
                <Text style={styles.cardTitle}>Total Trainees</Text>
                <Text style={styles.cardSubtitle}>Across all Programs</Text>
              </View>
              <Ionicons name="people-outline" size={28} color="#3CB371" />
            </View>
            <Text style={styles.cardValue}>30</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>Avg Progress</Text>
              <MaterialIcons name="timelapse" size={28} color="#F4B400" />
            </View>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBar, { width: '40%' }]} />
            </View>
            <Text style={styles.cardValue}>40%</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>House Logged</Text>
              <Ionicons name="time-outline" size={28} color="#00B8D9" />
            </View>
            <Text style={styles.cardValue}>378</Text>
            <Text style={styles.cardSubtitle}>Total Training House</Text>
          </View>
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.cardTitle}>Feedback Rating</Text>
              <MaterialIcons name="star-rate" size={28} color="#F4B400" />
            </View>
            <Text style={styles.cardValue}>3.7</Text>
            <Text style={styles.cardSubtitle}>T Avg Rating</Text>
          </View>
          {/* Department Distribution */}
          <Text style={styles.sectionTitle}><MaterialIcons name="apartment" size={20} color="#222" />  Department Distribution</Text>
          <View style={styles.deptBox}>
            {DEPARTMENTS.map(dep => (
              <View key={dep.name} style={styles.deptRow}>
                <Text style={styles.deptName}>{dep.name}</Text>
                <View style={styles.deptBarBg}>
                  <View style={[styles.deptBar, { width: `${dep.value}%` }]} />
                </View>
              </View>
            ))}
          </View>
        </>
      )}
      {selectedTab === 'Registrations' && (
        <View style={{ marginTop: 0, paddingTop: 0 }}>
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
      )}
      {selectedTab === 'Progress' && (
        <>
          {TRAINEE_PROGRESS.map((trainee, idx) => (
            <View key={trainee.name} style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View>
                  <Text style={styles.progressName}>{trainee.name}</Text>
                  <Text style={styles.progressDept}>{trainee.department}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.progressPercent}>{trainee.progress}%</Text>
                  <Text style={styles.progressLabel}>Overall progress</Text>
                </View>
              </View>
              <View style={styles.progressWeeksRow}>
                {trainee.weeks.map((week, widx) => (
                  <View key={widx} style={styles.progressWeekBox}>
                    <View style={styles.progressWeekIconBox}>
                      {week.status === 'done' && (
                        <Ionicons name="checkmark-circle" size={28} color="#4ECB71" />
                      )}
                      {week.status === 'in-progress' && (
                        <Ionicons name="hourglass" size={28} color="#2196F3" />
                      )}
                      {week.status === 'not-started' && (
                        <Ionicons name="ellipse-outline" size={28} color="#B0B0B0" />
                      )}
                    </View>
                    <Text style={styles.progressWeekLabel}>Week {widx + 1}</Text>
                    <Text style={styles.progressWeekInfo}>{week.hours}h logged{week.tasks > 0 ? `\n${week.tasks} tasks` : ''}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </>
      )}
      {selectedTab === 'Overview' && (
        <>
          {OVERVIEW_TRAINEES.map((trainee, idx) => (
            <View key={trainee.name} style={styles.overviewCard}>
              <View style={styles.overviewHeader}>
                <View>
                  <Text style={styles.overviewName}>{trainee.name}</Text>
                  <Text style={styles.overviewDept}>{trainee.department}</Text>
                </View>
                <Text style={styles.overviewPercent}>{trainee.progress}%</Text>
              </View>
              <View style={styles.overviewStatsRow}>
                <View style={styles.overviewStatBox}>
                  <Text style={styles.overviewStatValue}>{trainee.weeksDone}</Text>
                  <Text style={styles.overviewStatLabel}>Week done of {trainee.totalWeeks}</Text>
                </View>
                <View style={styles.overviewStatBox}>
                  <Text style={styles.overviewStatValue}>{trainee.hoursLogged}</Text>
                  <Text style={styles.overviewStatLabel}>Hours logged of {trainee.totalHours}</Text>
                </View>
                <View style={styles.overviewStatBox}>
                  <Text style={styles.overviewStatValue}>{trainee.progress}%</Text>
                  <Text style={styles.overviewStatLabel}>Progress overall</Text>
                </View>
              </View>
              <View style={styles.overviewBarBg}>
                <View style={[styles.overviewBar, { width: `${trainee.progress}%`, backgroundColor: trainee.color }]} />
              </View>
            </View>
          ))}
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
    color: '#004080',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#8BA18C',
    marginLeft: 20,
    marginBottom: 12,
  },
  tabsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
    marginLeft: 12,
  },
  tab: {
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginRight: 8,
  },
  tabActive: {
    backgroundColor: '#4ECB71',
  },
  tabText: {
    color: '#222',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    color: '#222',
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#888',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#004080',
    marginTop: 4,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: '#E5E7E9',
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
    color: '#222',
    flexDirection: 'row',
    alignItems: 'center',
  },
  deptBox: {
    backgroundColor: '#F8FFFA',
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
    color: '#222',
    marginBottom: 2,
  },
  deptBarBg: {
    height: 8,
    backgroundColor: '#E5E7E9',
    borderRadius: 4,
    width: '100%',
  },
  deptBar: {
    height: 8,
    backgroundColor: '#4ECB71',
    borderRadius: 4,
  },
  progressCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
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
    color: '#222',
  },
  progressDept: {
    fontSize: 13,
    color: '#888',
  },
  progressPercent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#004080',
  },
  progressLabel: {
    fontSize: 12,
    color: '#888',
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
    color: '#222',
    marginBottom: 2,
  },
  progressWeekInfo: {
    fontSize: 11,
    color: '#888',
    textAlign: 'center',
    lineHeight: 14,
  },
  overviewCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  overviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  overviewName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  overviewDept: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  overviewPercent: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
  },
  overviewStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    marginTop: 4,
  },
  overviewStatBox: {
    alignItems: 'center',
    flex: 1,
  },
  overviewStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  overviewStatLabel: {
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
  },
  overviewBarBg: {
    height: 8,
    backgroundColor: '#E5E7E9',
    borderRadius: 4,
    width: '100%',
    marginTop: 8,
  },
  overviewBar: {
    height: 8,
    borderRadius: 4,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#222',
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
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterBtnText: {
    fontSize: 14,
    color: '#222',
    marginRight: 4,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F7',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    alignItems: 'center',
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#222',
  },
  tableRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  nameText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#222',
  },
  emailText: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  tableCell: {
    fontSize: 14,
    color: '#222',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#888',
    marginLeft: 16,
    marginBottom: 8,
  },
}); 