import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { isValidCode, sanitizeText, MAX_TITLE, MAX_MESSAGE } from "@/lib/fim-shared"

// Limite simples por código (por instância do servidor): 30 avisos por minuto.
const RATE_LIMIT = 30
const rateMap = new Map<string, number[]>()

function rateLimited(code: string): boolean {
  const now = Date.now()
  const windowStart = now - 60_000
  const hits = (rateMap.get(code) ?? []).filter((t) => t > windowStart)
  if (hits.length >= RATE_LIMIT) {
    rateMap.set(code, hits)
    return true
  }
  hits.push(now)
  rateMap.set(code, hits)
  return false
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: "Corpo da requisição deve ser JSON válido." },
      { status: 400 }
    )
  }

  const data = body as { code?: unknown; title?: unknown; message?: unknown }

  if (!isValidCode(data.code)) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Campo 'code' inválido. Use 4 a 64 caracteres (letras, números, - ou _).",
      },
      { status: 400 }
    )
  }

  if (rateLimited(data.code)) {
    return NextResponse.json(
      { ok: false, error: "Limite de 30 avisos por minuto excedido para este código." },
      { status: 429 }
    )
  }

  const code = data.code
  const title = sanitizeText(data.title, MAX_TITLE) || "Tarefa concluída"
  const message = sanitizeText(data.message, MAX_MESSAGE)

  // 1) Registra o histórico (melhor esforço — não bloqueia o aviso se falhar)
  let saved = false
  try {
    await Promise.all([
      db.notification.create({ data: { code, title, message } }),
      db.code.upsert({ where: { code }, update: {}, create: { code } }),
    ])
    saved = true
  } catch (err) {
    console.error("[notify] falha ao salvar no banco:", err)
  }

  // 2) Repassa para o ntfy.sh (push no celular via app ntfy + SSE em tempo real)
  let relayed = false
  let relayError: string | null = null
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10_000)
    const res = await fetch("https://ntfy.sh/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: code,
        title,
        message,
        tags: ["white_check_mark"],
      }),
      signal: controller.signal,
    })
    clearTimeout(timeout)
    if (!res.ok) {
      const detail = await res.text().catch(() => "")
      relayError = `ntfy.sh respondeu ${res.status}${detail ? `: ${detail.slice(0, 180)}` : ""}`
    } else {
      relayed = true
    }
  } catch (err) {
    relayError = `Falha ao contatar ntfy.sh: ${err instanceof Error ? err.message : String(err)}`
  }

  // O aviso é considerado entregável se ficou no histórico (o painel faz polling)
  // OU se o relay para o ntfy deu certo. Se os dois falharam, é erro de verdade.
  if (!saved && !relayed) {
    return NextResponse.json(
      { ok: false, error: relayError ?? "Não foi possível registrar o aviso." },
      { status: 502 }
    )
  }

  return NextResponse.json({
    ok: true,
    saved,
    relayed,
    warning:
      relayed || !saved
        ? null
        : "Aviso registrado no histórico do painel, mas o push para o ntfy.sh falhou" +
          (relayError ? ` (${relayError})` : "") +
          ". O painel aberto ainda será avisado.",
  })
}
