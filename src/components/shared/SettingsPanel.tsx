import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getUserProfile, saveUserProfile } from '../../utils/userProfile'
import type { UserRole, ReplyStyle, SceneMode } from '../../utils/userProfile'
import { fetchMemories, addMemory, removeMemory, clearMemories } from '../../utils/api'
import { useAppStore } from '../../store/useAppStore'
import html2canvas from 'html2canvas'

interface Props {
  onClose: () => void
}

const ROLE_OPTIONS: { value: UserRole; label: string; desc: string }[] = [
  { value: 'student', label: '学生', desc: '本科生/研究生' },
  { value: 'faculty', label: '教师', desc: '教授/讲师' },
  { value: 'staff', label: '行政', desc: '辅导员/行政人员' },
]

const STYLE_OPTIONS: { value: ReplyStyle; label: string; desc: string }[] = [
  { value: 'academic', label: '更学术', desc: '引用理论，深入分析' },
  { value: 'balanced', label: '平衡', desc: '轻松与专业兼顾' },
  { value: 'casual', label: '更轻松', desc: '口语化，活泼随意' },
]

const MODE_OPTIONS: { value: SceneMode; label: string; desc: string }[] = [
  { value: 'daily', label: '日常', desc: '标准陪伴模式' },
  { value: 'orientation', label: '迎新季', desc: '新生引导与学院介绍' },
  { value: 'exam', label: '期末周', desc: '备考鼓励与资源推荐' },
  { value: 'graduation', label: '毕业季', desc: '毕业祝福与职业规划' },
]

