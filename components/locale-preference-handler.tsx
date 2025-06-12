"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useLocale } from "next-intl";
import {
  saveLocalePreference,
  getStoredLocalePreference,
  isSupportedLocale,
} from "@/lib/locale-utils";

export function LocalePreferenceHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const currentLocale = useLocale();

  useEffect(() => {
    // Only check on initial page load
    const hasCheckedPreference = sessionStorage.getItem(
      "locale-preference-checked"
    );

    if (hasCheckedPreference) {
      // Even if we've checked before, ensure localStorage and cookie are in sync
      saveLocalePreference(currentLocale);
      return;
    }

    // Mark that we've checked the preference for this session
    sessionStorage.setItem("locale-preference-checked", "true");

    try {
      const preferredLocale = getStoredLocalePreference();

      // If we have a stored preference and it's different from current locale
      if (
        preferredLocale &&
        preferredLocale !== currentLocale &&
        isSupportedLocale(preferredLocale)
      ) {
        // Build new path with preferred locale
        const segments = pathname.split("/");
        segments[1] = preferredLocale;
        const newPath = segments.join("/");

        // Save the preference with cookie
        saveLocalePreference(preferredLocale);

        // Replace current URL with preferred locale
        router.replace(newPath);
      } else {
        // Update localStorage and cookie with current locale
        saveLocalePreference(currentLocale);
      }
    } catch (error) {
      // localStorage might not be available in some browsers/modes
      console.warn(
        "Could not access localStorage for locale preference:",
        error
      );
      // Still try to set the cookie
      try {
        document.cookie = `preferred-locale=${currentLocale}; path=/; max-age=${
          60 * 60 * 24 * 365
        }; SameSite=Lax`;
      } catch (cookieError) {
        console.warn("Could not set locale cookie:", cookieError);
      }
    }
  }, [currentLocale, pathname, router]);

  // This component doesn't render anything
  return null;
}
