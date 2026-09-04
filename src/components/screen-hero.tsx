import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleProp, StyleSheet, View, ViewStyle } from 'react-native';

import { Brand } from '@/constants/theme';

/**
 * A photo band that fades into the screen's own background before any real
 * content renders — every screen gets a real image, but nothing sits on top
 * of it that needs its own contrast handling. `style` lets a screen pull it
 * out of a scroll container's own padding so it still bleeds edge-to-edge.
 */
export function ScreenHero({
  image,
  height = 130,
  style,
  fadeTo = Brand.bg,
}: {
  image: string;
  height?: number;
  style?: StyleProp<ViewStyle>;
  fadeTo?: string;
}) {
  return (
    <View style={[styles.wrap, { height }, style]}>
      <Image source={{ uri: image }} style={styles.image} />
      <LinearGradient
        colors={['transparent', 'rgba(28,10,58,0.35)', fadeTo]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: '100%' },
  image: { width: '100%', height: '100%' },
});
