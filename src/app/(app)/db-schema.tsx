import { Feather } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';

type Field = { name: string; type: string; kind?: 'pk' | 'fk' };

type Table = {
  name: string;
  note: string;
  fields: Field[];
  accent: string;
};

// Matches the actual migrations in ripplebox-api/database/migrations —
// this is documentation of the real schema, not the prototype's mockup.
const TABLES: Table[] = [
  {
    name: 'users',
    note: 'Primary entity',
    accent: Brand.accent,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'phone_number', type: 'VARCHAR unique' },
      { name: 'user_type', type: 'ENUM(client,salon,admin)' },
      { name: 'name', type: 'VARCHAR' },
      { name: 'deleted_at', type: 'soft delete' },
    ],
  },
  {
    name: 'otp_codes',
    note: 'Phone verification',
    accent: Brand.brand2,
    fields: [
      { name: 'id', type: 'BIGINT PK', kind: 'pk' },
      { name: 'phone_number', type: 'VARCHAR indexed' },
      { name: 'code', type: 'VARCHAR hashed' },
      { name: 'expires_at', type: 'TIMESTAMP' },
      { name: 'consumed_at', type: 'TIMESTAMP nullable' },
    ],
  },
  {
    name: 'salons',
    note: 'FK: users.id (nullable)',
    accent: Brand.brand2,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'user_id', type: 'FK → users, nullable', kind: 'fk' },
      { name: 'business_name', type: 'VARCHAR' },
      { name: 'category', type: 'ENUM nullable' },
      { name: 'location', type: 'VARCHAR' },
      { name: 'website', type: 'VARCHAR nullable' },
      { name: 'instagram_handle', type: 'VARCHAR nullable' },
      { name: 'google_place_id', type: 'VARCHAR nullable' },
      { name: 'external_ref', type: 'VARCHAR unique, nullable' },
      { name: 'source', type: "VARCHAR ('signup' or 'osm_import')" },
      { name: 'logo_url', type: 'VARCHAR nullable' },
      { name: 'subscription_status', type: 'ENUM' },
      { name: 'deleted_at', type: 'soft delete' },
    ],
  },
  {
    name: 'clients',
    note: 'FK: users.id',
    accent: Brand.brand2,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'user_id', type: 'FK → users', kind: 'fk' },
      { name: 'referral_code', type: 'VARCHAR unique' },
      { name: 'deleted_at', type: 'soft delete' },
    ],
  },
  {
    name: 'referrals',
    note: 'Core business table',
    accent: Brand.brand3,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'referrer_client_id', type: 'FK → clients', kind: 'fk' },
      { name: 'referred_client_id', type: 'FK → clients', kind: 'fk' },
      { name: 'salon_id', type: 'FK → salons', kind: 'fk' },
      { name: 'status', type: 'ENUM(pending,engaged,redeemed)' },
      { name: 'deleted_at', type: 'soft delete' },
    ],
  },
  {
    name: 'rewards',
    note: 'FK: salons.id',
    accent: Brand.brand3,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'salon_id', type: 'FK → salons', kind: 'fk' },
      { name: 'reward_type', type: 'ENUM' },
      { name: 'reward_value', type: 'DECIMAL(10,2)' },
      { name: 'recipient_type', type: 'ENUM(both,referrer,new_client)' },
      { name: 'expiry_date', type: 'DATE' },
      { name: 'is_active', type: 'BOOLEAN' },
      { name: 'deleted_at', type: 'soft delete' },
    ],
  },
  {
    name: 'redemptions',
    note: 'FK: referrals + rewards',
    accent: Brand.brand3,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'referral_id', type: 'FK → referrals', kind: 'fk' },
      { name: 'reward_id', type: 'FK → rewards', kind: 'fk' },
      { name: 'redeemed_at', type: 'TIMESTAMP nullable' },
      { name: 'deleted_at', type: 'soft delete' },
    ],
  },
  {
    name: 'subscriptions',
    note: 'No real billing yet',
    accent: Brand.brand3,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'salon_id', type: 'FK → salons', kind: 'fk' },
      { name: 'stripe_subscription_id', type: 'VARCHAR nullable' },
      { name: 'plan_type', type: 'ENUM(monthly,annual)' },
      { name: 'status', type: 'ENUM(trialing,active,overdue,cancelled)' },
      { name: 'current_period_end', type: 'TIMESTAMP nullable' },
      { name: 'deleted_at', type: 'soft delete' },
    ],
  },
  {
    name: 'notifications',
    note: 'FK: users.id',
    accent: Brand.brand3,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'user_id', type: 'FK → users', kind: 'fk' },
      { name: 'type', type: 'VARCHAR' },
      { name: 'payload', type: 'JSON' },
      { name: 'read_at', type: 'TIMESTAMP nullable' },
      { name: 'deleted_at', type: 'soft delete' },
    ],
  },
  {
    name: 'salon_leads',
    note: 'From marketing site',
    accent: Brand.brand2,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'business_name', type: 'VARCHAR' },
      { name: 'owner_name', type: 'VARCHAR nullable' },
      { name: 'phone_number', type: 'VARCHAR nullable' },
      { name: 'email', type: 'VARCHAR nullable' },
      { name: 'location', type: 'VARCHAR nullable' },
      { name: 'source', type: 'VARCHAR' },
    ],
  },
  {
    name: 'content_posts',
    note: 'FK: salons.id',
    accent: Brand.accent,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'salon_id', type: 'FK → salons', kind: 'fk' },
      { name: 'image_path', type: 'VARCHAR' },
      { name: 'image_mime', type: 'VARCHAR' },
      { name: 'caption', type: 'VARCHAR nullable' },
      { name: 'deleted_at', type: 'soft delete' },
    ],
  },
  {
    name: 'content_likes',
    note: 'FK: content_posts + clients',
    accent: Brand.accent,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'content_post_id', type: 'FK → content_posts', kind: 'fk' },
      { name: 'client_id', type: 'FK → clients', kind: 'fk' },
      { name: 'created_at', type: 'TIMESTAMP' },
    ],
  },
  {
    name: 'salon_favorites',
    note: 'FK: clients + salons',
    accent: Brand.accent,
    fields: [
      { name: 'id', type: 'UUID PK', kind: 'pk' },
      { name: 'client_id', type: 'FK → clients', kind: 'fk' },
      { name: 'salon_id', type: 'FK → salons', kind: 'fk' },
      { name: 'created_at', type: 'TIMESTAMP' },
    ],
  },
];

