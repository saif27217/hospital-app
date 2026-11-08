import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { HOSPITALS, dualPairCount } from '@/utils/hospital-search';

export default function HomeScreen() {
  const total = HOSPITALS.length;
  const hdfc = HOSPITALS.filter((h) => h.insurance === 'HDFC Ergo').length;
  const care = total - hdfc;
  const areas = new Set(HOSPITALS.map((h) => h.area)).size;
  const specialties = new Set(HOSPITALS.map((h) => h.specialty)).size;
  const recommended = HOSPITALS.filter((h) => h.is_recommended).length;
  const withPhone = HOSPITALS.filter((h) => h.contact_number.length > 0).length;

  return (
    <LinearGradient style={styles.fill} colors={['#070D1A', '#10384C', '#070D1A']}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>
            {'\u{1F3B7} Hyderabad Hospitals'}
          </Text>
          <Text style={styles.subtitle}>
            {`${total} insured hospitals · HDFC Ergo + Care Supreme networks`}
          </Text>
        </View>

        <View style={styles.splitRow}>
          <View style={styles.statCard}>
            <Text style={styles.big}>{hdfc}</Text>
            <Text style={styles.label}>HDFC Ergo</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.big}>{care}</Text>
            <Text style={styles.label}>Care Supreme</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.big}>{areas}</Text>
            <Text style={styles.label}>areas covered</Text>
          </View>
        </View>

        <View style={styles.legend}>
          <Text style={styles.legendLine}>
            {`Search by hospital name, area or address · ${specialties} specialty tags on file`}
          </Text>
          <Text style={styles.legendLine}>
            {`★ = Google rating · ~km = HDFC bucketed distance (0.5/3/7/15 km), Care = measured km`}
          </Text>
          <Text style={styles.legendLine}>
            {`\u{1F3C6} = network-recommended (${recommended}) · ${withPhone} entries carry phone numbers`}
          </Text>
          <Text style={styles.legendLine}>
            {`\u2691 = insured under BOTH networks — ${dualPairCount()} hospital pairs mapped across HDFC Ergo \u2194 Care Supreme (tap one to see its counterpart); the Hospitals tab shows the full list`}
          </Text>
        </View>

        <View style={styles.hint}>
          <Text style={styles.hintText}>
            Hospitals tab: filter by network, sort by distance/rating/name · Contacts tab: top call-offices
          </Text>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#070D1A' },
  container: { flex: 1, padding: 20, gap: 14, backgroundColor: '#070D1A' },
  header: { gap: 6 },
  title: { fontSize: 28, fontWeight: '700', color: '#E8F4FF' },
  subtitle: { fontSize: 14, color: '#8FB8CC' },
  splitRow: { flexDirection: 'row', gap: 10 },
  statCard: {
    flex: 1,
    padding: 14,
    gap: 4,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderWidth: 1,
  },
  big: { fontSize: 30, fontWeight: '800', color: '#67E8F9' },
  label: { fontSize: 12, color: '#8FB8CC' },
  legend: { padding: 14, gap: 6, borderRadius: 16, backgroundColor: 'rgba(103,232,249,0.05)' },
  legendLine: { fontSize: 13, color: '#9FB8D4' },
  hint: { padding: 10, borderRadius: 12 },
  hintText: { fontSize: 12, color: '#5F7A92' },
});
