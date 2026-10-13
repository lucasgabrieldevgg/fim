# Fim! 🔔

Seu agente de IA terminou a tarefa? Você fica sabendo — com notificação, título customizado e até alarme.

O **Fim!** resolve um problema simples de quem usa agentes de IA: você manda o agente trabalhar e fica olhando a tela esperando. Com o Fim!, a **última ação** do agente antes de encerrar é uma requisição REST para o seu código — e você recebe um aviso no painel aberto no navegador e, opcionalmente, um push no celular via [ntfy](https://ntfy.sh) (app gratuito no [Play Store](https://play.google.com/store/apps/details?id=io.heckel.ntfy), F-Droid ou APK do GitHub).

## Como funciona

```
Agente de IA ──POST /api/notify──► Fim! (servidor)
                                    │
                                    ├─► salva no histórico (SQLite/Prisma)
                                    └─► repassa para o ntfy.sh
                                              │
              ┌───────────────────────────────┤
              ▼                               ▼
   Painel web (aba aberta)           App ntfy no celular
   SSE em tempo real + polling       push notification
   notificação do sistema + alarme   (o "APK" pronto e gratuito)
```

1. Você abre o Fim! e gera (ou digita) um código, ex.: `fim-minhatarefa42`
2. Cola as instruções prontas (página `#/agente/<código>`) no agente de IA
3. O agente trabalha; quando termina, envia o POST com título e mensagem
4. O painel avisa na hora: notificação do sistema, título da aba piscando e alarme (se você ativou)

As instruções também ensinam o agente a enviar **direto** para o ntfy.sh, sem passar pelo servidor — útil se o agente não tiver acesso à sua instância.

## Rodando localmente

```bash
bun install        # ou npm install
bun run db:push    # cria o banco SQLite
bun run dev        # http://localhost:3000
```

## Deploy

### Vercel (recomendado)

A Vercel roda a aplicação inteira — API, relay para o ntfy.sh e o painel.

1. Suba o repo para o GitHub (já publicado em <https://github.com/lucasgabrieldevgg/fim>):

```bash
git remote add origin https://github.com/lucasgabrieldevgg/fim.git
git push -u origin main
```

2. Na [vercel.com](https://vercel.com): **Add New → Project → importe o repo**. O Next.js é detectado automaticamente; não precisa mexer no build.
3. Em **Environment Variables**, adicione:

```
DATABASE_URL=file:/tmp/fim.db
```

> **Nota honesta sobre o banco:** o disco do Vercel serverless é efêmero. O histórico salvo no banco dura só enquanto a instância estiver quente — o painel mantém uma cópia no `localStorage`, e o aviso em tempo real (SSE + push ntfy) **não depende do banco**. Se quiser histórico persistente de verdade, o caminho é trocar o provider do Prisma para [Turso](https://turso.tech) (LibSQL, free tier) — mudança pequena no `schema.prisma`.

### GitHub Pages (não recomendado para esta versão)

O GitHub Pages só serve arquivos estáticos — ele **não executa a API** `/api/notify`, que é o cérebro do fluxo (validação, rate limit, histórico e relay). Publicar lá exigiria a variante "modo zero-backend", em que o agente fala direto com o ntfy.sh e o painel vive só de SSE + localStorage. É possível, mas abre mão do histórico centralizado e do rate limit. Para a experiência completa, Vercel.

## API (o que o agente chama)

```bash
curl -X POST https://SEU-DEPLOY.vercel.app/api/notify \
  -H "Content-Type: application/json" \
  -d '{"code": "fim-minhatarefa42", "title": "Build pronto ✅", "message": "Testes passaram: 128/128."}'
```

| Campo | Obrigatório | Limite |
|---|---|---|
| `code` | sim | 4–64 caracteres (`a-z0-9-_`) |
| `title` | não (padrão: "Tarefa concluída") | 80 caracteres |
| `message` | não | 500 caracteres |

Rate limit: 30 avisos por minuto por código. Resposta: `{ok, saved, relayed, warning}` — o aviso conta como entregue se ficou no histórico **ou** se o relay para o ntfy deu certo.

## Instalar no celular

- **Fim! Android 2.0 (app próprio)**: baixe em [GitHub Releases](https://github.com/lucasgabrieldevgg/fim-app/releases/latest) — app enxuto feito para o Fim! (~5 MB, sem Google services): cola o código, escuta, avisa na hora. ⚠️ O Google Play Protect pode avisar que o app é "nocivo" — **falso positivo** comum em APKs fora da Play Store; toque em "Instalar mesmo assim" e, se quiser, peça pro seu agente de IA [auditar o código aberto](https://github.com/lucasgabrieldevgg/fim-app). Código-fonte: [lucasgabrieldevgg/fim-app](https://github.com/lucasgabrieldevgg/fim-app). (A versão 1.x — fork do app ntfy — segue disponível em [fim-android](https://github.com/lucasgabrieldevgg/fim-android).)
- **App ntfy oficial** (alternativa): Play Store, F-Droid ou APK do [repositório ntfy](https://github.com/binwiederhier/ntfy-android/releases) — inscreva-se no tópico do seu código e receba o push.
- **PWA**: abra o painel no navegador do celular e use "Adicionar à tela inicial".

## Stack

Next.js 16 (App Router) · TypeScript · Tailwind · shadcn/ui · Prisma + SQLite · ntfy.sh · Web Audio API · SSE

## Créditos

O polimento de UI e código deste projeto aplicou a skill [craftsmanship](https://github.com/lucasgabrieldevgg/theskill) (anti vibe-coding + design), que por sua vez sintetiza material de projetos como [impeccable](https://github.com/pbakaus/impeccable) (Apache 2.0) e [stop-slop](https://github.com/hardikpandya/stop-slop), mantendo as licenças upstream.
