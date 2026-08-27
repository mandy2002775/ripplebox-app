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
  // Falls back rather than crashing if the backend ever sends a status this
  // build doesn't know about yet (a real risk during active development,
  // where frontend and backend don't always deploy in lockstep) — this
  // renders inline inside a scrollable list, so one bad value shouldn't take
  // the whole screen down with it.
  const colors = COLORS[status] ?? { bg: Brand.lavender, text: Brand.text2 };
  const label = LABELS[status] ?? status;

  return (
    <View style={[styles.badge, { backgroundColor: colors.bg }]}>
      <Text style={[styles.text, { color: colors.text }]}>{label}</Text>
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
