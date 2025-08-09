import express from "express";
import cors from "cors";
import Database from "better-sqlite3";

const app = express();
app.use(cors());
app.use(express.json());

// --- DB init ---
const db = new Database("gf.sqlite");
db.pragma("journal_mode = WAL");

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS friends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  friend_id INTEGER NOT NULL,
  UNIQUE(user_id, friend_id)
);
CREATE TABLE IF NOT EXISTS recipes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
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
`);

// --- Helpers ---
function requireUser(req, res, next) {
  const username = req.header("X-User");
  if (!username) return res.status(401).json({ error: "Missing X-User header" });
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) return res.status(401).json({ error: "No such user. Register first." });
  req.user = user;
  next();
}

function getFriendsIds(userId) {
  const rows = db.prepare("SELECT friend_id FROM friends WHERE user_id = ?").all(userId);
  return rows.map(r => r.friend_id);
}

function hydrateRecipe(rid) {
  const recipe = db.prepare("SELECT * FROM recipes WHERE id = ?").get(rid);
  const ingredients = db.prepare("SELECT name FROM recipe_ingredients WHERE recipe_id = ?").all(rid).map(r=>r.name);
  const steps = db.prepare("SELECT content FROM recipe_steps WHERE recipe_id = ?").all(rid).map(r=>r.content);
  const stickers = db.prepare("SELECT sticker FROM recipe_stickers WHERE recipe_id = ?").all(rid).map(r=>r.sticker);
  const owner = db.prepare("SELECT username FROM users WHERE id = ?").get(recipe.user_id)?.username;
  return { ...recipe, owner, ingredients, steps, stickers };
}

// --- Auth ---
app.post("/api/register", (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: "username required" });
  try {
    const info = db.prepare("INSERT INTO users (username) VALUES (?)").run(username);
    return res.json({ id: info.lastInsertRowid, username });
  } catch (e) {
    return res.status(400).json({ error: "username already exists" });
  }
});

app.post("/api/login", (req, res) => {
  const { username } = req.body || {};
  if (!username) return res.status(400).json({ error: "username required" });
  let user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) {
    const info = db.prepare("INSERT INTO users (username) VALUES (?)").run(username);
    user = { id: info.lastInsertRowid, username };
  }
  return res.json({ id: user.id, username: user.username });
});

// --- Friends ---
app.post("/api/friends/add", requireUser, (req, res) => {
  const { friendUsername } = req.body || {};
  if (!friendUsername) return res.status(400).json({ error: "friendUsername required" });
  const friend = db.prepare("SELECT * FROM users WHERE username = ?").get(friendUsername);
  if (!friend) return res.status(404).json({ error: "friend user not found" });
  if (friend.id === req.user.id) return res.status(400).json({ error: "cannot friend yourself" });
  try {
    db.prepare("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)").run(req.user.id, friend.id);
    db.prepare("INSERT INTO friends (user_id, friend_id) VALUES (?, ?)").run(friend.id, req.user.id);
  } catch {}
  res.json({ ok: true });
});

// --- Current user ---
app.get("/api/me", requireUser, (req, res) => {
  res.json({ id: req.user.id, username: req.user.username, friends: getFriendsIds(req.user.id) });
});

// --- Recipes CRUD ---
app.post("/api/recipes", requireUser, (req, res) => {
  const { title, description = "", ingredients = [], steps = [], stickers = [] } = req.body || {};
  if (!title) return res.status(400).json({ error: "title required" });
  const info = db.prepare("INSERT INTO recipes (user_id, title, description) VALUES (?, ?, ?)")
    .run(req.user.id, title, description);
  const rid = info.lastInsertRowid;
  const insIngr = db.prepare("INSERT INTO recipe_ingredients (recipe_id, name) VALUES (?, ?)");
  ingredients.forEach(n => insIngr.run(rid, n.trim()));
  const insStep = db.prepare("INSERT INTO recipe_steps (recipe_id, content) VALUES (?, ?)");
  steps.forEach(s => insStep.run(rid, s));
  const insSticker = db.prepare("INSERT INTO recipe_stickers (recipe_id, sticker) VALUES (?, ?)");
  stickers.forEach(t => insSticker.run(rid, t));
  res.json(hydrateRecipe(rid));
});

app.put("/api/recipes/:id", requireUser, (req, res) => {
  const rid = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM recipes WHERE id = ?").get(rid);
  if (!existing) return res.status(404).json({ error: "not found" });
  if (existing.user_id !== req.user.id) return res.status(403).json({ error: "not your recipe" });

  const { title, description, ingredients, steps, stickers } = req.body || {};
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
  res.json(hydrateRecipe(rid));
});

app.delete("/api/recipes/:id", requireUser, (req, res) => {
  const rid = Number(req.params.id);
  const existing = db.prepare("SELECT * FROM recipes WHERE id = ?").get(rid);
  if (!existing) return res.status(404).json({ error: "not found" });
  if (existing.user_id !== req.user.id) return res.status(403).json({ error: "not your recipe" });

  db.prepare("DELETE FROM recipe_ingredients WHERE recipe_id = ?").run(rid);
  db.prepare("DELETE FROM recipe_steps WHERE recipe_id = ?").run(rid);
  db.prepare("DELETE FROM recipe_stickers WHERE recipe_id = ?").run(rid);
  db.prepare("DELETE FROM recipes WHERE id = ?").run(rid);
  res.json({ ok: true });
});

// --- Search & feed ---
app.get("/api/recipes", requireUser, (req, res) => {
  const q = (req.query.q || "").trim().toLowerCase();
  const stickers = (req.query.stickers || "").split(",").map(s => s.trim()).filter(Boolean);
  const include = (req.query.include || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);
  const exclude = (req.query.exclude || "").split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

  // Everyone sees everyone's recipes for now (family sharing)
  // Basic candidate set: all recipe IDs
  let candidates = db.prepare("SELECT id FROM recipes").all().map(r=>r.id);

  // Filter by full text q (title/description)
  if (q) {
    candidates = candidates.filter(rid => {
      const r = db.prepare("SELECT title, description FROM recipes WHERE id = ?").get(rid);
      return (r.title + " " + r.description).toLowerCase().includes(q);
    });
  }
  // Filter by stickers
  if (stickers.length) {
    candidates = candidates.filter(rid => {
      const tags = db.prepare("SELECT sticker FROM recipe_stickers WHERE recipe_id = ?").all(rid).map(r=>r.sticker);
      return stickers.every(s => tags.includes(s));
    });
  }
  // Filter by include ingredients
  if (include.length) {
    candidates = candidates.filter(rid => {
      const ings = db.prepare("SELECT name FROM recipe_ingredients WHERE recipe_id = ?").all(rid).map(r=>r.name.toLowerCase());
      return include.every(i => ings.includes(i));
    });
  }
  // Filter by exclude ingredients
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
