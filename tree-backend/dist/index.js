"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = __importDefault(require("body-parser"));
const sqlite3_1 = require("sqlite3");
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
// Provjeravamo postoji li datoteka s bazom podataka
const DB_PATH = './tree.db';
const dbExists = fs_1.default.existsSync(DB_PATH);
// Inicijalizacija baze podataka
const db = new sqlite3_1.Database(DB_PATH);
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(body_parser_1.default.json());
// Inicijaliziramo bazu s tablicom za čvorove
if (!dbExists) {
    db.serialize(() => {
        db.run(`CREATE TABLE nodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    parentId INTEGER,
    title TEXT NOT NULL,
    ordering INTEGER NOT NULL
  )`);
        // Insert root node
        db.run(`INSERT INTO nodes (id, parentId, title, ordering) VALUES (1, 0, 'Root', 1)`);
    });
}
// Helper funkcija za dohvaćanje čvorova iz baze po parentId
const getNodesByParentId = (parentId, callback) => {
    db.all(`SELECT * FROM nodes WHERE parentId = ? ORDER BY ordering`, [parentId], (err, rows) => {
        if (err) {
            callback(err);
        }
        else {
            callback(null, rows);
        }
    });
};
// Endpoint za dohvat stabla ili pojedinačnog čvora
app.get('/tree/:parentId?', (req, res) => {
    const parentId = req.params.parentId ? parseInt(req.params.parentId) : 0;
    getNodesByParentId(parentId, (err, nodes) => {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.json(nodes);
        }
    });
});
// Endpoint za unos novog čvora
app.post('/node', (req, res) => {
    const { parentId, title } = req.body;
    db.get(`SELECT MAX(ordering) as maxOrder FROM nodes WHERE parentId = ?`, [parentId], (err, row) => {
        const newOrder = ((row === null || row === void 0 ? void 0 : row.maxOrder) || 0) + 1;
        db.run(`INSERT INTO nodes (parentId, title, ordering) VALUES (?, ?, ?)`, [parentId, title, newOrder], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            }
            else {
                res.json({ id: this.lastID, parentId, title, ordering: newOrder });
            }
        });
    });
});
// Endpoint za izmjenu čvora
app.put('/node/:id', (req, res) => {
    const { id } = req.params;
    const { title } = req.body;
    db.run(`UPDATE nodes SET title = ? WHERE id = ?`, [title, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else if (this.changes === 0) {
            res.status(404).json({ error: "Node not found" });
        }
        else {
            res.sendStatus(200);
        }
    });
});
// Endpoint za brisanje čvora i svih njegovih potomaka
app.delete('/node/:id', (req, res) => {
    const { id } = req.params;
    if (parseInt(id) === 1) {
        return res.status(400).json({ error: "Root node cannot be deleted" });
    }
    db.run(`WITH RECURSIVE sub_tree AS (
    SELECT id FROM nodes WHERE id = ?
    UNION ALL
    SELECT n.id FROM nodes n INNER JOIN sub_tree st ON n.parentId = st.id
  )
  DELETE FROM nodes WHERE id IN (SELECT id FROM sub_tree)`, [id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.sendStatus(200);
        }
    });
});
// Endpoint za premještanje čvora pod novi parent čvor
app.patch('/node/:id/move', (req, res) => {
    const { id } = req.params;
    const { newParentId } = req.body;
    if (parseInt(id) === 1 || parseInt(newParentId) === parseInt(id)) {
        return res.status(400).json({ error: "Invalid move" });
    }
    db.get(`SELECT MAX(ordering) as maxOrder FROM nodes WHERE parentId = ?`, [newParentId], (err, row) => {
        const newOrder = ((row === null || row === void 0 ? void 0 : row.maxOrder) || 0) + 1;
        db.run(`UPDATE nodes SET parentId = ?, ordering = ? WHERE id = ?`, [newParentId, newOrder, id], function (err) {
            if (err) {
                res.status(500).json({ error: err.message });
            }
            else {
                res.sendStatus(200);
            }
        });
    });
});
// Endpoint za promjenu redoslijeda čvora
app.patch('/node/:id/reorder', (req, res) => {
    const { id } = req.params;
    const { newOrder } = req.body;
    db.run(`UPDATE nodes SET ordering = ? WHERE id = ?`, [newOrder, id], function (err) {
        if (err) {
            res.status(500).json({ error: err.message });
        }
        else {
            res.sendStatus(200);
        }
    });
});
// Pokretanje servera
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
