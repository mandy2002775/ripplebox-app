import { useRouter, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest } from '@/lib/api';
import {
  AppNotification,
  NotificationsResponse,
  ReferralRedeemedPayload,
  RewardEarnedPayload,
} from '@/lib/types';

function describe(notification: AppNotification): { title: string; subtitle: string } {
  if (notification.type === 'reward_earned') {
    const payload = notification.payload as RewardEarnedPayload;
    return {
      title: `You earned a reward at ${payload.salon_name}`,
      subtitle: payload.reward_description,
    };
  }

  const payload = notification.payload as ReferralRedeemedPayload;
  return {
    title: 'New referral redeemed',
    subtitle: `${payload.referrer_name} referred ${payload.referred_name}`,
  };
}

export default function NotificationsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<NotificationsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(() => {
    setIsLoading(true);
    return apiRequest<NotificationsResponse>('/notifications', { token })
      .then(setData)
      .finally(() => setIsLoading(false));
  }, [token]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  async function handleOpen(notification: AppNotification) {
    if (!notification.read_at) {
      await apiRequest(`/notifications/${notification.id}/read`, { method: 'PATCH', token });
      load();
    }
  }

  async function handleMarkAllRead() {
    await apiRequest('/notifications/read-all', { method: 'PATCH', token });
    load();
  }

  const hasUnread = !!data?.unread_count;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'‹'}</Text>
          </Pressable>
          <Text style={styles.heading}>Notifications</Text>
          {hasUnread && (
            <Pressable onPress={handleMarkAllRead} style={styles.markAllButton}>
              <Text style={styles.markAllButtonText}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {isLoading || !data ? (
          <ActivityIndicator color={Brand.brand} style={{ marginTop: 20 }} />
        ) : data.notifications.length === 0 ? (
          <Text style={styles.emptyText}>Nothing yet — you'll see referral and reward updates here.</Text>
        ) : (
          <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
            {data.notifications.map((notification) => {
              const { title, subtitle } = describe(notification);
              const isUnread = !notification.read_at;
              return (
                <Pressable
                  key={notification.id}
                  onPress={() => handleOpen(notification)}
                  style={[styles.row, isUnread && styles.rowUnread]}>
                  {isUnread && <View style={styles.dot} />}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{title}</Text>
                    <Text style={styles.rowSub}>{subtitle}</Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Brand.bg,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  backButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    fontSize: 18,
    color: Brand.brand,
    marginTop: -2,
  },
  heading: {
    flex: 1,
    fontSize: 21,
    fontWeight: '500',
    color: Brand.brand,
  },
  markAllButton: {
    backgroundColor: Brand.lavender,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  markAllButtonText: {
    fontSize: 11,
    fontWeight: '500',
    color: Brand.brand3,
  },
  emptyText: {
    fontSize: 13,
    color: Brand.text3,
    marginTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  rowUnread: {
    borderColor: Brand.accent,
    backgroundColor: Brand.lavender,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Brand.accent,
    marginTop: 5,
  },
  rowTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: Brand.brand,
  },
  rowSub: {
    fontSize: 11.5,
    color: Brand.text2,
    marginTop: 2,
  },
});
