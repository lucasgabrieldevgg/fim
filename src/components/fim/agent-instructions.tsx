"use client"

import { useMemo } from "react"
import {
  AlertTriangle,
  ArrowLeft,
  BotMessageSquare,
  Info,
  ListChecks,
  TerminalSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { buildAgentInstructions } from "@/lib/fim-shared"
import { CopyButton } from "./copy-button"

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="scroll-thin overflow-x-auto rounded-lg border border-zinc-800 bg-zinc-950 p-4 font-mono text-xs leading-relaxed text-zinc-300 sm:text-sm">
      {children}
    </pre>
  )
}

export function AgentInstructions({
  code,
  navigate,
}: {
  code: string
  navigate: (to: string) => void
}) {
  const origin =
    typeof window === "undefined" ? "https://seu-site" : window.location.origin
  const full = useMemo(() => buildAgentInstructions(origin, code), [origin, code])

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-zinc-400"
        onClick={() => navigate(`#/painel/${code}`)}
      >
        <ArrowLeft className="size-4" /> Voltar ao painel
      </Button>

      <div className="text-center">
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Instruções para o agente de IA
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-zinc-400">
          Copie o bloco abaixo e cole nas instruções do seu agente (ou envie o link
          desta página para ele). Código deste canal:{" "}
          <code className="rounded bg-zinc-900 px-1.5 py-0.5 font-mono text-emerald-400">
            {code}
          </code>
        </p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
          <CopyButton
            text={full}
            label="Copiar instruções completas"
            size="lg"
            variant="default"
            className="bg-emerald-600 hover:bg-emerald-500"
          />
          <CopyButton
            text={`${origin}/#/agente/${code}`}
            label="Copiar link desta página"
            size="lg"
          />
        </div>
      </div>

      <Card className="border-emerald-900/50 bg-emerald-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BotMessageSquare className="size-5 text-emerald-400" />
            1. Papel do agente
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-300">
            O agente trabalha em uma tarefa qualquer e, ao <strong>terminar</strong>,
            avisa o usuário pelo canal <code className="font-mono text-emerald-400">{code}</code>{" "}
            antes de encerrar. O aviso é uma única requisição REST.
          </p>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-400">
            <li>
              Enviar como a <strong>última ação</strong>, imediatamente antes de encerrar
              o trabalho.
            </li>
            <li>Enviar <strong>apenas uma vez</strong> por tarefa.</li>
            <li>
              Se a tarefa <strong>falhar</strong> ou for interrompida, enviar mesmo assim
              com um título apropriado (ex.: &quot;Tarefa falhou&quot;).
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <TerminalSquare className="size-5 text-emerald-400" />
            2. A requisição
          </CardTitle>
          <CardDescription>
            POST para o endpoint do app, com corpo JSON. Resposta 200 = aviso aceito.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CodeBlock>{`POST ${origin}/api/notify
Content-Type: application/json

{"code":"${code}","title":"<resumo curto>","message":"<o que foi feito>"}`}</CodeBlock>
          <CodeBlock>{`# Exemplo com curl:
curl -s -X POST ${origin}/api/notify \\
  -H "Content-Type: application/json" \\
  -d '{"code":"${code}","title":"Relatório pronto","message":"Gerei o relatório mensal em PDF e salvei em /downloads."}'`}</CodeBlock>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="size-5 text-emerald-400" />
            3. Regras do conteúdo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="list-disc space-y-1.5 pl-5 text-sm text-zinc-400">
            <li>
              <code className="font-mono text-zinc-200">code</code>: use exatamente{" "}
              <code className="font-mono text-emerald-400">{code}</code>
            </li>
            <li>
              <code className="font-mono text-zinc-200">title</code>: até 80 caracteres,
              resumo do resultado (ex.: &quot;Planilha pronta&quot;, &quot;Deploy
              concluído&quot;)
            </li>
            <li>
              <code className="font-mono text-zinc-200">message</code>: até 400
              caracteres descrevendo o que foi feito e onde está o resultado
            </li>
            <li>O aviso é só um aviso: a IA não deve esperar resposta por esse canal</li>
            <li>
              Em caso de erro de rede, tentar mais 1 vez antes de desistir
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Info className="size-5 text-emerald-400" />
            4. Alternativa direta (independe do site)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-zinc-400">
            Se preferir, o agente pode publicar direto no ntfy.sh (o serviço de push que
            o app usa por baixo dos panos). O efeito no painel é o mesmo.
          </p>
          <CodeBlock>{`curl -s -H "Title: <resumo curto>" -d "<o que foi feito>" https://ntfy.sh/${code}`}</CodeBlock>
          <p className="text-sm text-zinc-400">
            Dá para usar qualquer cliente REST: basta um POST para{" "}
            <code className="font-mono text-zinc-200">https://ntfy.sh/{code}</code> com o
            texto no corpo e o título no header{" "}
            <code className="font-mono text-zinc-200">Title</code>.
          </p>
        </CardContent>
      </Card>

      <Card className="border-amber-900/50 bg-amber-950/20">
        <CardContent className="flex gap-3 pt-6">
          <AlertTriangle className="size-5 shrink-0 text-amber-400" />
          <p className="text-sm text-amber-200/90">
            O código é a chave do canal: qualquer pessoa que o tiver consegue enviar
            avisos para você. Não publique o código em lugares públicos e prefira os
            códigos longos gerados automaticamente pelo app.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
