import {
  CountryCode,
  getExampleNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js/min";
import examples from "libphonenumber-js/examples.mobile.json";
import { getCountry, resolveCountry } from "@/lib/countries";

/** Everything but digits, with a single leading plus kept. */
function stripToDigits(raw: string): { plus: boolean; digits: string } {
  const text = raw.trim();
  return { plus: text.startsWith("+") || text.startsWith("00"), digits: text.replace(/\D/g, "") };
}

/**
 * Reads what a person typed or an old record holds as a full international number.
 * A number that starts with a plus (or 00) is taken as written; any other is
 * read as a number of the given country, so "0300 1234567" works for Pakistan.
 *
 * @param {string} raw - The number as written.
 * @param {string} [country] - The country a number without a calling code belongs to.
 * @returns {string | null} The number as "+923001234567", or null when it is not a valid number.
 */
export function toE164(raw: string | null | undefined, country?: string): string | null {
  if (!raw || !raw.trim()) return null;
  const { plus, digits } = stripToDigits(raw);
  const text = plus ? `+${digits.replace(/^00/, "")}` : raw;
  const parsed = parsePhoneNumberFromString(text, resolveCountry(country));
  return parsed?.isValid() ? parsed.number : null;
}

/**
 * @param {string | null | undefined} value - A number, usually "+<calling code><digits>".
 * @param {string} [country] - The country a number without a calling code belongs to.
 * @returns {boolean} Whether it is a real, dialable number.
 */
export function isValidPhone(value: string | null | undefined, country?: string): boolean {
  return toE164(value, country) !== null;
}

/**
 * Splits a stored number into the country it belongs to and the part after the calling code, so it can fill a country picker and a number box.
 *
 * @param {string | null | undefined} value - A stored number.
 * @param {string} [fallbackCountry] - Used when the number is empty or its country cannot be read.
 * @returns {{ country: CountryCode, national: string }} The country and the digits to show.
 */
export function splitPhone(
  value: string | null | undefined,
  fallbackCountry?: string,
): { country: CountryCode; national: string } {
  const fallback = resolveCountry(fallbackCountry);
  if (!value || !value.trim()) return { country: fallback, national: "" };
  const { plus, digits } = stripToDigits(value);
  const parsed = parsePhoneNumberFromString(plus ? `+${digits.replace(/^00/, "")}` : value, fallback);
  if (parsed?.country) return { country: parsed.country, national: parsed.nationalNumber };
  if (parsed) return { country: fallback, national: parsed.nationalNumber };
  return { country: fallback, national: digits };
}

/**
 * The form a number is kept in while someone is still typing it: the calling code plus whatever digits are there so far. Empty when there are no digits.
 *
 * @param {CountryCode} country - The selected country.
 * @param {string} nationalText - What is in the number box.
 * @returns {string} "+<calling code><digits>", or "" for no digits.
 */
export function joinPhone(country: CountryCode, nationalText: string): string {
  const dial = getCountry(country)?.dialCode ?? "";
  const digits = nationalText.replace(/\D/g, "").replace(/^0+/, "");
  return digits ? `${dial}${digits}` : "";
}

/**
 * @param {string | null | undefined} value - A stored number.
 * @returns {string} The number laid out the way people write it ("+92 300 1234567"), or the value as stored when it cannot be read.
 */
export function formatPhone(value: string | null | undefined): string {
  if (!value) return "";
  const parsed = parsePhoneNumberFromString(value);
  return parsed ? parsed.formatInternational() : value;
}

/**
 * @param {string} country - A country code.
 * @returns {string | null} A sample mobile number of that country, as people write it locally, for a hint under the box.
 */
export function exampleNumber(country: string): string | null {
  const example = getExampleNumber(resolveCountry(country), examples);
  return example ? example.formatNational() : null;
}
