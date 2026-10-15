import { create } from 'zustand'

export type Expression =
  | 'default'
  | 'happy'
  | 'encouraging'
  | 'surprised'
  | 'shy'
  | 'thinking'
  | 'cheer'
  | 'listening'
  | 'studying'
  | 'touched'
  | 'sleepy'
  | 'overwhelmed'
  | 'sage'
export type Mode = 'widget' | 'fullscreen'

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  expression?: Expression
}

interface AppState {
  mode: Mode
  messages: Message[]
  currentExpression: Expression
  isStreaming: boolean
  streamingContent: string

  setMode: (mode: Mode) => void
  addMessage: (msg: Message) => void
  setExpression: (expr: Expression) => void
  setIsStreaming: (v: boolean) => void
  setStreamingContent: (content: string) => void
  clearMessages: () => void
}

export const useAppStore = create<AppState>((set) => ({
  mode: 'widget',
  messages: [],
  currentExpression: 'default',
  isStreaming: false,
  streamingContent: '',

  setMode: (mode) => set({ mode }),
  addMessage: (msg) =>
    set((state) => ({ messages: [...state.messages, msg] })),
  setExpression: (expr) => set({ currentExpression: expr }),
  setIsStreaming: (v) => set({ isStreaming: v }),
  setStreamingContent: (content) => set({ streamingContent: content }),
  clearMessages: () => set({ messages: [], streamingContent: '' }),
}))
