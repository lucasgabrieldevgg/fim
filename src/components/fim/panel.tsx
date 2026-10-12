"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import {
  AlarmClock,
  BellOff,
  BellRing,
  BotMessageSquare,
  CircleCheck,
  CircleDashed,
  Loader2,
  MonitorSmartphone,
  RadioTower,
  Send,
  Trash2,
  Volume2,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { AlarmEngine } from "@/lib/audio"
import {
  buildAgentInstructions,
  generateCode,
  SOUND_MODES,
  type SoundMode,
} from "@/lib/fim-shared"
import { CopyButton } from "./copy-button"

type Item = { key: string; title: string; message: string; at: number }

type Status = "conectando" | "tempo-real" | "alternativo"

type WakeLockSentinelLike = { release: () => Promise<void>; released: boolean }
type WakeLockApi = { request: (type: "screen") => Promise<WakeLockSentinelLike> }

const historyKey = (code: string) => `fim-hist-${code}`
const SOUND_KEY = "fim-sound"

// Ritmos do painel: verificação alternativa, teto do alarme e limites de histórico
const POLL_INTERVAL_MS = 5000
const ALARM_AUTOSTOP_MS = 120_000
// O mesmo aviso chega pelo SSE (~1 s) e pelo polling (até 5 s): a assinatura
// título+mensagem compara a HORA DA MENSAGEM, não o momento da chegada — assim a
// duplicação entre canais é filtrada (mesma msg tem at quase igual) e avisos
// legítimos repetidos (at novo) continuam passando.
const SIG_WINDOW_MS = 30_000
const SIG_MAP_MAX = 300
const SIG_PRUNE_MS = 600_000
const HISTORY_CAP = 50
const LOCAL_HISTORY_CAP = 30
const SEED_LIMIT = 20
const POLL_LIMIT = 15