export default function SettingsPanel({ onClose }: Props) {
  const existing = getUserProfile()
  const messages = useAppStore((s) => s.messages)
  const clearMessages = useAppStore((s) => s.clearMessages)

  // 身份状态
  const [name, setName] = useState(existing?.name || '')
  const [role, setRole] = useState<UserRole>(existing?.role || 'student')
  const [className, setClassName] = useState(existing?.className || '')
  const [interests, setInterests] = useState(existing?.interests || '')
  const [customBio, setCustomBio] = useState(existing?.customBio || '')
  const [replyStyle, setReplyStyle] = useState<ReplyStyle>(existing?.replyStyle || 'balanced')
  const [sceneMode, setSceneMode] = useState<SceneMode>(existing?.sceneMode || 'auto')

  // 记忆状态
  const [memories, setMemories] = useState<string[]>([])
  const [newMemory, setNewMemory] = useState('')
  const [memoryMsg, setMemoryMsg] = useState('')
  const [memoryLoading, setMemoryLoading] = useState(false)

  // 导出状态
  const [exporting, setExporting] = useState(false)
  const exportRef = useRef<HTMLDivElement>(null)

  const loadMemories = useCallback(async () => {
    return fetchMemories()
  }, [])

  useEffect(() => {
    let cancelled = false
    void loadMemories().then((list) => {
      if (!cancelled) setMemories(list)
    })
    return () => {
      cancelled = true
    }
  }, [loadMemories])

  const handleSave = () => {
    if (!name.trim()) return
    saveUserProfile({
      name: name.trim(),
      className: className.trim() || undefined,
      role,
      interests: interests.trim() || undefined,
      customBio: customBio.trim() || undefined,
      replyStyle,
      sceneMode,
      createdAt: existing?.createdAt || new Date().toISOString(),
    })
    onClose()
  }

  const handleAddMemory = async () => {
    if (!newMemory.trim()) return
    if (newMemory.trim().length > 60) {
      setMemoryMsg('每条记忆不能超过60字')
      return
    }
    setMemoryLoading(true)
    setMemoryMsg('')
    const result = await addMemory(newMemory.trim())
    setMemoryMsg(result.message)
    setMemoryLoading(false)
    if (result.success) {
      setNewMemory('')
      setMemories(await loadMemories())
    }
  }

  const handleDeleteMemory = async (index: number) => {
    await removeMemory(index)
    setMemories(await loadMemories())
  }

  const handleClearMemories = async () => {
    if (!window.confirm('确定要清除所有记忆吗？小会将不再记得关于你的事情。')) return
    await clearMemories()
    setMemories(await loadMemories())
  }

  const handleExportChat = async () => {
    if (messages.length === 0 || exporting) return
    setExporting(true)
    // 短暂延迟让隐藏的渲染节点挂载
    await new Promise((r) => setTimeout(r, 100))
    if (!exportRef.current) {
      setExporting(false)
      return
    }
    try {
      const canvas = await html2canvas(exportRef.current, {
        backgroundColor: '#F3F4F6',
        scale: 2,
      })
      const link = document.createElement('a')
      link.download = `社小会聊天记录_${new Date().toISOString().slice(0, 10)}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch {
      // export failed silently
    }
    setExporting(false)
  }

  const handleClearChat = () => {
    if (!window.confirm('确定要清除当前对话吗？此操作不可撤销。')) return
    clearMessages()
  }

  const isProfileComplete = name.trim().length > 0

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] flex flex-col"
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-[#1F2937]">⚙ 设置</h2>
            <button onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Body — scrollable */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-6">

            {/* 我的身份 */}
            <section>
              <h3 className="text-sm font-semibold text-[#2B5A8E] mb-3">👤 我的身份</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">称呼 *</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="你的名字" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#5B8DC4]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1.5">身份</label>
                  <div className="flex gap-2">
                    {ROLE_OPTIONS.map((opt) => (
                      <button key={opt.value} onClick={() => setRole(opt.value)}
                        className={`flex-1 py-2 rounded-xl text-xs font-medium transition-colors ${role === opt.value ? 'bg-[#2B5A8E] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                      >
                        <div>{opt.label}</div>
                        <div className="text-[10px] opacity-70">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">班级/部门（选填）</label>
                  <input value={className} onChange={(e) => setClassName(e.target.value)} placeholder={role === 'student' ? '例如：本科二班' : '例如：社会学系'} className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#5B8DC4]" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">兴趣爱好（选填）</label>
                  <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="例如：社会学理论、摄影、音乐" className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#5B8DC4]" />
                </div>
              </div>
            </section>

            {/* 回复偏好 */}
            <section>
              <h3 className="text-sm font-semibold text-[#2B5A8E] mb-3">💬 回复偏好</h3>
              <div className="flex gap-2">
                {STYLE_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setReplyStyle(opt.value)}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-medium transition-colors ${replyStyle === opt.value ? 'bg-[#2B5A8E] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[10px] opacity-70">{opt.desc}</div>
                  </button>
                ))}
              </div>
            </section>

            {/* 自定义介绍 */}
            <section>
              <h3 className="text-sm font-semibold text-[#2B5A8E] mb-3">📝 希望小会了解的关于你的事</h3>
              <textarea value={customBio} onChange={(e) => setCustomBio(e.target.value)}
                placeholder="例如：我正在做大创项目、我最近在准备考研、我喜欢布迪厄的理论..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#5B8DC4] resize-none"
              />
              <p className="text-[10px] text-gray-400 mt-1">这些信息只保存在当前浏览器，不会随聊天请求发送。</p>
            </section>

            {/* 场景模式 */}
            <section>
              <h3 className="text-sm font-semibold text-[#2B5A8E] mb-3">🎬 场景模式</h3>
              <div className="grid grid-cols-2 gap-2">
                {MODE_OPTIONS.map((opt) => (
                  <button key={opt.value} onClick={() => setSceneMode(opt.value)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-medium transition-colors text-left ${sceneMode === opt.value ? 'bg-[#2B5A8E] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                  >
                    <div>{opt.label}</div>
                    <div className="text-[10px] opacity-70">{opt.desc}</div>
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 mt-3 text-xs text-gray-400 cursor-pointer">
                <input type="checkbox" checked={sceneMode === 'auto'} onChange={(e) => setSceneMode(e.target.checked ? 'auto' : 'daily')} className="rounded accent-[#2B5A8E]" />
                根据当前日期自动切换场景
              </label>
            </section>

            {/* 记忆管理 */}
            <section>
              <h3 className="text-sm font-semibold text-[#2B5A8E] mb-3">🧠 本地记忆</h3>
              {memories.length === 0 ? (
                <p className="text-xs text-gray-400 italic">还没有任何记忆，多和小会聊聊吧~</p>
              ) : (
                <ul className="space-y-1.5 mb-3">
                  {memories.map((m, i) => (
                    <li key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2 group">
                      <span className="flex-1 text-gray-700">{m}</span>
                      <button onClick={() => handleDeleteMemory(i)} className="text-gray-300 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">✕</button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <input value={newMemory} onChange={(e) => { setNewMemory(e.target.value); setMemoryMsg('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddMemory()}
                  placeholder="手动添加记忆（60字内）..."
                  maxLength={60}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none focus:border-[#5B8DC4]"
                />
                <button onClick={handleAddMemory} disabled={memoryLoading || !newMemory.trim()}
                  className="px-3 py-2 rounded-xl bg-[#2B5A8E] text-white text-xs font-medium hover:bg-[#1e4570] disabled:opacity-40 transition-colors whitespace-nowrap"
                >
                  + 添加
                </button>
              </div>
              {memoryMsg && <p className={`text-xs mt-1.5 ${memoryMsg.includes('成功') ? 'text-green-500' : 'text-amber-500'}`}>{memoryMsg}</p>}
              {memories.length > 0 && (
                <button onClick={handleClearMemories} className="mt-2 text-xs text-red-400 hover:text-red-500 transition-colors">清除全部记忆</button>
              )}
            </section>

            {/* 对话管理 */}
            <section>
              <h3 className="text-sm font-semibold text-[#2B5A8E] mb-3">📋 对话</h3>
              <div className="flex gap-2">
                <button onClick={handleExportChat} disabled={messages.length === 0 || exporting}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-sm text-gray-600 hover:bg-gray-200 disabled:opacity-40 transition-colors"
                >
                  {exporting ? '生成中...' : '导出聊天记录（图片）'}
                </button>
                <button onClick={handleClearChat} disabled={messages.length === 0}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-sm text-red-400 hover:bg-red-50 disabled:opacity-40 transition-colors"
                >
                  清除当前对话
                </button>
              </div>
            </section>

            {/* 邀请码状态 */}
            <section>
              <h3 className="text-sm font-semibold text-[#2B5A8E] mb-3">🔑 邀请码状态</h3>
              <p className="text-xs text-green-600 flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
                已验证 · 可正常使用
              </p>
            </section>

          </div>

          {/* Footer */}
          <div className="px-5 py-4 border-t border-gray-100">
            <button onClick={handleSave} disabled={!isProfileComplete}
              className="w-full py-2.5 rounded-xl bg-[#2B5A8E] text-white text-sm font-medium hover:bg-[#1e4570] disabled:opacity-40 transition-colors"
            >
              保存设置
            </button>
          </div>
        </motion.div>
      </motion.div>

      {/* 隐藏的导出渲染节点 —— 不在可视区域内，但 html2canvas 需要它存在 */}
      <div
        ref={exportRef}
        style={{ position: 'fixed', left: '-9999px', top: 0, width: '375px', background: '#F3F4F6', padding: '20px 16px', fontFamily: 'system-ui, sans-serif', zIndex: -1 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>社小会 · 聊天记录</div>
          <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{new Date().toLocaleDateString('zh-CN')}</div>
        </div>
        {messages.map((m) => (
          <div key={m.id} style={{ marginBottom: 12, display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
            <div style={{
              maxWidth: '80%', padding: '10px 14px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: m.role === 'user' ? '#2B5A8E' : '#FFFFFF', color: m.role === 'user' ? '#FFFFFF' : '#1F2937',
              fontSize: 13, lineHeight: 1.6, boxShadow: '0 1px 3px rgba(0,0,0,0.08)', wordBreak: 'break-word',
            }}>
              {m.content}
            </div>
          </div>
        ))}
        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 10, color: '#D1D5DB' }}>社小会 · 独立开源示例</div>
      </div>
    </AnimatePresence>
  )
}
