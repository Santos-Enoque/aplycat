"use client";

import { useLocale, useTranslations } from 'next-intl';
import { useRouter, usePathname } from 'next/navigation';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Globe, Check } from 'lucide-react';
import { locales } from '@/i18n';

export function LanguageSwitcher() {
  const t = useTranslations('navbar');
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    // Remove current locale from pathname if it exists
    const pathnameWithoutLocale = pathname.startsWith(`/${locale}`) 
      ? pathname.slice(`/${locale}`.length) 
      : pathname;
    
    // Construct new path with new locale
    const newPath = newLocale === 'en' 
      ? pathnameWithoutLocale || '/'
      : `/${newLocale}${pathnameWithoutLocale || '/'}`;
    
    router.push(newPath);
  };

  const getLanguageName = (code: string) => {
    switch (code) {
      case 'en':
        return t('english');
      case 'pt':
        return t('portuguese');
      default:
        return code.toUpperCase();
    }
  };

  const getCurrentLanguageFlag = () => {
    switch (locale) {
      case 'en':
        return '🇺🇸';
      case 'pt':
        return '🇧🇷';
      default:
        return '🌐';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{getCurrentLanguageFlag()}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {locales.map((localeCode) => (
          <DropdownMenuItem
            key={localeCode}
            onClick={() => handleLanguageChange(localeCode)}
            className="flex items-center justify-between cursor-pointer"
          >
            <div className="flex items-center gap-2">
              <span>{localeCode === 'en' ? '🇺🇸' : '🇧🇷'}</span>
              <span>{getLanguageName(localeCode)}</span>
            </div>
            {locale === localeCode && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}