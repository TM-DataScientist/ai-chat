import { Hono } from 'hono'
import { handle } from 'hono/vercel'
import { prisma } from '@/lib/prisma'
import { agents } from '@/lib/mastra'

export const runtime = 'nodejs'

const app = new Hono().basePath('/api')

// POST /api/chat - Mastra Agent ストリーミング
app.post('/chat', async (c) => {
  const { messages, model } = await c.req.json()
  const agent = agents['gpt-5-nano']
  const result = await agent.stream(messages)
  return new Response(result.textStream as unknown as ReadableStream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
})

// GET /api/sessions - セッション一覧（messages 除外）
app.get('/sessions', async (c) => {
  const sessions = await prisma.session.findMany({
    orderBy: { updatedAt: 'desc' },
    select: { id: true, title: true, model: true, createdAt: true, updatedAt: true },
  })
  return c.json(sessions.map((s) => ({ ...s, _id: s.id })))
})

// POST /api/sessions - 新規セッション作成
app.post('/sessions', async (c) => {
  const { title, model } = await c.req.json()
  const session = await prisma.session.create({
    data: {
      title: (String(title)).slice(0, 50) || '新しいチャット',
      model: model || 'gpt-4o-mini',
      messages: [],
    },
  })
  return c.json({ ...session, _id: session.id }, 201)
})

// GET /api/sessions/:id - セッション詳細（messages 含む）
app.get('/sessions/:id', async (c) => {
  const id = c.req.param('id')
  const session = await prisma.session.findUnique({ where: { id } })
  if (!session) return c.json({ error: 'Not found' }, 404)
  return c.json({ ...session, _id: session.id })
})

// DELETE /api/sessions/:id - セッション削除
app.delete('/sessions/:id', async (c) => {
  const id = c.req.param('id')
  try {
    await prisma.session.delete({ where: { id } })
  } catch {
    // セッションが存在しない場合は無視
  }
  return c.json({ ok: true })
})

// POST /api/sessions/:id/messages - メッセージ一括保存（ストリーミング完了後）
app.post('/sessions/:id/messages', async (c) => {
  const id = c.req.param('id')
  const { messages } = await c.req.json()
  try {
    await prisma.session.update({
      where: { id },
      data: {
        messages: messages.map((m: { id: string; role: string; content: string; createdAt?: string }) => ({
          id: m.id,
          role: m.role,
          content: m.content,
          createdAt: m.createdAt ? new Date(m.createdAt) : new Date(),
        })),
      },
    })
  } catch {
    return c.json({ error: 'Not found' }, 404)
  }
  return c.json({ ok: true })
})

export const GET = handle(app)
export const POST = handle(app)
export const DELETE = handle(app)
