import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

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

export default function TraineeOverview() {
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#fff', marginTop: 0, paddingTop: 0 }} contentContainerStyle={{ paddingBottom: 32 }}>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
}); 