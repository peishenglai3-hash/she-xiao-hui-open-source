import { useState, useRef, useEffect, useCallback } from 'react'
import { useAppStore } from '../../store/useAppStore'

interface ChatInputProps {
  onSend: (text: string) => void
  onFocusChange?: (focused: boolean) => void
}

const QUICK_PHRASES = [
  '小会，给我讲讲一个社会学概念吧',
  '我最近压力好大……',
  '你能帮我分析一个社会现象吗？',
]

export default function ChatInput({ onSend, onFocusChange }: ChatInputProps) {
  const [text, setText] = useState('')
  const [showQuick, setShowQuick] = useState(false)
  const isStreaming = useAppStore((s) => s.isStreaming)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const lastSendRef = useRef(0)

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = Math.min(textareaRef.current.scrollHeight, 120) + 'px'
    }
  }, [text])

  const doSend = useCallback(() => {
    if (!text.trim() || isStreaming) return
    const now = Date.now()
    if (now - lastSendRef.current < 1000) return
    lastSendRef.current = now
    onSend(text)
    setText('')
    setShowQuick(false)
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }, [text, isStreaming, onSend])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      doSend()
    }
  }

  const handleQuickPhrase = (phrase: string) => {
    setText(phrase)
    setShowQuick(false)
    textareaRef.current?.focus()
  }

  return (
    <div className="px-3 py-2.5 border-t border-gray-100 bg-white/80 backdrop-blur-sm pb-[env(safe-area-inset-bottom,12px)]">
      {showQuick && (
        <div className="flex gap-1.5 mb-2 flex-wrap">
          {QUICK_PHRASES.map((p) => (
            <button
              key={p}
              onClick={() => handleQuickPhrase(p)}
              className="text-xs px-2.5 py-1 rounded-full bg-[#e8f0f8] text-[#2B5A8E] hover:bg-[#d0e0f0] transition-colors whitespace-nowrap"
            >
              {p}
            </button>
          ))}
        </div>
      )}
      <div className="flex items-end gap-2">
        <button
          onClick={() => setShowQuick(!showQuick)}
          className="w-9 h-9 rounded-full bg-gray-100 text-gray-400 hover:bg-[#e8f0f8] hover:text-[#2B5A8E] flex items-center justify-center flex-shrink-0 transition-colors"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
          </svg>
        </button>
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => onFocusChange?.(true)}
          onBlur={() => onFocusChange?.(false)}
          placeholder={isStreaming ? '社小会正在回复……' : '和社小会说点什么吧……'}
          disabled={isStreaming}
          rows={1}
          className="flex-1 px-4 py-2.5 rounded-2xl border border-gray-200 bg-gray-50 text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:border-[#5B8DC4] focus:ring-1 focus:ring-[#5B8DC4] disabled:opacity-50 transition-colors resize-none"
        />
        <button
          onClick={doSend}
          disabled={!text.trim() || isStreaming}
          className="w-10 h-10 rounded-full bg-[#2B5A8E] text-white flex items-center justify-center hover:bg-[#1e4570] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex-shrink-0"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 2L11 13" />
            <path d="M22 2L15 22L11 13L2 9L22 2Z" />
          </svg>
        </button>
      </div>
    </div>
  )
}
