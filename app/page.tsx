"use client"

import { useState, useCallback, memo, useEffect } from "react"
import dynamic from "next/dynamic"
import { useSimulationCore } from "@/src/core/SimulationCore"
import { QuickLoad, saveToQuickLoad } from "@/src/ui/QuickLoad"
import { ThemeToggle } from "@/src/ui/ThemeToggle"
import { DNAPreview } from "@/src/ui/DNAPreview"
import type { Character, BioStats } from "@/src/core/types"

const CharacterCreator = dynamic(() => import("@/src/ui/CharacterCreator"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-foreground text-sm uppercase tracking-widest">Loading Chronos...</div>
    </div>
  ),
})

const StoryInterface = dynamic(() => import("@/src/ui/StoryInterface"), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse text-foreground text-sm uppercase tracking-widest">Initializing Simulation...</div>
    </div>
  ),
})

type Screen = "home" | "create" | "preview" | "game"

const ChronosApp = memo(function ChronosApp() {
  const [screen, setScreen] = useState<Screen>("home")
  const [showDNAPreview, setShowDNAPreview] = useState(false)
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false)
  const core = useSimulationCore()

  // Check if there are saved characters on mount
  useEffect(() => {
    const saved = localStorage.getItem("chronos_quick_load")
    if (!saved || JSON.parse(saved).length === 0) {
      setScreen("create")
    }
  }, [])

  const handleLoadCharacter = useCallback(
    (character: Character, stats: BioStats) => {
      core.setCharacter(character)
      core.setGameState((prev) => ({
        ...prev,
        stats,
        messages: [
          {
            id: "continue",
            role: "system",
            content: "Соединение восстановлено. Продолжаем симуляцию...",
            timestamp: Date.now(),
          },
        ],
      }))
      setScreen("game")
      setTimeout(() => core.actions.sendMessage("", true), 500)
    },
    [core],
  )

  const handleNewCharacter = useCallback(() => {
    setScreen("create")
  }, [])

  const handlePreviewDNA = useCallback(() => {
    if (!core.character.name) {
      alert("Введите имя субъекта")
      return
    }
    setShowDNAPreview(true)
  }, [core.character.name])

  const handleGenerateAvatarInPreview = useCallback(async () => {
    setIsGeneratingAvatar(true)
    try {
      await core.actions.generateAvatar()
    } finally {
      setIsGeneratingAvatar(false)
    }
  }, [core.actions])

  const handleConfirmAndStart = useCallback(() => {
    setShowDNAPreview(false)
    // Save to quick load
    saveToQuickLoad(core.character, core.gameState.stats)
    setScreen("game")

    if (core.gameState.messages.length === 0) {
      core.setGameState((prev) => ({
        ...prev,
        messages: [
          {
            id: "init",
            role: "system",
            content: "Соединение с ядром установлено.",
            timestamp: Date.now(),
          },
        ],
      }))
      setTimeout(() => core.actions.sendMessage("", true), 500)
    }
  }, [core])

  const handleStartFromCreator = useCallback(() => {
    handlePreviewDNA()
  }, [handlePreviewDNA])

  // Home screen with QuickLoad
  if (screen === "home") {
    return (
      <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between p-4 bg-background/80 backdrop-blur border-b border-border">
          <h1 className="text-xl font-bold tracking-wider">CHRONOS</h1>
          <ThemeToggle />
        </header>

        {/* Main content */}
        <main className="pt-20 pb-8 px-4 max-w-4xl mx-auto">
          <div className="space-y-8">
            {/* Hero */}
            <div className="text-center py-8">
              <h2 className="text-3xl font-bold mb-2">Life Simulation</h2>
              <p className="text-muted-foreground">Choose a character or create a new one</p>
            </div>

            {/* Quick Load */}
            <QuickLoad
              onLoadCharacter={handleLoadCharacter}
              onNewCharacter={handleNewCharacter}
              themeAccent={core.theme.accent}
            />
          </div>
        </main>
      </div>
    )
  }

  // Create screen
  if (screen === "create") {
    return (
      <>
        {/* Theme toggle in creator */}
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>

        <CharacterCreator core={core} onStart={handleStartFromCreator} />

        {/* DNA Preview Modal */}
        <DNAPreview
          character={core.character}
          isOpen={showDNAPreview}
          onClose={() => setShowDNAPreview(false)}
          onEdit={() => setShowDNAPreview(false)}
          onGenerateAvatar={handleGenerateAvatarInPreview}
          onConfirm={handleConfirmAndStart}
          isGenerating={isGeneratingAvatar}
          themeAccent={core.theme.accent}
        />
      </>
    )
  }

  // Game screen
  return (
    <>
      <StoryInterface core={core} />
    </>
  )
})

export default ChronosApp
