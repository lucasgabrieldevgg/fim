import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { isValidCode } from "@/lib/fim-shared"

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code") ?? ""
  const limitRaw = Number(searchParams.get("limit") ?? "20")
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 50) : 20

  if (!isValidCode(code)) {
    return NextResponse.json(
      { ok: false, error: "Parâmetro 'code' inválido." },
      { status: 400 }
    )
  }

  try {
    const items = await db.notification.findMany({
      where: { code },
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { id: true, code: true, title: true, message: true, createdAt: true },
    })
    return NextResponse.json({ ok: true, items })
  } catch (err) {
    console.error("[history] falha ao consultar:", err)
    return NextResponse.json(
      { ok: false, error: "Falha ao consultar o histórico." },
      { status: 500 }
    )
  }
}

/** Limpa o histórico de um código. */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const code = searchParams.get("code") ?? ""
  if (!isValidCode(code)) {
    return NextResponse.json(
      { ok: false, error: "Parâmetro 'code' inválido." },
      { status: 400 }
    )
  }
  try {
    await db.notification.deleteMany({ where: { code } })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[history] falha ao limpar:", err)
    return NextResponse.json(
      { ok: false, error: "Falha ao limpar o histórico." },
      { status: 500 }
    )
  }
}
