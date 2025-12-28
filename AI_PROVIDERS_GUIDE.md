# Chronos V6 - AI Providers Architecture Guide

## Overview

Chronos V6 uses a **universal API-agnostic architecture** that supports multiple AI providers. You can easily switch between providers or use different providers for different tasks (text, images, audio) without changing any code.

## Supported Providers

### 1. OpenRouter (Recommended Gateway)
**Type:** Gateway to 100+ models  
**Best for:** Flexibility, cost optimization, one-key access  
**Get API Key:** https://openrouter.ai/keys

**Available Models:**
- `deepseek/deepseek-chat` - Fast and cheap text generation
- `anthropic/claude-3.5-sonnet` - Premium quality reasoning
- `google/gemini-2.5-flash` - Fast and intelligent
- `x-ai/grok-2` - xAI's flagship model
- `meta-llama/llama-3.3-70b-instruct` - Open source powerhouse
- `mistralai/mistral-large` - European alternative

**Advantages:**
- One API key for all models
- Automatic fallback if a model is unavailable
- Smart routing and load balancing
- Often cheaper than direct APIs
- Easy model A/B testing

---

### 2. Google Gemini
**Type:** Native API  
**Best for:** Images (Imagen-4), Audio (TTS), Multimodal tasks  
**Get API Key:** https://makersuite.google.com/app/apikey

**Available Models:**
- `gemini-2.5-flash-preview` - Fast text generation
- `gemini-2.5-pro` - Advanced reasoning
- `imagen-4.0-generate-001` - State-of-the-art images
- `gemini-2.5-flash-preview-tts` - Natural voice synthesis

**Advantages:**
- Free tier with generous limits
- Best-in-class image generation (Imagen-4)
- High-quality TTS with multiple voices
- Fast response times

---

### 3. DeepSeek
**Type:** Native API  
**Best for:** Fast, cost-effective text generation  
**Get API Key:** https://platform.deepseek.com/api_keys

**Available Models:**
- `deepseek-chat` - General purpose chat
- `deepseek-reasoner` - Advanced reasoning tasks

**Advantages:**
- Extremely cost-effective
- Fast inference
- Strong reasoning capabilities
- High rate limits

---

### 4. Anthropic Claude
**Type:** Native API  
**Best for:** Premium quality, complex reasoning, long context  
**Get API Key:** https://console.anthropic.com/

**Available Models:**
- `claude-3-5-sonnet-20241022` - Best balance of speed and quality
- `claude-3-opus-20240229` - Maximum quality and reasoning

**Advantages:**
- Industry-leading text quality
- Excellent at nuanced conversations
- Long context windows (200K tokens)
- Strong safety and alignment

---

### 5. Grok (xAI)
**Type:** Native API  
**Best for:** Real-time information, X/Twitter integration  
**Get API Key:** https://console.x.ai/

**Available Models:**
- `grok-2-1212` - Latest flagship model
- `grok-2-vision-1212` - Multimodal with vision

**Advantages:**
- Real-time web information
- Unique personality and humor
- Strong reasoning capabilities

---

### 6. Together AI
**Type:** Gateway + Native  
**Best for:** FLUX image generation, open source models  
**Get API Key:** https://api.together.xyz/settings/api-keys

**Available Models:**
- `deepseek-ai/DeepSeek-R1` - Latest DeepSeek reasoning model
- `meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo` - Fast Llama
- `black-forest-labs/FLUX.1-schnell` - Fast image generation

**Advantages:**
- Access to latest open source models
- FLUX image generation (alternative to Stable Diffusion)
- Competitive pricing
- Fast inference

---

## Configuration Examples

### Example 1: OpenRouter Only (Simplest)
```env
NEXT_AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-xxx
OPENROUTER_TEXT_MODEL=deepseek/deepseek-chat
```

OpenRouter handles everything - text generation through DeepSeek model. Add more models as needed.

---

### Example 2: Budget Setup (Free/Cheap)
```env
NEXT_AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-xxx
OPENROUTER_TEXT_MODEL=deepseek/deepseek-chat
AI_IMAGE_PROVIDER=gemini
GEMINI_API_KEY=xxx
AI_AUDIO_PROVIDER=gemini
FALLBACK_PROVIDERS=deepseek
```

Use OpenRouter with DeepSeek for text (very cheap), Gemini for images/audio (free tier).

---

### Example 3: Premium Setup (Best Quality)
```env
AI_TEXT_PROVIDER=claude
ANTHROPIC_API_KEY=sk-ant-xxx
AI_IMAGE_PROVIDER=together
TOGETHER_API_KEY=xxx
AI_AUDIO_PROVIDER=gemini
GEMINI_API_KEY=xxx
FALLBACK_PROVIDERS=openrouter,deepseek
OPENROUTER_API_KEY=sk-or-xxx
DEEPSEEK_API_KEY=sk-xxx
```

Claude for premium text quality, Together AI for FLUX images, Gemini for audio. Fallback to OpenRouter or DeepSeek if needed.

---

### Example 4: Multi-Provider with Fallbacks
```env
NEXT_AI_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-xxx
OPENROUTER_TEXT_MODEL=anthropic/claude-3.5-sonnet
FALLBACK_PROVIDERS=gemini,deepseek
GEMINI_API_KEY=xxx
DEEPSEEK_API_KEY=sk-xxx
```

