# ZChords

PWA mobile-first para biblioteca de cifras (ChordPro), playlists e dicionário de acordes com funcionamento offline-first.

## Status Atual (Implementado)

- Offline-first com Dexie como fonte de runtime.
- Sync com Neon Postgres via rotas Nuxt + Drizzle (`pull`/`push`, last-write-wins por `updatedAt`, soft delete por `deletedAt`).
- Seed de instrumentos + acordes (`@tombatossals/chords-db`) + músicas de navegação.
- Biblioteca de músicas com busca local, visualização ChordPro e transposição em tempo de render.
- Modo palco com foco no conteúdo, auto-scroll e controles mínimos.
- Dicionário de acordes em 2 etapas:
  - etapa 1: notas base (`C, C#, D, D#...`)
  - etapa 2: acordes da nota selecionada (`C, Cm, C7...`)
  - clique abre `Slideover` à direita com diagrama grande e navegação de variações.
- Seletor de instrumento via botão com ícone + `Slideover` de instrumentos (sem `select` padrão).
- Navegação inferior: Músicas, Playlists, Acordes, Ajustes.

## Stack

- Nuxt 4 + Nuxt UI 4
- Tailwind CSS v4
- Dexie (IndexedDB)
- Drizzle ORM + Neon Postgres
- `@vite-pwa/nuxt` (Workbox)
- Tonal.js (transposição)
- `@tombatossals/chords-db` (formas de acorde)

## Requisitos

- Node 20+
- pnpm 10+
- `DATABASE_URL` do Neon

## Setup

```bash
pnpm install
cp .env.example .env
# edite DATABASE_URL
```

## Banco de dados

```bash
pnpm db:migrate
pnpm seed:neon
```

Alternativa rápida em dev:

```bash
pnpm db:push
pnpm seed:neon
```

## Rodar

```bash
pnpm dev
```

Build/preview:

```bash
pnpm build
pnpm preview
```

## Qualidade

```bash
pnpm lint
pnpm typecheck
```

## Sync (Offline-first)

- Runtime local: Dexie.
- Nuvem: Neon (backup/sync).
- Primeiro bootstrap: pull inicial (`since=1970`) quando base local está vazia.
- Manual: botão **Sincronizar** em `Ajustes`.
- Automático: push com debounce quando há `dirty` e conexão online.
- Erros de push mantêm `dirty=true` e não bloqueiam UI.

### Endpoints

- `GET /api/sync/pull?since=<ISO>&deviceId=<string>`
- `POST /api/sync/push`

## Seed inicial (`pnpm seed:neon`)

Popula:

- Instrumentos: Violão, Ukulele, Cavaquinho, Viola caipira (3 afinações).
- Formas de acorde: carga máxima para violão/ukulele do dataset `chords-db`.
- Formas mínimas para cavaquinho/violas (MVP).
- Músicas tradicionais curtas para navegação.

O seed é idempotente para acordes (upsert por `id` determinístico) e marca dados antigos de acordes com soft delete.

## Rotas principais

- `/songs`
- `/playlists`
- `/chords`
- `/settings`

## Instalação PWA

- Android (Chrome): Menu -> **Adicionar à tela inicial**
- iOS (Safari): Compartilhar -> **Adicionar à Tela de Início**

## Notas importantes

- Sem autenticação (single-user).
- `deviceId` local persistido em Dexie (`meta`).
- Troca de instrumento altera diagramas/dicionário, não o conteúdo da música.
- Transposição é aplicada somente na renderização.
- Visual atual prioriza cantos mais discretos (raio global reduzido).

## Troubleshooting Rápido

Se mudar parser/seed de acordes e os dados parecerem antigos:

1. `pnpm seed:neon`
2. No app: `Ajustes -> Sincronizar`
