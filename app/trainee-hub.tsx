import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, SafeAreaView, FlatList } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

const TABS = ['Setup', 'Department', 'Plan', 'Progress', 'Overview'];

const DEPARTMENTS = [
  {
    name: 'IT Governance and Architecture',
    desc: 'Responsible for ensuring that IT strategies align with the overall business goals of the organization. It sets policies, frameworks, and standards to guide technology-related decisions.',
    majors: 'Computer Science, Software Engineering, Information Technology',
    tools: 'IBM OpenPages, OneTrust, LeanIX, MEGA HOPEX',
  },
  {
    name: 'Enterprise Project Delivery',
    desc: 'Responsible for managing and delivering strategic, regulatory, and enhancement projects across the organization. EPD ensures that all projects are executed on time, within scope, and with high quality.',
    majors: 'Software Engineering',
    tools: 'Clarity PPM, Jira, Excel',
  },
  {
    name: 'Development and Testing',
    desc: 'In charge of building and maintaining software applications and systems. Developers work on coding, debugging, testing, and deploying solutions that meet business requirements.',
    majors: 'Software Engineering',
    tools: 'Visual Studio Code, Eclipse, Android Studio',
  },
  {
    name: 'Production',
    desc: 'Manages the live IT environment, ensuring applications and services are deployed effectively and run smoothly, securely, and with high availability to support business operations.',
    majors: 'Software Engineering, Data Science, Computer Science',
    tools: 'OBIEE, Cognos, VMware, Linux, SQL Developer',
  },
  {
    name: 'IT Services',
    desc: 'Handles technical support for all users across the organization. Resolves software issues, installs apps, and applies updates. Ensures systems run efficiently as part of the core IT infrastructure.',
    majors: 'Software Engineering',
    tools: 'SCCM, Trend Micro, Next think',
  },
  {
    name: 'IT Transformation',
    desc: 'Handles technical support for all users across the organization. Resolves software issues, installs apps, and applies updates. Ensures systems run efficiently as part of the core IT infrastructure.',
    majors: 'Software Engineering, Computer Science, Information Technology',
    tools: 'Studio, Android, Netbeans',
  },
];

const INITIAL_PLAN = [
  { week: 1, duration: '', tasks: '', status: '' },
  { week: 2, duration: '', tasks: '', status: '' },
  { week: 3, duration: '', tasks: '', status: '' },
  { week: 4, duration: '', tasks: '', status: '' },
  { week: 5, duration: '', tasks: '', status: '' },
];

