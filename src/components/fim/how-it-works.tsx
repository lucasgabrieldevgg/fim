"use client"

import {
  ArrowLeft,
  ArrowRight,
  BellRing,
  Cloud,
  Download,
  Github,
  Lock,
  Smartphone,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"

export function HowItWorks({ navigate }: { navigate: (to: string) => void }) {
  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 text-zinc-400"
        onClick={() => navigate("#/")}
      >
        <ArrowLeft className="size-4" /> Voltar ao início
      </Button>

      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-zinc-50">
          Como funciona
        </h1>
        <p className="mt-2 text-zinc-400">
          O Fim! é uma ponte entre o seu agente de IA e você, usando apenas requisições
          REST. Nada de instalar servidor, nada de cadastro.
        </p>
      </div>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">O fluxo completo</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="space-y-4">
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-950 font-bold text-emerald-400">
                1
              </span>
              <div>
                <p className="font-medium text-zinc-100">Você cria um canal</p>
                <p className="text-sm text-zinc-400">
                  O código do canal (ex.: <code className="font-mono text-emerald-400">fim-x7k92mq8ab</code>)
                  identifica seus avisos. Ele funciona como chave secreta.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-950 font-bold text-emerald-400">
                2
              </span>
              <div>
                <p className="font-medium text-zinc-100">O agente recebe as instruções</p>
                <p className="text-sm text-zinc-400">
                  Você cola o bloco de instruções nas regras do agente. Ele aprende que,
                  quando terminar a tarefa, deve enviar um POST para{" "}
                  <code className="font-mono text-zinc-300">/api/notify</code> com o
                  código, um título e uma mensagem curta.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-950 font-bold text-emerald-400">
                3
              </span>
              <div>
                <p className="font-medium text-zinc-100">O servidor registra e repassa</p>
                <p className="text-sm text-zinc-400">
                  O aviso fica no histórico do app e é repassado para o ntfy.sh, um
                  serviço gratuito e open-source de notificações push. É ele quem leva o
                  aviso para a sua aba e para o seu celular.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-950 font-bold text-emerald-400">
                4
              </span>
              <div>
                <p className="font-medium text-zinc-100">Você é avisado</p>
                <p className="text-sm text-zinc-400">
                  A aba do painel mostra o título escolhido pela IA, dispara notificação
                  do sistema e toca o som configurado (ding ou alarme contínuo até você
                  desligar). O título da aba pisca se você estiver em outra guia.
                </p>
              </div>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Smartphone className="size-5 text-emerald-400" />
            Receber no celular (o jeito mais simples de ter um &quot;APK&quot;)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-400">
          <p>
            O transporte das notificações é o projeto open-source{" "}
            <a
              href="https://ntfy.sh"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 underline underline-offset-2"
            >
              ntfy.sh
            </a>
            , que já tem aplicativo oficial Android: de graça, sem anúncios e sem
            cadastro. É o caminho mais direto para receber os avisos no bolso:
          </p>
          <ol className="list-decimal space-y-1.5 pl-5">
            <li>
              Instale o app ntfy:{" "}
              <a
                href="https://play.google.com/store/apps/details?id=io.heckel.ntfy"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline underline-offset-2"
              >
                Google Play
              </a>
              ,{" "}
              <a
                href="https://f-droid.org/packages/io.heckel.ntfy/"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline underline-offset-2"
              >
                F-Droid
              </a>{" "}
              ou o{" "}
              <a
                href="https://github.com/binwiederhier/ntfy-android/releases"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-400 underline underline-offset-2"
              >
                APK direto do GitHub
              </a>
              .
            </li>
            <li>
              No app, toque em <span className="text-zinc-200">Inscrever-se</span> e
              digite o seu código do Fim! (ex.:{" "}
              <code className="font-mono text-emerald-400">fim-x7k92mq8ab</code>).
            </li>
            <li>
              Pronto: cada aviso que a IA enviar aparece como push no seu celular, com o
              título que ela escolheu.
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="size-5 text-emerald-400" />
            Instalar o painel como app (PWA)
          </CardTitle>
          <CardDescription>
            O painel é um Progressive Web App: funciona como aplicativo sem instalar
            nada pela loja.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400">
          <p>
            <span className="text-zinc-200">No Android/Chrome:</span> abra o painel,
            toque no menu (três pontinhos) e escolha{" "}
            <span className="text-zinc-200">&quot;Adicionar à tela inicial&quot;</span>.
            <br />
            <span className="text-zinc-200">No desktop:</span> clique no ícone de
            instalação na barra de endereço. A aba vira uma janela própria, ideal para
            deixar de olho.
          </p>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <BellRing className="size-5 text-emerald-400" />
            Por que deixar a aba aberta?
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-400">
          <p>
            A aba aberta é o &quot;alto-falante&quot; dos avisos no computador: ela fica
            escutando o canal em tempo real (SSE) e, como plano B, consulta o servidor a
            cada 5 segundos. Com a aba em segundo plano, você ainda recebe a notificação
            do sistema e o alarme toca.
          </p>
          <p>
            Se você fechar a aba, o celular (via app ntfy) continua recebendo os pushes
            normalmente. Por isso recomendamos configurar os dois.
          </p>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Cloud className="size-5 text-emerald-400" />
            Publicar na Vercel (ou GitHub)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-400">
          <p>
            O app é um projeto Next.js padrão. Para ter a sua versão pública, basta
            subir o repositório no GitHub e importar na{" "}
            <a
              href="https://vercel.com/new"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 underline underline-offset-2"
            >
              Vercel
            </a>{" "}
            (o plano gratuito dá conta). Configure a variável{" "}
            <code className="font-mono text-zinc-300">DATABASE_URL</code> apontando para
            um arquivo (ou troque o Prisma por um banco hospedado como Turso/Neon para
            histórico durável).
          </p>
          <p>
            No GitHub Pages (apenas estático), a página de instruções e o painel
            funcionam, mas o endpoint <code className="font-mono text-zinc-300">/api/notify</code>{" "}
            não existe. Nesse cenário, use a alternativa direta para o ntfy.sh que está
            nas instruções do agente, e o painel continua recebendo tudo em tempo real
            via SSE.
          </p>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Github className="size-5 text-emerald-400" />
            E se eu quiser um APK com a minha marca?
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-zinc-400">
          <p>
            Como o painel é um PWA, você pode empacotá-lo como APK usando o{" "}
            <a
              href="https://github.com/GoogleChromeLabs/bubblewrap"
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 underline underline-offset-2"
            >
              Bubblewrap
            </a>{" "}
            (ferramenta oficial do Chrome, que gera um Trusted Web Activity) ou serviços
            como o PWABuilder. Em poucos minutos você tem um .apk instalável que abre o
            seu painel em tela cheia. Para a maioria dos casos, o app ntfy + PWA já
            cobre tudo sem precisar compilar nada.
          </p>
        </CardContent>
      </Card>

      <Card className="border-zinc-800 bg-zinc-900/60">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Lock className="size-5 text-emerald-400" />
            Privacidade e segurança
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-zinc-400">
          <p>
            Não há login nem coleta de dados pessoais: só o código do canal, o título e
            a mensagem do aviso. O código é a chave: quem o tiver pode enviar avisos
            para você, então trate-o como senha e prefira os gerados automaticamente.
          </p>
          <Separator className="bg-zinc-800" />
          <p>
            Quer começar?{" "}
            <button
              onClick={() => navigate("#/")}
              className="inline-flex items-center gap-1 text-emerald-400 underline underline-offset-2"
            >
              Gere seu código <ArrowRight className="size-3.5" />
            </button>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
