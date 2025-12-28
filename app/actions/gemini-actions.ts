"use server"

import { pcmToWav } from "@/src/core/utils"

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || ""

if (!DEEPSEEK_API_KEY) {
  console.warn("[Server] DEEPSEEK_API_KEY not configured")
}

export async function generateText(
  systemPrompt: string,
  history: Array<{ role: string; content: string }>,
  input: string,
) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY not configured")
  }

  try {
    // Форматируем историю под OpenAI формат
    const messages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.role === "user" ? "user" : "assistant",
        content: m.content,
      })),
      { role: "user", content: input },
    ]

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",  // или deepseek-reasoner
        messages,
        temperature: 0.7,
        max_tokens: 1000,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} - ${response.statusText}`)
    }

    const data = await response.json()
    const rawText = data.choices?.[0]?.message?.content || "..."

    return { success: true, text: rawText }
  } catch (error) {
    console.error("[Server] Text generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}

export async function generateSpeech(text: string) {
  if (!DEEPSEEK_API_KEY) {
    return { success: false, error: "API key not configured" }
  }

  // DeepSeek TTS пока нет, возвращаем fallback
  console.warn("[Server] TTS not available with DeepSeek, using fallback")
  return {
    success: false,
    error: "TTS unavailable with DeepSeek (use text simulation)",
  }
}

export async function generateImage(prompt: string) {
  if (!DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY not configured")
  }

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-image",  // DeepSeek image model
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image",
                image_url: {
                  url: "https://api.deepseek.com/v1/images/generations" // placeholder
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`Image generation failed: ${response.status}`)
    }

    const data = await response.json()
    // DeepSeek возвращает URL изображения
    const imageUrl = data.choices?.[0]?.message?.content || null

    if (imageUrl) {
      return {
        success: true,
        image: imageUrl,  // URL вместо base64
      }
    }

    return { success: false, error: "No image data" }
  } catch (error) {
    console.error("[Server] Image generation error:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    }
  }
}
