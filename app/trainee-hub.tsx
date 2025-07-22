import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, SafeAreaView, Platform, Modal, Pressable } from 'react-native';
import { Ionicons, AntDesign } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import RNPickerSelect from 'react-native-picker-select';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const DEPARTMENTS = [
  'IT Services',
  'IT Development',
  'Production',
  'Enterprise Project Delivery',
  'Cyber Security',
  'IT Governance',
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

export default function TraineeHub() {
  const [tab, setTab] = useState<'Registration' | 'Dashboard'>('Registration');
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
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Trainee Hub</Text>
      </View>
      <View style={styles.tabRow}>
        {['Registration', 'Dashboard'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t as 'Registration' | 'Dashboard')}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {tab === 'Registration' && (
          !showSummary ? (
            <View style={{ margin: 18, backgroundColor: '#F8FAFC', borderRadius: 18, padding: 22, borderWidth: 1, borderColor: '#B2E6F7', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
              <Text style={{ textAlign: 'center', fontSize: 26, fontWeight: 'bold', color: '#3CB6E3', marginBottom: 24, letterSpacing: 0.5 }}>Trainee Registration</Text>
              {/* Overall From/To Date Pickers */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 }}>
                <TouchableOpacity onPress={() => setShowOverallDatePicker({ field: 'from' })} style={{ flex: 1, marginRight: 8, borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 6, padding: 14 }}>
                  <Text style={{ color: overallFrom ? '#222' : '#888', fontSize: 17 }}>{overallFrom ? `From: ${formatDate(overallFrom)}` : 'From date'}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setShowOverallDatePicker({ field: 'to' })} style={{ flex: 1, marginLeft: 8, borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 6, padding: 14 }}>
                  <Text style={{ color: overallTo ? '#222' : '#888', fontSize: 17 }}>{overallTo ? `To: ${formatDate(overallTo)}` : 'To date'}</Text>
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
                  <View key={idx} style={{ marginBottom: 16, borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 10, backgroundColor: expanded ? '#F7FBFD' : '#fff', shadowColor: '#3CB6E3', shadowOpacity: 0.06, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 1 }}>
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
                                  <Picker.Item label="Cyber Security" value="Cyber Security" color="#222" />
                                  <Picker.Item label="IT Governance" value="IT Governance" color="#222" />
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
                            <Ionicons name="chevron-down" size={20} color="#888" style={{ position: 'absolute', right: 10 }} />
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
              {/* Plan Summary */}
              <Text style={{ fontWeight: 'bold', marginTop: 28, marginBottom: 10, fontSize: 21, color: '#3CB6E3', textAlign: 'center', letterSpacing: 0.5 }}>Plan Summary</Text>
              <View style={{ borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 12, marginBottom: 18, backgroundColor: '#F8FAFC', paddingVertical: 8, maxWidth: 500, width: '95%', alignSelf: 'center' }}>
                <View style={{ flexDirection: 'row', backgroundColor: '#EAF6FB', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Week
                  </Text>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    From
                  </Text>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    To
                  </Text>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Department
                  </Text>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Hours
                  </Text>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Task
                  </Text>
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
              {submitSuccess ? <Text style={{ color: '#24B26B', marginTop: 10 }}>Registration saved!</Text> : null}
            </View>
          ) : (
            <View style={{ margin: 18, backgroundColor: '#F8FAFC', borderRadius: 18, padding: 22, borderWidth: 1, borderColor: '#B2E6F7', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
              <Text style={{ textAlign: 'center', fontSize: 26, fontWeight: 'bold', color: '#3CB6E3', marginBottom: 24, letterSpacing: 0.5 }}>Plan Summary</Text>
              <Text style={styles.subtitle}>Review your training plan before confirming.</Text>
              <View style={{ borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 12, marginBottom: 18, backgroundColor: '#F8FAFC', paddingVertical: 8, maxWidth: 500, width: '95%', alignSelf: 'center' }}>
                <View style={{ flexDirection: 'row', backgroundColor: '#EAF6FB', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Week
                  </Text>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    From
                  </Text>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    To
                  </Text>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Department
                  </Text>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Hours
                  </Text>
                  <Text
                    style={{
                      fontWeight: 'bold',
                      color: '#3CB6E3',
                      paddingVertical: 10,
                      paddingHorizontal: 16,
                      textAlign: 'center',
                      fontSize: 13,
                      letterSpacing: 0.5
                    }}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    Task
                  </Text>
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
        {tab === 'Dashboard' && dashboardPlan.length > 0 && (
          <View style={{ margin: 18, backgroundColor: '#fff', borderRadius: 18, padding: 18, borderWidth: 1, borderColor: '#B2E6F7', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 3 }}>
            {/* Progress Bar */}
            <View style={{ marginVertical: 20, alignItems: 'center' }}>
              <Text style={{ fontSize: 16, fontWeight: '600', color: '#3CB6E3', marginBottom: 8 }}>
                Progress: {progress}% ({completedWeeks}/{dashboardPlan.length} weeks)
              </Text>
              <View style={{ width: 200, height: 12, backgroundColor: '#EAF6FB', borderRadius: 6, overflow: 'hidden' }}>
                <View style={{
                  width: `${progress}%`,
                  height: '100%',
                  backgroundColor: '#3CB6E3',
                  borderRadius: 6
                }} />
              </View>
            </View>
            {/* Simple Circular Progress (Donut) */}
            <View style={{ alignItems: 'center', marginBottom: 20 }}>
              <View style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                borderWidth: 8,
                borderColor: '#EAF6FB',
                justifyContent: 'center',
                alignItems: 'center',
                position: 'relative'
              }}>
                <View style={{
                  position: 'absolute',
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  borderWidth: 8,
                  borderColor: '#3CB6E3',
                  borderRightColor: 'transparent',
                  borderBottomColor: 'transparent',
                  transform: [{ rotate: `${(progress / 100) * 360}deg` }]
                }} />
                <Text style={{ fontWeight: 'bold', color: '#3CB6E3', fontSize: 18 }}>{progress}%</Text>
              </View>
            </View>
            {/* Plan Table */}
            <Text style={{ fontWeight: 'bold', marginBottom: 6, fontSize: 18, color: '#3CB6E3', textAlign: 'center', letterSpacing: 0.5 }}>Plan</Text>
            <View style={{ borderWidth: 1, borderColor: '#B2E6F7', borderRadius: 10, marginBottom: 12, backgroundColor: '#F8FAFC', maxWidth: 500, width: '95%', alignSelf: 'center' }}>
              <View style={{ flexDirection: 'row', backgroundColor: '#EAF6FB', borderTopLeftRadius: 10, borderTopRightRadius: 10 }}>
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: '#3CB6E3',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    textAlign: 'center',
                    fontSize: 13,
                    letterSpacing: 0.5
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Week
                </Text>
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: '#3CB6E3',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    textAlign: 'center',
                    fontSize: 13,
                    letterSpacing: 0.5
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  From
                </Text>
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: '#3CB6E3',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    textAlign: 'center',
                    fontSize: 13,
                    letterSpacing: 0.5
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  To
                </Text>
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: '#3CB6E3',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    textAlign: 'center',
                    fontSize: 13,
                    letterSpacing: 0.5
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Department
                </Text>
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: '#3CB6E3',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    textAlign: 'center',
                    fontSize: 13,
                    letterSpacing: 0.5
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Hours
                </Text>
                <Text
                  style={{
                    fontWeight: 'bold',
                    color: '#3CB6E3',
                    paddingVertical: 10,
                    paddingHorizontal: 16,
                    textAlign: 'center',
                    fontSize: 13,
                    letterSpacing: 0.5
                  }}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  Task
                </Text>
              </View>
              {dashboardPlan.map((w, idx) => (
                <View key={idx} style={{ flexDirection: 'row', borderTopWidth: idx === 0 ? 0 : 1, borderTopColor: '#EAF6FB', backgroundColor: idx % 2 === 0 ? '#fff' : '#F7FBFD', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ flex: 1, padding: 10, textAlign: 'center', color: '#222', fontWeight: 'bold', fontSize: 12 }}>{w.week}</Text>
                  <Text style={{ flex: 1.2, padding: 10, textAlign: 'center', color: '#3CB6E3', fontWeight: '500', fontSize: 12 }}>{w.from ? formatDate(w.from) : '-'}</Text>
                  <Text style={{ flex: 1.2, padding: 10, textAlign: 'center', color: '#3CB6E3', fontWeight: '500', fontSize: 12 }}>{w.to ? formatDate(w.to) : '-'}</Text>
                  <Text style={{ flex: 1.2, padding: 10, textAlign: 'center', color: '#3CB6E3', fontWeight: 'bold', fontSize: 12 }}>{w.department || '-'}</Text>
                  <Text style={{ flex: 0.8, padding: 10, textAlign: 'center', color: '#222', fontWeight: 'bold', fontSize: 12 }}>{w.hours || '-'}</Text>
                  <Text style={{ flex: 2, padding: 10, color: '#555', fontSize: 12 }}>{w.task || '-'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
} 