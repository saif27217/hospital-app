import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet } from 'react-native';
import { Text } from 'react-native';
import { View } from 'react-native';
import { ScrollView } from 'react-native';
import { Pressable } from 'react-native';
import { Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { topContacts, networkBadge, fmtDistance, Hospital } from '@/utils/hospital-search';

const HDFC = topContacts('hdfc', 6);
const CARE = topContacts('care', 6);

function contactCard(h: Hospital): readonly { label: string; value: string }[] {
  return [
    { label: 'Network', value: `${networkBadge(h)}${h.is_recommended ? ' \u{1F3C6}' : ''}` },
    { label: 'Area', value: h.area },
    { label: 'Specialty', value: h.specialty },
    { label: 'Rating', value: h.google_rating !== undefined && h.google_rating !== null
      ? `${h.google_rating} ★ (${h.num_reviews ?? '—'} reviews)` : '—' },
    { label: 'Distance', value: fmtDistance(h) },
    { label: 'Address', value: h.full_address || '—' },
    { label: 'Call', value: h.contact_number.length ? h.contact_number.join(' · ') : '—' },
  ];
}

function phoneDigits(h: Hospital): string | null {
  for (const c of h.contact_number ?? []) {
    const d = c.replace(/\D/g, '');
    if (d.length >= 7) return d;
  }
  return null;
}
function callHospital(h: Hospital) {
  const d = phoneDigits(h);
  if (d) Linking.openURL(`tel:${d}`);
}
function mapUrl(h: Hospital) {
  return `https://maps.google.com/?q=${encodeURIComponent(`${h.hospital_name}, ${h.area}, Hyderabad`)}`;
}
function openMap(h: Hospital) {
  Linking.openURL(mapUrl(h));
}

export default function ContactsScreen() {
  return (
    <LinearGradient style={styles.fill} colors={['#070D1A', '#10384C', '#070D1A']}>
      <SafeAreaView style={styles.container}>
        <Text style={styles.header}>{'\u{1F4CE} Top contacts per network'}</Text>
        <ScrollView style={styles.scroll}>
          <Text style={styles.section}>HDFC Ergo — best-scored</Text>
          {HDFC.map((h, i) => (
            <View key={`h-${i}`} style={styles.card}>
              <Text style={styles.cardName}>{h.hospital_name}</Text>
              {contactCard(h).map((row, j) => (
                <Text key={j} style={styles.line}>
                  <Text style={styles.label}>{row.label}: </Text>
                  <Text style={styles.value}>{row.value}</Text>
                </Text>
              ))}
              <View style={styles.actions}>
                {phoneDigits(h) ? (
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => callHospital(h)}
                    accessibilityLabel={`Call ${h.hospital_name}`}
                  >
                    <Text style={styles.actionText}>{'\u{1F4DE} Call'}</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => openMap(h)}
                  accessibilityLabel={`Open ${h.hospital_name} on Google Maps`}
                >
                  <Text style={styles.actionText}>{'\u{1F4CD} Directions'}</Text>
                </Pressable>
              </View>
            </View>
          ))}
          <Text style={styles.section}>Care Supreme — best-rated</Text>
          {CARE.map((h, i) => (
            <View key={`c-${i}`} style={styles.card}>
              <Text style={styles.cardName}>{h.hospital_name}</Text>
              {contactCard(h).map((row, j) => (
                <Text key={j} style={styles.line}>
                  <Text style={styles.label}>{row.label}: </Text>
                  <Text style={styles.value}>{row.value}</Text>
                </Text>
              ))}
              <View style={styles.actions}>
                {phoneDigits(h) ? (
                  <Pressable
                    style={styles.actionBtn}
                    onPress={() => callHospital(h)}
                    accessibilityLabel={`Call ${h.hospital_name}`}
                  >
                    <Text style={styles.actionText}>{'\u{1F4DE} Call'}</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  style={styles.actionBtn}
                  onPress={() => openMap(h)}
                  accessibilityLabel={`Open ${h.hospital_name} on Google Maps`}
                >
                  <Text style={styles.actionText}>{'\u{1F4CD} Directions'}</Text>
                </Pressable>
              </View>
            </View>
          ))}
        </ScrollView>
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Ranked by network score/rating · all numbers listed are in the source sheets
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
  section: { fontSize: 16, fontWeight: '700', color: '#67E8F9', marginBottom: 8 },
  scroll: { flex: 1, gap: 10 },
  card: {
    padding: 12,
    gap: 4,
    borderRadius: 14,
    marginBottom: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(139,92,246,0.45)',
    borderWidth: 1,
  },
  cardName: { fontSize: 16, fontWeight: '700', color: '#E8F4FF' },
  actions: { flexDirection: 'row', gap: 10, marginTop: 6 },
  actionBtn: {
    flex: 1,
    padding: 9,
    borderRadius: 12,
    backgroundColor: 'rgba(103,232,249,0.12)',
    borderColor: 'rgba(103,232,249,0.5)',
    borderWidth: 1,
    alignItems: 'center',
  },
  actionText: { fontSize: 13, fontWeight: '700', color: '#67E8F9' },
  line: { fontSize: 12, color: '#9FB8D4' },
  label: { fontSize: 11, fontWeight: '800', color: '#67E8F9' },
  value: { fontSize: 12, color: '#B9CFE8' },
  footer: { padding: 10, borderRadius: 12 },
  footerText: { fontSize: 12, color: '#5F7A92' },
});
