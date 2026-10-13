import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { ensureSchema } from "@/lib/db-init"
import { isValidCode } from "@/lib/fim-shared"

/** Registra um código (para o painel avisar que o canal existe) e informa se já existia. */
export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ ok: false, error: "JSON inválido." }, { status: 400 })
  }
  const { code } = body as { code?: unknown }
  if (!isValidCode(code)) {
    return NextResponse.json(
      { ok: false, error: "Código inválido (4 a 64 caracteres: letras, números, - ou _)." },
      { status: 400 }
    )
  }
  try {
    await ensureSchema()
    const existing = await db.code.findUnique({ where: { code } })
    if (!existing) {
      await db.code.create({ data: { code } })
    }
    return NextResponse.json({ ok: true, created: !existing })
  } catch (err) {
    console.error("[codes] falha ao registrar:", err)
    // O código ainda funciona sem registro (o ntfy não depende do nosso banco)
    return NextResponse.json({ ok: true, created: false, warning: "Registro local falhou." })
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code") ?? ""
  if (!isValidCode(code)) {
    return NextResponse.json({ ok: false, error: "Código inválido." }, { status: 400 })
  }
  try {
    await ensureSchema()
    const existing = await db.code.findUnique({ where: { code } })
    return NextResponse.json({ ok: true, exists: Boolean(existing) })
  } catch {
    return NextResponse.json({ ok: true, exists: false, warning: "Consulta falhou." })
  }
}
