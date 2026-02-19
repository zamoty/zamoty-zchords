```markdown
# AGENTS.md — ZChords

## Overview

ZChords is a mobile-first PWA for managing chord sheets and playlists.
It is offline-first using Dexie (IndexedDB) and syncs to Neon Postgres via Nuxt server routes using Drizzle ORM.
Single-user. No authentication.

---

## Core Principles

- Mobile-first always.
- Offline-first always.
- Code in English.
- UI in pt-BR.
- Keep components small and composable.
- Never block UI due to sync failure.

---

## Architecture

Frontend:
- Nuxt 3/4
- Tailwind v4
- Nuxt UI

Offline DB:
- Dexie
- Tables mirror Neon schema
- dirty flag for sync tracking

Backend:
- Nuxt server routes
- Drizzle ORM
- Neon Postgres

Sync model:
- Pull then Push
- last-write-wins via updatedAt
- Soft deletes via deletedAt

---

## Data Model

Tables:
- instruments
- chord_shapes
- songs
- playlists
- playlist_items
- meta

All syncable tables must include:
- id (uuid)
- createdAt
- updatedAt
- deletedAt

Dexie tables include:
- dirty (boolean)
- syncError (nullable)

---

## UI Rules

- Bottom navigation tabs:
  - Músicas
  - Playlists
  - Acordes
  - Ajustes
- Stage Mode:
  - Hide UI chrome
  - Large font
  - High contrast
  - Tap zones for scroll
- Chords clickable → open modal with diagram

---

## Typography

- Default UI font: Inter
- Title font: Rubik
- Chord content font: Manrope

---

## Important Notes

- Songs stored as ChordPro text.
- Transposition happens at render time only.
- Instrument switch affects chord dictionary only.
- Use Tonal.js for all chord transpositions.
- Load maximum chord shapes for guitar and ukulele using chords-db dataset.

---

## Development Commands

pnpm dev
pnpm build
pnpm start
pnpm lint
pnpm tsc --noEmit


---

## Do Not

- Do not introduce authentication.
- Do not store sensitive data.
- Do not make sync blocking.
- Do not break offline functionality.