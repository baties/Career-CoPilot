export interface CountryOption {
  code: string;
  name: string;
}

const EXCLUDED = new Set(['EU', 'UN', 'EZ', 'XA', 'XB', 'ZZ', 'QO', 'AC', 'CP', 'DG', 'EA', 'IC', 'TA']);

let cached: CountryOption[] | null = null;

export function getCountries(): CountryOption[] {
  if (cached) return cached;
  const names = new Intl.DisplayNames(['en'], { type: 'region' });
  const out: CountryOption[] = [];
  const A = 65;
  for (let i = 0; i < 26; i += 1) {
    for (let j = 0; j < 26; j += 1) {
      const code = String.fromCharCode(A + i, A + j);
      if (EXCLUDED.has(code)) continue;
      let name: string | undefined;
      try {
        name = names.of(code);
      } catch {
        name = undefined;
      }
      if (name && name !== code && name.length <= 100) out.push({ code, name });
    }
  }
  cached = out.sort((a, b) => a.name.localeCompare(b.name));
  return cached;
}

export const MAJOR_CITIES: Record<string, string[]> = {
  AE: ['Dubai', 'Abu Dhabi', 'Sharjah', 'Ajman', 'Ras Al Khaimah', 'Fujairah', 'Al Ain'],
  CA: ['Toronto', 'Calgary', 'Vancouver', 'Montreal', 'Ottawa', 'Edmonton', 'Waterloo', 'Winnipeg', 'Halifax', 'Quebec City'],
  GB: ['London', 'Manchester', 'Birmingham', 'Edinburgh', 'Glasgow', 'Bristol', 'Leeds', 'Cambridge', 'Cardiff', 'Belfast'],
  US: ['New York', 'San Francisco', 'Seattle', 'Austin', 'Boston', 'Chicago', 'Los Angeles', 'Denver', 'Atlanta', 'Washington DC'],
  IN: ['Bengaluru', 'Mumbai', 'Delhi', 'Hyderabad', 'Pune', 'Chennai', 'Kolkata', 'Gurugram', 'Noida'],
  AU: ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Canberra', 'Adelaide'],
  DE: ['Berlin', 'Munich', 'Hamburg', 'Frankfurt', 'Cologne', 'Stuttgart'],
  FR: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice'],
  NL: ['Amsterdam', 'Rotterdam', 'Utrecht', 'Eindhoven', 'The Hague'],
  IE: ['Dublin', 'Cork', 'Galway', 'Limerick'],
  ES: ['Madrid', 'Barcelona', 'Valencia', 'Seville'],
  IT: ['Milan', 'Rome', 'Turin', 'Bologna'],
  SG: ['Singapore'],
  SA: ['Riyadh', 'Jeddah', 'Dammam', 'NEOM'],
  QA: ['Doha'],
  EG: ['Cairo', 'Alexandria'],
  PK: ['Karachi', 'Lahore', 'Islamabad'],
  NG: ['Lagos', 'Abuja'],
  KE: ['Nairobi'],
  ZA: ['Johannesburg', 'Cape Town', 'Durban'],
  BR: ['Sao Paulo', 'Rio de Janeiro', 'Brasilia'],
  MX: ['Mexico City', 'Guadalajara', 'Monterrey'],
  JP: ['Tokyo', 'Osaka', 'Kyoto', 'Yokohama'],
  KR: ['Seoul', 'Busan'],
  CN: ['Shanghai', 'Beijing', 'Shenzhen', 'Hangzhou'],
  SE: ['Stockholm', 'Gothenburg', 'Malmo'],
  CH: ['Zurich', 'Geneva', 'Basel'],
  PL: ['Warsaw', 'Krakow', 'Wroclaw'],
  NZ: ['Auckland', 'Wellington', 'Christchurch'],
  PH: ['Manila', 'Cebu'],
  MY: ['Kuala Lumpur', 'Penang'],
  ID: ['Jakarta', 'Bali'],
  TR: ['Istanbul', 'Ankara'],
};

export const MAX_COUNTRIES = 30;
export const MAX_CITIES = 30;