export default function TraineeHub() {
  const [tab, setTab] = useState('Department');
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [plan, setPlan] = useState(INITIAL_PLAN);
  const [planSaved, setPlanSaved] = useState(false);

  // Add a new week to the plan
  const addWeek = () => {
    if (plan.length < 24) {
      setPlan([...plan, { week: plan.length + 1, duration: '', tasks: '', status: '' }]);
    }
  };

  // Update a field in a week
  const updatePlan = (idx, field, value) => {
    const newPlan = plan.map((w, i) => i === idx ? { ...w, [field]: value } : w);
    setPlan(newPlan);
    setPlanSaved(false);
  };

  // Save plan
  const savePlan = () => {
    setPlanSaved(true);
  };

  // Calculate total duration
  const totalDuration = plan.reduce((sum, w) => sum + (parseInt(w.duration) || 0), 0);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity style={{ marginRight: 8 }} onPress={() => history.back && history.back()}>
          <Ionicons name="arrow-back" size={24} color="#222" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Trainee Hub</Text>
        <View style={{ width: 32 }} />
      </View>
      <Text style={styles.subtitle}>Lets start you Journey!</Text>
      <View style={styles.tabRow}>
        {TABS.map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.tabBtn, tab === t && styles.tabBtnActive]}
            onPress={() => setTab(t)}
          >
            <Text style={[styles.tabBtnText, tab === t && styles.tabBtnTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 32 }}>
        {tab === 'Department' && (
          <>
            <Text style={styles.sectionTitle}>Department Selection</Text>
            <Text style={styles.sectionDesc}>Choose the department that best aligns with your interests and career goals</Text>
            {DEPARTMENTS.map((dep, idx) => (
              <View key={dep.name} style={[styles.deptCard, selectedDept === dep.name && styles.deptCardSelected]}>
                <Text style={styles.deptName}>{dep.name}</Text>
                <Text style={styles.deptDesc}>{dep.desc}</Text>
                <Text style={styles.deptLabel}>Suitable Majors</Text>
                <Text style={styles.deptValue}>{dep.majors}</Text>
                <Text style={styles.deptLabel}>Tools Used</Text>
                <Text style={styles.deptValue}>{dep.tools}</Text>
                <TouchableOpacity
                  style={[styles.selectBtn, selectedDept === dep.name && styles.selectBtnActive]}
                  onPress={() => setSelectedDept(dep.name)}
                >
                  <Text style={styles.selectBtnText}>Select</Text>
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={[styles.continueBtn, !selectedDept && { opacity: 0.5 }]}
              disabled={!selectedDept}
              onPress={() => setTab('Plan')}
            >
              <Text style={styles.continueBtnText}>Continue</Text>
            </TouchableOpacity>
          </>
        )}
        {tab === 'Plan' && (
          <View style={styles.planSection}>
            <View style={styles.planHeaderRow}>
              <Text style={styles.planSectionTitle}>Weekly Training Plan</Text>
              <TouchableOpacity style={styles.addWeekBtn} onPress={addWeek} disabled={plan.length >= 24}>
                <Text style={styles.addWeekBtnText}>Add Week</Text>
                <Ionicons name="add-circle-outline" size={20} color="#3CB6E3" />
              </TouchableOpacity>
            </View>
            <View style={styles.planTableHeader}>
              <Text style={styles.planTableHeaderCell}>Week</Text>
              <Text style={styles.planTableHeaderCell}>Duration</Text>
              <Text style={styles.planTableHeaderCell}>Tasks</Text>
              <Text style={styles.planTableHeaderCell}>Status</Text>
            </View>
            {plan.map((w, idx) => (
              <View key={idx} style={styles.planTableRow}>
                <Text style={styles.planTableCell}>{w.week}</Text>
                <View style={[styles.planTableCell, { flexDirection: 'row', alignItems: 'center' }]}> 
                  <TextInput
                    style={styles.durationInput}
                    value={w.duration}
                    onChangeText={v => updatePlan(idx, 'duration', v.replace(/[^0-9]/g, ''))}
                    keyboardType="numeric"
                    placeholder="0"
                  />
                  <Text style={styles.hrsLabel}>hrs</Text>
                </View>
                <TextInput
                  style={[styles.planTableCell, styles.tasksInput]}
                  value={w.tasks}
                  onChangeText={v => updatePlan(idx, 'tasks', v)}
                  placeholder="Describe tasks..."
                  multiline
                />
                <TouchableOpacity style={styles.statusBtn}>
                  <Text style={styles.statusBtnText}>{w.status || '...'} </Text>
                  <Ionicons name="chevron-down" size={16} color="#3CB6E3" />
                </TouchableOpacity>
              </View>
            ))}
            <View style={styles.planFooterRow}>
              <Text style={styles.planFooterText}>Total Duration: {totalDuration} hours</Text>
              <Text style={styles.planFooterText}>{plan.length} Weeks | Max Weeks: 24</Text>
            </View>
            <TouchableOpacity style={styles.savePlanBtn} onPress={savePlan}>
              <Text style={styles.savePlanBtnText}>Save Training Plan</Text>
            </TouchableOpacity>
            {planSaved && (
              <View style={styles.successBanner}>
                <Ionicons name="checkmark-circle" size={20} color="#24B26B" style={{ marginRight: 8 }} />
                <Text style={styles.successText}>The Plan Saved Successfully</Text>
              </View>
            )}
          </View>
        )}
        {tab === 'Setup' && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontSize: 18, color: '#43C6AC', fontWeight: 'bold', marginBottom: 12 }}>Welcome to your Trainee Hub!</Text>
            <Text style={{ color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>Get started by selecting your department and creating your training plan.</Text>
            <TouchableOpacity style={styles.continueBtn} onPress={() => setTab('Department')}>
              <Text style={styles.continueBtnText}>Start</Text>
            </TouchableOpacity>
          </View>
        )}
        {tab === 'Progress' && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontSize: 18, color: '#43C6AC', fontWeight: 'bold', marginBottom: 12 }}>Progress</Text>
            <Text style={{ color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>Progress tracking coming soon!</Text>
          </View>
        )}
        {tab === 'Overview' && (
          <View style={{ alignItems: 'center', marginTop: 40 }}>
            <Text style={{ fontSize: 18, color: '#43C6AC', fontWeight: 'bold', marginBottom: 12 }}>Overview</Text>
            <Text style={{ color: '#888', fontSize: 16, textAlign: 'center', marginBottom: 20 }}>Overview coming soon!</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
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