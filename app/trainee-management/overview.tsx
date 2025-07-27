import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { supabase } from '../../services/supabase';
import { Ionicons } from '@expo/vector-icons';
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

export default function TraineeOverview() {
  const [plans, setPlans] = useState<TraineePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isDarkMode } = useTheme();
  const backgroundColor = useThemeColor({}, 'background');
  const cardBackground = isDarkMode ? '#1E1E1E' : '#fff';
  const textColor = useThemeColor({}, 'text');
  const secondaryTextColor = isDarkMode ? '#9BA1A6' : '#888';

  useEffect(() => {
    const fetchPlans = async () => {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.from('trainee_plans').select('*');
      if (error) {
        setError('Failed to fetch trainee plans');
        setLoading(false);
        return;
      }
      setPlans(data || []);
      console.log('Trainee plans (overview):', data);
      setLoading(false);
    };
    fetchPlans();
  }, []);

  // Aggregations
  const totalTrainees = plans.length;
  const allWeeks = plans.flatMap(plan => plan.weeks || []);
  const totalHours = allWeeks.reduce((sum, w) => sum + (w.hours || 0), 0);
  const avgTotalHours = totalTrainees > 0 ? Math.round(totalHours / totalTrainees) : 0;
  const departmentCounts: Record<string, number> = {};
  allWeeks.forEach(w => {
    if (w.department) departmentCounts[w.department] = (departmentCounts[w.department] || 0) + 1;
  });
  const mostCommonDept = Object.entries(departmentCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '-';

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}><ActivityIndicator size="large" color="#3CB371" /></View>;
  }
  if (error) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor }}><Text style={{ color: 'red' }}>{error}</Text></View>;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor }} contentContainerStyle={{ padding: 20 }}>
      <View style={styles.cardsRow}>
        <View style={[styles.metricCard, { backgroundColor: cardBackground, shadowColor: isDarkMode ? '#000' : '#000' }] }>
          <Text style={[styles.metricLabel, { color: secondaryTextColor }]}>Total Trainees</Text>
          <Text style={[styles.metricValue, { color: '#3CB371' }]}>{totalTrainees}</Text>
        </View>
        <View style={[styles.metricCard, { backgroundColor: cardBackground, shadowColor: isDarkMode ? '#000' : '#000' }] }>
          <Text style={[styles.metricLabel, { color: secondaryTextColor }]}>Avg Hours</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="time-outline" size={18} color="#3CB371" style={{ marginRight: 4 }} />
            <Text style={[styles.metricValueSmall, { color: '#3CB371' }]}>{avgTotalHours}</Text>
          </View>
        </View>
      </View>
      <View style={styles.cardsRow}>
        <View style={[styles.metricCardFull, { backgroundColor: cardBackground, shadowColor: isDarkMode ? '#000' : '#000' }] }>
          <Text style={[styles.metricLabel, { color: secondaryTextColor }]}>Most Common Dept</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4 }}>
            <Ionicons name="business-outline" size={18} color="#3CB371" style={{ marginRight: 4 }} />
            <Text style={[styles.metricValueSmall, { color: '#3CB371' }]}>{mostCommonDept}</Text>
          </View>
        </View>
      </View>
      {/* Add more cards/metrics as needed */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  cardsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    padding: 22,
    marginRight: 12,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
  },
  metricCardFull: {
    flex: 1,
    borderRadius: 20,
    padding: 22,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: 15,
    fontWeight: '500',
    fontFamily: 'System',
    marginBottom: 2,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: 'bold',
    fontFamily: 'System',
    marginTop: 2,
  },
  metricValueSmall: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'System',
  },
}); 