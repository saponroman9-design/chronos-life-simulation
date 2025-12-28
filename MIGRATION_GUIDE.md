# Migration from Gemini-Only to Universal AI Architecture

## What Changed?

Chronos V6 has been refactored from a Gemini-only architecture to a **universal AI-agnostic system** that supports multiple providers.

### Before (Gemini-Only)
```typescript
// Direct Gemini API calls
import { generateText, generateImage, generateSpeech } from '@/app/actions/gemini-actions'
```

### After (Universal)
```typescript
// Provider-agnostic actions
import { generateText, generateImage, generateSpeech } from '@/app/actions/ai-actions'
// Same interface, but works with ANY provider!
```

---

## Breaking Changes

### 1. File Structure

**Removed:**
- `app/actions/gemini-actions.ts` (replaced)

**Added:**
- `app/services/ai-provider.interface.ts` - Provider interface
- `app/services/ai-factory.ts` - Smart provider selection
- `app/services/providers/` - Individual provider implementations
  - `openrouter-provider.ts`
  - `gemini-provider.ts`
  - `deepseek-provider.ts`
  - `claude-provider.ts`
  - `together-provider.ts`
- `app/actions/ai-actions.ts` - New unified actions
- `config/ai-providers.config.ts` - Provider configurations

### 2. Environment Variables

**Before:**
```env
GEMINI_API_KEY=your_key_here
```

**After (Backward Compatible):**
```env
# Still works! Gemini is auto-detected as fallback
GEMINI_API_KEY=your_key_here

# Or explicitly set primary provider
NEXT_AI_PROVIDER=gemini
GEMINI_API_KEY=your_key_here

# Or use OpenRouter (recommended)
NEXT_AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key_here
```

---

## Migration Steps

### Step 1: Update Imports (Already Done in Codebase)

```typescript
// OLD
import { generateText } from '@/app/actions/gemini-actions'

// NEW (already updated in src/core/SimulationCore.tsx)
import { generateText } from '@/app/actions/ai-actions'
```

### Step 2: Update Environment Variables

```bash
# Copy the new example file
cp .env.local.example .env.local

# Option A: Keep using Gemini (backward compatible)
GEMINI_API_KEY=your_existing_key

# Option B: Switch to OpenRouter (recommended)
NEXT_AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_new_key
OPENROUTER_TEXT_MODEL=deepseek/deepseek-chat
```

### Step 3: Test Your Configuration

```typescript
// The system will log which provider is being used
[AI Factory] Using Gemini for text
[AI Factory] Using Gemini for image
[AI Factory] Using Gemini for audio
```

Check browser console or server logs to verify.

---

## Backward Compatibility

### Existing Gemini Keys Still Work!

If you have `GEMINI_API_KEY` configured:
1. System detects Gemini is available
2. Uses Gemini as smart default for images/audio
3. Can use Gemini for text if no other provider configured

### API Interface Unchanged

All function signatures remain identical:

```typescript
// Before and After - SAME interface
await generateText(systemPrompt, history, input)
await generateImage(prompt)
await generateSpeech(text)
```

Your existing code continues to work without modifications!

---

## Benefits of New Architecture

### 1. Provider Flexibility
Switch providers without code changes - just update `.env.local`

### 2. Cost Optimization
Use cheap providers (DeepSeek) for text, premium (Gemini) for images

### 3. Automatic Fallbacks
If primary provider fails, system tries alternatives

### 4. Easy Testing
Compare different models by changing environment variables

### 5. Future-Proof
Easy to add new providers as they emerge

---

## Recommended Migration Path

### For Development
```env
# Keep using Gemini (no changes needed)
GEMINI_API_KEY=your_existing_key
```

### For Production
```env
# Upgrade to OpenRouter for flexibility
NEXT_AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-xxx
OPENROUTER_TEXT_MODEL=deepseek/deepseek-chat

# Keep Gemini for images/audio
AI_IMAGE_PROVIDER=gemini
AI_AUDIO_PROVIDER=gemini
GEMINI_API_KEY=your_existing_key

# Add fallbacks
FALLBACK_PROVIDERS=gemini,deepseek
```

---

## Troubleshooting

### "No AI provider available"
**Cause:** No API keys configured  
**Fix:** Add at least one provider key to `.env.local`

### "Using Gemini for text" but want different provider
**Cause:** `NEXT_AI_PROVIDER` not set  
**Fix:** 
```env
NEXT_AI_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key
```

### Code still imports from gemini-actions.ts
**Cause:** Old imports in custom code  
**Fix:** Replace with:
```typescript
import { generateText, generateImage, generateSpeech } from '@/app/actions/ai-actions'
```

---

## Support

- **Documentation:** See `AI_PROVIDERS_GUIDE.md`
- **Provider Configs:** Check `config/ai-providers.config.ts`
- **Example Setups:** Review `.env.local.example`

The migration is designed to be **zero-breaking** for existing Gemini users while enabling powerful new capabilities!
