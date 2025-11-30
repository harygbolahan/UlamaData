import { useBanners } from '@/contexts/banner-context';
import { useTheme } from '@/contexts/theme-context';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  View
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BANNER_WIDTH = SCREEN_WIDTH * 0.90; // 85% of screen width
const BANNER_HEIGHT = 80;
const BANNER_SPACING = 28; // Space between banners
const AUTO_SCROLL_INTERVAL = 4000; // 4 seconds

export default function BannerCarousel() {
  const { banners, isLoading } = useBanners();
  const { colors } = useTheme();
  const scrollViewRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (banners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % banners.length;
        scrollViewRef.current?.scrollTo({
          x: nextIndex * (BANNER_WIDTH + BANNER_SPACING),
          animated: true,
        });
        return nextIndex;
      });
    }, AUTO_SCROLL_INTERVAL);

    return () => clearInterval(interval);
  }, [banners.length]);

  const handleScroll = (event) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / (BANNER_WIDTH + BANNER_SPACING));
    setCurrentIndex(index);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.card }]}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  }

  if (!banners || banners.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled={false}
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        snapToInterval={BANNER_WIDTH + BANNER_SPACING}
        snapToAlignment="start"
        contentContainerStyle={styles.scrollContent}
      >
        {banners.map((banner) => (
          <View key={banner.id} style={styles.bannerWrapper}>
            <Image
              source={{ uri: banner.imageUrl }}
              style={[styles.bannerImage, { backgroundColor: colors.card }]}
              resizeMode="cover"
            />
          </View>
        ))}
      </ScrollView>

      {banners.length > 1 && (
        <View style={styles.pagination}>
          {banners.map((_, index) => (
            <View
              key={index}
              style={[
                styles.paginationDot,
                {
                  backgroundColor:
                    index === currentIndex
                      ? colors.primary
                      : colors.isDark
                      ? '#444'
                      : '#D0D0D0',
                  width: index === currentIndex ? 20 : 6,
                },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingRight: 16 + (SCREEN_WIDTH - BANNER_WIDTH) / 2,
  },
  bannerWrapper: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    marginRight: BANNER_SPACING,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  loadingContainer: {
    width: BANNER_WIDTH,
    height: BANNER_HEIGHT,
    marginHorizontal: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },
});
