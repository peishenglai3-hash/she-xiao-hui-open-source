import express from 'express'
import cors from 'cors'
import path from 'path'
import crypto from 'crypto'
import { SYSTEM_PROMPT } from './prompts/systemPrompt'
import { COLLEGE_KNOWLEDGE } from './knowledge/college'
import { getScenePrompt } from './prompts/modes'
import type { Request, Response, NextFunction } from 'express'

type ChatRole = 'user' | 'assistant'
type ChatMessage = { role: ChatRole; content: string }
type UpstreamMessage = { role: 'system' | ChatRole; content: string }
type ReplyStyle = 'academic' | 'balanced' | 'casual'
type SceneMode = 'auto' | 'daily' | 'orientation' | 'exam' | 'graduation'

const app = express()
app.disable('x-powered-by')

const PORT = parsePort(process.env.PORT, 3001)
const MAX_BODY_SIZE = '32kb'
const MAX_MESSAGES = 20
const MAX_MESSAGE_CHARS = 4_000
const MAX_OUTPUT_CHARS = 8_000
const SESSION_TTL_MS = 12 * 60 * 60 * 1_000
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY?.trim() || ''
const DEEPSEEK_BASE_URL = (process.env.DEEPSEEK_BASE_URL?.trim() || 'https://api.deepseek.com').replace(/\/$/, '')
const INVITE_CODE = process.env.INVITE_CODE?.trim() || ''
const REQUIRE_INVITE = process.env.REQUIRE_INVITE !== 'false'
const allowedOrigins = new Set(
  (process.env.CORS_ORIGIN || '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
)

const validTokens = new Map<string, number>()
const rateWindows = new Map<string, { startedAt: number; count: number }>()
let activeChats = 0
const MAX_ACTIVE_CHATS = 4
const VALID_EXPRESSIONS = new Set([
  'default',
  'happy',
  'encouraging',
  'surprised',
  'shy',
  'thinking',
  'cheer',
  'listening',
  'studying',
  'touched',
  'sleepy',
  'overwhelmed',
  'sage',
])

app.use(
  cors({
    origin: allowedOrigins.size > 0 ? [...allowedOrigins] : false,
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
  }),
)
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('Referrer-Policy', 'no-referrer')
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  next()
})
app.use(express.json({ limit: MAX_BODY_SIZE }))

function parsePort(raw: string | undefined, fallback: number): number {
  const port = Number(raw)
  return Number.isInteger(port) && port > 0 && port < 65_536 ? port : fallback
}

function clientAddress(req: Request): string {
  return req.socket.remoteAddress || 'unknown'
}

function allowRate(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const current = rateWindows.get(key)
  if (!current || now - current.startedAt >= windowMs) {
    rateWindows.set(key, { startedAt: now, count: 1 })
    return true
  }
  if (current.count >= limit) return false
  current.count += 1
  return true
}

function rateLimit(limit: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowRate(`${clientAddress(req)}:${req.path}`, limit, windowMs)) {
      res.status(429).json({ error: '请求过于频繁，请稍后再试' })
      return
    }
    next()
  }
}

function issueToken(): string {
  const token = crypto.randomBytes(32).toString('hex')
  validTokens.set(token, Date.now() + SESSION_TTL_MS)
  return token
}

function tokenIsValid(token: unknown): token is string {
  if (typeof token !== 'string' || token.length < 32 || token.length > 128) return false
  const expiresAt = validTokens.get(token)
  if (!expiresAt) return false
  if (expiresAt <= Date.now()) {
    validTokens.delete(token)
    return false
  }
  return true
}

function sanitizeOutput(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[邮箱]')
    .replace(/(?<!\d)1[3-9]\d{9}(?!\d)/g, '[手机号]')
    .replace(/\bsk-[A-Za-z0-9_-]{20,}\b/g, '[模型密钥]')
}

function getTimeContext(): string {
  const now = new Date()
  return `\n\n[系统时间] ${now.toLocaleString('zh-CN', { hour12: false })}。只有在与问题相关时才提及时间；不要据此推断用户身份或位置。`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function validateMessages(value: unknown): ChatMessage[] | null {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_MESSAGES) return null
  const messages: ChatMessage[] = []
  for (const item of value) {
    if (!isRecord(item) || (item.role !== 'user' && item.role !== 'assistant') || typeof item.content !== 'string') {
      return null
    }
    const content = item.content.trim()
    if (!content || content.length > MAX_MESSAGE_CHARS) return null
    messages.push({ role: item.role, content })
  }
  return messages.some((message) => message.role === 'user') ? messages : null
}

function getPreferences(value: unknown): { replyStyle: ReplyStyle; sceneMode: SceneMode } {
  const preferences = isRecord(value) && isRecord(value.preferences) ? value.preferences : {}
  const replyStyle: ReplyStyle =
    preferences.replyStyle === 'academic' || preferences.replyStyle === 'casual' ? preferences.replyStyle : 'balanced'
  const allowedModes: SceneMode[] = ['auto', 'daily', 'orientation', 'exam', 'graduation']
  const sceneMode = allowedModes.includes(preferences.sceneMode as SceneMode) ? (preferences.sceneMode as SceneMode) : 'auto'
  return { replyStyle, sceneMode }
}

function writeSse(res: Response, payload: Record<string, string>): void {
  res.write(`data: ${JSON.stringify(payload)}\n\n`)
}

