// Utilitários compartilhados entre servidor e cliente do app "Fim!"

export const CODE_REGEX = /^[a-zA-Z0-9_-]{4,64}$/

export const MAX_TITLE = 120
export const MAX_MESSAGE = 1000

export function isValidCode(code: unknown): code is string {
  return typeof code === "string" && CODE_REGEX.test(code)
}

/** Remove caracteres de controle e limita o tamanho de um campo de texto. */
export function sanitizeText(value: unknown, maxLen: number): string {
  if (typeof value !== "string") return ""
  const cleaned = value.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
  return cleaned.trim().slice(0, maxLen)
}

/** Gera um código legível e razoavelmente único, ex.: fim-3k9x2mq7ab4c */
export function generateCode(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789"
  const bytes = new Uint8Array(12)
  crypto.getRandomValues(bytes)
  let out = ""
  for (const b of bytes) out += alphabet[b % alphabet.length]
  return `fim-${out}`
}

export type SoundMode = "ding" | "alarme" | "mudo"

export const SOUND_MODES: { value: SoundMode; label: string }[] = [
  { value: "ding", label: "Ding curto" },
  { value: "alarme", label: "Alarme contínuo (até desligar)" },
  { value: "mudo", label: "Sem som" },
]

/** Monta o bloco de instruções em texto puro para o agente de IA copiar. */
export function buildAgentInstructions(origin: string, code: string): string {
  return `# Instrução para o agente: avisar o usuário quando a tarefa terminar

Você está trabalhando para um usuário que usa o app "Fim!" para ser avisado
quando uma tarefa do agente de IA termina. Siga as regras abaixo.

## QUANDO ENVIAR
- Envie a notificação como a SUA ÚLTIMA AÇÃO, imediatamente antes de encerrar o trabalho na tarefa.
- Envie APENAS UMA vez por tarefa (não repita).
- Se a tarefa falhar ou for interrompida, envie mesmo assim, com um title apropriado (ex.: "Tarefa falhou").

## COMO ENVIAR (requisição REST)
POST ${origin}/api/notify
Content-Type: application/json

Corpo (JSON):
{"code":"${code}","title":"<resumo curto>","message":"<o que foi feito>"}

Exemplo com curl:
curl -s -X POST ${origin}/api/notify \\
  -H "Content-Type: application/json" \\
  -d '{"code":"${code}","title":"Relatório pronto","message":"Gerei o relatório mensal em PDF e salvei em /downloads."}'

## REGRAS DO CONTEÚDO
- code: use EXATAMENTE este código: ${code}
- title: até 80 caracteres, resumo do resultado (ex.: "Planilha pronta", "Deploy concluído").
- message: até 400 caracteres descrevendo o que foi feito e onde está o resultado.
- Resposta 200 significa que o aviso foi aceito. Se der erro de rede, tente 1 vez mais.
- A notificação é apenas um aviso: não espere resposta do usuário por esse canal.

## ALTERNATIVA (envio direto, independe do site)
curl -s -H "Title: <resumo curto>" -d "<o que foi feito>" https://ntfy.sh/${code}

Último passo antes de encerrar: envie o aviso. Depois disso, encerre normalmente.`
}