Primary: Claude through OpenRouter. If it fails, try Gemini, then DeepSeek.

---

## How It Works

### Architecture Layers

```
Your App
    ↓
AI Actions (app/actions/ai-actions.ts)
    ↓
AI Factory (app/services/ai-factory.ts) ← Smart provider selection
    ↓
Provider Interface (AIProvider)
    ↓
┌─────────────┬──────────┬──────────┬─────────┬──────────┐
│ OpenRouter  │  Gemini  │ DeepSeek │ Claude  │ Together │
└─────────────┴──────────┴──────────┴─────────┴──────────┘
```

### Smart Selection Logic

1. **Check primary provider** (from `NEXT_AI_PROVIDER` or task-specific env var)
2. **Health check** - Is the provider available?
3. **Try fallback providers** (from `FALLBACK_PROVIDERS`)
4. **Smart defaults** - For images/audio, prefer Gemini if available

### Zero Code Changes

Change providers by updating `.env.local` only:

```bash
# Switch from OpenRouter to Claude
AI_TEXT_PROVIDER=claude  # Change this line
# That's it! No code changes needed.
```

---

## Cost Optimization

### Estimated Costs (per 1M tokens)

| Provider | Input | Output | Notes |
|----------|-------|--------|-------|
| DeepSeek | $0.14 | $0.28 | Cheapest |
| OpenRouter (DeepSeek) | $0.14 | $0.28 | Same via gateway |
| Gemini Flash | $0.10 | $0.30 | Free tier available |
| Claude Sonnet | $3.00 | $15.00 | Premium quality |
| Grok-2 | $2.00 | $10.00 | Mid-tier |

### Image Generation Costs

| Provider | Cost per image | Quality |
|----------|----------------|---------|
| Gemini (Imagen-4) | Free tier → $0.04 | Excellent |
| Together AI (FLUX) | $0.008 | Very good |
| OpenRouter (varies) | $0.01-0.05 | Depends on model |

### Recommendations

- **Development:** Use DeepSeek or Gemini (free tier)
- **Production (budget):** OpenRouter with DeepSeek model
- **Production (quality):** Claude through OpenRouter
- **Images:** Gemini Imagen-4 or Together AI FLUX

---

## Adding New Providers

### Step 1: Add to config
```typescript
// config/ai-providers.config.ts
export const AI_PROVIDERS = {
  newprovider: {
    name: "New Provider",
    type: "native",
    baseUrl: "https://api.newprovider.com/v1",
    envKey: "NEWPROVIDER_API_KEY",
    models: {
      text: ["model-name"],
      image: null,
      audio: null,
    },
  },
}
```

### Step 2: Create provider class
```typescript
// app/services/providers/newprovider-provider.ts
export class NewProviderProvider implements AIProvider {
  // Implement interface methods
}
```

### Step 3: Register in factory
```typescript
// app/services/ai-factory.ts
case "newprovider":
  provider = new NewProviderProvider(apiKey)
  break
```

Done! The system automatically integrates the new provider.

---

## Troubleshooting

### "No AI provider available"
- Check that at least one API key is configured in `.env.local`
- Verify the API key is valid (test on provider's website)
- Check provider status pages for outages

### "API error: 401"
- Invalid API key
- Key needs to be regenerated
- Wrong environment variable name

### "API error: 429"
- Rate limit exceeded
- Configure fallback providers
- Wait or upgrade to paid tier

### Provider not working
```bash
# Check logs
[AI Factory] Using OpenRouter for text ← Should see this
[OpenRouter] Text generation error: ... ← Error details
```

Enable fallback providers for automatic recovery.

---

## Best Practices

1. **Always configure fallbacks** - Prevents downtime if primary fails
2. **Use OpenRouter as default** - Maximum flexibility, one key
3. **Separate tasks by provider** - Text via Claude, images via Gemini
4. **Monitor costs** - Check provider dashboards regularly
5. **Test before production** - Verify all providers work
6. **Keep keys secure** - Never commit `.env.local` to git

---

## FAQ

**Q: Can I use multiple providers simultaneously?**  
A: Yes! Configure different providers for text, images, and audio.

**Q: What happens if a provider is down?**  
A: System automatically tries fallback providers in order.

**Q: Which provider is best?**  
A: OpenRouter for flexibility, Claude for quality, DeepSeek for cost, Gemini for images/audio.

**Q: Do I need to change code to switch providers?**  
A: No! Just update `.env.local` environment variables.

**Q: Can I add custom providers?**  
A: Yes! Follow the "Adding New Providers" section above.

---

## Support

For provider-specific issues:
- OpenRouter: https://openrouter.ai/docs
- Gemini: https://ai.google.dev/docs
- DeepSeek: https://platform.deepseek.com/docs
- Claude: https://docs.anthropic.com
- Grok: https://docs.x.ai
- Together AI: https://docs.together.ai

For Chronos V6 architecture questions, check the codebase or create an issue.
```

```ts file="app/actions/gemini-actions.ts" isDeleted="true"
...deleted...
