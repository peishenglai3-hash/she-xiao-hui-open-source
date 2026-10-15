import type { Message, Expression } from '../store/useAppStore'
import { getUserProfile } from './userProfile'

export interface StreamEvent {
  type: 'content' | 'expression'
  content?: string
  expression?: Expression
}

const INVITE_TOKEN_KEY = 'shexiaohui_invite_token'
const LOCAL_MEMORIES_KEY = 'shexiaohui_local_memories'
const MAX_LOCAL_MEMORIES = 30
const MAX_MEMORY_CHARS = 60

function getSessionStorage(): Storage | null {
  try {
    return window.sessionStorage
  } catch {
    return null
  }
}

function readLocalMemories(): string[] {
  try {
    const raw = window.localStorage.getItem(LOCAL_MEMORIES_KEY)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_LOCAL_MEMORIES)
  } catch {
    return []
  }
}

function writeLocalMemories(memories: string[]): void {
  try {
    window.localStorage.setItem(LOCAL_MEMORIES_KEY, JSON.stringify(memories.slice(0, MAX_LOCAL_MEMORIES)))
  } catch {
    // Local memory is optional. A full or restricted browser storage should not break chat.
  }
}

export function getInviteToken(): string | null {
  return getSessionStorage()?.getItem(INVITE_TOKEN_KEY) || null
}

export function setInviteToken(token: string): void {
  getSessionStorage()?.setItem(INVITE_TOKEN_KEY, token)
}

export async function verifyInviteCode(code: string): Promise<{ valid: boolean; token?: string; message?: string }> {
  const response = await fetch('/api/verify-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: code.slice(0, 128) }),
  })
  try {
    return (await response.json()) as { valid: boolean; token?: string; message?: string }
  } catch {
    return { valid: false, message: '验证服务暂时不可用' }
  }
}

export async function* streamChat(messages: Message[]): AsyncGenerator<StreamEvent> {
  const profile = getUserProfile()
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: messages.slice(-20).map((message) => ({
        role: message.role,
        content: message.content.slice(0, 4_000),
      })),
      inviteToken: getInviteToken(),
      preferences: {
        replyStyle: profile?.replyStyle || 'balanced',
        sceneMode: profile?.sceneMode || 'auto',
      },
    }),
  })

  if (!response.ok) {
    if (response.status === 403) {
      getSessionStorage()?.removeItem(INVITE_TOKEN_KEY)
      window.location.reload()
      throw new Error('会话已失效，请重新验证')
    }
    throw new Error(response.status === 429 ? '请求过于频繁，请稍后再试' : '聊天服务暂时不可用')
  }

  const reader = response.body?.getReader()
  if (!reader) throw new Error('聊天服务没有返回内容')

  const decoder = new TextDecoder()
  let buffer = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.startsWith('data: ')) continue
      const data = trimmed.slice(6)
      if (data === '[DONE]') return
      try {
        const parsed = JSON.parse(data) as { content?: string; expression?: Expression }
        if (parsed.expression) {
          yield { type: 'expression', expression: parsed.expression }
        } else if (parsed.content) {
          yield { type: 'content', content: parsed.content }
        }
      } catch {
        // Ignore malformed chunks from a local or remote stream.
      }
    }
  }
}

// Memories intentionally stay in this browser. They are never sent to the server or a model provider.
export async function fetchMemories(): Promise<string[]> {
  return readLocalMemories()
}

export async function addMemory(memory: string): Promise<{ success: boolean; count: number; message: string }> {
  const value = memory.trim().slice(0, MAX_MEMORY_CHARS)
  if (!value) return { success: false, count: readLocalMemories().length, message: '请输入要保存的内容' }
  const memories = readLocalMemories().filter((item) => item !== value)
  memories.unshift(value)
  writeLocalMemories(memories)
  return { success: true, count: Math.min(memories.length, MAX_LOCAL_MEMORIES), message: '已保存在当前浏览器' }
}

export async function removeMemory(index: number): Promise<boolean> {
  const memories = readLocalMemories()
  if (!Number.isInteger(index) || index < 0 || index >= memories.length) return false
  memories.splice(index, 1)
  writeLocalMemories(memories)
  return true
}

export async function clearMemories(): Promise<boolean> {
  try {
    window.localStorage.removeItem(LOCAL_MEMORIES_KEY)
    return true
  } catch {
    return false
  }
}
