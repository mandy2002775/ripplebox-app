import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RowButton } from '@/components/row-button';
import { ScreenHero } from '@/components/screen-hero';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiBlobRequest, apiRequest, ApiError } from '@/lib/api';
import { saveBlob } from '@/lib/download';
import { SALON_CATEGORIES } from '@/lib/salon-categories';
import { PlanType, Salon, SalonCategory, User } from '@/lib/types';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1609535904959-aaa9d01fb5a4?auto=format&fit=crop&w=1200&q=80';

const PLAN_LABELS: Record<PlanType, string> = {
  monthly: 'Monthly',
  annual: 'Annual',
};

export default function ProfileScreen() {
  const { user, token, signOut, refreshUser } = useAuth();

  if (!user) return null;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.content}>
          <ScreenHero image={HERO_IMAGE} height={110} style={styles.hero} />
          <Text style={styles.heading}>Profile</Text>

          {user.user_type === 'salon' && user.salon ? (
            <SalonProfile salon={user.salon} token={token} refreshUser={refreshUser} />
          ) : (
            <View style={styles.card}>
              <Text style={styles.fieldLabel}>Name</Text>
              <Text style={styles.readValue}>{user.name}</Text>
              <Text style={styles.fieldLabel}>Phone number</Text>
              <Text style={styles.readValue}>{user.phone_number}</Text>
              {user.client && (
                <>
                  <Text style={styles.fieldLabel}>Referral code</Text>
                  <Text style={styles.readValue}>{user.client.referral_code}</Text>
                </>
              )}
            </View>
          )}

          <EmailSection user={user} token={token} refreshUser={refreshUser} />

          <SupportSection userType={user.user_type} />

          <PrivacySection token={token} />

          <RowButton label="Sign out" variant="ghost" onPress={() => signOut()} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function EmailSection({
  user,
  token,
  refreshUser,
}: {
  user: User;
  token: string | null;
  refreshUser: () => Promise<void>;
}) {
  const [email, setEmail] = useState(user.email ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSave() {
    setError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      await apiRequest('/me', { method: 'PATCH', token, body: { email: email.trim() || null } });
      await refreshUser();
      setSaved(true);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save your email.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.fieldLabel}>
        Email <Text style={styles.optional}>(optional)</Text>
      </Text>
      <Text style={styles.emailHint}>
        Used only to send you reward and account emails — sign-in still works by phone.
      </Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        placeholderTextColor={Brand.text3}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      {error && <Text style={styles.error}>{error}</Text>}
      {saved && <Text style={styles.success}>Saved.</Text>}
      <Pressable disabled={isSaving} onPress={handleSave}>
        <LinearGradient
          colors={[Brand.roseVivid, Brand.accent]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, isSaving && styles.pressed]}>
          {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Save email</Text>}
        </LinearGradient>
      </Pressable>
    </View>
  );
}

const SUPPORT_EMAIL = 'hello@ripplebox.com.au';

