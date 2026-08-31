import mysql from "mysql2/promise";
import { DatabaseSync } from "node:sqlite";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { initDatabase as initSqliteSchema } from "./database.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const useMySQL = Boolean(process.env.DB_HOST);

let pool = null;
let sqlite = null;

export async function initDb() {
  if (useMySQL) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME,
      port: Number(process.env.DB_PORT || 3306),
      waitForConnections: true,
      connectionLimit: 10,
      charset: "utf8mb4",
    });
    const conn = await pool.getConnection();
    conn.release();
    console.log("MySQL conectado:", process.env.DB_NAME);
    return;
  }

  initSqliteSchema();
  const dataDir = path.join(__dirname, "../../data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  sqlite = new DatabaseSync(path.join(dataDir, "burger_falcone.db"));
  sqlite.exec("PRAGMA foreign_keys = ON");
  console.log("SQLite local iniciado");
}

function toMySQL(sql) {
  return sql
    .replace(/datetime\('now',\s*'-(\d+) days'\)/gi, "DATE_SUB(NOW(), INTERVAL $1 DAY)")
    .replace(/datetime\('now'\)/gi, "NOW()")
    .replace(/date\('now',\s*'-(\d+) days'\)/gi, "DATE_SUB(CURDATE(), INTERVAL $1 DAY)")
    .replace(/date\('now'\)/gi, "CURDATE()");
}

class Stmt {
  constructor(sql) {
    this.sql = useMySQL ? toMySQL(sql) : sql;
  }

  async get(...params) {
    if (useMySQL) {
      const [rows] = await pool.execute(this.sql, params);
      return rows[0] || null;
    }
    return sqlite.prepare(this.sql).get(...params);
  }

  async all(...params) {
    if (useMySQL) {
      const [rows] = await pool.execute(this.sql, params);
      return rows;
    }
    return sqlite.prepare(this.sql).all(...params);
  }

  async run(...params) {
    if (useMySQL) {
      const [result] = await pool.execute(this.sql, params);
      return { lastInsertRowid: result.insertId, changes: result.affectedRows };
    }
    return sqlite.prepare(this.sql).run(...params);
  }
}

const db = {
  prepare(sql) {
    return new Stmt(sql);
  },
};

export default db;
