import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenHero } from '@/components/screen-hero';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiBlobRequest, apiRequest } from '@/lib/api';
import { saveBlob } from '@/lib/download';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1557682268-e3955ed5d83f?auto=format&fit=crop&w=1200&q=80';
import { ReportRange, ReportsSummary } from '@/lib/types';

const RANGES: { value: ReportRange; label: string }[] = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'all', label: 'All time' },
];

export default function ReportsScreen() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [range, setRange] = useState<ReportRange>('7');
  const [report, setReport] = useState<ReportsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    setLoadError(false);
    apiRequest<ReportsSummary>(`/admin/reports?range=${range}`, { token })
      .then(setReport)
      .catch(() => setLoadError(true))
      .finally(() => setIsLoading(false));
  }, [token, range]);

  useEffect(() => {
    load();
  }, [load]);

  if (user && user.user_type !== 'admin') {
    return <Redirect href="/" />;
  }

  async function handleExport(format: 'csv' | 'pdf') {
    setExportError(null);
    setIsExporting(format);
    try {
      const blob = await apiBlobRequest(`/admin/reports/export.${format}?range=${range}`, token);
      await saveBlob(
        blob,
        `ripplebox-report.${format}`,
        format === 'csv' ? 'text/csv' : 'application/pdf'
      );
    } catch {
      setExportError('Could not export the report. Try again.');
    } finally {
      setIsExporting(null);
    }
  }

  const maxDaily = Math.max(1, ...(report?.daily.map((d) => Math.max(d.shared, d.converted)) ?? [1]));

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safeArea}>
        <ScreenHero image={HERO_IMAGE} height={100} />
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Feather name="chevron-left" size={18} color={Brand.brand} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={styles.heading}>Reports</Text>
            <Text style={styles.subheading}>Platform analytics and exports</Text>
          </View>
        </View>

        <View style={styles.rangeRow}>
          {RANGES.map((r) => (
            <Pressable
              key={r.value}
              onPress={() => setRange(r.value)}
              style={[styles.rangeChip, range === r.value && styles.rangeChipActive]}>
              <Text style={[styles.rangeText, range === r.value && styles.rangeTextActive]}>
                {r.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {loadError ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>Couldn't load reports.</Text>
            <Pressable onPress={load} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Try again</Text>
            </Pressable>
          </View>
        ) : isLoading || !report ? (
          <ActivityIndicator color={Brand.accent} style={{ marginTop: 20 }} />
        ) : (
          <ScrollView contentContainerStyle={styles.body}>
            <View style={styles.metricGrid}>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Total referrals</Text>
                <Text style={styles.metricNumber}>{report.referrals_count}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Conversions</Text>
                <Text style={styles.metricNumber}>{report.conversions_count}</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Avg cost/lead</Text>
                <Text style={styles.metricNumberGreen}>{report.cost_per_lead_pct}%</Text>
              </View>
              <View style={styles.metric}>
                <Text style={styles.metricLabel}>Revenue</Text>
                <Text style={styles.metricNumber}>${report.revenue.toFixed(0)}</Text>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Referral conversions — last 7 days</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartRow}>
                {report.daily.map((d) => (
                  <View key={d.date} style={styles.chartCol}>
                    <View
                      style={[
                        styles.chartBarShared,
                        { height: 6 + (d.shared / maxDaily) * 50 },
                      ]}
                    />
                    <View
                      style={[
                        styles.chartBarConverted,
                        { height: 4 + (d.converted / maxDaily) * 24 },
                      ]}
                    />
                    <Text style={styles.chartDay}>
                      {new Date(d.date).toLocaleDateString(undefined, { weekday: 'short' })}
                    </Text>
                  </View>
                ))}
              </View>
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: Brand.lavender }]} />
                  <Text style={styles.legendText}>Referrals shared</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendSwatch, { backgroundColor: Brand.accent }]} />
                  <Text style={styles.legendText}>Converted</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionLabel}>Top salons by referrals</Text>
            {report.top_salons.length === 0 ? (
              <Text style={styles.emptyText}>No referrals in this range.</Text>
            ) : (
              report.top_salons.map((s, i) => (
                <View key={s.salon_name} style={styles.topRow}>
                  <View style={styles.rankBadge}>
                    <Text style={styles.rankBadgeText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.topName}>{s.salon_name}</Text>
                  <Text style={styles.topCount}>{s.referrals_count}</Text>
                </View>
              ))
            )}

            {exportError && <Text style={styles.error}>{exportError}</Text>}

            <Pressable disabled={isExporting !== null} onPress={() => handleExport('csv')}>
              <LinearGradient
                colors={[Brand.roseVivid, Brand.accent]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.exportButton, isExporting === 'csv' && styles.pressed]}>
                {isExporting === 'csv' ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="download" size={13} color="#fff" />
                    <Text style={styles.exportButtonText}>Export full report as CSV</Text>
                  </>
                )}
              </LinearGradient>
            </Pressable>
            <Pressable
              disabled={isExporting !== null}
              onPress={() => handleExport('pdf')}
              style={({ pressed }) => [styles.exportButtonGhost, pressed && styles.pressed]}>
              {isExporting === 'pdf' ? (
                <ActivityIndicator color={Brand.brand} />
              ) : (
                <>
                  <Feather name="download" size={13} color={Brand.brand} />
                  <Text style={styles.exportButtonGhostText}>Export as PDF</Text>
                </>
              )}
            </Pressable>
          </ScrollView>
        )}
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
    gap: 11,
    paddingHorizontal: 20,
    paddingTop: 14,
    marginBottom: 14,
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
  heading: { fontSize: 18, color: Brand.brand, fontFamily: Type.displayBold, letterSpacing: -0.2 },
  subheading: { fontSize: 11, color: Brand.text2, marginTop: 1, fontFamily: Type.body },
  rangeRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  rangeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: Radius.sm,
    backgroundColor: Brand.surface,
    alignItems: 'center',
    ...Shadow.sm,
  },
  rangeChipActive: {
    backgroundColor: Brand.brand,
    shadowOpacity: 0,
    elevation: 0,
  },
  rangeText: { fontSize: 11, color: Brand.text2, fontFamily: Type.bodyMedium },
  rangeTextActive: { color: '#fff', fontFamily: Type.bodySemiBold },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 9,
    marginBottom: 16,
  },
  metric: {
    width: '47%',
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 14,
    ...Shadow.sm,
  },
  metricLabel: { fontSize: 10, color: Brand.text3, marginBottom: 5, fontFamily: Type.bodyMedium },
  metricNumber: { fontSize: 22, color: Brand.brand, fontFamily: Type.displayBold },
  metricNumberGreen: { fontSize: 22, color: Brand.green, fontFamily: Type.displayBold },
  sectionLabel: {
    fontSize: 10.5,
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 8,
    fontFamily: Type.bodySemiBold,
  },
  chartCard: {
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 15,
    marginBottom: 14,
    ...Shadow.sm,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 5,
    height: 80,
    marginBottom: 8,
  },
  chartCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  chartBarShared: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: Brand.lavender,
  },
  chartBarConverted: {
    width: '100%',
    borderRadius: 4,
    backgroundColor: Brand.accent,
  },
  chartDay: { fontSize: 9, color: Brand.text3, fontFamily: Type.bodyMedium },
  chartLegend: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendSwatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  legendText: { fontSize: 10, color: Brand.text2, fontFamily: Type.bodyMedium },
  emptyText: { fontSize: 12, color: Brand.text3, marginBottom: 10, fontFamily: Type.body },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 13,
    marginBottom: 8,
    ...Shadow.sm,
  },
  rankBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Brand.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: { fontSize: 11, color: Brand.accent, fontFamily: Type.bodyBold },
  topName: { flex: 1, fontSize: 13, color: Brand.brand, fontFamily: Type.bodySemiBold },
  topCount: { fontSize: 13, color: Brand.brand, fontFamily: Type.bodySemiBold },
  error: { fontSize: 12, color: Brand.red, marginBottom: 8, fontFamily: Type.body },
  exportButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderRadius: Radius.pill,
    paddingVertical: 15,
    marginTop: 8,
    ...Shadow.md,
    shadowColor: Brand.accent,
  },
  exportButtonText: { color: '#fff', fontSize: 13, fontFamily: Type.bodySemiBold },
  exportButtonGhost: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1.5,
    borderColor: Brand.brand,
    borderRadius: Radius.pill,
    paddingVertical: 13,
    marginTop: 9,
  },
  exportButtonGhostText: { color: Brand.brand, fontSize: 13, fontFamily: Type.bodySemiBold },
  pressed: { opacity: 0.85 },
  errorBox: {
    marginHorizontal: 20,
    backgroundColor: Brand.surface,
    borderRadius: Radius.md,
    padding: 22,
    alignItems: 'center',
    marginTop: 20,
    ...Shadow.sm,
  },
  errorBoxText: { fontSize: 12.5, color: Brand.text2, marginBottom: 12, fontFamily: Type.body },
  retryButton: {
    backgroundColor: Brand.brand,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  retryButtonText: { fontSize: 12.5, color: '#fff', fontFamily: Type.bodySemiBold },
});
