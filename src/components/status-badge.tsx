import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';
import { ReferralStatus } from '@/lib/types';

const LABELS: Record<ReferralStatus, string> = {
  pending: 'Pending',
  engaged: 'Engaged',
  redeemed: 'Redeemed',
};

const COLORS: Record<ReferralStatus, { bg: string; text: string }> = {
  pending: { bg: Brand.amberBg, text: Brand.amber },
  engaged: { bg: Brand.lavender, text: Brand.brand3 },
  redeemed: { bg: Brand.greenBg, text: Brand.green },
};

export function StatusBadge({ status }: { status: ReferralStatus }) {
  const colors = COLORS[status];
  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{LABELS[status]}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderRadius: 20,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  text: {
    fontSize: 10,
    fontWeight: '500',
  },
});
