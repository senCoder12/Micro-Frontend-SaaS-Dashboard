/**
 * Generates 1,000 realistic user session records for the Analytics data grid.
 * Uses a seeded deterministic pattern so the data is stable across hot-reloads.
 */

export interface SessionRecord {
  /**
   * Index signature required so SessionRecord satisfies `Record<string, unknown>`,
   * which is the DataGrid's generic constraint.
   *
   * WHY `unknown` not `never` or a union:
   *   `unknown` is the widest type — all specific property types (string, number,
   *   boolean) are assignable to it. Adding this signature doesn't widen the
   *   specific properties; TypeScript still knows `id` is `string`, not `unknown`.
   */
  [key: string]: unknown;
  id:       string;
  user:     string;
  email:    string;
  country:  string;
  city:     string;
  browser:  string;
  os:       string;
  page:     string;
  duration: number;   // seconds
  revenue:  number;   // USD (0 if no purchase)
  date:     string;   // ISO date string
}

// ── Lookup tables ──────────────────────────────────────────────────────────

const FIRST_NAMES = ['Alex','Maya','Jordan','Chris','Sam','Taylor','Morgan','Casey',
  'Riley','Quinn','Avery','Blake','Drew','Harley','Jamie','Kendall','Lee','Logan',
  'Parker','Peyton','Reese','Robin','Sage','Skyler','Spencer','Tristan','Whitney'];

const LAST_NAMES = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller',
  'Davis','Martinez','Wilson','Anderson','Taylor','Thomas','Hernandez','Moore',
  'Martin','Jackson','Thompson','White','Lopez','Lee','Gonzalez','Harris','Clark',
  'Lewis','Robinson','Walker','Perez','Hall','Young'];

const DOMAINS = ['gmail.com','outlook.com','yahoo.com','company.io','startup.co',
  'enterprise.com','acme.org','tech.dev','corp.net'];

const COUNTRIES = ['United States','Germany','United Kingdom','France','Japan',
  'Canada','Australia','Brazil','India','Netherlands','Spain','Sweden','Singapore',
  'South Korea','Mexico','Italy','Poland','Argentina','Turkey','South Africa'];

const CITIES: Record<string, string[]> = {
  'United States':  ['New York','Los Angeles','Chicago','Houston','Phoenix'],
  'Germany':        ['Berlin','Hamburg','Munich','Frankfurt','Cologne'],
  'United Kingdom': ['London','Manchester','Birmingham','Leeds','Glasgow'],
  'France':         ['Paris','Lyon','Marseille','Toulouse','Nice'],
  'Japan':          ['Tokyo','Osaka','Nagoya','Sapporo','Fukuoka'],
  'Canada':         ['Toronto','Vancouver','Montreal','Calgary','Ottawa'],
  'Australia':      ['Sydney','Melbourne','Brisbane','Perth','Adelaide'],
  'Brazil':         ['São Paulo','Rio de Janeiro','Brasília','Salvador','Fortaleza'],
  'India':          ['Mumbai','Delhi','Bangalore','Chennai','Hyderabad'],
  'Netherlands':    ['Amsterdam','Rotterdam','The Hague','Utrecht','Eindhoven'],
};

const BROWSERS = ['Chrome','Firefox','Safari','Edge','Opera'];
const OS_LIST  = ['Windows','macOS','Linux','iOS','Android'];
const PAGES    = ['/dashboard','/analytics','/workflow','/settings','/onboarding','/billing','/reports','/team'];

// ── Generator ──────────────────────────────────────────────────────────────

function pick<T>(arr: T[], seed: number): T {
  return arr[seed % arr.length];
}

function generateEmail(firstName: string, lastName: string, domain: string): string {
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${domain}`;
}

function generateDate(seed: number): string {
  const now = Date.now();
  const daysAgo = seed % 90; // last 90 days
  const hoursAgo = (seed * 7) % 24;
  return new Date(now - daysAgo * 86_400_000 - hoursAgo * 3_600_000).toISOString().split('T')[0];
}

export function generateSessions(count = 1_000): SessionRecord[] {
  return Array.from({ length: count }, (_, i) => {
    const n         = i + 1;
    const firstName = pick(FIRST_NAMES, n * 3);
    const lastName  = pick(LAST_NAMES,  n * 7);
    const country   = pick(COUNTRIES,   n * 11);
    const cityList  = CITIES[country] ?? ['Capital City'];
    const browser   = pick(BROWSERS, n * 13);
    const os        = pick(OS_LIST,  n * 17);

    // Revenue: ~30% of sessions result in a purchase
    const hasPurchase = n % 3 === 0;
    const revenue     = hasPurchase
      ? Math.round((29 + (n % 12) * 50 + (n % 5) * 10) * 100) / 100
      : 0;

    // Duration: 30s to 20 minutes, weighted toward shorter sessions
    const duration = 30 + (n % 100) * 11 + (n % 7) * 30;

    return {
      id:       `sess_${String(n).padStart(4, '0')}`,
      user:     `${firstName} ${lastName}`,
      email:    generateEmail(firstName, lastName, pick(DOMAINS, n * 19)),
      country,
      city:     pick(cityList, n * 5),
      browser,
      os,
      page:     pick(PAGES, n * 23),
      duration,
      revenue,
      date:     generateDate(n),
    };
  });
}

/** Pre-generated dataset — computed once, shared across renders */
export const SESSION_DATA: SessionRecord[] = generateSessions(1_000);
