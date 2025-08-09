# GF App — Public Recipes + Image Uploads

Public, no-login recipe sharing for your family:
- Add recipes with images (uploaded to `/uploads`).
- Tag with diet stickers (GF, vegan, etc.).
- Search by text, stickers, include/exclude ingredients.
- Everything is visible to everyone (no users/auth).

## Stack
- **Server:** Node.js, Express, SQLite (better-sqlite3), Multer for uploads
- **Client:** Vite + React + Tailwind

## Quick Start
### 1) Server
```bash
cd server
npm i
npm run dev
```
Server on http://localhost:3001

### 2) Client
```bash
cd client
npm i
npm run dev
```
Client on http://localhost:5173

Set `VITE_API_BASE` to your server URL for production.
