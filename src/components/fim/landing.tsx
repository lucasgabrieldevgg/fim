"use client"

import { useEffect, useState } from "react"
import {
  ArrowRight,
  BellRing,
  BotMessageSquare,
  KeyRound,
  ListChecks,
  ShieldCheck,
  Sparkles,
  Smartphone,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { CODE_REGEX, generateCode, isValidCode } from "@/lib/fim-shared"

const CODES_KEY = "fim-codes"

export function Landing({ navigate }: { navigate: (to: string) => void }) {
  const [code, setCode] = useState("")
  const [recent, setRecent] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    // lê o localStorage fora do fluxo síncrono do efeito (evita render em cascata)
    const id = setTimeout(() => {
      if (!alive) return
      try {
        const saved = JSON.parse(localStorage.getItem(CODES_KEY) ?? "[]")
        if (alive && Array.isArray(saved)) setRecent(saved.slice(0, 4))
      } catch {}
    }, 0)
    return () => {
      alive = false
      clearTimeout(id)
    }
  }, [])

  const remember = (c: string) => {
    try {
      const cur = JSON.parse(localStorage.getItem(CODES_KEY) ?? "[]") as string[]
      const next = [c, ...cur.filter((x) => x !== c)].slice(0, 6)
      localStorage.setItem(CODES_KEY, JSON.stringify(next))
    } catch {}
  }

  const openPanel = (c: string) => {
    if (!isValidCode(c)) {
      setError("O código precisa ter de 4 a 64 caracteres (letras, números, - ou _).")
      return
    }
    setError(null)
    remember(c)
    fetch("/api/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: c }),
    }).catch(() => {})
    navigate(`#/painel/${c}`)
  }

  const gen = () => {
    const c = generateCode()
    setCode(c)
    setError(null)
    toast.success("Código gerado! Anote ou guarde este painel nos favoritos.")
  }

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-16">
      {/* Hero */}
      <div className="text-center">
        <Badge
          variant="outline"
          className="gap-1.5 border-emerald-800 bg-emerald-950/40 text-emerald-400"
        >
          <Sparkles className="size-3.5" />
          Gratuito • sem cadastro • push via ntfy.sh
        </Badge>
        <h1 className="mt-5 text-balance text-4xl font-extrabold tracking-tight text-zinc-50 sm:text-5xl">
          Seu agente de IA terminou.{" "}
          <span className="text-emerald-400">Você fica sabendo na hora.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-pretty text-lg text-zinc-400">
          Deixe esta aba aberta, passe as instruções para o seu agente e vá fazer outra
          coisa. Quando a tarefa acabar, o agente envia uma requisição REST e o app toca
          o aviso na hora, com título definido pela própria IA e, se você quiser, um
          alarme sonoro.
        </p>
      </div>

      {/* Entrada de código */}
      <Card className="mt-10 border-zinc-800 bg-zinc-900/60">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="size-5 text-emerald-400" />
            Crie ou abra seu canal
          </CardTitle>
          <CardDescription>
            O código é o nome do seu canal de avisos e também a sua chave secreta.
            Quem tiver o código consegue enviar avisos para você, então prefira o código
            gerado automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              value={code}
              onChange={(e) => {
                setCode(e.target.value)
                setError(null)
              }}
              onKeyDown={(e) => e.key === "Enter" && openPanel(code.trim())}
              placeholder="fim-xxxxxxxxxxxx"
              className="h-11 flex-1 border-zinc-700 bg-zinc-950 font-mono"
              aria-label="Código do canal"
              maxLength={64}
            />
            <div className="flex gap-3">
              <Button variant="outline" onClick={gen} className="h-11 flex-1 border-zinc-700 sm:flex-none">
                Gerar código
              </Button>
              <Button
                onClick={() => openPanel(code.trim())}
                className="h-11 flex-1 bg-emerald-600 hover:bg-emerald-500 sm:flex-none"
              >
                Abrir painel <ArrowRight className="size-4" />
              </Button>
            </div>
          </div>
          {error && <p className="text-sm text-red-400">{error}</p>}
          {recent.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-zinc-500">Seus canais recentes:</span>
              {recent.map((c) => (
                <button
                  key={c}
                  onClick={() => openPanel(c)}
                  className="rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 font-mono text-xs text-emerald-400 transition-colors hover:border-emerald-700"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Passos */}
      <ol className="relative mt-12 space-y-10 border-l border-zinc-800 pl-8">
        <li className="relative">
          <span className="absolute -left-[41px] flex size-8 items-center justify-center rounded-full border border-emerald-800 bg-zinc-950 text-sm font-bold text-emerald-400">
            1
          </span>
          <h3 className="text-lg font-semibold text-zinc-100">Abra o painel</h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            Gere seu código e deixe a aba do painel aberta. Ative as notificações do
            sistema e escolha entre o ding curto e o alarme contínuo. Pode fechar os
            olhos que a gente grita por você.
          </p>
        </li>
        <li className="relative">
          <span className="absolute -left-[41px] flex size-8 items-center justify-center rounded-full border border-emerald-800 bg-zinc-950 text-sm font-bold text-emerald-400">
            2
          </span>
          <h3 className="text-lg font-semibold text-zinc-100">Configure o agente</h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            Copie as instruções prontas e cole nas regras do seu agente (Claude, Cursor,
            etc.). Elas mandam a IA enviar um POST REST simples como última ação da
            tarefa, com o título que ela quiser.
          </p>
        </li>
        <li className="relative">
          <span className="absolute -left-[41px] flex size-8 items-center justify-center rounded-full border border-emerald-800 bg-zinc-950 text-sm font-bold text-emerald-400">
            3
          </span>
          <h3 className="text-lg font-semibold text-zinc-100">Receba o aviso</h3>
          <p className="mt-1 text-sm leading-relaxed text-zinc-400">
            A IA termina, a requisição sai, o painel notifica na hora e toca o alarme (se
            ativado). Com o app ntfy no celular, você recebe push mesmo longe do
            computador.
          </p>
        </li>
      </ol>

      {/* Selos */}
      <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-zinc-500">
        <span className="flex items-center gap-2">
          <BellRing className="size-4 text-emerald-500" /> Notificação + título customizado
        </span>
        <span className="flex items-center gap-2">
          <ListChecks className="size-4 text-emerald-500" /> Histórico de avisos
        </span>
        <span className="flex items-center gap-2">
          <BotMessageSquare className="size-4 text-emerald-500" /> Feito para qualquer agente REST
        </span>
        <span className="flex items-center gap-2">
          <Smartphone className="size-4 text-emerald-500" /> Instala como app no celular
        </span>
        <span className="flex items-center gap-2">
          <ShieldCheck className="size-4 text-emerald-500" /> Sem login, sem rastreamento
        </span>
      </div>

      <div className="mt-8 text-center">
        <Button
          variant="link"
          className="text-emerald-400"
          onClick={() => navigate("#/como-funciona")}
        >
          Ver como funciona em detalhes (celular, APK, deploy) <ArrowRight className="size-4" />
        </Button>
      </div>
    </div>
  )
}