function writeFallback(res: Response): void {
  writeSse(res, { expression: 'listening' })
  writeSse(res, { content: '我现在运行在本地安全降级模式，还没有连接模型服务。你可以先聊聊一个社会学概念，或在服务端配置模型 key 后再试。' })
  res.write('data: [DONE]\n\n')
  res.end()
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'she-xiao-hui', llmConfigured: Boolean(DEEPSEEK_API_KEY), inviteRequired: REQUIRE_INVITE })
})

app.post('/api/verify-invite', rateLimit(5, 15 * 60 * 1_000), (req, res) => {
  if (!REQUIRE_INVITE) {
    res.json({ valid: true, token: issueToken() })
    return
  }
  if (!INVITE_CODE) {
    res.status(503).json({ valid: false, message: '服务端尚未配置访问口令' })
    return
  }
  const code = isRecord(req.body) && typeof req.body.code === 'string' ? req.body.code.trim() : ''
  if (!code || code.length > 128 || code !== INVITE_CODE) {
    res.status(403).json({ valid: false, message: '访问口令不正确' })
    return
  }
  res.json({ valid: true, token: issueToken() })
})

app.post('/api/chat', rateLimit(20, 60 * 1_000), async (req, res) => {
  const body = isRecord(req.body) ? req.body : {}
  if (REQUIRE_INVITE && !tokenIsValid(body.inviteToken)) {
    res.status(403).json({ error: '会话未验证或已过期' })
    return
  }

  const messages = validateMessages(body.messages)
  if (!messages) {
    res.status(400).json({ error: '消息格式无效或超出限制' })
    return
  }
  if (activeChats >= MAX_ACTIVE_CHATS) {
    res.status(503).json({ error: '当前请求较多，请稍后再试' })
    return
  }
  activeChats += 1

  const { replyStyle, sceneMode } = getPreferences(body)
  const styleNote =
    replyStyle === 'academic'
      ? '回复可以更有结构，必要时解释概念，但不要虚构引用。'
      : replyStyle === 'casual'
        ? '回复更口语化、轻松，但保持准确和尊重。'
        : '在亲切与清晰之间保持平衡。'
  const fullMessages: UpstreamMessage[] = [
    {
      role: 'system',
      content: `${SYSTEM_PROMPT}\n\n${COLLEGE_KNOWLEDGE}${getScenePrompt(sceneMode)}\n\n[回复偏好]\n${styleNote}${getTimeContext()}`,
    },
    ...messages,
  ]

  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
  res.setHeader('Cache-Control', 'no-cache, no-transform')
  res.setHeader('Connection', 'keep-alive')

  if (!DEEPSEEK_API_KEY) {
    writeFallback(res)
    activeChats -= 1
    return
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 25_000)
  try {
    const upstream = await fetch(`${DEEPSEEK_BASE_URL}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: fullMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 1_024,
      }),
      signal: controller.signal,
    })

    if (!upstream.ok || !upstream.body) {
      writeSse(res, { content: '模型服务暂时不可用，请稍后再试。' })
      res.write('data: [DONE]\n\n')
      res.end()
      return
    }

    const reader = upstream.body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    let tagBuffer = ''
    let tagParsed = false
    let outputChars = 0
    let streamDone = false

    const emitContent = (value: string) => {
      if (outputChars >= MAX_OUTPUT_CHARS) return
      const clean = sanitizeOutput(value).slice(0, MAX_OUTPUT_CHARS - outputChars)
      outputChars += clean.length
      if (clean) writeSse(res, { content: clean })
    }

    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''

      for (const line of lines) {
        const trimmed = line.trim()
        if (!trimmed.startsWith('data: ')) continue
        const data = trimmed.slice(6)
        if (data === '[DONE]') {
          streamDone = true
          break
        }
        try {
          const parsed = JSON.parse(data) as { choices?: Array<{ delta?: { content?: string } }> }
          const content = parsed.choices?.[0]?.delta?.content
          if (!content) continue

          if (!tagParsed) {
            tagBuffer += content
            const closeIndex = tagBuffer.indexOf(']')
            if (closeIndex >= 0) {
              const tag = tagBuffer.slice(0, closeIndex + 1).match(/^\[(\w+)\]/)?.[1]
              if (tag && VALID_EXPRESSIONS.has(tag)) writeSse(res, { expression: tag })
              const remainder = tag ? tagBuffer.slice(closeIndex + 1) : tagBuffer
              tagParsed = true
              emitContent(remainder)
            } else if (tagBuffer.length > 40) {
              tagParsed = true
              emitContent(tagBuffer)
            }
          } else {
            emitContent(content)
          }
        } catch {
          // Ignore malformed upstream chunks and continue the bounded stream.
        }
      }
      if (streamDone) break
      if (outputChars >= MAX_OUTPUT_CHARS) break
    }
    res.write('data: [DONE]\n\n')
    res.end()
  } catch {
    if (!res.headersSent) {
      res.status(502).json({ error: '模型服务暂时不可用' })
    } else {
      writeSse(res, { content: '模型服务暂时不可用，请稍后再试。' })
      res.write('data: [DONE]\n\n')
      res.end()
    }
  } finally {
    clearTimeout(timeout)
    activeChats -= 1
  }
})

const distPath = path.join(import.meta.dirname, '..', 'dist')
app.use(express.static(distPath))
app.use((_req, res) => {
  const indexPath = path.join(distPath, 'index.html')
  res.sendFile(indexPath, (error) => {
    if (error && !res.headersSent) res.status(404).json({ error: 'Not found' })
  })
})

app.use((_error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next
  if (!res.headersSent) res.status(400).json({ error: '请求无法解析' })
})

app.listen(PORT, () => {
  console.log(`She Xiao Hui server listening on http://localhost:${PORT}`)
})
