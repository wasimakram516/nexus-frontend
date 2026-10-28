import { CountryCode, getCountries, getCountryCallingCode } from "libphonenumber-js/min";

export interface Country {
  /** ISO 3166-1 alpha-2, upper case: "PK". */
  iso: CountryCode;
  name: string;
  /** Calling code with the plus: "+92". */
  dialCode: string;
}

/** Used when a school has not chosen a default country. */
export const FALLBACK_COUNTRY: CountryCode = "PK";

const names = typeof Intl !== "undefined" && "DisplayNames" in Intl
  ? new Intl.DisplayNames(["en"], { type: "region" })
  : null;

/** Every country the phone library knows, in alphabetical order. Built from the library, so nothing is hand-kept. */
export const COUNTRIES: Country[] = getCountries()
  .map((iso) => ({
    iso,
    name: names?.of(iso) ?? iso,
    dialCode: `+${getCountryCallingCode(iso)}`,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

const byIso = new Map(COUNTRIES.map((country) => [country.iso, country]));

/**
 * @param {string | null | undefined} iso - A country code in any case.
 * @returns {Country | null} The country, or null when the code is unknown.
 */
export function getCountry(iso: string | null | undefined): Country | null {
  return iso ? byIso.get(iso.toUpperCase() as CountryCode) ?? null : null;
}

/**
 * @param {string | null | undefined} iso - A country code, or nothing.
 * @returns {CountryCode} The code if it is a known country, otherwise the fallback.
 */
export function resolveCountry(iso: string | null | undefined): CountryCode {
  return getCountry(iso)?.iso ?? FALLBACK_COUNTRY;
}

/**
 * @param {string} iso - A country code.
 * @param {number} [width] - Flag image width in pixels (20, 40, 80, 160, ...).
 * @returns {string} Where the country's flag image can be loaded from.
 */
export function flagUrl(iso: string, width = 40): string {
  return `https://flagcdn.com/w${width}/${iso.toLowerCase()}.png`;
}

/**
 * Letters, digits and marks folded so "Pakistan", "pakistán" and "+92" all find the same country in a search box.
 *
 * @param {string} text - What was typed or the name searched.
 * @returns {string} The folded text.
 */
export function normalizeForSearch(text: string): string {
  return text.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/**
 * @param {string} query - What the person typed.
 * @param {Country[]} [list] - The countries to search.
 * @returns {Country[]} Countries whose name, code or calling code contain the query.
 */
export function searchCountries(query: string, list: Country[] = COUNTRIES): Country[] {
  const q = normalizeForSearch(query);
  if (!q) return list;
  return list.filter(
    (country) =>
      normalizeForSearch(country.name).includes(q) ||
      country.iso.toLowerCase() === q ||
      country.dialCode.replace("+", "").startsWith(q.replace("+", "")),
  );
}
