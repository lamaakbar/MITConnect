import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, SafeAreaView, Platform, Modal, Pressable } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import RNPickerSelect from 'react-native-picker-select';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { useTheme } from '../components/ThemeContext';
import { useThemeColor } from '../hooks/useThemeColor';
import { useRouter } from 'expo-router';

const DEPARTMENTS = [
  'IT Services',
  'IT Development',
  'Production',
  'Enterprise Project Delivery',
  'IT Governance',
  'IT Transformation',
];

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' });
}

function addWorkdays(start: string, days: number) {
  let date = new Date(start);
  let added = 0;
  while (added < days) {
    date.setDate(date.getDate() + 1);
    if (date.getDay() !== 0 && date.getDay() !== 6) added++;
  }
  return date.toISOString().split('T')[0];
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 6,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: '#222',
  },
  subtitle: {
    fontSize: 15,
    color: '#666',
    marginLeft: 18,
    marginBottom: 18,
    marginTop: 8,
  },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginHorizontal: 12,
    marginBottom: 12,
    marginTop: 8,
    padding: 4,
    justifyContent: 'center',
  },
  tabBtn: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
    marginHorizontal: 2,
  },
  tabBtnActive: {
    backgroundColor: '#B2E6F7',
  },
  tabBtnText: {
    color: '#222',
    fontWeight: '600',
    fontSize: 15,
  },
  tabBtnTextActive: {
    color: '#3CB6E3',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginLeft: 18,
    marginTop: 18,
    marginBottom: 4,
  },
  sectionDesc: {
    fontSize: 14,
    color: '#888',
    marginLeft: 18,
    marginBottom: 12,
  },
  deptCard: {
    borderWidth: 1,
    borderColor: '#B2E6F7',
    borderRadius: 10,
    marginHorizontal: 18,
    marginBottom: 18,
    padding: 16,
    backgroundColor: '#fff',
  },
  deptCardSelected: {
    borderColor: '#3CB6E3',
    backgroundColor: '#F2F9FC',
  },
  deptName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 4,
  },
  deptDesc: {
    fontSize: 13,
    color: '#888',
    marginBottom: 8,
  },
  deptLabel: {
    fontSize: 12,
    color: '#3CB6E3',
    fontWeight: 'bold',
    marginTop: 4,
  },
  deptValue: {
    fontSize: 13,
    color: '#222',
    marginBottom: 2,
  },
  selectBtn: {
    backgroundColor: '#B2E6F7',
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  selectBtnActive: {
    backgroundColor: '#3CB6E3',
  },
  selectBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  continueBtn: {
    backgroundColor: '#7ED6DF',
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 18,
    marginTop: 8,
    alignItems: 'center',
  },
  continueBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  planSection: {
    marginHorizontal: 12,
    marginTop: 10,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#B2E6F7',
  },
  planHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planSectionTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#222',
  },
  addWeekBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EAF6FB',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  addWeekBtnText: {
    color: '#3CB6E3',
    fontWeight: 'bold',
    marginRight: 4,
  },
  planTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#EAF6FB',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 4,
    marginTop: 4,
  },
  planTableHeaderCell: {
    flex: 1,
    fontWeight: 'bold',
    color: '#3CB6E3',
    textAlign: 'center',
    fontSize: 14,
  },
  planTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#EAF6FB',
    paddingVertical: 6,
  },
  planTableCell: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    color: '#222',
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#B2E6F7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    width: 48,
    textAlign: 'center',
    fontSize: 14,
    marginRight: 4,
    color: '#222',
  },
  hrsLabel: {
    color: '#888',
    fontSize: 13,
  },
  tasksInput: {
    borderWidth: 1,
    borderColor: '#B2E6F7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minHeight: 32,
    fontSize: 14,
    color: '#222',
    flex: 1,
  },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#B2E6F7',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 48,
    justifyContent: 'center',
  },
  statusBtnText: {
    color: '#3CB6E3',
    fontWeight: 'bold',
    fontSize: 14,
  },
  planFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  planFooterText: {
    color: '#888',
    fontSize: 13,
  },
  savePlanBtn: {
    backgroundColor: '#7ED6DF',
    borderRadius: 10,
    paddingVertical: 12,
    marginHorizontal: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  savePlanBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 17,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F9F1',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#24B26B',
    justifyContent: 'center',
  },
  successText: {
    color: '#24B26B',
    fontWeight: '600',
    fontSize: 15,
  },
});

// iOS-inspired Plan Summary Table Component
function PlanSummaryIOS() {
  return (
    <View style={iosStyles.planContainer}>
      <Text style={iosStyles.sectionTitle}>Plan Summary</Text>
      <View style={iosStyles.tableHeader}>
        <Text style={iosStyles.headerText}>Week</Text>
        <Text style={iosStyles.headerText}>From</Text>
        <Text style={iosStyles.headerText}>To</Text>
        <Text style={iosStyles.headerText}>Department</Text>
        <Text style={iosStyles.headerText}>Hours</Text>
      </View>
      {[1, 2, 3, 4, 5].map((week) => (
        <View key={week} style={iosStyles.tableRow}>
          <Text style={iosStyles.rowText}>{week}</Text>
          <Text style={iosStyles.rowText}>-</Text>
          <Text style={iosStyles.rowText}>-</Text>
          <Text style={iosStyles.rowText}>-</Text>
          <Text style={iosStyles.rowText}>-</Text>
        </View>
      ))}
    </View>
  );
}

