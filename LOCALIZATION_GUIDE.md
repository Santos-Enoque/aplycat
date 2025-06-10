# Localization Guide

This document outlines the internationalization (i18n) implementation for the Aplycat application using `next-intl`.

## Supported Languages

- **English (en)** - Default language
- **Portuguese (pt)** - Brazil Portuguese

## File Structure

```
/
├── i18n.ts                          # Main i18n configuration
├── middleware.ts                     # Updated to handle locale routing
├── messages/
│   ├── en.json                       # English translations
│   └── pt.json                       # Portuguese translations
├── app/
│   ├── layout.tsx                    # Root layout (redirects to locale)
│   ├── page.tsx                      # Root page (redirects to default locale)
│   └── [locale]/
│       ├── layout.tsx                # Locale-specific layout with NextIntlClientProvider
│       ├── page.tsx                  # Localized home page
│       ├── dashboard/
│       ├── analyze/
│       └── improve/
├── components/
│   ├── language-switcher.tsx         # Language selection component
│   ├── unified-navbar.tsx            # Updated with translations
│   ├── dashboard/
│   │   └── dashboard-content.tsx     # Updated with translations
│   ├── landing-page.tsx              # Wrapper for internationalized version
│   └── landing-page-i18n.tsx         # Full internationalized landing page
└── next.config.ts                    # Updated with next-intl plugin
```

## Key Features

### 1. Language Switcher
- Added to the navbar for easy language switching
- Shows current language flag and allows selection
- Preserves current page when switching languages

### 2. URL Structure
- `en.aplycat.com/` or `aplycat.com/` for English
- `aplycat.com/pt/` for Portuguese
- Automatic detection and redirects via middleware

### 3. Localized Pages
All main user-facing pages have been localized:
- Landing page
- Dashboard
- Resume analysis page
- Resume improvement page
- All components and modals

## Configuration

### i18n.ts
Main configuration file that:
- Defines supported locales
- Sets the default locale (English)
- Loads appropriate message files

### middleware.ts
Enhanced to handle:
- Locale detection from URL
- Authentication redirects with locale support
- Route protection with internationalization

### next.config.ts
Updated with:
- `next-intl` plugin integration
- Proper webpack configuration

## Translation Structure

The translation files (`messages/en.json` and `messages/pt.json`) are organized by feature:

```json
{
  "common": {
    "loading": "Loading...",
    "error": "Error",
    // ... common UI strings
  },
  "navbar": {
    "signIn": "Sign In",
    "language": "Language",
    // ... navbar specific strings
  },
  "landingPage": {
    "hero": {
      "title": "Get Your Resume Brutally Roasted",
      // ... hero section strings
    },
    "features": {
      // ... features section strings
    }
    // ... other landing page sections
  },
  "dashboard": {
    // ... dashboard specific strings
  },
  "analyze": {
    // ... analysis page strings
  },
  "improve": {
    // ... improvement page strings
  }
}
```

## Usage in Components

### Basic Usage
```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('namespace');
  
  return <h1>{t('title')}</h1>;
}
```

### Multiple Namespaces
```tsx
import { useTranslations } from 'next-intl';

function MyComponent() {
  const t = useTranslations('landingPage.hero');
  const tCommon = useTranslations('common');
  
  return (
    <div>
      <h1>{t('title')}</h1>
      <button>{tCommon('submit')}</button>
    </div>
  );
}
```

## Language Switcher Component

The `LanguageSwitcher` component provides:
- Dropdown menu with available languages
- Flag icons for visual identification
- Proper routing that preserves current page
- Current language indication

## Routing

### URL Patterns
- `/` → redirects to `/en`
- `/en` → English homepage
- `/pt` → Portuguese homepage
- `/en/dashboard` → English dashboard
- `/pt/dashboard` → Portuguese dashboard

### Middleware Logic
1. Skips API routes and static files
2. Applies internationalization for pages
3. Handles authentication redirects with locale awareness
4. Preserves locale in protected route redirects

## Development

### Adding New Translations
1. Add the key-value pair to both `en.json` and `pt.json`
2. Use the translation in your component with `useTranslations`
3. Ensure the namespace structure matches

### Adding New Languages
1. Add the locale to `locales` array in `i18n.ts`
2. Create a new message file (e.g., `messages/es.json`)
3. Update the `LanguageSwitcher` component to include the new language
4. Update middleware route matchers if needed

## Testing

### Manual Testing
1. Start the development server: `npm run dev`
2. Navigate to `/` (should redirect to `/en`)
3. Use the language switcher to test Portuguese
4. Verify all text changes appropriately
5. Test navigation between pages in different languages

### URL Testing
- Direct navigation to `/pt/dashboard`
- Language switching from different pages
- Authentication flows with different locales

## Production Considerations

### CDN and Caching
- Ensure proper cache headers for locale-specific content
- Consider geolocation-based default language detection

### SEO
- Implement `hreflang` tags for better SEO
- Consider separate sitemaps for each language
- Ensure proper meta tags are localized

### Performance
- Translation files are loaded on demand
- Client-side routing preserves language context
- Static generation works with locale routing

## Troubleshooting

### Common Issues
1. **Translations not loading**: Check file paths and namespace structure
2. **Redirects not working**: Verify middleware configuration
3. **Language switcher not preserving page**: Check routing logic in component

### Debug Mode
Enable debug mode in `i18n.ts` for development:
```ts
export default getRequestConfig(async ({ locale }) => {
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
    onError: (error) => console.error('i18n Error:', error),
  };
});
```

## Future Enhancements

1. **Browser Language Detection**: Automatically detect user's browser language
2. **RTL Support**: Add support for right-to-left languages
3. **Pluralization**: Implement proper plural forms for different languages
4. **Date/Number Formatting**: Locale-specific formatting
5. **Currency Localization**: Display prices in local currency formats

---

This implementation provides a solid foundation for internationalization and can be easily extended to support additional languages and features.