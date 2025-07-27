import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../../services/supabase';
import { useTheme } from '../../components/ThemeContext';
import { useThemeColor } from '../../hooks/useThemeColor';

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

function getWeekStatus(from: string, to: string): 'done' | 'in-progress' | 'not-started' {
  const today = new Date();
  const fromDate = from ? new Date(from) : null;
  const toDate = to ? new Date(to) : null;
  if (toDate && today > toDate) return 'done';
  if (fromDate && toDate && today >= fromDate && today <= toDate) return 'in-progress';
  if (fromDate && today < fromDate) return 'not-started';
  return 'not-started';
}

export default function TraineeProgress() {
  const [progressData, setProgressData] = useState<TraineePlan[]>([]);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';
  const dividerColor = isDarkMode ? '#23272b' : '#F2F4F7';
  const expandedSectionBg = isDarkMode ? '#23272b' : '#F8FFFA';

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('trainee_plans').select('*');
      if (error) {
        setError('Failed to fetch trainee progress');
        setLoading(false);
        return;
      }
      setProgressData(data || []);
      console.log('Trainee progress data:', data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}><ActivityIndicator size="large" color="#3CB371" /></View>;
  }
  if (error) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor }} contentContainerStyle={{ padding: 16 }}>
      {progressData.length === 0 && (
        <Text style={{ color: secondaryTextColor, textAlign: 'center', marginTop: 32 }}>No trainees found.</Text>
      )}
      {progressData.map((trainee) => {
        const totalWeeks = trainee.weeks?.length || 0;
        // Count completed weeks based on date logic
        const completedWeeks = trainee.weeks?.filter(w => getWeekStatus(w.from, w.to) === 'done').length || 0;
        const progress = totalWeeks > 0 ? Math.round((completedWeeks / totalWeeks) * 100) : 0;
        return (
          <View key={trainee.id} style={[styles.card, { backgroundColor: cardBackground, shadowColor: isDarkMode ? '#000' : '#000' }] }>
            <TouchableOpacity onPress={() => setExpanded(expanded === trainee.id ? null : trainee.id)} activeOpacity={0.8}>
              <View style={styles.cardRow}>
                <Ionicons name="person-circle-outline" size={28} color="#3CB371" style={{ marginRight: 10 }} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.nameText, { color: '#3CB371' }]}>{trainee.trainee_name}</Text>
                  <Text style={[styles.programText, { color: secondaryTextColor }]}>{trainee.program_name}</Text>
                </View>
                <Text style={[styles.progressPercent, { color: textColor }]}>{progress}%</Text>
              </View>
              <View style={[styles.progressBarBg, { backgroundColor: dividerColor }] }>
                <View style={[styles.progressBar, { width: `${progress}%` }]} />
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.weekChipsRow}>
                {trainee.weeks?.map((w, idx) => {
                  const status = getWeekStatus(w.from, w.to);
                  let chipColor = '#B0B0B0', icon = 'ellipse-outline';
                  if (status === 'done') { chipColor = '#4ECB71'; icon = 'checkmark-circle'; }
                  else if (status === 'in-progress') { chipColor = '#F7B801'; icon = 'hourglass'; }
                  else if (status === 'not-started') { chipColor = '#E57373'; icon = 'hourglass'; }
                  return (
                    <View key={idx} style={[styles.weekChip, { backgroundColor: chipColor + '22' }]}> 
                      <Ionicons name={icon as any} size={18} color={chipColor} />
                      <Text style={[styles.weekChipText, { color: chipColor }]}>{idx + 1}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </TouchableOpacity>
            {expanded === trainee.id && (
              <View style={[styles.expandedSection, { backgroundColor: expandedSectionBg }] }>
                {trainee.weeks?.map((w, idx) => (
                  <View key={idx} style={styles.expandedWeekRow}>
                    <Text style={[styles.expandedWeekLabel, { color: textColor }]}>Week {idx + 1}:</Text>
                    <Text style={[styles.expandedWeekDetail, { color: textColor }]}>Dept: {w.department || '-'}</Text>
                    <Text style={[styles.expandedWeekDetail, { color: textColor }]}>Hours: {w.hours || 0}</Text>
                    <Text style={[styles.expandedWeekDetail, { color: textColor }]}>From: {w.from || '-'}</Text>
                    <Text style={[styles.expandedWeekDetail, { color: textColor }]}>To: {w.to || '-'}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
  progressPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    width: '100%',
    marginTop: 4,
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3CB371',
  },
  weekChipsRow: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 2,
  },
  weekChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  weekChipText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginLeft: 4,
    fontFamily: 'System',
  },
  expandedSection: {
    borderRadius: 12,
    marginTop: 10,
    padding: 12,
  },
  expandedWeekRow: {
    marginBottom: 8,
  },
  expandedWeekLabel: {
    fontWeight: 'bold',
    fontSize: 14,
    marginBottom: 2,
  },
  expandedWeekDetail: {
    fontSize: 13,
    marginLeft: 8,
    marginBottom: 1,
  },
}); 