import { HOSPITALS_RAW } from './hospitals.ts';

// Typed catalogue loaded from the JSON emitted by scripts/extract_hospitals.py.
export interface Hospital {
  hospital_name: string;
  insurance: string;          // 'HDFC Ergo' | 'Care Supreme'
  area: string;
  specialty: string;
  contact_number: readonly string[];
  google_rating?: number | null;
  distance_km?: number | null;
  travel_time_min?: number | null;
  proximity_category?: string | null;
  final_score?: number | null;   // HDFC proximity composite only
  full_address?: string | null;
  is_recommended?: boolean;
  num_reviews?: string | null;
  dual?: string | null;   // counterpart record name on the other insurance network
}

export const HOSPITALS: readonly Hospital[] = HOSPITALS_RAW;

export function isHdfc(h: Hospital): boolean {
  return h.insurance === 'HDFC Ergo';
}

// `dual` pairs are mapped by evidence (name chain + phone + branch), not exact-name
// coincidence: the counterpart record's hospital name lives on the other network.
export function dualNetworks(h: Hospital): boolean {
  return h.dual !== undefined && h.dual !== null && h.dual !== '';
}

export function dualPartnerName(h: Hospital): string | null {
  return dualNetworks(h) ? String(h.dual) : null;
}

export function dualPairCount(): number {
  let n = 0;
  for (const h of HOSPITALS) {
    if (dualNetworks(h) && h.insurance === 'HDFC Ergo') n += 1;
  }
  return n;
}

export function networkBadge(h: Hospital): string {
  if (dualNetworks(h)) return 'HDFC+CARE';
  return isHdfc(h) ? 'HDFC' : 'CARE';
}

const STOPWORDS = new Set(['hospital', 'hospitals', 'pvt', 'ltd', 'limited']);

function keywords(text: string): string[] {
  return text.toLowerCase().split(/[^a-z]+/).filter((w) => w.length > 1 && !STOPWORDS.has(w));
}

export interface FilterOpts {
  insurance?: 'all' | 'hdfc' | 'care' | 'both';
  specialty?: string;
  area?: string;
  phoneOnly?: boolean;
  ratedOnly?: boolean;
  recommendedOnly?: boolean;
}

function matchesFilters(h: Hospital, insurance: string, specialty: string, area: string, opts: FilterOpts): boolean {
  if (insurance === 'hdfc' && !isHdfc(h)) return false;
  if (insurance === 'care' && isHdfc(h)) return false;
  if (insurance === 'both' && !dualNetworks(h)) return false;
  if (specialty && !h.specialty.toLowerCase().includes(specialty)) return false;
  if (area && !h.area.toLowerCase().includes(area)) return false;
  if (opts.phoneOnly && h.contact_number.length === 0) return false;
  if (opts.ratedOnly && (h.google_rating === undefined || h.google_rating === null)) return false;
  if (opts.recommendedOnly && !h.is_recommended) return false;
  return true;
}

export function browseHospitals(opts: FilterOpts & { sort?: 'name' | 'distance' | 'rating' | 'score' } = {}): Hospital[] {
  const insurance = opts.insurance ?? 'all';
  const specialty = (opts.specialty ?? '').trim().toLowerCase();
  const area = (opts.area ?? '').trim().toLowerCase();
  const pool = HOSPITALS.filter((h) => matchesFilters(h, insurance, specialty, area, opts));
  return sortResults([...pool], opts.sort ?? 'name');
}

export function searchHospitals(
  query: string,
  opts: FilterOpts & { sort?: 'relevance' | 'distance' | 'rating' | 'score' | 'name'; limit?: number } = {},
): Hospital[] {
  const q = query.trim().toLowerCase();
  const insurance = opts.insurance ?? 'all';
  const specialty = (opts.specialty ?? '').trim().toLowerCase();
  const area = (opts.area ?? '').trim().toLowerCase();
  if (!q && !specialty && !area) return [];
  const pool = HOSPITALS.filter((h) => matchesFilters(h, insurance, specialty, area, opts));
  const scored: [number, Hospital][] = [];
  for (const h of pool) {
    let score: number | null = null;
    const name = h.hospital_name.toLowerCase();
    if (!q) {
      score = 0;
    } else if (name.startsWith(q)) {
      score = 0;
    } else if (name.includes(q)) {
      score = 1;
    } else if (h.area.toLowerCase().includes(q)) {
      score = 2;
    } else if (h.specialty.toLowerCase().includes(q)) {
      score = 3;
    } else if (h.full_address && h.full_address.toLowerCase().includes(q)) {
      score = 4;
    }
    if (score !== null) scored.push([score, h]);
  }
  scored.sort((a, b) => a[0] - b[0] || a[1].hospital_name.localeCompare(b[1].hospital_name));
  const limit = opts.limit ?? 100;
  const results = scored.slice(0, limit).map(([, h]) => h);
  return sortResults(results, opts.sort ?? 'relevance');
}

export function sortResults(rows: Hospital[], sort: 'relevance' | 'distance' | 'rating' | 'score' | 'name'): Hospital[] {
  const copy = [...rows];
  switch (sort) {
    case 'relevance':
      break;
    case 'distance':
      // HDFC distances are bucket-mapped (0.5/3/7/15 km); Care distances are measured km.
      copy.sort((a, b) => (a.distance_km ?? Infinity) - (b.distance_km ?? Infinity) || a.hospital_name.localeCompare(b.hospital_name));
      break;
    case 'rating':
      copy.sort((a, b) => (b.google_rating ?? -1) - (a.google_rating ?? -1));
      break;
    case 'score':
      // final_score exists only on HDFC entries; Care entries sort last.
      copy.sort((a, b) => (b.final_score ?? -Infinity) - (a.final_score ?? -Infinity));
      break;
    case 'name':
      copy.sort((a, b) => a.hospital_name.localeCompare(b.hospital_name));
      break;
  }
  return copy;
}

export function topContacts(insurance: 'hdfc' | 'care', n = 5): Hospital[] {
  const pool = HOSPITALS.filter((h) => (insurance === 'hdfc' ? isHdfc(h) : !isHdfc(h)));
  if (insurance === 'hdfc') {
    return [...pool].sort((a, b) => (b.final_score ?? -Infinity) - (a.final_score ?? -Infinity)).slice(0, n);
  }
  return [...pool].sort((a, b) => (b.google_rating ?? -1) - (a.google_rating ?? -1)).slice(0, n);
}

export function highlightSegments(text: string, query: string): { part: string; hit: boolean }[] {
  const q = query.trim();
  if (!q) return [{ part: text, hit: false }];
  const idx = text.toLowerCase().indexOf(q.toLowerCase());
  if (idx < 0) return [{ part: text, hit: false }];
  return [
    { part: text.slice(0, idx), hit: false },
    { part: text.slice(idx, idx + q.length), hit: true },
    { part: text.slice(idx + q.length), hit: false },
  ].filter((s) => s.part.length > 0);
}

export function fmtDistance(h: Hospital): string {
  if (h.distance_km === undefined || h.distance_km === null) return '—';
  return isHdfc(h) ? `~${h.distance_km} km` : `${h.distance_km} km`;
}
