import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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

export default function TraineeProgress() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff' }} contentContainerStyle={{ paddingBottom: 32 }}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}><Text style={{ color: '#3CB371' }}>Tracking</Text> Trainee Hub</Text>
      </View>
      <Text style={styles.headerSubtitle}>Progress</Text>
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
    justifyContent: 'space-around',
    marginTop: 8,
  },
  progressWeekBox: {
    alignItems: 'center',
    width: '25%', // Adjust as needed for 5 weeks
  },
  progressWeekIconBox: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  progressWeekLabel: {
    fontSize: 12,
    color: '#222',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  progressWeekInfo: {
    fontSize: 10,
    color: '#888',
    textAlign: 'center',
  },
}); 