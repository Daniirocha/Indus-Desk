import bcrypt from 'bcryptjs'
import cors from 'cors'
import express from 'express'
import jwt from 'jsonwebtoken'
import { db, getUserByEmail, rowToChamado } from './db.js'

const PORT = Number(process.env.PORT) || 4000
const JWT_SECRET = process.env.JWT_SECRET || 'indusdesk-dev-secret-altere-em-producao'
const app = express()

app.use(
  cors({
    origin: [
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:4173',
      'http://127.0.0.1:4173',
    ],
    credentials: true,
  }),
)
app.use(express.json({ limit: '12mb' }))

function requireAuth(req, res, next) {
  const h = req.headers.authorization
  if (!h?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token ausente.' })
  }
  try {
    req.auth = jwt.verify(h.slice(7), JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado.' })
  }
}

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {}
  if (!email || !password) {
    return res.status(400).json({ error: 'E-mail e senha são obrigatórios.' })
  }
  const user = getUserByEmail(String(email).trim().toLowerCase())
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ error: 'Credenciais inválidas.' })
  }
  const token = jwt.sign(
    { sub: user.id, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' },
  )
  res.json({
    token,
    user: { name: user.name, email: user.email },
  })
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = getUserByEmail(req.auth.email)
  if (!user) return res.status(401).json({ error: 'Usuário não encontrado.' })
  res.json({ name: user.name, email: user.email })
})

app.get('/api/chamados', requireAuth, (_req, res) => {
  const rows = db.prepare('SELECT * FROM chamados ORDER BY id DESC').all()
  res.json(rows.map(rowToChamado))
})

app.post('/api/chamados', requireAuth, (req, res) => {
  const b = req.body || {}
  if (!b.usuario?.trim() || !b.descricao?.trim()) {
    return res.status(400).json({ error: 'Usuário e descrição são obrigatórios.' })
  }
  const agora = new Date().toISOString()
  const info = db
    .prepare(`
    INSERT INTO chamados (
      usuario, descricao, categoria, prioridade, status, tecnico, data, data_resolucao, comentarios_json, imagem, preview
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
    .run(
      b.usuario.trim(),
      b.descricao.trim(),
      b.categoria || 'hardware',
      b.prioridade || 'média',
      'Aberto',
      b.tecnico || null,
      b.data || agora,
      null,
      JSON.stringify([]),
      b.imagem ?? null,
      b.preview ?? null,
    )
  const row = db.prepare('SELECT * FROM chamados WHERE id = ?').get(info.lastInsertRowid)
  res.status(201).json(rowToChamado(row))
})

app.patch('/api/chamados/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id)
  const b = req.body || {}
  if (Number(b.id) !== id) {
    return res.status(400).json({ error: 'ID inconsistente.' })
  }
  const existing = db.prepare('SELECT * FROM chamados WHERE id = ?').get(id)
  if (!existing) return res.status(404).json({ error: 'Chamado não encontrado.' })

  db.prepare(`
    UPDATE chamados SET
      usuario = ?, descricao = ?, categoria = ?, prioridade = ?, status = ?, tecnico = ?,
      data = ?, data_resolucao = ?, comentarios_json = ?, imagem = ?, preview = ?
    WHERE id = ?
  `).run(
    b.usuario,
    b.descricao,
    b.categoria,
    b.prioridade,
    b.status,
    b.tecnico ?? null,
    b.data,
    b.dataResolucao ?? null,
    JSON.stringify(b.comentarios || []),
    b.imagem ?? null,
    b.preview ?? null,
    id,
  )
  const row = db.prepare('SELECT * FROM chamados WHERE id = ?').get(id)
  res.json(rowToChamado(row))
})

app.listen(PORT, () => {
  console.log(`IndusDesk API em http://localhost:${PORT}`)
})
