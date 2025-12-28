"use server"

import type { AIProvider, ProviderConfig } from "./ai-provider.interface"
import { OpenRouterProvider } from "./providers/openrouter-provider"
import { GeminiProvider } from "./providers/gemini-provider"
import { DeepSeekProvider } from "./providers/deepseek-provider"
import { ClaudeProvider } from "./providers/claude-provider"
import { TogetherProvider } from "./providers/together-provider"

type ProviderType = "text" | "image" | "audio"

export const AI_PROVIDERS: Record<string, ProviderConfig> = {
  openrouter: {
    name: "OpenRouter",
    type: "gateway",
    baseUrl: "https://openrouter.ai/api/v1",
    envKey: "OPENROUTER_API_KEY",
    models: {
      text: [
        "deepseek/deepseek-chat",
        "anthropic/claude-3.5-sonnet",
        "google/gemini-2.5-flash",
        "x-ai/grok-2",
        "mistralai/mistral-large",
        "meta-llama/llama-3.3-70b-instruct",
      ],
      image: ["openrouter/auto"],
      audio: null,
    },
    rateLimits: { rpm: 20, tpm: 250000 },
  },

  deepseek: {
    name: "DeepSeek",
    type: "native",
    baseUrl: "https://api.deepseek.com/v1",
    envKey: "DEEPSEEK_API_KEY",
    models: {
      text: ["deepseek-chat", "deepseek-reasoner"],
      image: null,
      audio: null,
    },
    rateLimits: { rpm: 60, tpm: 1000000 },
  },

  claude: {
    name: "Anthropic Claude",
    type: "native",
    baseUrl: "https://api.anthropic.com/v1",
    envKey: "ANTHROPIC_API_KEY",
    models: {
      text: ["claude-3-5-sonnet-20241022", "claude-3-opus-20240229"],
      image: null,
      audio: null,
    },
    rateLimits: { rpm: 50, tpm: 400000 },
  },

  grok: {
    name: "Grok (xAI)",
    type: "native",
    baseUrl: "https://api.x.ai/v1",
    envKey: "GROK_API_KEY",
    models: {
      text: ["grok-2-1212", "grok-2-vision-1212"],
      image: null,
      audio: null,
    },
    rateLimits: { rpm: 60, tpm: 600000 },
  },

  gemini: {
    name: "Google Gemini",
    type: "native",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta",
    envKey: "GEMINI_API_KEY",
    models: {
      text: ["gemini-2.5-flash-preview-09-2025", "gemini-2.5-pro"],
      image: ["imagen-4.0-generate-001"],
      audio: ["gemini-2.5-flash-preview-tts"],
    },
    rateLimits: { rpm: 15, tpm: 1000000 },
  },

  together: {
    name: "Together AI",
    type: "gateway",
    baseUrl: "https://api.together.xyz/v1",
    envKey: "TOGETHER_API_KEY",
    models: {
      text: ["deepseek-ai/DeepSeek-R1", "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", "Qwen/QwQ-32B-Preview"],
      image: ["black-forest-labs/FLUX.1-schnell"],
      audio: null,
    },
    rateLimits: { rpm: 60, tpm: 600000 },
  },
}

export const DEFAULT_PROVIDER = "openrouter"

const providerCache = new Map<string, AIProvider>()

function createProvider(providerName: string): AIProvider | null {
  if (providerCache.has(providerName)) {
    return providerCache.get(providerName)!
  }

  const config = AI_PROVIDERS[providerName]
  if (!config) {
    console.error(`[AI Factory] Unknown provider: ${providerName}`)
    return null
  }

  const apiKey = process.env[config.envKey]
  if (!apiKey) {
    console.warn(`[AI Factory] ${config.envKey} not configured`)
    return null
  }

  let provider: AIProvider | null = null

  switch (providerName) {
    case "openrouter":
      provider = new OpenRouterProvider(apiKey, config)
      break
    case "gemini":
      provider = new GeminiProvider(apiKey, config)
      break
    case "deepseek":
      provider = new DeepSeekProvider(apiKey, config)
      break
    case "claude":
      provider = new ClaudeProvider(apiKey, config)
      break
    case "together":
      provider = new TogetherProvider(apiKey, config)
      break
    default:
      console.error(`[AI Factory] Provider implementation not found: ${providerName}`)
      return null
  }

  if (provider) {
    providerCache.set(providerName, provider)
  }

  return provider
}

export async function getAIProvider(type: ProviderType): Promise<AIProvider | null> {
  // Get primary provider from env or use default
  const primaryProviderName =
    process.env[`AI_${type.toUpperCase()}_PROVIDER`] || process.env.NEXT_AI_PROVIDER || DEFAULT_PROVIDER

  // Try primary provider
  const primaryProvider = createProvider(primaryProviderName)
  if (primaryProvider) {
    const available = await primaryProvider.isAvailable().catch(() => false)
    if (available) {
      console.log(`[AI Factory] Using ${primaryProvider.getName()} for ${type}`)
      return primaryProvider
    }
  }

  // Try fallback providers
  const fallbackProviders = process.env.FALLBACK_PROVIDERS?.split(",") || []

  for (const fallbackName of fallbackProviders) {
    const fallbackProvider = createProvider(fallbackName.trim())
    if (fallbackProvider) {
      const available = await fallbackProvider.isAvailable().catch(() => false)
      if (available) {
        console.log(`[AI Factory] Falling back to ${fallbackProvider.getName()} for ${type}`)
        return fallbackProvider
      }
    }
  }

  // Smart defaults based on type
  if (type === "image" || type === "audio") {
    const geminiProvider = createProvider("gemini")
    if (geminiProvider) {
      const available = await geminiProvider.isAvailable().catch(() => false)
      if (available) {
        console.log(`[AI Factory] Using Gemini for ${type} (smart default)`)
        return geminiProvider
      }
    }
  }

  console.error(`[AI Factory] No available provider for ${type}`)
  return null
}

export async function getTextProvider(): Promise<AIProvider | null> {
  return getAIProvider("text")
}

export async function getImageProvider(): Promise<AIProvider | null> {
  return getAIProvider("image")
}

export async function getAudioProvider(): Promise<AIProvider | null> {
  return getAIProvider("audio")
}
