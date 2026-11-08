import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { ScrollView } from 'react-native';
import { Text } from 'react-native';
import { TextInput } from 'react-native';
import { View } from 'react-native';
import { Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';

import { searchHospitals, browseHospitals, highlightSegments, fmtDistance, networkBadge, dualNetworks, dualNameCount, isHdfc, Hospital } from '@/utils/hospital-search';
import { HOSPITALS } from '@/utils/hospital-search';

function rowSegments(h: Hospital, q: string) {
  const prefix = dualNetworks(h) ? '\u2691 ' : '';
  return [
    { part: prefix, hit: true },
    ...highlightSegments(h.hospital_name, q),
  ].map((seg, i) => (
    <Text key={i} style={seg.hit ? styles.hit : styles.dim}>
      {seg.part}
    </Text>
  ));
}

function badgeLine(h: Hospital): string {
  const parts = [
    networkBadge(h),
    h.specialty,
    h.google_rating !== undefined && h.google_rating !== null ? `★${h.google_rating}` : null,
    fmtDistance(h) !== '—' ? fmtDistance(h) : null,
    h.num_reviews ? `${h.num_reviews} reviews` : null,
    h.is_recommended ? '\u{1F3C6}' : null,
  ];
  return '  ' + parts.filter((p) => p).join(' · ');
}

function detailLines(h: Hospital) {
  const rows: { label: string; value: string }[] = [
    { label: 'Network', value: dualNetworks(h) ? 'HDFC Ergo + Care Supreme (both)' : h.insurance },
    { label: 'Area', value: h.area },
    { label: 'Specialty', value: h.specialty },
    { label: 'Rating', value: h.google_rating !== undefined && h.google_rating !== null
      ? `${h.google_rating} ★ (${h.num_reviews ?? '—'} reviews)` : '—' },
    { label: 'Distance', value: fmtDistance(h) },
    { label: 'Proximity', value: h.proximity_category || '—' },
    { label: 'Address', value: h.full_address || '—' },
    { label: 'Phone', value: h.contact_number.length ? h.contact_number.join(' · ') : '—' },
  ];
  return rows;
}

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('');
  const [openName, setOpenName] = useState('');
  const [network, setNetwork] = useState<'all' | 'hdfc' | 'care' | 'both'>('all');
  const [sortKey, setSortKey] = useState<'distance' | 'rating' | 'name' | 'score'>('distance');
  const [ratedOnly, setRatedOnly] = useState(false);
  const [recOnly, setRecOnly] = useState(false);

  const filters = {
    insurance: network,
    specialty: '',
    area,
    phoneOnly: false,
    ratedOnly,
    recommendedOnly: recOnly,
    sort: sortKey as 'distance' | 'rating' | 'name' | 'score',
  };

  const matches = query
    ? searchHospitals(query, filters)
    : browseHospitals(filters);
  const dualShown = matches.filter(dualNetworks).length;

  return (
    <LinearGradient style={styles.fill} colors={['#070D1A', '#10384C', '#070D1A']}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>
          {'\u{1F507} Hospitals — '}{HOSPITALS.length} on file
        </Text>

        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setNetwork(network === 'all' ? 'hdfc' : network === 'hdfc' ? 'care' : network === 'care' ? 'both' : 'all')}
            style={styles.chip}
            accessibilityLabel={`Network filter: ${network}. Tap to cycle hdfc, care, both`}
          >
            <Text style={styles.chipLabel}>{`Network: ${network}`}</Text>
          </Pressable>
          <Pressable
            onPress={() => setSortKey(sortKey === 'distance' ? 'rating' : sortKey === 'rating' ? 'name' : sortKey === 'name' ? 'score' : 'distance')}
            style={styles.chip}
            accessibilityLabel={`Sort: ${sortKey}. Tap to cycle rating, name, score`}
          >
            <Text style={styles.chipLabel}>{`Sort: ${sortKey}`}</Text>
          </Pressable>
        </View>
        <View style={styles.filterRow}>
          <Pressable
            onPress={() => setRatedOnly((v) => !v)}
            style={styles.chip}
            accessibilityLabel="Toggle: only Google-rated hospitals"
          >
            <Text style={styles.chipLabel}>{`Rated: ${ratedOnly ? 'on' : 'off'} · tap`}</Text>
          </Pressable>
          <Pressable
            onPress={() => setRecOnly((v) => !v)}
            style={styles.chip}
            accessibilityLabel="Toggle: only network-recommended hospitals"
          >
            <Text style={styles.chipLabel}>{`★ pick: ${recOnly ? 'on' : 'off'} · tap`}</Text>
          </Pressable>
        </View>

        <View style={styles.searchBox}>
          <TextInput
            style={styles.input}
            multiline={false}
            autoCorrect={false}
            onChangeText={setQuery}
            accessibilityLabel="Search hospitals by name, area, specialty or address"
          />
          <TextInput
            style={styles.input}
            multiline={false}
            autoCorrect={false}
            onChangeText={setArea}
            accessibilityLabel="Filter by area, e.g. Gachibowli"
          />
        </View>

        <Text style={styles.matchLine}>
          {query || area ? (
            `${matches.length} match${matches.length === 1 ? '' : 'es'}${dualShown ? ` · ⚑ ${dualShown} on both networks` : ''} · scroll for more`
          ) : (
            `Full list · ${matches.length} hospitals · ${dualNameCount()} appear under both networks (⚑)`
          )}
        </Text>

        <ScrollView style={styles.resultsScroll}>
          {matches.map((h, i) => (
            <View key={i} style={styles.rowWrap}>
              <Pressable
                accessibilityLabel={`${h.hospital_name}, ${networkBadge(h)}. Open details`}
                accessibilityHint="Shows address and phone numbers"
                onPress={() => setOpenName(openName === h.hospital_name ? '' : h.hospital_name)}
                style={styles.pressRow}
              >
                <Text style={styles.row}>
                  {rowSegments(h, query)}
                  <Text style={styles.badge}>
                    {badgeLine(h)}
                  </Text>
                </Text>
              </Pressable>
              {openName === h.hospital_name ? (
                <View style={styles.detailCard}>
                  {detailLines(h).map((row, j) => (
                    <Text key={j} style={styles.detailLine}>
                      <Text style={styles.detailLabel}>{row.label}: </Text>
                      <Text style={styles.detailValue}>{row.value}</Text>
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          ))}
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            ⚑ HDFC+CARE = hospital insured under both networks · HDFC distances are bucketed (~km) · score sort only meaningful for HDFC
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#070D1A' },
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: '#070D1A' },
  header: { fontSize: 20, fontWeight: '700', color: '#E8F4FF' },
  filterRow: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    padding: 10,
    borderRadius: 14,
    backgroundColor: 'rgba(139,92,246,0.12)',
    borderColor: 'rgba(139,92,246,0.45)',
    borderWidth: 1,
  },
  chipLabel: { fontSize: 12, color: '#C9B8FF' },
  searchBox: {
    padding: 14,
    gap: 8,
    borderRadius: 18,
    backgroundColor: 'rgba(103,232,249,0.07)',
    borderColor: 'rgba(103,232,249,0.55)',
    borderWidth: 1,
  },
  input: { fontSize: 18, color: '#E8F4FF', padding: 4 },
  matchLine: { fontSize: 15, color: '#67E8F9' },
  hint: { fontSize: 14, color: '#5F7A92' },
  resultsScroll: { flex: 1, gap: 8 },
  rowWrap: { gap: 6, marginBottom: 10 },
  pressRow: { padding: 8, borderRadius: 10 },
  row: { fontSize: 15, color: '#B9CFE8' },
  badge: { fontSize: 11, fontWeight: '700', color: '#8B5CF6' },
  hit: { fontWeight: '800', color: '#67E8F9' },
  dim: { color: '#B9CFE8' },
  detailCard: {
    padding: 12,
    gap: 4,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(139,92,246,0.45)',
    borderWidth: 1,
  },
  detailLine: { fontSize: 12, color: '#9FB8D4' },
  detailLabel: { fontSize: 11, fontWeight: '800', color: '#67E8F9' },
  detailValue: { fontSize: 12, color: '#B9CFE8' },
  footer: { padding: 10, borderRadius: 12 },
  footerText: { fontSize: 12, color: '#5F7A92' },
});
