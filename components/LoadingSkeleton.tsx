import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: false,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: false,
        }),
      ])
    );
    animation.start();

    return () => animation.stop();
  }, [animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const EventCardSkeleton: React.FC = () => {
  return (
    <View style={styles.cardContainer}>
      <Skeleton width="100%" height={120} borderRadius={8} style={styles.imageSkeleton} />
      <View style={styles.contentContainer}>
        <Skeleton width="80%" height={20} style={styles.titleSkeleton} />
        <Skeleton width="60%" height={16} style={styles.subtitleSkeleton} />
        <Skeleton width="40%" height={16} style={styles.dateSkeleton} />
        <View style={styles.buttonContainer}>
          <Skeleton width={80} height={32} borderRadius={16} />
          <Skeleton width={32} height={32} borderRadius={16} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageSkeleton: {
    marginBottom: 12,
  },
  contentContainer: {
    gap: 8,
  },
  titleSkeleton: {
    marginBottom: 4,
  },
  subtitleSkeleton: {
    marginBottom: 4,
  },
  dateSkeleton: {
    marginBottom: 12,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
}); 