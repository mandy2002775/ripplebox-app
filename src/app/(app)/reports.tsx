import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth-context';
import { apiBlobRequest, apiRequest } from '@/lib/api';
import { saveBlob } from '@/lib/download';
import { ReportRange, ReportsSummary } from '@/lib/types';

const RANGES: { value: ReportRange; label: string }[] = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days' },
  { value: 'all', label: 'All time' },
];

export default function ReportsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [range, setRange] = useState<ReportRange>('7');
  const [report, setReport] = useState<ReportsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<'csv' | 'pdf' | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const load = useCallback(() => {
    setIsLoading(true);
    apiRequest<ReportsSummary>(`/admin/reports?range=${range}`, { token })
      .then(setReport)
      .finally(() => setIsLoading(false));
  }, [token, range]);

  useEffect(() => {
    load();
  }, [load]);

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
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backButtonText}>{'‹'}</Text>
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

        {isLoading || !report ? (
          <ActivityIndicator color={Brand.brand} style={{ marginTop: 20 }} />
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

            <Pressable
              disabled={isExporting !== null}
              onPress={() => handleExport('csv')}
              style={({ pressed }) => [styles.exportButton, pressed && styles.pressed]}>
              {isExporting === 'csv' ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.exportButtonText}>⬇ Export full report as CSV</Text>
              )}
            </Pressable>
            <Pressable
              disabled={isExporting !== null}
              onPress={() => handleExport('pdf')}
              style={({ pressed }) => [styles.exportButtonGhost, pressed && styles.pressed]}>
              {isExporting === 'pdf' ? (
                <ActivityIndicator color={Brand.brand} />
              ) : (
                <Text style={styles.exportButtonGhostText}>⬇ Export as PDF</Text>
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
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 12,
    marginBottom: 14,
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
  backButtonText: { fontSize: 18, color: Brand.brand, marginTop: -2 },
  heading: { fontSize: 16, fontWeight: '500', color: Brand.brand },
  subheading: { fontSize: 11, color: Brand.text2 },
  rangeRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  rangeChip: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    alignItems: 'center',
  },
  rangeChipActive: {
    backgroundColor: Brand.brand,
    borderColor: Brand.brand,
  },
  rangeText: { fontSize: 11, color: Brand.text2 },
  rangeTextActive: { color: '#fff', fontWeight: '500' },
  body: { paddingHorizontal: 20, paddingBottom: 40 },
  metricGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 14,
  },
  metric: {
    width: '47%',
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 13,
  },
  metricLabel: { fontSize: 10, color: Brand.text3, marginBottom: 4 },
  metricNumber: { fontSize: 22, fontWeight: '500', color: Brand.brand },
  metricNumberGreen: { fontSize: 22, fontWeight: '500', color: Brand.green },
  sectionLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Brand.text3,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginTop: 6,
    marginBottom: 8,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 14,
    marginBottom: 12,
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
  chartDay: { fontSize: 9, color: Brand.text3 },
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
  legendText: { fontSize: 10, color: Brand.text2 },
  emptyText: { fontSize: 12, color: Brand.text3, marginBottom: 10 },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#fff',
    borderWidth: 0.5,
    borderColor: Brand.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 7,
  },
  rankBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Brand.lavender,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankBadgeText: { fontSize: 11, fontWeight: '500', color: Brand.accent },
  topName: { flex: 1, fontSize: 12.5, fontWeight: '500', color: Brand.brand },
  topCount: { fontSize: 12.5, fontWeight: '500', color: Brand.brand },
  error: { fontSize: 12, color: Brand.red, marginBottom: 8 },
  exportButton: {
    backgroundColor: Brand.brand,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 6,
  },
  exportButtonText: { color: '#fff', fontSize: 13, fontWeight: '500' },
  exportButtonGhost: {
    borderWidth: 1.5,
    borderColor: Brand.brand,
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  exportButtonGhostText: { color: Brand.brand, fontSize: 13, fontWeight: '500' },
  pressed: { opacity: 0.85 },
});
