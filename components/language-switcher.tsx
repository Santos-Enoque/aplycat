"use client";

import React from "react";
import { useLocale } from "next-intl";
import { useRouter, usePathname } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Languages, Check } from "lucide-react";
import { locales, localeNames } from "@/i18n/request";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const switchLanguage = (newLocale: string) => {
    // Remove the current locale from the pathname
    const segments = pathname.split("/");
    const isLocaleInPath = locales.includes(segments[1] as any);

    let newPathname;
    if (isLocaleInPath) {
      // Replace the current locale
      segments[1] = newLocale;
      newPathname = segments.join("/");
    } else {
      // Add the new locale
      newPathname = `/${newLocale}${pathname}`;
    }

    // Handle root path edge case
    if (newPathname === `/${newLocale}/` || newPathname === `/${newLocale}`) {
      newPathname = newLocale === "en" ? "/" : `/${newLocale}`;
    }

    router.push(newPathname);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-600 hover:text-gray-900"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">Language</span>
          <span className="text-xs font-medium">{locale.toUpperCase()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {locales.map((lang) => (
          <DropdownMenuItem
            key={lang}
            onClick={() => switchLanguage(lang)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{lang === "en" ? "🇺🇸" : "🇧🇷"}</span>
              <span>{localeNames[lang]}</span>
            </div>
            {locale === lang && <Check className="h-4 w-4 text-blue-600" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
