# GF App — Gluten‑Free Recipe & Friends

A full‑stack web app where users can:
- Add their own **gluten‑friendly** recipes
- Tag each recipe with diet **stickers** (gluten‑free, pescatarian, vegetarian, vegan, keto‑friendly, etc.)
- **Search** by name, ingredients (include/exclude), and stickers
- **Friend** other users to see each other’s recipes (own, friends, or all)

> Built in the same spirit/format you liked from *bottle2donation*: clean React client, simple Express API, and a lightweight SQLite database.

## Stack
- **Server:** Node.js, Express, SQLite (via better-sqlite3)
- **Client:** Vite + React + TailwindCSS

## Quick Start

### 1) Server
```bash
cd server
npm i
npm run dev
```
Server runs on http://localhost:3001

### 2) Client
```bash
cd client
npm i
npm run dev
```
Client runs on http://localhost:5173

> The client expects the API at `http://localhost:3001`. You can change this in `client/src/api.js`.

## Minimal Auth Model
- Login/register by **username only** (no passwords, for prototype).  
- The client sends `X-User: <username>` header with each request.

## Search
- Text search matches recipe **title** and **description**.
- Filter by **stickers**.
- Include/Exclude specific **ingredients**.
- Scope: **own**, **friends**, or **all**.

## Stickers (Diet Tags)
- `gluten_free`
- `pescatarian`
- `vegetarian`
- `vegan`
- `keto_friendly`
- `dairy_free`
- `nut_free`
- `low_glycemic`

You can extend these in the UI easily.

## API (selected)
- `POST /api/register { username }`
- `POST /api/login { username }`
- `POST /api/friends/add { friendUsername }`
- `GET  /api/recipes` query: `q`, `stickers`, `include`, `exclude`, `scope` (own|friends|all)
- `POST /api/recipes` body: `{ title, description, ingredients:[], steps:[], stickers:[] }`
- `PUT  /api/recipes/:id`
- `DELETE /api/recipes/:id`
- `GET  /api/me` returns current user and basic info

Check server/src/index.js for details.

## License
MIT
