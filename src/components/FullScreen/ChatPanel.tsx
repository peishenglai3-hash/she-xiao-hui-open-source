import ChatMessages from '../shared/ChatMessages'
import ChatInput from '../shared/ChatInput'
import { useChat } from '../../hooks/useChat'

export default function ChatPanel({ onOpenSettings, onInputFocus }: { onOpenSettings?: () => void; onInputFocus?: (focused: boolean) => void }) {
  const { sendMessage } = useChat()

  return (
    <div className="flex flex-col h-full bg-[#F3F4F6] md:rounded-2xl rounded-t-2xl overflow-hidden md:shadow-sm md:border md:border-gray-100">
      {/* 桌面端标题栏 — 移动端隐藏 */}
      <div className="hidden md:flex px-4 py-3 bg-white border-b border-gray-100 items-center gap-2">
        <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
        <span className="text-sm font-medium text-[#1F2937]">社小会</span>
        <span className="text-xs text-gray-400">在线</span>
        <div className="flex-1" />
        <button
          onClick={onOpenSettings}
          className="text-xs text-gray-500 hover:text-[#2B5A8E] hover:bg-[#e8f0f8] transition-colors flex items-center gap-1.5 px-2.5 py-1 rounded-full"
          title="设置"
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
          设置
        </button>
      </div>

      <ChatMessages />
      <ChatInput onSend={sendMessage} onFocusChange={onInputFocus} />
    </div>
  )
}
