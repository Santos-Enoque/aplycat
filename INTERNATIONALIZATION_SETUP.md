# Internationalization (i18n) Setup

## Overview

Multi-language support has been added to your Aplycat application with support for English (en) and Portuguese (pt). The implementation uses `next-intl`, a powerful internationalization library for Next.js.

## What Was Implemented

### 1. Core Configuration

- **`i18n.ts`**: Main configuration file defining supported locales (en, pt) and message loading
- **`next.config.ts`**: Updated with next-intl plugin integration
- **`middleware.ts`**: Enhanced to handle locale routing while preserving Clerk authentication

### 2. Translation Files

- **`messages/en.json`**: Complete English translations for the landing page
- **`messages/pt.json`**: Complete Portuguese translations for the landing page

### 3. App Structure Changes

- **`app/[locale]/layout.tsx`**: New localized layout with next-intl providers
- **`app/[locale]/page.tsx`**: Localized landing page route
- **`app/layout.tsx`**: Root layout that redirects to appropriate locale
- **`app/page.tsx`**: Root page with language detection and redirection

### 4. Components

- **`components/language-switcher.tsx`**: Intuitive dropdown language switcher
- **`components/landing-page.tsx`**: Updated to use translations with `useTranslations` hook

## How It Works

### URL Structure

The app now uses locale-prefixed URLs:
- `/en` - English version
- `/pt` - Portuguese version
- `/` - Automatically redirects based on browser language preference

### Language Detection

1. **Initial Visit**: Detects browser's `Accept-Language` header
2. **Portuguese Preference**: If browser prefers Portuguese, redirects to `/pt`
3. **Default**: Falls back to English (`/en`)

### Language Switching

Users can switch languages using the language switcher component located in the top-right corner:
- **🇺🇸 English** - Switches to English version
- **🇧🇷 Português** - Switches to Portuguese version

## Features

### ✅ Current Implementation

- **Landing Page**: Fully translated (English ↔ Portuguese)
- **Language Switcher**: Elegant dropdown with flags and language names
- **URL Routing**: Locale-based routing with proper redirects
- **Browser Detection**: Automatic language detection on first visit
- **Authentication**: Clerk integration preserved with locale support

### 🔄 Key Sections Translated

1. **Hero Section**: Main headline, subtitle, and call-to-action
2. **Trial Popup**: Complete offer details and urgency messaging
3. **Upload Component**: File upload instructions and progress
4. **Analysis Results**: Score cards, feedback, and upgrade prompts
5. **Testimonials**: All customer stories and social proof
6. **Trial Banner**: Top promotional banner

## Usage Instructions

### For Users

1. **Automatic Detection**: The site will detect your browser language preference
2. **Manual Switching**: Use the language switcher (🌐) in the top-right corner
3. **URL Access**: Directly visit `/en` for English or `/pt` for Portuguese

### For Developers

#### Adding New Translations

1. **Add to English** (`messages/en.json`):
```json
{
  "NewSection": {
    "title": "New Feature",
    "description": "This is a new feature"
  }
}
```

2. **Add to Portuguese** (`messages/pt.json`):
```json
{
  "NewSection": {
    "title": "Nova Funcionalidade", 
    "description": "Esta é uma nova funcionalidade"
  }
}
```

3. **Use in Component**:
```tsx
import { useTranslations } from 'next-intl';

function NewComponent() {
  const t = useTranslations('NewSection');
  
  return (
    <div>
      <h2>{t('title')}</h2>
      <p>{t('description')}</p>
    </div>
  );
}
```

#### Adding New Locales

1. Update `i18n.ts` to include new locale
2. Create new message file in `messages/` directory
3. Add language option to `components/language-switcher.tsx`

## Technical Details

### File Structure
```
├── i18n.ts                          # Main i18n configuration
├── messages/
│   ├── en.json                       # English translations
│   └── pt.json                       # Portuguese translations
├── app/
│   ├── [locale]/
│   │   ├── layout.tsx               # Localized layout
│   │   └── page.tsx                 # Localized landing page
│   ├── layout.tsx                   # Root layout (redirects)
│   └── page.tsx                     # Root page (language detection)
├── components/
│   ├── language-switcher.tsx        # Language selection component
│   └── landing-page.tsx             # Internationalized landing page
├── middleware.ts                     # Enhanced with locale routing
└── next.config.ts                    # Updated with next-intl plugin
```

### Middleware Integration

The middleware handles both internationalization and authentication:
1. **Locale Detection**: Processes locale from URL
2. **Route Matching**: Supports both localized and non-localized protected routes
3. **Redirects**: Maintains locale in authentication redirects

## Testing

### Test the Implementation

1. **Visit Root URL**: Should auto-detect and redirect to appropriate locale
2. **Direct Locale Access**: Test `/en` and `/pt` directly
3. **Language Switcher**: Use the dropdown to switch between languages
4. **Browser Language**: Change browser language and revisit to test detection

### Verification Points

- ✅ Text changes when switching languages
- ✅ URLs update with locale prefix
- ✅ Authentication flows work in both languages
- ✅ Language preference persists during navigation

## Browser Support

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **JavaScript Required**: Language switching requires client-side JavaScript
- **Fallback**: Defaults to English if locale detection fails

## Performance

- **Optimized Loading**: Only loads messages for current locale
- **Server-Side**: Initial page render includes translated content
- **Client-Side**: Language switching is instant without page reload

---

**Note**: This implementation covers the landing page. To extend internationalization to other parts of the app (dashboard, forms, etc.), follow the same pattern of adding translations to the message files and using the `useTranslations` hook in components.