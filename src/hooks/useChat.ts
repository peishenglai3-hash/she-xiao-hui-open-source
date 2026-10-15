import { useCallback } from 'react'
import { useAppStore } from '../store/useAppStore'
import type { Message } from '../store/useAppStore'
import { streamChat } from '../utils/api'
import { analyzeCombinedEmotion } from '../utils/emotionAnalyzer'

let msgId = 0
function nextId() {
  return `msg-${++msgId}-${Date.now()}`
}

export function useChat() {
  const addMessage = useAppStore((s) => s.addMessage)
  const setExpression = useAppStore((s) => s.setExpression)
  const setIsStreaming = useAppStore((s) => s.setIsStreaming)
  const setStreamingContent = useAppStore((s) => s.setStreamingContent)
  const messages = useAppStore((s) => s.messages)

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      const userMsg: Message = {
        id: nextId(),
        role: 'user',
        content: content.trim(),
        timestamp: Date.now(),
      }
      addMessage(userMsg)

      const userEmotion = analyzeCombinedEmotion(content.trim(), null)
      if (userEmotion !== 'default') setExpression(userEmotion)

      setIsStreaming(true)
      setStreamingContent('')

      const allMessages = [...messages, userMsg]

      try {
        let fullContent = ''
        let serverExpression: string | null = null
        const assistantMsgId = nextId()

        for await (const event of streamChat(allMessages)) {
          if (event.type === 'expression' && event.expression) {
            serverExpression = event.expression
            setExpression(event.expression)
          } else if (event.type === 'content' && event.content) {
            fullContent += event.content
            setStreamingContent(fullContent)
          }
        }

        const currentExpression = useAppStore.getState().currentExpression
        const assistantMsg: Message = {
          id: assistantMsgId,
          role: 'assistant',
          content: fullContent,
          timestamp: Date.now(),
          expression: currentExpression,
        }
        addMessage(assistantMsg)
        setStreamingContent('')

        // Fallback: if server didn't provide expression, use keyword matching
        if (!serverExpression) {
          const aiEmotion = analyzeCombinedEmotion(null, fullContent)
          if (aiEmotion !== 'default') setExpression(aiEmotion)
        }
      } catch (err) {
        const errorMsg: Message = {
          id: nextId(),
          role: 'assistant',
          content: '啊，好像出了点问题……稍等一下再试试好吗？（轻轻敲了敲笔记本）',
          timestamp: Date.now(),
        }
        addMessage(errorMsg)
        console.error('Chat error:', err)
      } finally {
        setIsStreaming(false)
      }
    },
    [messages, addMessage, setExpression, setIsStreaming, setStreamingContent]
  )

  return { sendMessage }
}