function SupportSection({ userType }: { userType: User['user_type'] }) {
  function handleEmailSupport() {
    const subject = encodeURIComponent(
      userType === 'salon' ? 'Ripplebox business support' : 'Ripplebox support'
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`);
  }

  return (
    <View style={styles.card}>
      <Text style={styles.fieldLabel}>Help &amp; support</Text>
      <Pressable
        onPress={handleEmailSupport}
        style={({ pressed }) => [styles.privacyRow, pressed && styles.pressed]}>
        <Feather name="mail" size={14} color={Brand.brand} />
        <View style={{ flex: 1 }}>
          <Text style={styles.privacyRowText}>Email support</Text>
          <Text style={styles.supportHint}>Send us a detailed message — we'll get back to you</Text>
        </View>
        <Feather name="chevron-right" size={15} color={Brand.text3} />
      </Pressable>
    </View>
  );
}

function PrivacySection({ token }: { token: string | null }) {
  const { deleteAccount } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleExport() {
    setError(null);
    setIsExporting(true);
    try {
      const blob = await apiBlobRequest('/me/export', token);
      await saveBlob(blob, 'ripplebox-my-data.json', 'application/json');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not export your data.');
    } finally {
      setIsExporting(false);
    }
  }

  async function handleDelete() {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteAccount();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not delete your account.');
      setIsDeleting(false);
    }
  }

  return (
    <View style={styles.card}>
      <Text style={styles.fieldLabel}>Privacy</Text>

      <Pressable
        disabled={isExporting}
        onPress={handleExport}
        style={({ pressed }) => [styles.privacyRow, (pressed || isExporting) && styles.pressed]}>
        <Feather name="download" size={14} color={Brand.brand} />
        <Text style={styles.privacyRowText}>
          {isExporting ? 'Preparing your data…' : 'Download my data'}
        </Text>
      </Pressable>

      {!isConfirmingDelete ? (
        <Pressable onPress={() => setIsConfirmingDelete(true)} style={styles.privacyRow}>
          <Feather name="trash-2" size={14} color={Brand.red} />
          <Text style={[styles.privacyRowText, styles.dangerText]}>Delete my account</Text>
        </Pressable>
      ) : (
        <View style={styles.confirmBox}>
          <Text style={styles.confirmText}>
            This permanently deletes your account and all of your data. This can't be undone.
          </Text>
          <Pressable
            disabled={isDeleting}
            onPress={handleDelete}
            style={({ pressed }) => [
              styles.confirmButton,
              (pressed || isDeleting) && styles.pressed,
            ]}>
            <Text style={[styles.confirmButtonText, styles.dangerText]}>
              {isDeleting ? 'Deleting…' : 'Yes, delete my account'}
            </Text>
          </Pressable>
          <Pressable onPress={() => setIsConfirmingDelete(false)} style={styles.cancelLink}>
            <Text style={styles.cancelLinkText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

function SalonProfile({
  salon,
  token,
  refreshUser,
}: {
  salon: Salon;
  token: string | null;
  refreshUser: () => Promise<void>;
}) {
  const [businessName, setBusinessName] = useState(salon.business_name);
  const [category, setCategory] = useState<SalonCategory | null>(salon.category);
  const [location, setLocation] = useState(salon.location);
  const [website, setWebsite] = useState(salon.website ?? '');
  const [instagramHandle, setInstagramHandle] = useState(salon.instagram_handle ?? '');
  const [logoUrl, setLogoUrl] = useState(salon.logo_url ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  async function handleSave() {
    setSaveError(null);
    setSaved(false);
    setIsSaving(true);
    try {
      await apiRequest<Salon>('/salons', {
        method: 'PATCH',
        token,
        body: {
          business_name: businessName.trim(),
          category,
          location: location.trim(),
          website: website.trim() || null,
          instagram_handle: instagramHandle.trim() || null,
          logo_url: logoUrl.trim() || null,
        },
      });
      await refreshUser();
      setSaved(true);
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : 'Could not save your profile.');
    } finally {
      setIsSaving(false);
    }
  }

  async function handleCancelSubscription() {
    setCancelError(null);
    setIsCancelling(true);
    try {
      await apiRequest('/salons/subscription', { method: 'DELETE', token });
      setIsConfirmingCancel(false);
      await refreshUser();
    } catch (e) {
      setCancelError(e instanceof ApiError ? e.message : 'Could not cancel your subscription.');
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <>
      <View style={styles.card}>
        {logoUrl.trim() ? (
          <Image source={{ uri: logoUrl.trim() }} style={styles.logoPreview} />
        ) : (
          <View style={styles.logoPlaceholder}>
            <Feather name="scissors" size={18} color={Brand.accent} />
          </View>
        )}
        <Text style={styles.fieldLabel}>Business name</Text>
        <TextInput style={styles.input} value={businessName} onChangeText={setBusinessName} />
        <Text style={styles.fieldLabel}>
          Category <Text style={styles.optional}>(optional)</Text>
        </Text>
        <View style={styles.categoryGrid}>
          {SALON_CATEGORIES.map((c) => (
            <Pressable
              key={c.value}
              onPress={() => setCategory(category === c.value ? null : c.value)}
              style={[styles.categoryChip, category === c.value && styles.categoryChipActive]}>
              <Feather name={c.icon} size={12} color={category === c.value ? '#fff' : Brand.accent} />
              <Text
                style={[
                  styles.categoryChipText,
                  category === c.value && styles.categoryChipTextActive,
                ]}>
                {c.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <Text style={styles.fieldLabel}>Location</Text>
        <TextInput style={styles.input} value={location} onChangeText={setLocation} />
        <Text style={styles.fieldLabel}>
          Website <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={website}
          onChangeText={setWebsite}
          autoCapitalize="none"
        />
        <Text style={styles.fieldLabel}>
          Instagram <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={instagramHandle}
          onChangeText={setInstagramHandle}
          autoCapitalize="none"
        />
        <Text style={styles.fieldLabel}>
          Logo URL <Text style={styles.optional}>(optional)</Text>
        </Text>
        <TextInput
          style={styles.input}
          value={logoUrl}
          onChangeText={setLogoUrl}
          autoCapitalize="none"
        />

        {saveError && <Text style={styles.error}>{saveError}</Text>}
        {saved && <Text style={styles.success}>Saved.</Text>}

        <Pressable disabled={isSaving} onPress={handleSave}>
          <LinearGradient
            colors={[Brand.roseVivid, Brand.accent]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={[styles.button, isSaving && styles.pressed]}>
            {isSaving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Save changes</Text>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {salon.subscription && (
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Subscription</Text>
          <Text style={styles.rowTitle}>{PLAN_LABELS[salon.subscription.plan_type]} plan</Text>
          <Text style={styles.rowSub}>
            {salon.subscription.status === 'cancelled'
              ? 'Cancelled'
              : `Renews ${new Date(salon.subscription.current_period_end).toLocaleDateString()}`}
          </Text>

          {salon.subscription.status !== 'cancelled' && !isConfirmingCancel && (
            <Pressable onPress={() => setIsConfirmingCancel(true)} style={styles.cancelLink}>
              <Text style={styles.cancelLinkText}>Cancel subscription</Text>
            </Pressable>
          )}

          {isConfirmingCancel && (
            <View style={styles.confirmBox}>
              <Text style={styles.confirmText}>
                Cancel your subscription? You can still use the dashboard, but this ends billing
                renewal.
              </Text>
              <Pressable
                disabled={isCancelling}
                onPress={handleCancelSubscription}
                style={({ pressed }) => [
                  styles.confirmButton,
                  (pressed || isCancelling) && styles.pressed,
                ]}>
                <Text style={styles.confirmButtonText}>
                  {isCancelling ? 'Cancelling…' : 'Yes, cancel subscription'}
                </Text>
              </Pressable>
              {cancelError && <Text style={styles.error}>{cancelError}</Text>}
            </View>
          )}
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Brand.bg },
  safeArea: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 18, paddingBottom: 40 },
  hero: { marginHorizontal: -20, marginTop: -18, marginBottom: 14 },
  heading: { fontSize: 23, color: Brand.brand, marginBottom: 18, fontFamily: Type.displayBold, letterSpacing: -0.3 },
  card: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.lg,
    padding: 17,
    marginBottom: 14,
    ...Shadow.sm,
  },
  logoPreview: {
    width: 58,
    height: 58,
    borderRadius: Radius.md,
    backgroundColor: Brand.lavender,
    marginBottom: 14,
  },
  logoPlaceholder: {
    width: 58,
    height: 58,
    borderRadius: Radius.md,
    backgroundColor: Brand.lavender,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11,
    color: Brand.accent,
    marginBottom: 6,
    fontFamily: Type.bodySemiBold,
  },
  optional: {
    color: Brand.text3,
    fontFamily: Type.body,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 13,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Brand.bg,
    borderRadius: Radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  categoryChipActive: {
    backgroundColor: Brand.accent,
  },
  categoryChipText: {
    fontSize: 11,
    color: Brand.brand,
    fontFamily: Type.bodyMedium,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontFamily: Type.bodySemiBold,
  },
  emailHint: {
    fontSize: 11,
    color: Brand.text3,
    marginBottom: 11,
    fontFamily: Type.body,
  },
  readValue: {
    fontSize: 14.5,
    color: Brand.brand,
    marginBottom: 13,
    fontFamily: Type.bodyMedium,
  },
  input: {
    backgroundColor: Brand.lavender,
    borderRadius: Radius.sm,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Brand.brand,
    marginBottom: 12,
    fontFamily: Type.bodyMedium,
  },
  error: { fontSize: 12, color: Brand.red, marginBottom: 10, fontFamily: Type.body },
  success: { fontSize: 12, color: Brand.green, marginBottom: 10, fontFamily: Type.body },
  privacyRow: { flexDirection: 'row', alignItems: 'center', gap: 9, paddingVertical: 10 },
  privacyRowText: { fontSize: 13, color: Brand.brand, fontFamily: Type.bodyMedium },
  supportHint: { fontSize: 10.5, color: Brand.text2, marginTop: 1, fontFamily: Type.body },
  dangerText: { color: Brand.red },
  button: {
    borderRadius: Radius.pill,
    paddingVertical: 14,
    alignItems: 'center',
    ...Shadow.sm,
    shadowColor: Brand.accent,
  },
  buttonText: { color: '#fff', fontSize: 14, fontFamily: Type.bodySemiBold },
  pressed: { opacity: 0.8 },
  rowTitle: { fontSize: 13.5, color: Brand.brand, marginTop: 4, fontFamily: Type.bodySemiBold },
  rowSub: { fontSize: 11, color: Brand.text2, marginTop: 2, fontFamily: Type.body },
  cancelLink: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Brand.border,
    borderRadius: Radius.pill,
    paddingHorizontal: 11,
    paddingVertical: 5,
    marginTop: 10,
  },
  cancelLinkText: { fontSize: 11, color: Brand.text2, fontFamily: Type.bodyMedium },
  confirmBox: {
    backgroundColor: Brand.lavender,
    borderRadius: Radius.sm,
    padding: 13,
    marginTop: 10,
  },
  confirmText: { fontSize: 11, color: Brand.brand3, lineHeight: 16, marginBottom: 11, fontFamily: Type.body },
  confirmButton: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.sm,
    paddingVertical: 11,
    alignItems: 'center',
  },
  confirmButtonText: { fontSize: 12.5, color: Brand.brand, fontFamily: Type.bodySemiBold },
});
