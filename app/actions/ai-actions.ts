"use server"

import { getTextProvider, getImageProvider, getAudioProvider } from "../services/ai-factory"

export async function generateText(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  input: string,
) {
  const provider = await getTextProvider()

  if (!provider) {
    return {
      success: false,
      error: "No AI text provider available. Please configure API keys.",
    }
  }

  try {
    const result = await provider.generateText(systemPrompt, history, input)
    return result
  } catch (error) {
    console.error("[AI Actions] Text generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function generateImage(prompt: string) {
  const provider = await getImageProvider()

  if (!provider) {
    return {
      success: false,
      error: "No AI image provider available. Please configure API keys.",
    }
  }

  try {
    const result = await provider.generateImage(prompt)
    return result
  } catch (error) {
    console.error("[AI Actions] Image generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function generateSpeech(text: string) {
  const provider = await getAudioProvider()

  if (!provider) {
    return {
      success: false,
      error: "No AI audio provider available. Please configure API keys.",
    }
  }

  try {
    const result = await provider.generateAudio(text)
    return result
  } catch (error) {
    console.error("[AI Actions] Audio generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function* generateTextStream(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  input: string,
): AsyncGenerator<string, void, unknown> {
  const provider = await getTextProvider()

  if (!provider) {
    yield "[ERROR] No AI text provider available. Please configure API keys."
    return
  }

  try {
    // Check if provider supports streaming
    if (provider.generateTextStream) {
      yield* provider.generateTextStream(systemPrompt, history, input)
    } else {
      // Fallback: generate full text and yield word by word
      const result = await provider.generateText(systemPrompt, history, input)
      if (result.success && result.text) {
        const words = result.text.split(/(\s+)/)
        for (const word of words) {
          yield word
          // Small delay between words for effect
          await new Promise((resolve) => setTimeout(resolve, 20))
        }
      } else {
        yield result.error || "[ERROR] Unknown error"
      }
    }
  } catch (error) {
    console.error("[AI Actions] Streaming error:", error)
    yield `[ERROR] ${error instanceof Error ? error.message : "Unknown error"}`
  }
}