const iosStyles = StyleSheet.create({
  planContainer: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#0EA5E9',
    marginBottom: 12,
    textAlign: 'center',
  },
  tableHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderColor: '#CBD5E1',
  },
  rowText: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
    textAlign: 'center',
  },
});

export default function TraineeHub() {
  const router = useRouter();
  const [tab, setTab] = useState<'Departments' | 'Registration' | 'Dashboard'>('Departments');
  const [overallFrom, setOverallFrom] = useState('');
  const [overallTo, setOverallTo] = useState('');
  const [showOverallDatePicker, setShowOverallDatePicker] = useState<{field: 'from'|'to'|null} | null>(null);
  const [weekPlan, setWeekPlan] = useState(Array.from({ length: 5 }, () => ({ department: '', hours: '', task: '', from: '', to: '' })));
  const [expandedWeeks, setExpandedWeeks] = useState([0]);
  const [deptModalIdx, setDeptModalIdx] = useState<number | null>(null);
  const [isCalendarVisible, setCalendarVisible] = useState(false);
  const [calendarWeekIdx, setCalendarWeekIdx] = useState<number | null>(null);
  const [calendarField, setCalendarField] = useState<'from' | 'to' | null>(null);
  const [datePickerValue, setDatePickerValue] = useState(new Date());
  const [errors, setErrors] = useState<any>({});
  const [showSummary, setShowSummary] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [dashboardPlan, setDashboardPlan] = useState<any[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [selectedProgram, setSelectedProgram] = useState('');
  const [fullName, setFullName] = useState('');
  const PROGRAM_OPTIONS = [
    { label: 'COOP Training', value: 'COOP Training' },
    { label: 'Technology', value: 'Technology' },
  ];

  const { isDarkMode, toggleTheme } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const textColor = useThemeColor({}, 'text');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const borderColor = isDarkMode ? '#2A2A2A' : '#F2F2F7';
  const iconColor = useThemeColor({}, 'icon');

  // Custom dark mode palette
  const darkBg = '#181C20';
  const darkCard = '#23272b';
  const darkBorder = '#2D333B';
  const darkText = '#F3F6FA';
  const darkSecondary = '#AEB6C1';
  const darkTab = '#20232A';
  const darkTabActive = '#3CB6E3';
  const darkTabInactive = '#23272b';
  const darkInput = '#23272b';
  const darkInputBorder = '#2D333B';
  const darkHighlight = '#43C6AC';

  // Generate weekPlan based on overallFrom/To
  React.useEffect(() => {
    if (overallFrom && overallTo) {
      let from = new Date(overallFrom);
      let to = new Date(overallTo);
      let weeks = [];
      let weekStart = new Date(from);
      while (weekStart <= to && weeks.length < 24) {
        let weekEnd = new Date(weekStart);
        let days = 0;
        while (days < 5 && weekEnd <= to) {
          if (weekEnd.getDay() !== 0 && weekEnd.getDay() !== 6) days++;
          if (days < 5) weekEnd.setDate(weekEnd.getDate() + 1);
        }
        weeks.push({ from: weekStart.toISOString().split('T')[0], to: weekEnd.toISOString().split('T')[0] });
        weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() + 1);
        while (weekStart.getDay() === 0 || weekStart.getDay() === 6) weekStart.setDate(weekStart.getDate() + 1);
      }
      setWeekPlan(Array.from({ length: weeks.length }, (_, i) => weekPlan[i] ? { ...weekPlan[i], from: weeks[i].from, to: weeks[i].to } : { department: '', hours: '', task: '', from: weeks[i].from, to: weeks[i].to }));
    }
  }, [overallFrom, overallTo]);

  const toggleWeek = (idx: number) => {
    setExpandedWeeks(expanded =>
      expanded.includes(idx)
        ? expanded.filter(i => i !== idx)
        : [...expanded, idx]
    );
  };

  const moveWeek = (from: number, to: number) => {
    if (to < 0 || to >= weekPlan.length) return;
    setWeekPlan(prev => {
      const arr = [...prev];
      const [removed] = arr.splice(from, 1);
      arr.splice(to, 0, removed);
      return arr;
    });
    setExpandedWeeks(expanded => expanded.map(i => {
      if (i === from) return to;
      if (i === to) return from;
      return i;
    }));
  };

  const handleWeekPlanChange = (idx: number, field: 'department'|'hours'|'task', value: string) => {
    setWeekPlan(prev => prev.map((w, i) => i === idx ? { ...w, [field]: value } : w));
  };

  const isFormValid = () => {
    if (!overallFrom || !overallTo) return false;
    for (let i = 0; i < weekPlan.length; i++) {
      const w = weekPlan[i];
      if (!w.department) return false;
      if (!w.hours || isNaN(Number(w.hours)) || Number(w.hours) <= 0 || Number(w.hours) > 40) return false;
      // 1. Remove required validation for task description in isFormValid()
      // if (!w.task.trim()) return false;
      if (!w.from || !w.to) return false;
      if (w.to < w.from) return false;
    }
    return true;
  };

  const handleReview = () => {
    setShowSummary(true);
  };

  const handleFinalSubmit = () => {
    if (!isFormValid()) {
      setSubmitError('Please complete all required fields correctly.');
      return;
    }
    setSubmitError('');
    setSubmitSuccess(true);
    setShowSummary(true);
    // setDashboardPlan(weekPlan.map((w, idx) => ({ ...w, week: idx + 1 }))); // This line is moved to handleConfirm
  };

  const handleEdit = (idx: number) => {
    setEditIdx(idx);
    setTab('Registration');
    setExpandedWeeks([idx]);
  };

  const handleDelete = (idx: number) => {
    setDashboardPlan(prev => prev.filter((_, i) => i !== idx));
  };

  const handleExportCSV = async () => {
    const header = 'Week,From,To,Department,Hours,Task\n';
    const rows = dashboardPlan.map(w => `${w.week},${w.from},${w.to},${w.department},${w.hours},"${w.task.replace(/"/g, '""')}"`).join('\n');
    const csv = header + rows;
    const fileUri = FileSystem.cacheDirectory + 'plan.csv';
    await FileSystem.writeAsStringAsync(fileUri, csv, { encoding: FileSystem.EncodingType.UTF8 });
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv' });
  };

  const today = new Date();
  const completedWeeks = dashboardPlan.filter(w => new Date(w.to) <= today).length;
  const progress = dashboardPlan.length > 0 ? Math.round((completedWeeks / dashboardPlan.length) * 100) : 0;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? darkCard : cardBackground }}>
      <View style={[styles.header, { backgroundColor: isDarkMode ? darkCard : cardBackground, borderBottomColor: isDarkMode ? darkBorder : borderColor }] }>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4, marginRight: 8 }}>
          <Ionicons name="arrow-back" size={24} color={iconColor} />
        </TouchableOpacity>
        <Text style={{ fontSize: 22, fontWeight: '700', letterSpacing: 0.5, flex: 1, textAlign: 'center', color: isDarkMode ? darkText : textColor }}>
          MIT<Text style={{ color: darkHighlight }}>Connect</Text>
        </Text>
        <View style={{ width: 32 }} />
      </View>
      <View style={[styles.tabRow, { backgroundColor: isDarkMode ? darkTab : '#F2F2F7' }] }>
        {['Departments', 'Registration', 'Dashboard'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, {
              backgroundColor: isDarkMode
                ? (tab === t ? darkTabActive : darkTabInactive)
                : (tab === t ? '#B2E6F7' : undefined)
            }]}
            onPress={() => setTab(t as 'Departments' | 'Registration' | 'Dashboard')}
          >
            <Text style={{
              color: isDarkMode
                ? (tab === t ? darkText : darkSecondary)
                : (tab === t ? '#3CB6E3' : '#222'),
              fontWeight: '600',
              fontSize: 15,
            }}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: isDarkMode ? darkBg : backgroundColor }} contentContainerStyle={{ paddingBottom: 32 }}>
        {tab === 'Departments' && (
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
            {/* Welcome message and visuals from Welcome screen */}
            <View style={{ alignItems: 'center', marginTop: 24, marginBottom: 16 }}>
              {/* You can add your logo or illustration here if needed */}
              <Text style={{ fontWeight: 'bold', fontSize: 22, marginBottom: 18, textAlign: 'center', color: isDarkMode ? darkHighlight : '#43C6AC' }}>Trainee Hub</Text>
              <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 15, marginBottom: 8 }}>Lets start your Journey!</Text>
            </View>
            {/* Department Cards - keep all text and headlines as in Welcome screen, but remove select/continue buttons */}
            <View style={{ marginBottom: 24 }}>
              <View style={{ borderWidth: 1, borderColor: isDarkMode ? darkBorder : '#B2E6F7', borderRadius: 12, marginHorizontal: 18, marginBottom: 18, padding: 16, backgroundColor: isDarkMode ? darkCard : cardBackground }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: isDarkMode ? darkText : '#222', marginBottom: 4 }}>IT Governance and Architecture</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 8 }}>responsible for ensuring that IT strategies align with the overall business goals of the organization, it sets policies, frameworks, and standards to guide technology-related decisions.</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Suitable Majors</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>Computer Science, Software Engineering, Information Technology</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Tools Used</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>ISM OpenPages, OneTrust, LeanIX, MEGA HOPEX</Text>
              </View>
              <View style={{ borderWidth: 1, borderColor: isDarkMode ? darkBorder : '#B2E6F7', borderRadius: 12, marginHorizontal: 18, marginBottom: 18, padding: 16, backgroundColor: isDarkMode ? darkCard : cardBackground }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: isDarkMode ? darkText : '#222', marginBottom: 4 }}>Enterprise Project Delivery</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 8 }}>Enterprise Project Delivery is responsible for managing and delivering strategic, regulatory, and enhancement projects across the organization. EPD ensures that all projects are executed on time, within scope, and with high quality.</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Suitable Majors</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>Software Engineering</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Tools Used</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>Clarity PPM, Jira, Excel</Text>
              </View>
              <View style={{ borderWidth: 1, borderColor: isDarkMode ? darkBorder : '#B2E6F7', borderRadius: 12, marginHorizontal: 18, marginBottom: 18, padding: 16, backgroundColor: isDarkMode ? darkCard : cardBackground }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: isDarkMode ? darkText : '#222', marginBottom: 4 }}>Development and Testing</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 8 }}>The Development department is in charge of building and maintaining software applications and systems. Developers work on coding, debugging, testing, and deploying solutions that meet business requirements.</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Suitable Majors</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>Software Engineering, Computer Science, Information Technology</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Tools Used</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>Visual Studio Code, Eclipse, Android Studio</Text>
              </View>
              <View style={{ borderWidth: 1, borderColor: isDarkMode ? darkBorder : '#B2E6F7', borderRadius: 12, marginHorizontal: 18, marginBottom: 18, padding: 16, backgroundColor: isDarkMode ? darkCard : cardBackground }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: isDarkMode ? darkText : '#222', marginBottom: 4 }}>Production</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 8 }}>The Production department manages the live IT environment, ensuring applications and services are deployed effectively and run smoothly, securely, and with high availability to support business operations.</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Suitable Majors</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>Software Engineering, Data Science, Computer Science</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Tools Used</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>OBIEE, Cognos, VMware, Linux, SQL Developer</Text>
              </View>
              <View style={{ borderWidth: 1, borderColor: isDarkMode ? darkBorder : '#B2E6F7', borderRadius: 12, marginHorizontal: 18, marginBottom: 18, padding: 16, backgroundColor: isDarkMode ? darkCard : cardBackground }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: isDarkMode ? darkText : '#222', marginBottom: 4 }}>IT Services</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 8 }}>Handles technical support for all users across the organization. Reviews software issues, installs apps, and applies updates. Ensures systems run efficiently as part of the core IT infrastructure.</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Suitable Majors</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>Software Engineering, Computer Science, Information Technology</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Tools Used</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>SCCM, Trend Micro, next think</Text>
              </View>
              <View style={{ borderWidth: 1, borderColor: isDarkMode ? darkBorder : '#B2E6F7', borderRadius: 12, marginHorizontal: 18, marginBottom: 18, padding: 16, backgroundColor: isDarkMode ? darkCard : cardBackground }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: isDarkMode ? darkText : '#222', marginBottom: 4 }}>IT Transformation</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 8 }}>Handles technical support for all users across the organization. Reviews software issues, installs apps, and applies updates. Ensures systems run efficiently as part of the core IT infrastructure.</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Suitable Majors</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>Software Engineering, Computer Science, Information Technology</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Tools Used</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>Studio, Android, Netbeans</Text>
              </View>
              <View style={{ borderWidth: 1, borderColor: isDarkMode ? darkBorder : '#B2E6F7', borderRadius: 12, marginHorizontal: 18, marginBottom: 18, padding: 16, backgroundColor: isDarkMode ? darkCard : cardBackground }}>
                <Text style={{ fontWeight: 'bold', fontSize: 16, color: isDarkMode ? darkText : '#222', marginBottom: 4 }}>Cyber Security</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 8 }}>This department focuses on protecting the bank’s digital infrastructure, ensuring secure systems, and defending against cyber threats.</Text>
                <Text style={{ fontWeight: 'bold', fontSize: 13, color: isDarkMode ? darkText : '#222', marginBottom: 2 }}>Tools Used</Text>
                <Text style={{ color: isDarkMode ? darkSecondary : '#888', fontSize: 13, marginBottom: 2 }}>Splunk, Wireshark, Burp Suite, Kali Linux, Nessus</Text>
              </View>
            </View>
          </ScrollView>
        )}
        {tab === 'Registration' && (
          !showSummary ? (
            <View style={{ margin: 18, backgroundColor: isDarkMode ? darkCard : cardBackground, borderRadius: 18, padding: 22, borderWidth: 1, borderColor: isDarkMode ? darkBorder : borderColor, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
              <Text style={{ textAlign: 'center', fontSize: 26, fontWeight: 'bold', color: isDarkMode ? darkHighlight : '#3CB6E3', marginBottom: 24, letterSpacing: 0.5 }}>Trainee Registration</Text>
              {/* Full Name Input */}
              <Text style={{ fontSize: 15, fontWeight: '500', color: isDarkMode ? darkText : textColor, marginBottom: 8, marginLeft: 2 }}>Full Name</Text>
              <TextInput
                style={{ borderWidth: 1, borderColor: isDarkMode ? darkBorder : borderColor, borderRadius: 10, backgroundColor: isDarkMode ? darkCard : cardBackground, marginBottom: 18, paddingHorizontal: 12, height: 40, fontSize: 16, color: isDarkMode ? darkText : textColor, fontWeight: '600' }}
                placeholderTextColor={isDarkMode ? darkSecondary : secondaryTextColor}
                value={fullName}
                onChangeText={setFullName}
              />
              {/* Program Name Dropdown */}
              <Text style={{ fontSize: 15, fontWeight: '500', color: isDarkMode ? darkText : textColor, marginBottom: 8, marginLeft: 2 }}>Program Name</Text>
              <View style={{ position: 'relative', borderWidth: 1, borderColor: isDarkMode ? darkBorder : borderColor, borderRadius: 10, backgroundColor: isDarkMode ? darkCard : cardBackground, marginBottom: 18, paddingHorizontal: 12, paddingVertical: 2, justifyContent: 'center' }}>
                <RNPickerSelect
                  onValueChange={setSelectedProgram}
                  value={selectedProgram}
                  placeholder={{ label: 'Select a program...', value: '', color: isDarkMode ? darkSecondary : secondaryTextColor }}
                  items={PROGRAM_OPTIONS.map(opt => ({ ...opt, color: isDarkMode ? darkText : textColor }))}
                  style={{
                    inputIOS: { height: 40, fontSize: 16, color: isDarkMode ? darkText : textColor, paddingHorizontal: 4, fontWeight: '600', backgroundColor: isDarkMode ? darkCard : cardBackground },
                    inputAndroid: { height: 40, fontSize: 16, color: isDarkMode ? darkText : textColor, paddingHorizontal: 4, fontWeight: '600', backgroundColor: isDarkMode ? darkCard : cardBackground },
                    placeholder: { color: isDarkMode ? darkSecondary : secondaryTextColor },
                  }}
                  useNativeAndroidPickerStyle={false}
                  Icon={() => (
                    <View style={{ position: 'absolute', right: 8, top: 0, bottom: 0, height: 40, justifyContent: 'center', alignItems: 'center' }}>
                      <Ionicons name="chevron-down" size={20} color={isDarkMode ? darkSecondary : secondaryTextColor} />
                    </View>
                  )}
                />
              </View>
              {/* Overall From/To Date Pickers */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setShowOverallDatePicker({ field: 'from' })} style={{ flex: 1, marginRight: 8, borderWidth: 1, borderColor: isDarkMode ? darkBorder : '#B2E6F7', borderRadius: 6, padding: 14, backgroundColor: isDarkMode ? darkCard : undefined }}>
                  <Text style={{ color: overallFrom ? (isDarkMode ? darkText : '#222') : (isDarkMode ? darkSecondary : '#888'), fontSize: 17 }}>{overallFrom ? `From: ${formatDate(overallFrom)}` : 'From date'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowOverallDatePicker({ field: 'to' })} style={{ flex: 1, marginLeft: 8, borderWidth: 1, borderColor: isDarkMode ? darkBorder : '#B2E6F7', borderRadius: 6, padding: 14, backgroundColor: isDarkMode ? darkCard : undefined }}>
                  <Text style={{ color: overallTo ? (isDarkMode ? darkText : '#222') : (isDarkMode ? darkSecondary : '#888'), fontSize: 17 }}>{overallTo ? `To: ${formatDate(overallTo)}` : 'To date'}</Text>
                </TouchableOpacity>
              </View>
              {showOverallDatePicker && (
                <DateTimePickerModal
                  isVisible={!!showOverallDatePicker}
                  mode="date"
                  onConfirm={date => {
                    if (showOverallDatePicker.field === 'from') setOverallFrom(date.toISOString().split('T')[0]);
                    if (showOverallDatePicker.field === 'to') setOverallTo(date.toISOString().split('T')[0]);
                    setShowOverallDatePicker(null);
                  }}
                  onCancel={() => setShowOverallDatePicker(null)}
                  date={showOverallDatePicker.field === 'from' && overallFrom ? new Date(overallFrom) : showOverallDatePicker.field === 'to' && overallTo ? new Date(overallTo) : new Date()}
                />
              )}
              {/* Week Accordion - only show if both dates are set */}
              {overallFrom && overallTo && weekPlan.map((w, idx) => {
                const expanded = expandedWeeks.includes(idx);
                return (
                  <View key={idx} style={{ marginBottom: 16, borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 10, backgroundColor: expanded ? '#F7FBFD' : cardBackground, shadowColor: '#3CB6E3', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}>
                    <TouchableOpacity onPress={() => toggleWeek(idx)} style={{ flexDirection: 'row', alignItems: 'center', padding: 18, borderBottomWidth: expanded ? 1 : 0, borderBottomColor: '#EAF6F7', backgroundColor: '#EAF6FB', borderTopLeftRadius: 10, borderTopRightRadius: 10, marginBottom: expanded ? 0 : 8 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 22, color: '#3CB6E3', flex: 1, letterSpacing: 0.5 }}>
                        Week {idx + 1}  <Text style={{ fontWeight: 'normal', fontSize: 16, color: '#888' }}>({formatDate(w.from)} - {formatDate(w.to)})</Text>
                      </Text>
                      <AntDesign name={expanded ? 'up' : 'down'} size={22} color="#3CB6E3" />
                      <TouchableOpacity onPress={() => moveWeek(idx, idx - 1)} disabled={idx === 0} style={{ marginLeft: 10, opacity: idx === 0 ? 0.3 : 1 }}>
                        <AntDesign name="arrowup" size={20} color="#888" />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => moveWeek(idx, idx + 1)} disabled={idx === weekPlan.length - 1} style={{ marginLeft: 6, opacity: idx === weekPlan.length - 1 ? 0.3 : 1 }}>
                        <AntDesign name="arrowdown" size={20} color="#888" />
                      </TouchableOpacity>
                    </TouchableOpacity>
                    {expanded && (
                      <View style={{ padding: 12 }}>
                        {/* Department Dropdown per week */}
                        {Platform.OS === 'ios' ? (
                          <>
                            <Pressable
                              onPress={() => setDeptModalIdx(idx)}
                              style={{ borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 8, marginBottom: 4, height: 44, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10 }}
                            >
                              <Text style={{ color: w.department ? '#222' : '#888', flex: 1 }} numberOfLines={1} ellipsizeMode="tail">
                                {w.department || 'Select Department...'}
                              </Text>
                              <Ionicons name="chevron-down" size={20} color="#888" />
                            </Pressable>
                            <Modal visible={deptModalIdx === idx} transparent animationType="slide">
                              <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)' }} onPress={() => setDeptModalIdx(null)} />
                              <View style={{ backgroundColor: '#fff', borderTopLeftRadius: 16, borderTopRightRadius: 16, position: 'absolute', left: 0, right: 0, bottom: 0 }}>
                                <Picker
                                  selectedValue={w.department}
                                  onValueChange={value => { handleWeekPlanChange(idx, 'department', value); setDeptModalIdx(null); }}
                                >
                                  <Picker.Item label="Select Department..." value="" color="#888" />
                                  <Picker.Item label="IT Services" value="IT Services" color="#222" />
                                  <Picker.Item label="IT Development" value="IT Development" color="#222" />
                                  <Picker.Item label="Production" value="Production" color="#222" />
                                  <Picker.Item label="Enterprise Project Delivery" value="Enterprise Project Delivery" color="#222" />
                                  <Picker.Item label="IT Governance" value="IT Governance" color="#222" />
                                  <Picker.Item label="IT Transformation" value="IT Transformation" color="#222" />
                                </Picker>
                              </View>
                            </Modal>
                          </>
                        ) : (
                          <View style={{ borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 8, marginBottom: 4, flexDirection: 'row', alignItems: 'center', height: 54 }}>
                            <RNPickerSelect
                              onValueChange={value => handleWeekPlanChange(idx, 'department', value)}
                              value={w.department}
                              placeholder={{ label: 'Select Department...', value: '', color: '#888' }}
                              items={DEPARTMENTS.map(dep => ({ label: dep, value: dep }))}
                              style={{
                                inputAndroid: { height: 44, padding: 10, color: '#222', flex: 1 },
                              }}
                              useNativeAndroidPickerStyle={false}
                              Icon={() => <Ionicons name="chevron-down" size={20} color="#888" style={{ marginRight: 10 }} />}
                            />
                          </View>
                        )}
                        <TextInput
                          style={{ borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 10, padding: 12, marginBottom: 8, color: '#222', backgroundColor: '#fff', fontSize: 16 }}
                          placeholder="Hours"
                          placeholderTextColor="#888"
                          value={w.hours}
                          onChangeText={v => {
                            let val = v.replace(/[^0-9]/g, '');
                            if (val && (parseInt(val) < 0 || parseInt(val) > 40)) return;
                            handleWeekPlanChange(idx, 'hours', val);
                          }}
                          keyboardType="numeric"
                        />
                        {errors[`week${idx}_hours`] && <Text style={{ color: 'red', marginBottom: 2 }}>{errors[`week${idx}_hours`]}</Text>}
                        <TextInput
                          style={{ borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 10, padding: 12, marginBottom: 8, color: '#222', backgroundColor: '#fff', fontSize: 16 }}
                          placeholder="Task description"
                          placeholderTextColor="#888"
                          value={w.task}
                          onChangeText={v => handleWeekPlanChange(idx, 'task', v)}
                          multiline
                        />
                        {errors[`week${idx}_task`] && <Text style={{ color: 'red', marginBottom: 2 }}>{errors[`week${idx}_task`]}</Text>}
                      </View>
                    )}
                  </View>
                );
              })}
              {/* Plan Summary Table - summary only, not editable */}
              <View style={{
                marginTop: 20,
                padding: 16,
                borderRadius: 12,
                backgroundColor: cardBackground,
                shadowColor: '#000',
                shadowOpacity: 0.05,
                shadowRadius: 10,
                borderWidth: 1,
                borderColor: borderColor,
              }}>
                <Text style={{ fontSize: 18, fontWeight: '600', color: isDarkMode ? '#43C6AC' : '#0EA5E9', marginBottom: 12, textAlign: 'center' }}>Plan Summary</Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 8, borderBottomWidth: 1, borderColor: borderColor }}>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: textColor, textAlign: 'center' }}>Week</Text>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: textColor, textAlign: 'center' }}>From</Text>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: textColor, textAlign: 'center' }}>To</Text>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: textColor, textAlign: 'center' }}>Department</Text>
                  <Text style={{ flex: 1, fontSize: 14, fontWeight: '500', color: textColor, textAlign: 'center' }}>Hours</Text>
                </View>
                {weekPlan.map((w, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 0.5, borderColor: borderColor, backgroundColor: isDarkMode ? (idx % 2 === 0 ? '#23272b' : cardBackground) : (idx % 2 === 0 ? '#fff' : '#F7FBFD') }}>
                    <Text style={{ flex: 1, fontSize: 14, color: textColor, textAlign: 'center' }}>{idx + 1}</Text>
                    <Text style={{ flex: 1, fontSize: 14, color: textColor, textAlign: 'center' }}>{w.from ? formatDate(w.from) : '-'}</Text>
                    <Text style={{ flex: 1, fontSize: 14, color: textColor, textAlign: 'center' }}>{w.to ? formatDate(w.to) : '-'}</Text>
                    <Text style={{ flex: 1, fontSize: 14, color: textColor, textAlign: 'center' }}>{w.department || '-'}</Text>
                    <Text style={{ flex: 1, fontSize: 14, color: textColor, textAlign: 'center' }}>{w.hours || '-'}</Text>
                  </View>
                ))}
              </View>
              {/* Date Picker Modal and Submit Button remain unchanged */}
              {showOverallDatePicker && (
                <DateTimePickerModal
                  isVisible={!!showOverallDatePicker}
                  mode="date"
                  onConfirm={date => {
                    if (showOverallDatePicker.field === 'from') setOverallFrom(date.toISOString().split('T')[0]);
                    if (showOverallDatePicker.field === 'to') setOverallTo(date.toISOString().split('T')[0]);
                    setShowOverallDatePicker(null);
                  }}
                  onCancel={() => setShowOverallDatePicker(null)}
                  date={showOverallDatePicker.field === 'from' && overallFrom ? new Date(overallFrom) : showOverallDatePicker.field === 'to' && overallTo ? new Date(overallTo) : new Date()}
                />
              )}
              {/* Submit Button */}
              <TouchableOpacity
                style={[styles.savePlanBtn, { opacity: isFormValid() ? 1 : 0.5 }]}
                onPress={handleFinalSubmit}
                disabled={!isFormValid()}
              >
                <Text style={styles.savePlanBtnText}>Submit</Text>
              </TouchableOpacity>
              {submitError ? <Text style={{ color: 'red', marginTop: 8 }}>{submitError}</Text> : null}
              {/* Only show Plan confirmed after submit */}
            </View>
          ) : (
            <View style={{ margin: 18, backgroundColor: '#F8FAFC', borderRadius: 18, padding: 22, borderWidth: 1, borderColor: '#B2E6F7', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
              <Text style={{ textAlign: 'center', fontSize: 26, fontWeight: 'bold', color: '#3CB6E3', marginBottom: 24, letterSpacing: 0.5 }}>Plan Summary</Text>
              <Text style={styles.subtitle}>Review your training plan before confirming.</Text>
              <View style={{ borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 12, marginBottom: 18, backgroundColor: '#F8FAFC', paddingVertical: 8, maxWidth: 500, width: '95%', alignSelf: 'center' }}>
                <View style={{ flexDirection: 'row', backgroundColor: '#EAF6FB', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
                  <Text style={{ flex: 1, fontWeight: 'bold', color: '#3CB6E3', paddingVertical: 8, paddingHorizontal: 4, textAlign: 'center', fontSize: 12, letterSpacing: 0.5, flexWrap: 'wrap' }} numberOfLines={2}>Week</Text>
                  <Text style={{ flex: 1.2, fontWeight: 'bold', color: '#3CB6E3', paddingVertical: 8, paddingHorizontal: 4, textAlign: 'center', fontSize: 12, letterSpacing: 0.5, flexWrap: 'wrap' }} numberOfLines={2}>From</Text>
                  <Text style={{ flex: 1.2, fontWeight: 'bold', color: '#3CB6E3', paddingVertical: 8, paddingHorizontal: 4, textAlign: 'center', fontSize: 12, letterSpacing: 0.5, flexWrap: 'wrap' }} numberOfLines={2}>To</Text>
                  <Text style={{ flex: 1.2, fontWeight: 'bold', color: '#3CB6E3', paddingVertical: 8, paddingHorizontal: 4, textAlign: 'center', fontSize: 12, letterSpacing: 0.5, flexWrap: 'wrap' }} numberOfLines={2}>Department</Text>
                  <Text style={{ flex: 0.8, fontWeight: 'bold', color: '#3CB6E3', paddingVertical: 8, paddingHorizontal: 4, textAlign: 'center', fontSize: 12, letterSpacing: 0.5, flexWrap: 'wrap' }} numberOfLines={2}>Hours</Text>
                  <Text style={{ flex: 2, fontWeight: 'bold', color: '#3CB6E3', paddingVertical: 8, paddingHorizontal: 4, textAlign: 'center', fontSize: 12, letterSpacing: 0.5, flexWrap: 'wrap' }} numberOfLines={2}>Task</Text>
                </View>
                {weekPlan.map((w, idx) => (
                  <View key={idx} style={{ flexDirection: 'row', borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: '#EAF6FB', backgroundColor: idx % 2 === 0 ? '#fff' : '#F7FBFD', justifyContent: 'center' }}>
                    <Text style={{ flex: 1, padding: 10, textAlign: 'center', color: '#222', fontWeight: 'bold', fontSize: 12 }}>{idx + 1}</Text>
                    <Text style={{ flex: 1.2, padding: 10, textAlign: 'center', color: '#3CB6E3', fontWeight: '500', fontSize: 12 }}>{w.from ? formatDate(w.from) : '-'}</Text>
                    <Text style={{ flex: 1.2, padding: 10, textAlign: 'center', color: '#3CB6E3', fontWeight: '500', fontSize: 12 }}>{w.to ? formatDate(w.to) : '-'}</Text>
                    <Text style={{ flex: 1.2, padding: 10, textAlign: 'center', color: '#3CB6E3', fontWeight: 'bold', fontSize: 12 }}>{w.department || '-'}</Text>
                    <Text style={{ flex: 0.8, padding: 10, textAlign: 'center', color: '#222', fontWeight: 'bold', fontSize: 12 }}>{w.hours || '-'}</Text>
                    <Text style={{ flex: 2, padding: 10, color: '#555', fontSize: 12 }}>{w.task || '-'}</Text>
                  </View>
                ))}
              </View>
              <TouchableOpacity
                style={[styles.continueBtn, { opacity: isFormValid() ? 1 : 0.5 }]}
                onPress={() => {
                  setDashboardPlan(weekPlan.map((w, idx) => ({ ...w, week: idx + 1 })));
                  setTab('Dashboard');
                  setShowSummary(false);
                }}
                disabled={!isFormValid()}
              >
                <Text style={styles.continueBtnText}>Confirm Plan</Text>
              </TouchableOpacity>
              {submitError ? <Text style={{ color: 'red', marginTop: 8 }}>{submitError}</Text> : null}
              {submitSuccess ? <Text style={{ color: '#24B26B', marginTop: 10 }}>Plan confirmed!</Text> : null}
            </View>
          )
        )}
        {tab === 'Dashboard' && (
          <View style={{ paddingHorizontal: 8, paddingTop: 8 }}>
            {(dashboardPlan.length > 0
              ? [{
                  name: 'My Plan',
                  department: selectedProgram || '—',
                  progress: dashboardPlan.length > 0 ? Math.round((dashboardPlan.filter(w => new Date(w.to) <= new Date()).length / dashboardPlan.length) * 100) : 0,
                  weeks: dashboardPlan.map((w, idx) => ({
                    status: w.hours && Number(w.hours) > 0 ? (new Date(w.to) <= new Date() ? 'done' : 'in-progress') : 'not-started',
                    hours: w.hours || 0,
                    tasks: w.task ? w.task.split(',').length : 0,
                  }))
                }]
              : [])
            .map((trainee, idx) => (
              <View key={idx} style={{ backgroundColor: cardBackground, borderRadius: 18, padding: 18, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 }}>
                  <View>
                    <Text style={{ fontWeight: 'bold', fontSize: 18, color: '#222' }}>{trainee.name}</Text>
                    <Text style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{trainee.department}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={{ fontWeight: 'bold', fontSize: 20, color: '#222' }}>{trainee.progress}%</Text>
                    <Text style={{ color: '#888', fontSize: 12, marginTop: 2 }}>Overall progress</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, marginBottom: 2 }}>
                  {trainee.weeks.map((week: any, widx: number) => (
                    <View key={widx} style={{ alignItems: 'center', flex: 1 }}>
                      <Text style={{ fontWeight: 'bold', fontSize: 13, color: '#222', marginBottom: 2 }}>Week {widx + 1}</Text>
                      <View style={{ marginBottom: 4 }}>
                        {week.status === 'done' && (
                          <Ionicons name="checkmark-circle" size={32} color="#4ECB71" />
                        )}
                        {week.status === 'in-progress' && (
                          <Ionicons name="hourglass" size={32} color="#3CB6E3" />
                        )}
                        {week.status === 'not-started' && (
                          <Ionicons name="ellipse-outline" size={32} color="#D3D3D3" />
                        )}
                      </View>
                      <Text style={{ color: '#888', fontSize: 12, textAlign: 'center', lineHeight: 16 }}>{week.hours}h logged</Text>
                      <Text style={{ color: '#888', fontSize: 12, textAlign: 'center', lineHeight: 16 }}>{week.tasks} tasks</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}
            {dashboardPlan.length === 0 && (
              <Text style={{ color: '#888', textAlign: 'center', marginTop: 32, fontSize: 16 }}>No plan submitted yet.</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 