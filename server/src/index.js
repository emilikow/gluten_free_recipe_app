import express from "express";
import cors from "cors";
import Database from "better-sqlite3";
import multer from "multer";
import path from "path";
import fs from "fs";

const app = express();
app.use(cors());
app.use(express.json());

// Static hosting for uploaded images
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use("/uploads", express.static(UPLOAD_DIR));

// Multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "_");
    const stamp = Date.now();
    cb(null, `${name}_${stamp}${ext}`);
  }
});
const upload = multer({ storage });

// --- DB init ---
const db = new Database("gf.sqlite");
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  name TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS recipe_steps (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  content TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS recipe_stickers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  sticker TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS recipe_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recipe_id INTEGER NOT NULL,
  url TEXT NOT NULL
);
`);

function hydrateRecipe(rid) {
  const recipe = db.prepare("SELECT * FROM recipes WHERE id = ?").get(rid);
  const ingredients = db.prepare("SELECT name FROM recipe_ingredients WHERE recipe_id = ?").all(rid).map(r=>r.name);
  const steps = db.prepare("SELECT content FROM recipe_steps WHERE recipe_id = ?").all(rid).map(r=>r.content);
  const stickers = db.prepare("SELECT sticker FROM recipe_stickers WHERE recipe_id = ?").all(rid).map(r=>r.sticker);
  const images = db.prepare("SELECT url FROM recipe_images WHERE recipe_id = ?").all(rid).map(r=>r.url);
  return { ...recipe, owner: "shared", ingredients, steps, stickers, images };
}

// --- Upload endpoint ---
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "no file" });
  const baseUrl = process.env.PUBLIC_BASE_URL || `${req.protocol}://${req.get("host")}`;
  const url = `${baseUrl}/uploads/${req.file.filename}`;
  res.json({ url });
});

// --- Recipes CRUD (public) ---
app.post("/api/recipes", (req, res) => {
  const { title, description = "", ingredients = [], steps = [], stickers = [], images = [] } = req.body || {};
  if (!title) return res.status(400).json({ error: "title required" });
  const info = db.prepare("INSERT INTO recipes (title, description) VALUES (?, ?)").run(title, description);
  const rid = info.lastInsertRowid;

  const insIngr = db.prepare("INSERT INTO recipe_ingredients (recipe_id, name) VALUES (?, ?)");
  ingredients.forEach(n => insIngr.run(rid, n.trim()));

  const insStep = db.prepare("INSERT INTO recipe_steps (recipe_id, content) VALUES (?, ?)");
  steps.forEach(s => insStep.run(rid, s));

  const insSticker = db.prepare("INSERT INTO recipe_stickers (recipe_id, sticker) VALUES (?, ?)");
  stickers.forEach(t => insSticker.run(rid, t));

  const insImg = db.prepare("INSERT INTO recipe_images (recipe_id, url) VALUES (?, ?)");
  images.forEach(u => insImg.run(rid, u));

  res.json(hydrateRecipe(rid));
});

app.put("/api/recipes/:id", (req, res) => {
  const rid = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM recipes WHERE id = ?").get(rid);
  if (!existing) return res.status(404).json({ error: "not found" });

  const { title, description, ingredients, steps, stickers, images } = req.body || {};
  if (title !== undefined || description !== undefined) {
    db.prepare("UPDATE recipes SET title = COALESCE(?, title), description = COALESCE(?, description), updated_at = datetime('now') WHERE id = ?")
      .run(title, description, rid);
  }
  if (Array.isArray(ingredients)) {
    db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").run(rid);
    const ins = db.prepare("INSERT INTO recipe_ingredients (recipe_id, name) VALUES (?, ?)");
    ingredients.forEach(n => ins.run(rid, n.trim()));
  }
  if (Array.isArray(steps)) {
    db.prepare("DELETE FROM recipe_steps WHERE recipe_id = ?").run(rid);
    const ins = db.prepare("INSERT INTO recipe_steps (recipe_id, content) VALUES (?, ?)");
    steps.forEach(s => ins.run(rid, s));
  }
  if (Array.isArray(stickers)) {
    db.prepare("DELETE FROM recipe_stickers WHERE recipe_id = ?").run(rid);
    const ins = db.prepare("INSERT INTO recipe_stickers (recipe_id, sticker) VALUES (?, ?)");
    stickers.forEach(t => ins.run(rid, t));
  }
  if (Array.isArray(images)) {
    db.prepare("DELETE FROM recipe_images WHERE recipe_id = ?").run(rid);
    const ins = db.prepare("INSERT INTO recipe_images (recipe_id, url) VALUES (?, ?)");
    images.forEach(u => ins.run(rid, u));
  }
  res.json(hydrateRecipe(rid));
});

app.delete("/api/recipes/:id", (req, res) => {
  const rid = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM recipes WHERE id = ?").get(rid);
  if (!existing) return res.status(404).json({ error: "not found" });

  db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").run(rid);
  db.prepare("DELETE FROM recipe_steps WHERE recipe_id = ?").run(rid);
  db.prepare("DELETE FROM recipe_stickers WHERE recipe_id = ?").run(rid);
  db.prepare("DELETE FROM recipe_images WHERE recipe_id = ?").run(rid);
  db.prepare("DELETE FROM recipes WHERE id = ?").run(rid);
  res.json({ ok: true });
});

// --- Search ---
app.get("/api/recipes", (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  const stickers = (req.query.stickers || "").split(",").map(s => s.trim()).filter(Boolean);
  const include = (req.query.include || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const exclude = (req.query.exclude || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

  let candidates = db.prepare("SELECT id FROM recipes").all().map(r=>r.id);

  if (q) {
    candidates = candidates.filter(rid => {
      const r = db.prepare("SELECT title, description FROM recipes WHERE id = ?").get(rid);
      return (r.title + " " + r.description).toLowerCase().includes(q);
    });
  }
  if (stickers.length) {
    candidates = candidates.filter(rid => {
      const tags = db.prepare("SELECT sticker FROM recipe_stickers WHERE recipe_id = ?").all(rid).map(r=>r.sticker);
      return stickers.every(s => tags.includes(s));
    });
  }
  if (include.length) {
    candidates = candidates.filter(rid => {
      const ings = db.prepare("SELECT name FROM recipe_ingredients WHERE recipe_id = ?").all(rid).map(r=>r.name.toLowerCase());
      return include.every(i => ings.includes(i));
    });
  }
  if (exclude.length) {
    candidates = candidates.filter(rid => {
      const ings = db.prepare("SELECT name FROM recipe_ingredients WHERE recipe_id = ?").all(rid).map(r=>r.name.toLowerCase());
      return exclude.every(x => !ings.includes(x));
    });
  }

  const out = candidates.map(hydrateRecipe).sort((a,b)=> b.id - a.id);
  res.json(out);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("GF App server running on port", PORT);
});
