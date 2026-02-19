# AGENTS.md — ZChords

## Overview

ZChords is a mobile-first PWA for personal chord sheets and chord dictionary.
It is offline-first with Dexie (IndexedDB) and syncs to Neon Postgres through Nuxt server routes using Drizzle ORM.
Single-user app. No authentication.

## Core Principles

- Mobile-first always.
- Offline-first always.
- Code/comments/file names in English.
- UI copy in pt-BR.
- Keep components composable and focused.
- Never block UI due to sync failure.

## Architecture

Frontend:
- Nuxt 4
- Tailwind v4
- Nuxt UI 4

Offline DB:
- Dexie
- Tables mirror Neon syncable tables
- Local sync flags per row: `dirty`, `syncError`

Backend:
- Nuxt server routes
- Drizzle ORM
- Neon Postgres

Sync model:
- Pull then push
- last-write-wins via `updatedAt`
- soft delete via `deletedAt`

## Data Model

Tables:
- `instruments`
- `chord_shapes`
- `songs`
- `playlists`
- `playlist_items`
- `meta`

All syncable tables:
- `id` (uuid)
- `createdAt`
- `updatedAt`
- `deletedAt`

Dexie rows include:
- `dirty` (boolean)
- `syncError` (nullable)

Meta includes:
- `deviceId`
- `lastSyncedAt`
- selected instrument id

## Implemented UX (Current)

Navigation tabs:
- Músicas
- Playlists
- Acordes
- Ajustes

Songs:
- ChordPro render with clickable chords
- Transpose at render time (Tonal.js)
- Stage mode with reduced chrome and scroll controls
- Chord click opens right-side `Slideover` with chord diagram/variations

Chord Dictionary:
- Two-step flow:
  - Step 1: root notes grid (`C, C#, D, D#...`)
  - Step 2: chord names grid for selected root (`C, Cm, C7...`)
- Clicking chord opens right-side `Slideover` with variation arrows
- Instrument selection uses icon button + instrument `Slideover` (no plain select)

Styling:
- Global UI corner radius intentionally low (clean/tighter)
- Avoid over-rounded components unless necessary

## Chord Data Rules

- Songs remain instrument-agnostic (ChordPro content unchanged by instrument switch).
- Instrument switch affects only dictionary/diagram lookup.
- Chord shapes sourced primarily from `@tombatossals/chords-db`.
- Prefer principal/common variations first (dataset `positionIndex`/`common` tags).

## Seed Notes

`pnpm seed:neon` currently:
- Upserts instruments
- Imports guitar + ukulele shapes from `chords-db`
- Inserts minimal sample shapes for cavaquinho/violas
- Upserts sample songs
- Soft-deletes previous `chords-db` chord shapes before re-upserting current set

## Sync/Offline Notes

- App runtime reads from Dexie.
- Manual sync from `Ajustes` button (`Sincronizar`).
- Auto-push runs debounced on local mutations while online.
- Failed push rows remain dirty and keep error details.

## Typography

- Default UI font: Inter
- Title font: Rubik
- Chord content font: Manrope

## Development Commands

```bash
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm typecheck
pnpm db:migrate
pnpm seed:neon
```

## Do Not

- Do not introduce authentication.
- Do not store sensitive data.
- Do not make sync blocking.
- Do not break offline functionality.
