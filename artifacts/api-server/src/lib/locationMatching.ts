import type { LocationPreference } from "@workspace/api-zod";

const normalize = (value: string) =>
  value.normalize("NFKD").replace(/\p{M}/gu, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, " ").trim();

const COUNTRY_ALIASES: Record<string, string[]> = {
  "united arab emirates": ["united arab emirates", "uae", "u a e", "ae"],
  "united kingdom": ["united kingdom", "uk", "u k", "gb", "great britain", "england", "scotland", "wales", "northern ireland"],
  "united states": ["united states", "united states of america", "usa", "us", "u s", "u s a"],
  "canada": ["canada", "ca"],
  "australia": ["australia", "au"],
  "germany": ["germany", "deutschland", "de"],
  "france": ["france", "fr"],
  "india": ["india", "in"],
  "netherlands": ["netherlands", "the netherlands", "nl"],
  "south korea": ["south korea", "republic of korea", "kr"],
};

const contains = (location: string, phrase: string) =>
  ` ${location} `.includes(` ${normalize(phrase)} `);

const canonicalCountry = (country: string) => {
  const name = normalize(country);
  return Object.entries(COUNTRY_ALIASES).find(([, aliases]) => aliases.includes(name))?.[0] ?? name;
};

export function matchesLocationPreferences(
  jobLocation: string,
  preferences: LocationPreference[],
): boolean {
  const location = normalize(jobLocation);
  return preferences.some(({ country, cities }) => {
    const canonical = canonicalCountry(country);
    const countryPresent = (COUNTRY_ALIASES[canonical] ?? [country])
      .some((alias) => contains(location, alias));
    if (!cities.length) return countryPresent;

    // A known, explicitly conflicting country must not be ignored for a city match.
    const otherCountryPresent = Object.entries(COUNTRY_ALIASES)
      .some(([name, aliases]) => name !== canonical && aliases.some((alias) => contains(location, alias)));
    return cities.some((city) => contains(location, city)) &&
      (countryPresent || !otherCountryPresent);
  });
}

export function demoLocation(
  preferences: LocationPreference[],
  index: number,
): string {
  const alternatives = preferences.flatMap(({ country, cities }) =>
    cities.length ? cities.map((city) => `${city}, ${country}`) : [country]);
  return alternatives[index % alternatives.length];
}