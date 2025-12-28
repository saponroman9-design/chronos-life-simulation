"use server"

import type {
  AIProvider,
  AIOptions,
  AITextResult,
  AIImageResult,
  AIAudioResult,
  ProviderConfig,
} from "../ai-provider.interface"
import { pcmToWav } from "@/src/core/utils"

export class GeminiProvider implements AIProvider {
  private apiKey: string
  private config: ProviderConfig

  constructor(apiKey: string, config: ProviderConfig) {
    this.apiKey = apiKey
    this.config = config
  }

  getName(): string {
    return this.config.name
  }

  getType(): "native" | "gateway" {
    return this.config.type
  }

  async generateText(
    systemPrompt: string,
    history: Array<{ role: string; content: string }>,
    input: string,
    options?: AIOptions,
  ): Promise<AITextResult> {
    try {
      const model = options?.model || "gemini-2.5-flash-preview-09-2025"

      const formattedHistory = history.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.content }],
      }))

      const response = await fetch(`${this.config.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: systemPrompt }] },
            ...formattedHistory,
            { role: "user", parts: [{ text: input }] },
          ],
          generationConfig: {
            temperature: options?.temperature || 0.7,
            maxOutputTokens: options?.maxTokens || 2000,
          },
        }),
      })

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || ""

      return { success: true, text }
    } catch (error) {
      console.error("[Gemini] Text generation error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async generateImage(prompt: string, _options?: AIOptions): Promise<AIImageResult> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models/imagen-4.0-generate-001:predict?key=${this.apiKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instances: [{ prompt }],
          parameters: { sampleCount: 1 },
        }),
      })

      if (!response.ok) {
        throw new Error(`Gemini image generation error: ${response.status}`)
      }

      const data = await response.json()
      const image = data.predictions?.[0]?.bytesBase64Encoded

      if (image) {
        return { success: true, image }
      }

      return { success: false, error: "No image data returned" }
    } catch (error) {
      console.error("[Gemini] Image generation error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async generateAudio(text: string, _options?: AIOptions): Promise<AIAudioResult> {
    try {
      const response = await fetch(
        `${this.config.baseUrl}/models/gemini-2.5-flash-preview-tts:generateContent?key=${this.apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Fenrir" } },
              },
            },
          }),
        },
      )

      if (!response.ok) {
        throw new Error(`Gemini TTS error: ${response.status}`)
      }

      const data = await response.json()
      const base64Audio = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data

      if (base64Audio) {
        const wavBlob = pcmToWav(base64Audio)
        const arrayBuffer = await wavBlob.arrayBuffer()
        const buffer = Buffer.from(arrayBuffer)
        const base64Wav = buffer.toString("base64")

        return { success: true, audio: base64Wav }
      }

      return { success: false, error: "No audio data returned" }
    } catch (error) {
      console.error("[Gemini] Audio generation error:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  getTextModels(): string[] {
    return this.config.models.text
  }

  getImageModels(): string[] {
    return this.config.models.image || []
  }

  getAudioModels(): string[] {
    return this.config.models.audio || []
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.config.baseUrl}/models?key=${this.apiKey}`)
      return response.ok
    } catch {
      return false
    }
  }
}
