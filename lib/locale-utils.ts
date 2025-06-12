/**
 * Utility functions for handling locale preferences
 */

export const SUPPORTED_LOCALES = ["en", "pt"] as const;
export type SupportedLocale = typeof SUPPORTED_LOCALES[number];

/**
 * Save locale preference to both localStorage and cookie
 * @param locale The locale to save
 */
export const saveLocalePreference = (locale: string): void => {
  try {
    localStorage.setItem("preferred-locale", locale);
    // Set cookie for server-side access (1 year expiry)
    document.cookie = `preferred-locale=${locale}; path=/; max-age=${
      60 * 60 * 24 * 365
    }; SameSite=Lax`;
  } catch (error) {
    console.warn("Could not save locale preference:", error);
  }
};

/**
 * Get locale preference from localStorage
 * @returns The saved locale or null if not found
 */
export const getStoredLocalePreference = (): string | null => {
  try {
    return localStorage.getItem("preferred-locale");
  } catch (error) {
    console.warn("Could not access localStorage for locale preference:", error);
    return null;
  }
};

/**
 * Check if a locale is supported
 * @param locale The locale to check
 * @returns True if the locale is supported
 */
export const isSupportedLocale = (locale: string): locale is SupportedLocale => {
  return SUPPORTED_LOCALES.includes(locale as SupportedLocale);
}; 