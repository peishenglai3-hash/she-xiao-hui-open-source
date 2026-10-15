import { useRef, useEffect } from 'react'
import { useAppStore } from '../../store/useAppStore'
import type { Expression } from '../../store/useAppStore'

const expressionSrc: Record<Expression, string> = {
  default: '/expressions/default.png',
  happy: '/expressions/happy.png',
  encouraging: '/expressions/encouraging.png',
  surprised: '/expressions/surprised.png',
  shy: '/expressions/shy.png',
  thinking: '/expressions/thinking.png',
  cheer: '/expressions/cheer.png',
  listening: '/expressions/listening.png',
  studying: '/expressions/studying.png',
  touched: '/expressions/touched.png',
  sleepy: '/expressions/sleepy.png',
  overwhelmed: '/expressions/overwhelmed.jpg',
  sage: '/expressions/sage.jpg',
}

export default function ChatMessages() {
  const messages = useAppStore((s) => s.messages)
  const isStreaming = useAppStore((s) => s.isStreaming)
  const streamingContent = useAppStore((s) => s.streamingContent)
  const currentExpression = useAppStore((s) => s.currentExpression)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  return (
    <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 pb-[env(safe-area-inset-bottom,8px)]">
      {messages.length === 0 && (
        <div className="text-center text-gray-400 mt-8">
          <p className="text-sm">社小会在等你和她说话呢~</p>
        </div>
      )}

      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`message-enter flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          {msg.role === 'assistant' && (
            <img
              src={expressionSrc[msg.expression || 'default']}
              alt=""
              className="w-7 h-7 rounded-full mr-2 mt-1 flex-shrink-0 border border-gray-100"
            />
          )}
          <div
            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#2B5A8E] text-white rounded-br-md'
                : 'bg-white text-[#1F2937] rounded-bl-md shadow-sm border border-gray-100'
            }`}
          >
            {msg.content}
          </div>
          {msg.role === 'user' && (
            <div className="w-7 h-7 rounded-full bg-[#5B8DC4] ml-2 mt-1 flex-shrink-0 flex items-center justify-center text-white text-xs">
              U
            </div>
          )}
        </div>
      ))}

      {isStreaming && streamingContent && (
        <div className="flex justify-start message-enter">
          <img
            src={expressionSrc[currentExpression]}
            alt=""
            className="w-7 h-7 rounded-full mr-2 mt-1 flex-shrink-0 border border-gray-100"
          />
          <div className="max-w-[75%] px-4 py-2.5 rounded-2xl rounded-bl-md bg-white text-[#1F2937] shadow-sm border border-gray-100 text-sm leading-relaxed">
            {streamingContent}
            <span className="typing-cursor text-[#2B5A8E] font-bold">|</span>
          </div>
        </div>
      )}

      {isStreaming && !streamingContent && (
        <div className="flex justify-start">
          <img
            src={expressionSrc[currentExpression]}
            alt=""
            className="w-7 h-7 rounded-full mr-2 mt-1 flex-shrink-0 border border-gray-100"
          />
          <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-white shadow-sm border border-gray-100">
            <span className="text-gray-400 text-sm">社小会正在思考</span>
            <span className="typing-cursor text-[#2B5A8E] font-bold">...</span>
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
