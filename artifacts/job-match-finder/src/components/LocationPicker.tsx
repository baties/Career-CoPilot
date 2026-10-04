import { useId, useMemo, useState } from 'react';
import { Globe2, Plus, X } from 'lucide-react';
import { MAJOR_CITIES, MAX_CITIES, MAX_COUNTRIES, getCountries } from '../lib/locationData';

export interface LocationSelection {
  code: string;
  country: string;
  cities: string[]; // empty = all cities
}

interface LocationPickerProps {
  worldwide: boolean;
  selections: LocationSelection[];
  onChange: (value: { worldwide: boolean; selections: LocationSelection[] }) => void;
  disabled?: boolean;
  error?: string;
}

const inputCls =
  'w-full px-4 py-3 rounded-xl border border-border/60 bg-background/60 backdrop-blur-md text-foreground font-medium placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-sm';

const chip = (on: boolean) =>
  `px-3 py-1.5 rounded-lg text-sm font-semibold border transition focus:outline-none focus:ring-2 focus:ring-primary/50 ${
    on
      ? 'bg-foreground text-background border-foreground'
      : 'bg-background/60 text-foreground border-border/60 hover:border-primary/40'
  }`;

export function LocationPicker({ worldwide, selections, onChange, disabled, error }: LocationPickerProps) {
  const uid = useId();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [cityDrafts, setCityDrafts] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState('');
  const countries = useMemo(() => getCountries(), []);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const chosen = new Set(selections.map((s) => s.code));
    const aliases: Record<string, string> = { AE: 'uae', GB: 'uk great britain england', US: 'usa united states america' };
    return countries.filter((c) => !chosen.has(c.code) && (!q || `${c.name} ${c.code} ${aliases[c.code] ?? ''}`.toLowerCase().includes(q))).slice(0, 60);
  }, [countries, query, selections]);

  const update = (next: LocationSelection[], ww = false) => onChange({ worldwide: ww, selections: next });

  const addCountry = (code: string, name: string) => {
    if (selections.length >= MAX_COUNTRIES) {
      setNotice(`You can choose up to ${MAX_COUNTRIES} countries.`);
      return;
    }
    setNotice('');
    update([...selections, { code, country: name, cities: [] }]);
    setQuery('');
    setOpen(false);
  };

  const patch = (code: string, cities: string[]) =>
    update(selections.map((s) => (s.code === code ? { ...s, cities } : s)));

  const toggleCity = (sel: LocationSelection, city: string) => {
    const has = sel.cities.some((c) => c.toLowerCase() === city.toLowerCase());
    if (has) return patch(sel.code, sel.cities.filter((c) => c.toLowerCase() !== city.toLowerCase()));
    if (sel.cities.length >= MAX_CITIES) {
      setNotice(`You can choose up to ${MAX_CITIES} cities per country.`);
      return;
    }
    setNotice('');
    patch(sel.code, [...sel.cities, city]);
  };

  const addCustom = (sel: LocationSelection) => {
    const v = (cityDrafts[sel.code] ?? '').trim().replace(/\s+/g, ' ');
    if (v.length < 2) return;
    if (v.length > 100) {
      setNotice('City names must be 100 characters or fewer.');
      return;
    }
    toggleCityAdd(sel, v);
    setCityDrafts((d) => ({ ...d, [sel.code]: '' }));
  };

  const toggleCityAdd = (sel: LocationSelection, city: string) => {
    if (sel.cities.some((c) => c.toLowerCase() === city.toLowerCase())) return;
    toggleCity(sel, city);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          aria-pressed={worldwide}
          disabled={disabled}
          onClick={() => update([], !worldwide)}
          className={`${chip(worldwide)} inline-flex items-center gap-2`}
          data-testid="button-worldwide"
        >
          <Globe2 size={15} />
          Worldwide
        </button>
        {(worldwide || selections.length > 0) && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => update([], false)}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground underline underline-offset-4"
            data-testid="button-clear-locations"
          >
            Clear
          </button>
        )}
        <span className="text-xs text-muted-foreground">
          {worldwide ? 'Searching everywhere. Pick a country to narrow down.' : `${selections.length}/${MAX_COUNTRIES} countries`}
        </span>
      </div>

      <div
        className="relative"
        onBlur={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(false);
        }}
      >
        <label htmlFor={`${uid}-country`} className="sr-only">
          Search and add a country
        </label>
        <input
          id={`${uid}-country`}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${uid}-list`}
          autoComplete="off"
          placeholder="Search countries to add..."
          className={`${inputCls} ${error ? 'border-destructive' : ''}`}
          value={query}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setOpen(false);
            if (e.key === 'Enter') {
              e.preventDefault();
              if (matches[0]) addCountry(matches[0].code, matches[0].name);
            }
          }}
          data-testid="input-country-search"
        />
        {open && (
          <ul
            id={`${uid}-list`}
            aria-label="Countries"
            className="absolute z-30 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-xl"
          >
            {matches.length === 0 && <li className="px-3 py-2 text-sm text-muted-foreground">No countries found.</li>}
            {matches.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => addCountry(c.code, c.name)}
                  className="w-full rounded-lg px-3 py-2 text-left text-sm font-medium hover:bg-secondary focus:bg-secondary focus:outline-none"
                >
                  {c.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {selections.map((sel) => {
        const suggestions = MAJOR_CITIES[sel.code] ?? [];
        const customs = sel.cities.filter((c) => !suggestions.some((s) => s.toLowerCase() === c.toLowerCase()));
        const draftId = `${uid}-city-${sel.code}`;
        return (
          <div key={sel.code} className="rounded-xl border border-border/60 bg-background/50 p-4 space-y-3" data-testid={`card-country-${sel.code}`}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-foreground">{sel.country}</h3>
              <button
                type="button"
                disabled={disabled}
                onClick={() => update(selections.filter((s) => s.code !== sel.code))}
                aria-label={`Remove ${sel.country}`}
                className="rounded-md p-1 text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <X size={16} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2" role="group" aria-label={`Cities in ${sel.country}`}>
              <button type="button" aria-pressed={sel.cities.length === 0} disabled={disabled} onClick={() => patch(sel.code, [])} className={chip(sel.cities.length === 0)}>
                All cities
              </button>
              {[...suggestions, ...customs].map((city) => {
                const on = sel.cities.some((c) => c.toLowerCase() === city.toLowerCase());
                return (
                  <button key={city} type="button" aria-pressed={on} disabled={disabled} onClick={() => toggleCity(sel, city)} className={chip(on)}>
                    {city}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-2">
              <label htmlFor={draftId} className="sr-only">
                Add a city in {sel.country}
              </label>
              <input
                id={draftId}
                type="text"
                maxLength={100}
                placeholder="Other city..."
                className={`${inputCls} py-2 text-sm`}
                value={cityDrafts[sel.code] ?? ''}
                disabled={disabled}
                onChange={(e) => setCityDrafts((d) => ({ ...d, [sel.code]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addCustom(sel);
                  }
                }}
              />
              <button
                type="button"
                disabled={disabled}
                onClick={() => addCustom(sel)}
                className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-primary/25 bg-background/80 px-4 text-sm font-bold text-primary hover:border-primary/50"
              >
                <Plus size={14} /> Add
              </button>
            </div>
          </div>
        );
      })}

      <p className="text-xs text-muted-foreground" aria-live="polite">
        {notice || 'Jobs in any selected country or city can match. Choosing cities limits that country to them.'}
      </p>
    </div>
  );
}
