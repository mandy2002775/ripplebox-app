import { Pressable, StyleSheet, Text } from 'react-native';

import { Brand } from '@/constants/theme';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost';
  disabled?: boolean;
};

export function RowButton({ label, onPress, variant = 'primary', disabled }: Props) {
  const isGhost = variant === 'ghost';
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isGhost ? styles.ghost : styles.primary,
        (pressed || disabled) && styles.pressed,
      ]}>
      <Text style={[styles.text, isGhost ? styles.textGhost : styles.textPrimary]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center',
    marginTop: 8,
  },
  primary: {
    backgroundColor: Brand.brand,
  },
  ghost: {
    borderWidth: 1.5,
    borderColor: Brand.brand,
  },
  text: {
    fontSize: 14,
    fontWeight: '500',
  },
  textPrimary: {
    color: '#fff',
  },
  textGhost: {
    color: Brand.brand,
  },
  pressed: {
    opacity: 0.8,
  },
});
