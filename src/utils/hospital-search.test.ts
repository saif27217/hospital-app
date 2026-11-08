import test from 'node:test';
import assert from 'node:assert';
import { searchHospitals, browseHospitals, sortResults, topContacts, fmtDistance, networkBadge, dualNetworks, dualNameCount, isHdfc, HOSPITALS } from './hospital-search.ts';

test.describe('hospital-search');

test('finds hospitals in Mehdipatnam', () => {
  const r = searchHospitals('Mehdipatnam');
  assert.ok(r.length > 5);
});

test('empty query returns nothing', () => {
  assert.deepEqual(searchHospitals('   '), []);
});

test('insurance filter hdfc excludes Care Supreme', () => {
  const r = searchHospitals('hospital', { insurance: 'hdfc' });
  assert.ok(r.length > 5);
  assert.ok(r.every((h) => h.insurance === 'HDFC Ergo'));
});

test('insurance filter care excludes HDFC', () => {
  const r = searchHospitals('eye', { insurance: 'care' });
  assert.ok(r.length > 0);
  assert.ok(r.every((h) => h.insurance === 'Care Supreme'));
});

test('name prefix outranks substring', () => {
  const r = searchHospitals('aravind');
  assert.ok(r[0].hospital_name.toLowerCase().startsWith('aravind'));
});

test('area match works when name does not contain query', () => {
  const r = searchHospitals('Gachibowli');
  assert.ok(r.length >= 2);
  assert.ok(r.some((h) => !h.hospital_name.toLowerCase().includes('gachibowli') && h.area.toLowerCase().includes('gachibowli')));
});

test('specialty filter narrows results', () => {
  const all = searchHospitals('hospital', { specialty: 'eye' });
  assert.ok(all.length > 0);
  assert.ok(all.every((h) => h.specialty.toLowerCase().includes('eye')));
});

test('limit is respected', () => {
  const r = searchHospitals('hospital', { limit: 10 });
  assert.equal(r.length, 10);
});

test('default limit is 100 (raised cap)', () => {
  const r = searchHospitals('hospital');
  assert.equal(r.length, 100);
});

test('rating sort puts rated first', () => {
  const r = sortResults(searchHospitals('general', { limit: 50 }), 'rating');
  assert.ok(r[0].google_rating !== undefined && r[0].google_rating !== null);
  assert.ok((r[r.length - 1].google_rating ?? -1) <= (r[0].google_rating ?? -1));
});

test('distance sort nulls last', () => {
  const r = sortResults(searchHospitals('hospital', { limit: 30 }), 'distance');
  const firstNull = r.findIndex((h) => h.distance_km === undefined || h.distance_km === null);
  if (firstNull >= 0) assert.ok(r.slice(firstNull).every((h) => h.distance_km === undefined || h.distance_km === null));
});

test('score sort puts unscored entries last', () => {
  const r = sortResults(searchHospitals('hospital', { limit: 30 }), 'score');
  const scored = r.filter((h) => h.final_score !== undefined && h.final_score !== null);
  const unscored = r.filter((h) => h.final_score === undefined || h.final_score === null);
  const lastScored = r.lastIndexOf(scored[scored.length - 1]);
  assert.ok(scored.every((h) => r.indexOf(h) < r.indexOf(unscored[0]) || unscored.length === 0), 'unscored entries must sort after scored ones');
  for (let i = 1; i < scored.length; i++) assert.ok(scored[i].final_score! <= scored[i - 1].final_score!);
});

test('topContacts hdfc has phone numbers', () => {
  const r = topContacts('hdfc');
  assert.equal(r.length, 5);
  assert.ok(r.every((h) => h.contact_number.length >= 1));
});

test('topContacts care sorted by rating', () => {
  const r = topContacts('care');
  assert.equal(r.length, 5);
  assert.ok(r.every((h) => h.insurance === 'Care Supreme'));
  for (let i = 1; i < r.length; i++) assert.ok((r[i].google_rating ?? -1) <= (r[i - 1].google_rating ?? -1));
});

test('fmtDistance prefixes HDFC buckets with ~', () => {
  const hdfc = HOSPITALS.find(isHdfc)!;
  assert.ok(hdfc.distance_km === undefined || fmtDistance(hdfc).startsWith('~'));
  const care = HOSPITALS.find((h) => !isHdfc(h) && h.distance_km !== undefined && h.distance_km !== null)!;
  assert.ok(!fmtDistance(care).startsWith('~'));
});

test('networkBadge maps insurance', () => {
  assert.equal(networkBadge(HOSPITALS.find((h) => isHdfc(h) && !dualNetworks(h))!), 'HDFC');
  assert.equal(networkBadge(HOSPITALS.find((h) => !isHdfc(h) && !dualNetworks(h))!), 'CARE');
});

test('dualNetworks flags hospitals under both networks', () => {
  const dual = HOSPITALS.filter(dualNetworks);
  assert.ok(dual.length > 0);
  assert.ok(dual.length === HOSPITALS.filter((h) =>
    HOSPITALS.some((o) => o !== h && o.hospital_name.toLowerCase() === h.hospital_name.toLowerCase() && o.insurance !== h.insurance)
  ).length);
  assert.ok(dual.every(dualNetworks));
});

test('networkBadge shows HDFC+CARE for dual hospitals', () => {
  const dual = HOSPITALS.find(dualNetworks)!;
  assert.equal(networkBadge(dual), 'HDFC+CARE');
});

test('dualNameCount counts distinct dual names', () => {
  const names = new Set(HOSPITALS.filter(dualNetworks).map((h) => h.hospital_name.toLowerCase()));
  assert.equal(dualNameCount(), names.size);
  assert.ok(names.size >= 5);
});

test('browseHospitals returns the whole catalogue', () => {
  const r = browseHospitals();
  assert.equal(r.length, HOSPITALS.length);
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].hospital_name.localeCompare(r[i].hospital_name) <= 0);
});

test('browseHospitals both filter returns only dual entries', () => {
  const r = browseHospitals({ insurance: 'both' });
  assert.ok(r.length > 0);
  assert.ok(r.every(dualNetworks));
  const names = new Set(r.map((h) => h.hospital_name.toLowerCase()));
  assert.equal(r.length, HOSPITALS.filter(dualNetworks).length);
  assert.ok(names.size === dualNameCount());
});

test('browseHospitals area filter narrows results', () => {
  const r = browseHospitals({ area: 'Gachibowli' });
  assert.ok(r.length > 0);
  assert.ok(r.length < HOSPITALS.length);
  assert.ok(r.every((h) => h.area.toLowerCase().includes('gachibowli')));
});

test('browseHospitals phoneOnly excludes phoneless entries', () => {
  const r = browseHospitals({ phoneOnly: true });
  assert.ok(r.length > 0);
  assert.ok(r.every((h) => h.contact_number.length > 0));
});

test('browseHospitals ratedOnly excludes unrated entries', () => {
  const r = browseHospitals({ ratedOnly: true });
  assert.ok(r.length > 0);
  assert.ok(r.every((h) => h.google_rating !== undefined && h.google_rating !== null));
});

test('browseHospitals recommendedOnly keeps stars', () => {
  const r = browseHospitals({ recommendedOnly: true });
  assert.ok(r.length > 0);
  assert.ok(r.every((h) => h.is_recommended));
});

test('browseHospitals rating sort puts rated first', () => {
  const r = browseHospitals({ sort: 'rating' });
  assert.ok(r[0].google_rating !== undefined && r[0].google_rating !== null);
  assert.ok((r[r.length - 1].google_rating ?? -1) <= (r[0].google_rating ?? -1));
});