function relativeTime(at: number): string {
  const diff = Date.now() - at
  if (diff < 15_000) return "agora"
  if (diff < 60_000) return `há ${Math.floor(diff / 1000)} s`
  if (diff < 3_600_000) return `há ${Math.floor(diff / 60_000)} min`
  if (diff < 86_400_000) return `há ${Math.floor(diff / 3_600_000)} h`
  return new Date(at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
}

export function Panel({ code }: { code: string }) {
  const [status, setStatus] = useState<Status>("conectando")
  const [items, setItems] = useState<Item[]>([])
  const [current, setCurrent] = useState<Item | null>(null)
  const [ringing, setRinging] = useState(false)
  const [soundMode, setSoundMode] = useState<SoundMode>("ding")
  const [permission, setPermission] = useState<NotificationPermission>("default")
  const [wakeLockOn, setWakeLockOn] = useState(false)
  const [testing, setTesting] = useState(false)

  const engineRef = useRef<AlarmEngine | null>(null)
  const esRef = useRef<EventSource | null>(null)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const seenKeysRef = useRef<Set<string>>(new Set())
  const seenSigsRef = useRef<Map<string, number>>(new Map())
  const mountedAtRef = useRef<number>(Date.now())
  const autoStopRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const flashRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const wakeLockRef = useRef<WakeLockSentinelLike | null>(null)
  const soundModeRef = useRef<SoundMode>("ding")

  const instructions = buildAgentInstructions(
    typeof window === "undefined" ? "" : window.location.origin,
    code
  )

  // Dedupe por id (canal ntfy vs banco) e por assinatura título+mensagem+hora
  const isDup = useCallback((key: string, sig: string, at: number) => {
    if (seenKeysRef.current.has(key)) return true
    const lastAt = seenSigsRef.current.get(sig)
    if (lastAt !== undefined && Math.abs(at - lastAt) < SIG_WINDOW_MS) return true
    seenKeysRef.current.add(key)
    seenSigsRef.current.set(sig, at)
    if (seenSigsRef.current.size > SIG_MAP_MAX) {
      const cutoff = Date.now() - SIG_PRUNE_MS
      for (const [s, t] of seenSigsRef.current) {
        if (t < cutoff) seenSigsRef.current.delete(s)
      }
    }
    return false
  }, [])

  const fireEffects = useCallback((title: string, message: string) => {
    // 1) notificação do sistema
    try {
      if (typeof Notification !== "undefined" && Notification.permission === "granted") {
        const n = new Notification(title, {
          body: message || "Seu agente de IA terminou a tarefa.",
          icon: "/icon-192.png",
          tag: "fim-notificacao",
        })
        n.onclick = () => window.focus()
      }
    } catch {
      /* ambiente sem Notification */
    }

    // 2) som
    const mode = soundModeRef.current
    if (mode === "ding") {
      engineRef.current?.ding()
    } else if (mode === "alarme") {
      engineRef.current?.startAlarm()
      setRinging(true)
      if (autoStopRef.current) clearTimeout(autoStopRef.current)
      autoStopRef.current = setTimeout(() => setRinging(false), ALARM_AUTOSTOP_MS)
    }
  }, [])

  const stopRinging = useCallback(() => {
    engineRef.current?.stopAlarm()
    setRinging(false)
    if (autoStopRef.current) {
      clearTimeout(autoStopRef.current)
      autoStopRef.current = null
    }
  }, [])

  const ingest = useCallback(
    (item: Item, live: boolean) => {
      const sig = `${item.title}||${item.message}`
      if (isDup(item.key, sig, item.at)) return
      setItems((prev) => [item, ...prev].slice(0, HISTORY_CAP))
      setCurrent(item)
      if (live && item.at >= mountedAtRef.current) {
        fireEffects(item.title, item.message)
      }
    },
    [fireEffects, isDup]
  )

  useEffect(() => {
    mountedAtRef.current = Date.now()
    seenKeysRef.current = new Set()
    seenSigsRef.current = new Map()
    engineRef.current = new AlarmEngine()

    // modo de som salvo
    try {
      const saved = localStorage.getItem(SOUND_KEY) as SoundMode | null
      if (saved && ["ding", "alarme", "mudo"].includes(saved)) {
        setSoundMode(saved)
        soundModeRef.current = saved
      }
      const savedLocally = JSON.parse(
        localStorage.getItem(historyKey(code)) ?? "[]"
      ) as Item[]
      if (Array.isArray(savedLocally)) {
        for (const it of savedLocally) {
          const sig = `${it.title}||${it.message}`
          if (isDup(it.key, sig)) continue
          setItems((prev) => [...prev, it])
        }
      }
    } catch {
      /* localStorage indisponível */
    }

    // seed do servidor (mais antigo primeiro para o mais novo ficar no topo)
    fetch(`/api/history?code=${encodeURIComponent(code)}&limit=${SEED_LIMIT}`, {
      cache: "no-store",
    })
      .then((r) => r.json())
      .then((payload) => {
        if (!payload?.ok || !Array.isArray(payload.items)) return
        for (const row of [...payload.items].reverse()) {
          const at = Date.parse(row.createdAt)
          ingest(
            { key: `db:${row.id}`, title: row.title, message: row.message, at },
            false
          )
        }
      })
      .catch(() => {
        /* sem seed agora: o polling preenche a lista em segundos */
      })

    // registra o código para o painel saber que o canal existe
    fetch("/api/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    }).catch(() => {
      /* melhor esforço: o canal funciona mesmo sem registro local */
    })

    // desbloqueia áudio no primeiro clique
    const unlock = () => engineRef.current?.unlock()
    window.addEventListener("pointerdown", unlock, { once: true })

    // SSE em tempo real no ntfy.sh (CORS liberado no servidor deles)
    let cancelled = false
    const connectSSE = () => {
      if (cancelled) return
      try {
        const es = new EventSource(`https://ntfy.sh/${encodeURIComponent(code)}/sse`)
        esRef.current = es
        es.onopen = () => setStatus("tempo-real")
        es.onerror = () => {
          // o EventSource reconecta sozinho; o polling cobre no intervalo
          setStatus((s) => (s === "tempo-real" ? "alternativo" : s))
        }
        es.onmessage = (ev) => {
          try {
            const ntfyEvent = JSON.parse(ev.data) as {
              id?: string
              event?: string
              title?: string
              message?: string
              time?: number
            }
            if (ntfyEvent.event !== "message") return
            ingest(
              {
                key: `ntfy:${ntfyEvent.id ?? `${ntfyEvent.time}-${ntfyEvent.title}`}`,
                title: ntfyEvent.title || "Tarefa concluída",
                message: ntfyEvent.message || "",
                at: (ntfyEvent.time ?? Math.floor(Date.now() / 1000)) * 1000,
              },
              true
            )
          } catch {
            /* linha keepalive ou payload parcial: ignorar */
          }
        }
      } catch {
        setStatus("alternativo")
      }
    }
    connectSSE()

    // polling no nosso banco (caminho principal, independe do ntfy)
    const poll = async () => {
      try {
        const r = await fetch(
          `/api/history?code=${encodeURIComponent(code)}&limit=${POLL_LIMIT}`,
          { cache: "no-store" }
        )
        const payload = await r.json()
        if (payload?.ok && Array.isArray(payload.items)) {
          for (const row of [...payload.items].reverse()) {
            const at = Date.parse(row.createdAt)
            ingest(
              { key: `db:${row.id}`, title: row.title, message: row.message, at },
              true
            )
          }
        }
        setStatus((s) => (s === "conectando" ? "alternativo" : s))
      } catch {
        setStatus((s) => (s === "conectando" ? "alternativo" : s))
      }
    }
    void poll()
    pollTimerRef.current = setInterval(poll, POLL_INTERVAL_MS)

    if (typeof Notification !== "undefined") {
      setPermission(Notification.permission)
    }

    return () => {
      cancelled = true
      esRef.current?.close()
      esRef.current = null
      if (pollTimerRef.current) clearInterval(pollTimerRef.current)
      engineRef.current?.stopAlarm()
      if (autoStopRef.current) clearTimeout(autoStopRef.current)
      if (flashRef.current) clearInterval(flashRef.current)
      wakeLockRef.current?.release().catch(() => {})
      wakeLockRef.current = null
      document.title = "Fim! — o aviso de tarefa concluída do seu agente de IA"
    }
  }, [code])

  useEffect(() => {
    try {
      localStorage.setItem(
        historyKey(code),
        JSON.stringify(items.slice(0, LOCAL_HISTORY_CAP))
      )
    } catch {
      /* armazenamento cheio ou bloqueado: o painel segue funcionando em memória */
    }
  }, [items, code])

  useEffect(() => {
    if (ringing) {
      const original = document.title
      let flip = false
      flashRef.current = setInterval(() => {
        flip = !flip
        document.title = flip ? "ALARME: tarefa concluída — Fim!" : original
      }, 900)
      return () => {
        if (flashRef.current) clearInterval(flashRef.current)
        document.title = original
      }
    }
  }, [ringing])

  useEffect(() => {
    const nav = navigator as Navigator & { wakeLock?: WakeLockApi }
    const sync = async () => {
      if (!nav.wakeLock) return
      if (wakeLockOn && document.visibilityState === "visible") {
        if (!wakeLockRef.current || wakeLockRef.current.released) {
          try {
            wakeLockRef.current = await nav.wakeLock.request("screen")
          } catch {
            /* usuário ou navegador recusou; a tela pode apagar normalmente */
          }
        }
      } else if (!wakeLockOn && wakeLockRef.current && !wakeLockRef.current.released) {
        await wakeLockRef.current.release().catch(() => {})
        wakeLockRef.current = null
      }
    }
    void sync()
    const onVis = () => void sync()
    document.addEventListener("visibilitychange", onVis)
    return () => document.removeEventListener("visibilitychange", onVis)
  }, [wakeLockOn])

  const askPermission = async () => {
    if (typeof Notification === "undefined") {
      toast.error("Este navegador não suporta notificações do sistema.")
      return
    }
    const p = await Notification.requestPermission()
    setPermission(p)
    if (p === "granted") toast.success("Notificações do sistema ativadas")
    else if (p === "denied") toast.error("Permissão bloqueada nas configurações do navegador")
  }

  const changeSound = (v: string) => {
    const mode = v as SoundMode
    setSoundMode(mode)
    soundModeRef.current = mode
    try {
      localStorage.setItem(SOUND_KEY, mode)
    } catch {
      /* preferência de som é opcional */
    }
    engineRef.current?.unlock()
    if (mode === "ding") engineRef.current?.ding()
    if (mode === "mudo") stopRinging()
  }

  const sendTest = async () => {
    setTesting(true)
    engineRef.current?.unlock()
    try {
      const r = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          title: "Teste do Fim!",
          message:
            "Se voce recebeu este aviso, o canal esta funcionando. Pode passar as instrucoes para o seu agente de IA.",
        }),
      })
      const resultado = await r.json()
      if (resultado?.ok) {
        toast.success(
          resultado.relayed
            ? "Teste enviado! Push no ntfy.sh OK e aviso no painel em instantes."
            : "Teste registrado! O painel vai tocar em alguns segundos (polling)."
        )
      } else {
        toast.error(resultado?.error ?? "Falha no teste")
      }
    } catch {
      toast.error("Falha de rede no teste")
    } finally {
      setTesting(false)
    }
  }

  const clearHistory = async () => {
    setItems([])
    setCurrent(null)
    try {
      localStorage.removeItem(historyKey(code))
    } catch {}
    fetch(`/api/history?code=${encodeURIComponent(code)}`, {
      method: "DELETE",
    }).catch(() => {
      /* o histórico local já foi limpo; o do servidor pode permanecer */
    })
    toast.success("Histórico limpo")
  }

  const statusBadge =
    status === "tempo-real" ? (
      <Badge className="gap-1.5 border-emerald-500/30 bg-emerald-500/10 text-emerald-400" variant="outline">
        <span className="relative flex size-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75 motion-reduce:animate-none" />
          <span className="relative inline-flex size-2 rounded-full bg-emerald-400" />
        </span>
        Tempo real
      </Badge>
    ) : status === "alternativo" ? (
      <Badge className="gap-1.5 border-amber-500/30 bg-amber-500/10 text-amber-400" variant="outline">
        <RadioTower className="size-3" />
        Modo alternativo (verificando a cada 5 s)
      </Badge>
    ) : (
      <Badge className="gap-1.5 border-zinc-700 bg-zinc-800 text-zinc-400" variant="outline">
        <Loader2 className="size-3 motion-safe:animate-spin" />
        Conectando...
      </Badge>
    )

  const permissionBtn =
    permission === "granted" ? (
      <Button variant="outline" disabled className="border-emerald-500/30 text-emerald-400">
        <CircleCheck className="size-4" /> Notificações ativas
      </Button>
    ) : permission === "denied" ? (
      <Button variant="outline" disabled className="border-red-500/30 text-red-400">
        <BellOff className="size-4" /> Bloqueadas pelo navegador
      </Button>
    ) : (
      <Button variant="outline" onClick={askPermission} className="border-zinc-700">
        <BellRing className="size-4" /> Ativar notificações
      </Button>
    )

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      {/* Cabeçalho do painel */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-sm font-medium text-zinc-400">Seu código</CardTitle>
              <div className="mt-1 flex items-center gap-2">
                <code className="rounded-md border border-zinc-800 bg-zinc-950 px-2.5 py-1 font-mono text-lg text-emerald-400">
                  {code}
                </code>
                <CopyButton text={code} variant="ghost" aria-label="Copiar código" />
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">{statusBadge}</div>
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 border-t border-zinc-800 pt-4">
          {permissionBtn}
          <div className="flex items-center gap-2">
            <Volume2 className="size-4 text-zinc-500" />
            <Select value={soundMode} onValueChange={changeSound}>
              <SelectTrigger className="w-[240px] border-zinc-700 bg-zinc-950" aria-label="Modo de som">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="border-zinc-800 bg-zinc-950">
                {SOUND_MODES.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="size-4 text-zinc-500" />
            <Switch
              checked={wakeLockOn}
              onCheckedChange={(v) => setWakeLockOn(v)}
              aria-label="Manter a tela ligada"
            />
            <span className="text-sm text-zinc-400">Manter tela ligada</span>
          </div>
          <Button onClick={sendTest} disabled={testing} className="ml-auto bg-emerald-600 hover:bg-emerald-500">
            {testing ? (
              <Loader2 className="size-4 motion-safe:animate-spin" />
            ) : (
              <Send className="size-4" />
            )}
            Testar agora
          </Button>
        </CardContent>
      </Card>

      {/* Último aviso */}
      <Card
        className={
          ringing
            ? "border-red-500 motion-safe:animate-pulse bg-red-950/30"
            : "border-zinc-800 bg-zinc-900/60"
        }
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium text-zinc-400">
            <BellRing className="size-4" /> Último aviso
          </CardTitle>
        </CardHeader>
        <CardContent>
          {current ? (
            <div className="space-y-2">
              <h3 className="text-2xl font-bold tracking-tight text-zinc-50">
                {current.title}
              </h3>
              {current.message && (
                <p className="text-zinc-300">{current.message}</p>
              )}
              <p className="text-xs tabular-nums text-zinc-500">
                {relativeTime(current.at)}
              </p>
              {ringing && (
                <Button
                  size="lg"
                  variant="destructive"
                  onClick={stopRinging}
                  className="mt-3 w-full text-base font-bold"
                >
                  <AlarmClock className="size-5" /> PARAR ALARME
                </Button>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3 py-4 text-zinc-500">
              <CircleDashed className="size-5" />
              <p>
                Nenhum aviso ainda. Deixe esta aba aberta: quando seu agente terminar a
                tarefa, o aviso aparece aqui.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Próximo passo */}
      <Card className="border-emerald-900/50 bg-emerald-950/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <BotMessageSquare className="size-5 text-emerald-400" />
            Próximo passo: configure seu agente de IA
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Abra a página de instruções, copie o bloco de texto e cole nas instruções do
            seu agente (ou passe o link para ele). Quando a tarefa terminar, o aviso
            chega aqui automaticamente.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <CopyButton text={instructions} label="Copiar instruções completas" variant="default" className="bg-emerald-600 hover:bg-emerald-500" />
          <Button
            variant="outline"
            className="border-emerald-800 text-emerald-300"
            onClick={() => (window.location.hash = `#/agente/${code}`)}
          >
            Abrir página de instruções
          </Button>
          <CopyButton
            text={`${window.location.origin}/#/agente/${code}`}
            label="Copiar link"
          />
        </CardContent>
      </Card>

      {/* Histórico */}
      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-base">Histórico ({items.length})</CardTitle>
          {items.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="text-zinc-500 hover:text-red-400">
                  <Trash2 className="size-4" /> Limpar
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="border-zinc-800 bg-zinc-950">
                <AlertDialogHeader>
                  <AlertDialogTitle>Limpar o histórico?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Os avisos mostrados nesta aba serão apagados. Novos avisos continuam
                    chegando normalmente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-zinc-800">Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={clearHistory} className="bg-red-600 hover:bg-red-500">
                    Limpar
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent>
          {items.length === 0 ? (
            <p className="py-4 text-sm text-zinc-500">
              O histórico desta sessão aparece aqui, com os avisos mais recentes no topo.
            </p>
          ) : (
            <ul className="scroll-thin max-h-96 space-y-3 overflow-y-auto pr-2">
              {items.map((it) => (
                <li
                  key={it.key}
                  className="rounded-lg border border-zinc-800 bg-zinc-950/60 p-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-zinc-100">{it.title}</p>
                      {it.message && (
                        <p className="mt-0.5 text-sm text-zinc-400">{it.message}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs tabular-nums text-zinc-500">
                      {relativeTime(it.at)}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <p className="text-center text-xs text-zinc-500">
        Dica: gere um código novo em{' '}
        <button
          className="underline hover:text-zinc-400"
          onClick={() => {
            try {
              navigator.clipboard.writeText(generateCode())
            } catch {}
            window.location.hash = "#/"
          }}
        >
          Início
        </button>{' '}
        se quiser recomeçar com um canal novo.
      </p>
    </div>
  )
}