export default function DbSchemaScreen() {
  const router = useRouter();
  const { user } = useAuth();

  if (user && user.user_type !== 'admin') {
    return <Redirect href="/" />;
  }

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={18} color={Brand.brand} />
          </Pressable>
          <View>
            <Text style={styles.heading}>Database schema</Text>
            <Text style={styles.subheading}>SQLite (dev) / MySQL 8.0 (prod) · 13 tables</Text>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body}>
          <Text style={styles.intro}>
            Entity overview. Most tables use soft delete (deleted_at) — otp_codes, content_likes,
            and salon_favorites don't, since a "like" or "favorite" toggling back off should
            actually remove the row, not just hide it.
          </Text>

          {TABLES.map((table) => (
            <View key={table.name} style={styles.card}>
              <View style={[styles.cardHeader, { backgroundColor: table.accent }]}>
                <Text style={styles.cardHeaderName}>{table.name}</Text>
                <Text style={styles.cardHeaderNote}>{table.note}</Text>
              </View>
              <View style={styles.cardBody}>
                {table.fields.map((f) => (
                  <View key={f.name} style={styles.fieldRow}>
                    <Text
                      style={[
                        styles.fieldName,
                        f.kind === 'pk' && styles.fieldNamePk,
                        f.kind === 'fk' && styles.fieldNameFk,
                      ]}>
                      {f.name}
                    </Text>
                    <Text style={styles.fieldType}>{f.type}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.legend}>
            <Text style={styles.legendTitle}>Legend</Text>
            <Text style={styles.legendLine}>
              <Text style={styles.legendPk}>PK</Text> Primary key — unique row identifier
            </Text>
            <Text style={styles.legendLine}>
              <Text style={styles.legendFk}>FK</Text> Foreign key — links to another table
            </Text>
            <Text style={styles.legendLine}>
              <Text style={styles.legendMuted}>soft delete</Text> Record hidden, not deleted
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  safeArea: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadow.sm,
  },
  heading: { fontSize: 17, color: Brand.brand, fontFamily: Type.displayBold, letterSpacing: -0.2 },
  subheading: { fontSize: 11, color: Brand.text2, marginTop: 1, fontFamily: Type.body },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  intro: { fontSize: 11.5, color: Brand.text2, lineHeight: 17, marginBottom: 14, fontFamily: Type.body },
  card: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    overflow: 'hidden',
    marginBottom: 9,
    ...Shadow.sm,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 13,
    paddingVertical: 8,
  },
  cardHeaderName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#fff',
    fontFamily: 'monospace',
  },
  cardHeaderNote: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  cardBody: {
    padding: 12,
    gap: 5,
  },
  fieldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  fieldName: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: Brand.brand,
  },
  fieldNamePk: {
    color: Brand.amber,
  },
  fieldNameFk: {
    color: Brand.green,
  },
  fieldType: {
    fontSize: 11,
    color: Brand.text3,
  },
  legend: {
    backgroundColor: Brand.lavender,
    borderRadius: Radius.md,
    padding: 14,
    marginTop: 6,
    marginBottom: 20,
  },
  legendTitle: {
    fontSize: 11,
    color: Brand.brand3,
    marginBottom: 7,
    fontFamily: Type.bodySemiBold,
  },
  legendLine: {
    fontSize: 11,
    color: Brand.brand,
    marginBottom: 4,
    fontFamily: Type.body,
  },
  legendPk: {
    fontFamily: 'monospace',
    fontWeight: '500',
    color: Brand.amber,
  },
  legendFk: {
    fontFamily: 'monospace',
    fontWeight: '500',
    color: Brand.green,
  },
  legendMuted: {
    fontFamily: 'monospace',
    color: Brand.text3,
  },
});
