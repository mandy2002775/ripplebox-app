import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiRequest, ApiError } from '@/lib/api';
import { SALON_CATEGORIES } from '@/lib/salon-categories';
import { Salon, SalonCategory } from '@/lib/types';

export default function SalonProfileSetupScreen() {
  const { token, refreshUser } = useAuth();
  const router = useRouter();

  const [businessName, setBusinessName] = useState('');
  const [category, setCategory] = useState<SalonCategory | null>(null);
  const [location, setLocation] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [website, setWebsite] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    setIsSubmitting(true);
    try {
      await apiRequest<Salon>('/salons', {
        method: 'POST',
        token,
        body: {
          business_name: businessName.trim(),
          location: location.trim(),
          ...(category ? { category } : {}),
          ...(instagramHandle.trim() ? { instagram_handle: instagramHandle.trim() } : {}),
          ...(website.trim() ? { website: website.trim() } : {}),
          ...(logoUrl.trim() ? { logo_url: logoUrl.trim() } : {}),
        },
      });
      // Pulls the freshly created salon back into context, then returns to
      // the home route — it decides what to render based on user.salon now
      // being present, instead of redirecting back here.
      await refreshUser();
      router.replace('/');
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Could not save your profile. Try again.');
    } finally {
      setIsSubmitting(false);
    }
  }

  const canSave = businessName.trim().length > 0 && location.trim().length > 0 && !isSubmitting;

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.heading}>Business profile</Text>
          <Text style={styles.subheading}>Step 1 of 2 — Your details</Text>

          <View style={styles.logoRow}>
            <View style={styles.logoPreview}>
              {logoUrl.trim() ? (
                <Image source={{ uri: logoUrl.trim() }} style={styles.logoImage} />
              ) : (
                <>
                  <Feather name="camera" size={17} color={Brand.accent} />
                  <Text style={styles.logoPlaceholderText}>Add logo</Text>
                </>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.logoTitle}>Business logo</Text>
              <Text style={styles.logoHint}>Paste a logo URL below — PNG or JPG</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Business name</Text>
          <TextInput
            style={styles.input}
            value={businessName}
            onChangeText={setBusinessName}
            placeholder="Gloss Hair Studio"
            placeholderTextColor={Brand.text3}
          />

          <Text style={styles.fieldLabel}>
            Category <Text style={styles.optional}>(optional)</Text>
          </Text>
          <View style={styles.categoryGrid}>
            {SALON_CATEGORIES.map((c) => (
              <Pressable
                key={c.value}
                onPress={() => setCategory(category === c.value ? null : c.value)}
                style={[styles.categoryChip, category === c.value && styles.categoryChipActive]}>
                <Feather
                  name={c.icon}
                  size={13}
                  color={category === c.value ? '#fff' : Brand.accent}
                />
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
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="42 King St, Perth WA 6000"
            placeholderTextColor={Brand.text3}
          />

          <Text style={styles.fieldLabel}>
            Website <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={website}
            onChangeText={setWebsite}
            placeholder="www.yoursalon.com.au"
            placeholderTextColor={Brand.text3}
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>
            Instagram <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={instagramHandle}
            onChangeText={setInstagramHandle}
            placeholder="@yoursalon"
            placeholderTextColor={Brand.text3}
            autoCapitalize="none"
          />

          <Text style={styles.fieldLabel}>
            Logo URL <Text style={styles.optional}>(optional)</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={logoUrl}
            onChangeText={setLogoUrl}
            placeholder="https://yoursalon.com.au/logo.png"
            placeholderTextColor={Brand.text3}
            autoCapitalize="none"
          />

          <View style={styles.infoBox}>
            <Feather name="info" size={13} color={Brand.brand3} />
            <Text style={styles.infoText}>
              No website? No problem — home-based salons can use Instagram or Facebook instead.
              Website is optional.
            </Text>
          </View>

          {error && <Text style={styles.error}>{error}</Text>}

          <Pressable disabled={!canSave} onPress={handleSave}>
            {canSave ? (
              <LinearGradient
                colors={[Brand.roseVivid, Brand.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.button}>
                {isSubmitting ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Continue to payment</Text>
                )}
              </LinearGradient>
            ) : (
              <View style={[styles.button, styles.buttonDisabled]}>
                <Text style={styles.buttonTextDisabled}>Continue to payment</Text>
              </View>
            )}
          </Pressable>
        </ScrollView>
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
  },
  scroll: {
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 40,
  },
  heading: {
    fontSize: 23,
    color: Brand.brand,
    marginBottom: 3,
    fontFamily: Type.displayBold,
    letterSpacing: -0.2,
  },
  subheading: {
    fontSize: 12,
    color: Brand.text2,
    marginBottom: 22,
    fontFamily: Type.body,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    marginBottom: 18,
  },
  logoPreview: {
    width: 64,
    height: 64,
    borderRadius: Radius.md,
    backgroundColor: Brand.lavender,
    borderWidth: 1.5,
    borderColor: Brand.accent,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  logoImage: {
    width: 64,
    height: 64,
  },
  logoPlaceholderText: {
    fontSize: 8.5,
    color: Brand.text3,
    marginTop: 3,
    fontFamily: Type.bodyMedium,
  },
  logoTitle: {
    fontSize: 13.5,
    color: Brand.brand,
    fontFamily: Type.bodySemiBold,
  },
  logoHint: {
    fontSize: 11,
    color: Brand.text2,
    marginTop: 2,
    fontFamily: Type.body,
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
    backgroundColor: Brand.surface,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 8,
    ...Shadow.sm,
  },
  categoryChipActive: {
    backgroundColor: Brand.accent,
    shadowOpacity: 0,
    elevation: 0,
  },
  categoryChipText: {
    fontSize: 11.5,
    color: Brand.brand,
    fontFamily: Type.bodyMedium,
  },
  categoryChipTextActive: {
    color: '#fff',
    fontFamily: Type.bodySemiBold,
  },
  input: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.sm,
    paddingHorizontal: 15,
    paddingVertical: 13,
    fontSize: 15,
    color: Brand.brand,
    marginBottom: 13,
    fontFamily: Type.bodyMedium,
    ...Shadow.sm,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: Brand.lavender,
    borderRadius: Radius.sm,
    padding: 12,
    marginBottom: 15,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: Brand.brand3,
    lineHeight: 16,
    fontFamily: Type.body,
  },
  error: {
    fontSize: 12,
    color: Brand.red,
    marginBottom: 10,
    fontFamily: Type.body,
  },
  button: {
    borderRadius: Radius.pill,
    paddingVertical: 15.5,
    alignItems: 'center',
    ...Shadow.md,
    shadowColor: Brand.accent,
  },
  buttonDisabled: {
    backgroundColor: Brand.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14.5,
    fontFamily: Type.bodySemiBold,
  },
  buttonTextDisabled: {
    color: Brand.text3,
    fontSize: 14.5,
    fontFamily: Type.bodySemiBold,
  },
});
