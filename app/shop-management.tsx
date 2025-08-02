import React, { useState } from 'react';
import { View, Text, Button, FlatList, TouchableOpacity, StyleSheet, Animated, Image } from 'react-native';
import { ThemedView } from '../components/ThemedView';
import { ThemedText } from '../components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import AdminHeader from '../components/AdminHeader';

// Mock data for ads
const initialAds = [
  {
    id: '1',
    title: '50% Off on Books',
    description: 'Get half price on all books this week only!',
    submittedBy: 'employee',
    status: 'pending',
    image: require('../assets/images/react-logo.png'),
  },
  {
    id: '2',
    title: 'New Coffee Shop Opening',
    description: 'Visit our new coffee shop and get a free drink.',
    submittedBy: 'trainee',
    status: 'pending',
    image: require('../assets/images/partial-react-logo.png'),
  },
  {
    id: '3',
    title: 'Art Supplies Sale',
    description: 'Discounts on all art supplies for students.',
    submittedBy: 'employee',
    status: 'pending',
    image: require('../assets/images/splash-icon.png'),
  },
];

const submittedByColors = {
  employee: '#4F8EF7',
  trainee: '#F7B32B',
};

export default function ShopManagementScreen() {
  const [ads, setAds] = useState(initialAds);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleAction = (id: string, action: 'accept' | 'reject') => {
    setAds((prevAds) =>
      prevAds.map((ad) =>
        ad.id === id ? { ...ad, status: action === 'accept' ? 'accepted' : 'rejected' } : ad
      )
    );
    setExpandedId(null);
  };

  const renderAd = ({ item }: { item: typeof initialAds[0] }) => {
    if (item.status !== 'pending') return null;
    const expanded = expandedId === item.id;
    return (
      <Animated.View style={[styles.card, expanded && styles.cardExpanded]}>  
        <TouchableOpacity
          style={styles.cardHeader}
          onPress={() => setExpandedId(expanded ? null : item.id)}
          activeOpacity={0.8}
        >
          <View style={styles.iconCircle}>
            <Ionicons
              name={item.submittedBy === 'employee' ? 'person' : 'school'}
              size={24}
              color={item.submittedBy === 'employee' ? '#4F8EF7' : '#F7B32B'}
            />
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={styles.title}>{item.title}</ThemedText>
            <Text style={[styles.submittedBy, { color: submittedByColors[item.submittedBy as 'employee' | 'trainee'] }]}>Submitted by: {item.submittedBy}</Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color="#888"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
        {expanded && (
          <View style={styles.details}>
            <Image source={item.image} style={styles.adImage} resizeMode="cover" />
            <Text style={styles.description}>{item.description}</Text>
            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionBtn, styles.acceptBtn]}
                onPress={() => handleAction(item.id, 'accept')}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.actionText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, styles.rejectBtn]}
                onPress={() => handleAction(item.id, 'reject')}
              >
                <Ionicons name="close-circle" size={20} color="#fff" />
                <Text style={styles.actionText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </Animated.View>
    );
  };

  return (
    <ThemedView style={styles.container}>
              <AdminHeader
        title="Shop Management"
        showLogo={false}
        rightComponent={
          <Ionicons name="pricetags" size={24} color="#4F8EF7" />
        }
      />
      <Text style={styles.subHeader}>Review and manage new shop ads submitted by employees and trainees.</Text>
      <FlatList
        data={ads}
        renderItem={renderAd}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No pending ads to review.</Text>}
        contentContainerStyle={{ paddingTop: 12, paddingBottom: 32 }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F6F8FB',
  },

  subHeader: {
    fontSize: 15,
    color: '#4F8EF7',
    marginBottom: 18,
    marginLeft: 2,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    shadowColor: '#4F8EF7',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
    borderWidth: 1,
    borderColor: '#E3E8F0',
  },
  cardExpanded: {
    borderColor: '#4F8EF7',
    shadowOpacity: 0.16,
    elevation: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#E3E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#222',
  },
  submittedBy: {
    fontSize: 14,
    marginTop: 2,
    fontWeight: '500',
  },
  details: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E3E8F0',
    paddingTop: 14,
  },
  description: {
    fontSize: 16,
    marginBottom: 16,
    color: '#444',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 16,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 18,
    marginLeft: 8,
  },
  acceptBtn: {
    backgroundColor: '#4CAF50',
  },
  rejectBtn: {
    backgroundColor: '#F44336',
  },
  actionText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 15,
  },
  empty: {
    textAlign: 'center',
    color: '#888',
    marginTop: 40,
    fontSize: 16,
  },
  adImage: {
    width: '100%',
    height: 160,
    borderRadius: 12,
    marginBottom: 14,
    backgroundColor: '#E3E8F0',
  },
}); 