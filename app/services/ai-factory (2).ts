"use server"

import type { AIProvider } from './ai-provider.interface'
import { DeepSeekProvider } from './deepseek-provider'

const PROVIDERS = {
  deepseek: DeepSeekProvider
}

export async function getTextProvider(): Promise<AIProvider | null> {
  console.log("AI Factory: Checking providers...")
  
  if (process.env.DEEPSEEK_API_KEY) {
    console.log("AI Factory: Using DeepSeek for text")
    return new (PROVIDERS.deepseek as any)(process.env.DEEPSEEK_API_KEY!, {
      name: 'deepseek',
      type: 'native',
      baseUrl: 'https://api.deepseek.com/v1',
      models: { text: 'deepseek-chat' }
    })
  }
  
  console.log("AI Factory: No providers available")
  return null
}

export async function getImageProvider(): Promise<AIProvider | null> {
  return getTextProvider() // Пока используем тот же
}

export async function getAudioProvider(): Promise<AIProvider | null> {
  return null
}
