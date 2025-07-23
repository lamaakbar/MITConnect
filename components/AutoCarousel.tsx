import React, { useRef, useEffect, useState } from 'react';
import { View, FlatList, StyleSheet, Dimensions } from 'react-native';

interface AutoCarouselProps {
  data: any[];
  renderItem: ({ item, index }: { item: any; index: number }) => React.ReactElement;
  interval?: number; // ms
  cardWidth?: number; // px
}

const { width: screenWidth } = Dimensions.get('window');

export default function AutoCarousel({ data, renderItem, interval = 3000, cardWidth = 300 }: AutoCarouselProps) {
  const flatListRef = useRef<FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (data.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex(prev => {
        const next = (prev + 1) % data.length;
        flatListRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [data.length, interval]);

  // Center the card
  const sidePadding = (screenWidth - cardWidth) / 2;

  return (
    <FlatList
      ref={flatListRef}
      data={data}
      keyExtractor={(_, idx) => idx.toString()}
      renderItem={renderItem}
      horizontal
      showsHorizontalScrollIndicator={false}
      pagingEnabled={false}
      snapToAlignment="center"
      contentContainerStyle={{ paddingHorizontal: sidePadding }}
      getItemLayout={(_, index) => ({ length: cardWidth, offset: cardWidth * index, index })}
      style={styles.carousel}
      onMomentumScrollEnd={ev => {
        const idx = Math.round(ev.nativeEvent.contentOffset.x / cardWidth);
        setCurrentIndex(idx);
      }}
    />
  );
}

const styles = StyleSheet.create({
  carousel: {
    marginBottom: 18,
  },
}); 