# Chronos Life Simulation v6

## Setup

1. **Install dependencies:**
```bash
npm install
```

2. **Configure API Keys (IMPORTANT - Security Fix):**

Create a `.env.local` file in the root directory:

```env
# IMPORTANT: Use GEMINI_API_KEY (not NEXT_PUBLIC_GEMINI_API_KEY)
# This keeps your API key secure on the server
GEMINI_API_KEY=your_gemini_api_key_here
```

Get your Gemini API key at: https://makersuite.google.com/app/apikey

**Security Note:** 
- The API key is now kept ONLY on the server
- All API calls go through Server Actions
- Your key is never exposed to the client

3. **Run development server:**
```bash
npm run dev
```

## Security Features

- ✅ API keys secured on server (Server Actions)
- ✅ No client-side API key exposure
- ✅ TypeScript strict mode
- ✅ React best practices (hooks, memoization)
- ✅ Performance optimizations (useCallback, useMemo, memo)
- ✅ Memory leak prevention (cleanup functions)
- ✅ Accessibility (ARIA labels, keyboard navigation)
- ✅ LocalStorage quota handling (graceful degradation)
- ✅ Comprehensive error boundaries

## Architecture

- **Server Actions** (`app/actions/gemini-actions.ts`) - Secure API calls
- **Client Components** - UI and state management
- **Environment Variables** - Server-only configuration

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
