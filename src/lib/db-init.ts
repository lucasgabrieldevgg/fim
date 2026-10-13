import { db } from "@/lib/db"

// Em discos efêmeros (Vercel serverless com /tmp) o arquivo do banco nasce vazio:
// nenhuma migração rodou lá. Este bootstrap cria o schema mínimo uma única vez por
// instância, antes da primeira consulta. É "melhor esforço" — se falhar, as rotas
// tratam como erro e o caminho ntfy.sh (que não depende do banco) segue funcionando.
let ready: Promise<void> | null = null

async function bootstrap(): Promise<void> {
  // $executeRawUnsafe aceita uma instrução por chamada — daí as três sequenciais.
  await db.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "Code" (
       "code" TEXT NOT NULL PRIMARY KEY,
       "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`
  )
  await db.$executeRawUnsafe(
    `CREATE TABLE IF NOT EXISTS "Notification" (
       "id" TEXT NOT NULL PRIMARY KEY,
       "code" TEXT NOT NULL,
       "title" TEXT NOT NULL,
       "message" TEXT NOT NULL,
       "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
     )`
  )
  await db.$executeRawUnsafe(
    `CREATE INDEX IF NOT EXISTS "Notification_code_createdAt_idx"
       ON "Notification" ("code", "createdAt")`
  )
}

export function ensureSchema(): Promise<void> {
  ready ??= bootstrap().catch((err) => {
    // Zera a promessa para permitir retry na próxima requisição — o /tmp pode ter
    // sido reciclado no meio do bootstrap, e a instância seguinte tenta de novo.
    ready = null
    throw err
  })
  return ready
}
