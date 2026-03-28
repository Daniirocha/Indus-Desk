import Database from 'better-sqlite3'
import bcrypt from 'bcryptjs'
import { mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { CHAMADOS_SEED } from './seedData.js'

const __dirname = dirname(fileURLToPath(import.meta.url))
const dataDir = join(__dirname, 'data')
mkdirSync(dataDir, { recursive: true })

const dbPath = process.env.INDUS_DB_PATH || join(dataDir, 'indusdesk.db')
export const db = new Database(dbPath)

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS chamados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario TEXT NOT NULL,
    descricao TEXT NOT NULL,
    categoria TEXT NOT NULL,
    prioridade TEXT NOT NULL,
    status TEXT NOT NULL,
    tecnico TEXT,
    data TEXT NOT NULL,
    data_resolucao TEXT,
    comentarios_json TEXT NOT NULL DEFAULT '[]',
    imagem TEXT,
    preview TEXT
  );
`)

const adminEmail = process.env.ADMIN_EMAIL || 'ti@industria.com.br'
const adminName = process.env.ADMIN_NAME || 'Administrador TI'
const adminPassword = process.env.ADMIN_PASSWORD || 'indus2024'

const userCount = db.prepare('SELECT COUNT(*) AS n FROM users').get().n
if (userCount === 0) {
  const hash = bcrypt.hashSync(adminPassword, 10)
  db.prepare(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)',
  ).run(String(adminEmail).trim().toLowerCase(), hash, adminName)
}

const ticketCount = db.prepare('SELECT COUNT(*) AS n FROM chamados').get().n
if (ticketCount === 0) {
  const ins = db.prepare(`
    INSERT INTO chamados (
      id, usuario, descricao, categoria, prioridade, status, tecnico, data, data_resolucao, comentarios_json, imagem, preview
    ) VALUES (
      @id, @usuario, @descricao, @categoria, @prioridade, @status, @tecnico, @data, @data_resolucao, @comentarios_json, @imagem, @preview
    )
  `)
  for (const c of CHAMADOS_SEED) {
    ins.run({
      id: c.id,
      usuario: c.usuario,
      descricao: c.descricao,
      categoria: c.categoria,
      prioridade: c.prioridade,
      status: c.status,
      tecnico: c.tecnico ?? null,
      data: c.data,
      data_resolucao: c.dataResolucao ?? null,
      comentarios_json: JSON.stringify(c.comentarios || []),
      imagem: c.imagem ?? null,
      preview: c.preview ?? null,
    })
  }
  const maxId = db.prepare('SELECT MAX(id) AS m FROM chamados').get().m
  if (maxId != null) {
    db.prepare('INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES (?, ?)').run(
      'chamados',
      maxId,
    )
  }
}

export function rowToChamado(row) {
  return {
    id: row.id,
    usuario: row.usuario,
    descricao: row.descricao,
    categoria: row.categoria,
    prioridade: row.prioridade,
    status: row.status,
    tecnico: row.tecnico || null,
    data: row.data,
    dataResolucao: row.data_resolucao || null,
    comentarios: JSON.parse(row.comentarios_json || '[]'),
    imagem: row.imagem || null,
    preview: row.preview || null,
  }
}

export function getUserByEmail(email) {
  return db.prepare('SELECT * FROM users WHERE email = ?').get(email)
}
