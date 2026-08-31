import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Brand, Radius, Shadow, Type } from '@/constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
};

export function RowButton({ label, onPress, variant = 'primary', disabled }: Props) {
  const isGhost = variant === 'ghost';

  if (isGhost) {
    return (
      <Pressable
        disabled={disabled}
        onPress={onPress}
        style={({ pressed }) => [
          styles.base,
          styles.ghost,
          (pressed || disabled) && styles.pressed,
        ]}>
        <Text style={[styles.text, styles.textGhost]}>{label}</Text>
      </Pressable>
    );
  }

  return (
    <Pressable disabled={disabled} onPress={onPress}>
      {({ pressed }) => (
        <LinearGradient
          colors={disabled ? [Brand.border, Brand.border] : [Brand.roseVivid, Brand.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.base, styles.primary, pressed && styles.pressed]}>
          <Text style={[styles.text, disabled ? styles.textDisabled : styles.textPrimary]}>
            {label}
          </Text>
        </LinearGradient>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  primary: {
    ...Shadow.md,
    shadowColor: Brand.accent,
  },
  ghost: {
    borderWidth: 1.5,
    borderColor: Brand.brand,
  },
  text: {
    fontSize: 14,
    fontFamily: Type.bodySemiBold,
  },
  textPrimary: {
    color: '#fff',
  },
  textDisabled: {
    color: Brand.text3,
  },
  textGhost: {
    color: Brand.brand,
  },
  pressed: {
    opacity: 0.85,
  },
});
