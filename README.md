# ZChords
> Offline-first, mobile-first chord sheets and setlist manager for musicians.

ZChords é um Progressive Web App (PWA) pensado para músicos que querem tocar sem distrações.
Organize cifras, crie playlists, visualize acordes por instrumento e use modo palco com rolagem automática.

Simples. Rápido. Offline.

---

## ✨ Features

- 📱 Mobile-first design
- 🎵 Biblioteca de músicas (ChordPro)
- 🔍 Busca por título ou artista
- 🎸 Dicionário completo de acordes (violão, ukulele + extensível)
- 🔁 Transposição por semitom
- 📂 Playlists (Setlists)
- 🎤 Modo Palco com:
  - Rolagem automática
  - Controle de velocidade
  - Tap scroll (topo sobe / baixo desce)
- 💾 Offline-first (IndexedDB via Dexie)
- ☁ Sync manual com Neon (Drizzle + Nuxt server routes)

---

## 🧱 Stack

- Nuxt 3/4
- Tailwind CSS v4
- Nuxt UI 4.2
- Dexie (IndexedDB)
- Drizzle ORM
- Neon Postgres
- Tonal.js (transposição)
- @tombatossals/chords-db (dataset de acordes)
- @vite-pwa/nuxt (PWA)

---

## 🛠 Setup

```bash
pnpm install
cp .env.example .env
pnpm dev
```

### Build:

```bash
pnpm build
pnpm start
```

### Start:

```bash
pnpm dev
```
## 📲 PWA Install

**Android:**  
Abrir no Chrome → Menu → **Adicionar à tela inicial**

**iOS:**  
Abrir no Safari → Compartilhar → **Adicionar à Tela de Início**

---

## 🎨 Design

- **Primary:** Modern cyan
- **Neutral:** Zinc

**Fonts:**
- *Inter* → UI
- *Rubik* → Títulos
- *Manrope* → Conteúdo de cifra

---

## 🧠 Architecture Notes

- Songs are instrument-agnostic.
- Instrument selection only affects chord shapes display.
- Sync is last-write-wins.
- No authentication (single-user model).

---

## 📄 License

MIT © Tommy