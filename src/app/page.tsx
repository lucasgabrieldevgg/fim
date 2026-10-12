"use client"

import { useEffect } from "react"
import { BellRing, CircleHelp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Toaster } from "@/components/ui/sonner"
import { useHashRoute } from "@/hooks/use-hash-route"
import { isValidCode } from "@/lib/fim-shared"
import { Landing } from "@/components/fim/landing"
import { Panel } from "@/components/fim/panel"
import { AgentInstructions } from "@/components/fim/agent-instructions"
import { HowItWorks } from "@/components/fim/how-it-works"

export default function Home() {
  const [route, navigate] = useHashRoute()

  // Título da página muda conforme a visão
  useEffect(() => {
    document.title = "Fim! — o aviso de tarefa concluída do seu agente de IA"
  }, [])

  // Código inválido na URL cai no início
  useEffect(() => {
    if ((route.view === "painel" || route.view === "agente") && !isValidCode(route.code)) {
      navigate("#/")
    }
  }, [route, navigate])

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      <header className="sticky top-0 z-40 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between px-4 py-3">
          <button
            onClick={() => navigate("#/")}
            className="flex items-center gap-2"
            aria-label="Ir para o início"
          >
            <span className="flex size-8 items-center justify-center rounded-lg bg-emerald-600">
              <BellRing className="size-4.5 text-white" />
            </span>
            <span className="text-lg font-extrabold tracking-tight">
              Fim<span className="text-emerald-400">!</span>
            </span>
          </button>
          <nav className="flex items-center gap-1" aria-label="Navegação principal">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("#/")}
              className="text-zinc-400 hover:text-zinc-100"
            >
              Início
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("#/como-funciona")}
              className="text-zinc-400 hover:text-zinc-100"
            >
              <CircleHelp className="size-4" /> Como funciona
            </Button>
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {route.view === "inicio" && <Landing navigate={navigate} />}
        {route.view === "painel" && isValidCode(route.code) && <Panel code={route.code} />}
        {route.view === "agente" && isValidCode(route.code) && (
          <AgentInstructions code={route.code} navigate={navigate} />
        )}
        {route.view === "como-funciona" && <HowItWorks navigate={navigate} />}
      </main>

      <footer className="mt-auto border-t border-zinc-800/80 bg-zinc-950 pb-[env(safe-area-inset-bottom)]">
        <div className="mx-auto flex w-full max-w-4xl flex-col items-center justify-between gap-2 px-4 py-4 text-xs text-zinc-500 sm:flex-row">
          <p>
            Fim! — avisos de conclusão para agentes de IA. Push via{" "}
            <a
              href="https://ntfy.sh"
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-2 hover:text-zinc-300"
            >
              ntfy.sh
            </a>{" "}
            (open source).
          </p>
          <p>Deixe a aba aberta e configure o som do jeito que preferir.</p>
        </div>
      </footer>

      <Toaster theme="dark" position="top-center" richColors />
    </div>
  )
}
