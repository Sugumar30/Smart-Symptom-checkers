import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, "db.json");

// Initialize simple JSON DB
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], history: [] }));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // History API
  app.get("/api/history", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    const userId = req.query.userId as string;
    const history = data.history.filter((h: any) => h.userId === userId);
    res.json(history);
  });

  app.post("/api/history", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    const newItem = { ...req.body, id: Date.now().toString(), timestamp: new Date().toISOString() };
    data.history.push(newItem);
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    res.status(201).json(newItem);
  });

  // User Profile API
  app.get("/api/user/:id", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    const user = data.users.find((u: any) => u.id === req.params.id);
    if (user) res.json(user);
    else res.status(404).json({ error: "User not found" });
  });

  app.post("/api/user", (req, res) => {
    const data = JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
    const user = req.body;
    const index = data.users.findIndex((u: any) => u.id === user.id);
    if (index !== -1) {
      data.users[index] = user;
    } else {
      data.users.push(user);
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    res.json(user);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
