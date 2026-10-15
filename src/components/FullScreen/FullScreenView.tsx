import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import type { Expression } from '../../store/useAppStore'
import CharacterStage from './CharacterStage'
import ChatPanel from './ChatPanel'

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

const mobileStatus: Record<Expression, string> = {
  default: '在线 · 随时陪伴你',
  happy: '今天很开心！',
  encouraging: '加油，你可以的！',
  surprised: '诶？真的吗？',
  shy: '唔…有点不好意思呢……',
  thinking: '嗯…让我想想……',
  cheer: '加油加油！',
  listening: '嗯嗯，我在认真听~',
  studying: '正在认真学习中…',
  touched: '好感动……',
  sleepy: '有点困了呢…晚安~',
  overwhelmed: '啊啊啊要崩溃了…',
  sage: '进入贤者模式……',
}

const EASTER_EGGS = [
  '诶？你戳我干嘛~',
  '唔…被发现啦！',
  '哼哼，再戳我就要脸红了哦~',
  '有什么话想和我说吗？',
  '我在呢，一直都在~',
  '咦？你是不是手滑了？',
  '哈哈哈别闹~',
  '戳一下，社会学知识+1！',
  '喂喂，我很怕痒的！',
  '嗯？想和我聊天就直接说嘛~',
]

interface AvatarRect {
  left: number
  top: number
  width: number
  height: number
}

export default function FullScreenView({ onOpenSettings, welcomeAvatarRect }: { onOpenSettings?: () => void; welcomeAvatarRect?: AvatarRect | null }) {
  const setMode = useAppStore((s) => s.setMode)
  const currentExpression = useAppStore((s) => s.currentExpression)

  const [characterCollapsed, setCharacterCollapsed] = useState(false)
  const [easterEgg, setEasterEgg] = useState<string | null>(null)
  const [easterEggPos, setEasterEggPos] = useState<'mobile' | 'desktop' | null>(null)
  const inputFocusedRef = useRef(false)
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const mobileAvatarTargetRef = useRef<HTMLDivElement>(null)

  // Welcome → FullScreen 头像飞入动画
  const [flyPhase, setFlyPhase] = useState<'idle' | 'flying' | 'arrived'>('idle')
  const [flyTarget, setFlyTarget] = useState<AvatarRect | null>(null)

  useEffect(() => {
    if (!welcomeAvatarRect || flyPhase !== 'idle') return
    const frame = requestAnimationFrame(() => {
      setFlyPhase('flying')
        const el = mobileAvatarTargetRef.current
        if (el) {
          const r = el.getBoundingClientRect()
          setFlyTarget({ left: r.left, top: r.top, width: r.width, height: r.height })
        }
    })
    return () => cancelAnimationFrame(frame)
  }, [welcomeAvatarRect, flyPhase])

  // 键盘感知：visualViewport 高度变化 → 自动收起/展开
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    const handler = () => {
      if (vv.height < window.innerHeight * 0.75) {
        setCharacterCollapsed(true)
      } else if (!inputFocusedRef.current) {
        collapseTimerRef.current = setTimeout(() => setCharacterCollapsed(false), 300)
      }
    }
    vv.addEventListener('resize', handler)
    return () => {
      vv.removeEventListener('resize', handler)
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
    }
  }, [])

  const handleInputFocus = useCallback((focused: boolean) => {
    inputFocusedRef.current = focused
    if (focused) {
      if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current)
      setCharacterCollapsed(true)
    } else {
      collapseTimerRef.current = setTimeout(() => setCharacterCollapsed(false), 400)
    }
  }, [])

  const handleAvatarClick = useCallback((pos: 'mobile' | 'desktop') => {
    const egg = EASTER_EGGS[Math.floor(Math.random() * EASTER_EGGS.length)]
    setEasterEgg(egg)
    setEasterEggPos(pos)
    setTimeout(() => setEasterEgg(null), 2200)
  }, [])

  return (
    <motion.div
      className="h-full w-full flex flex-col md:flex-row relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 全局背景 */}
      <img
        src="/background.png"
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-[0.06] pointer-events-none"
      />

      {/* 桌面端返回 + 设置按钮（移动端由角色区内部处理） */}
      <motion.button
        className="hidden md:flex absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-gray-100 items-center justify-center hover:bg-white transition-colors"
        onClick={() => setMode('widget')}
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B5A8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
      </motion.button>

      {onOpenSettings && (
        <motion.button
          className="hidden md:flex absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md border border-gray-100 items-center justify-center hover:bg-white transition-colors"
          onClick={onOpenSettings}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2B5A8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
          </svg>
        </motion.button>
      )}

      {/* ============== 手机端: 上下分栏 ============== */}
      <div className="md:hidden flex flex-col h-full">
        {/* 角色展示区 — 上半部分 */}
        <motion.div
          className="relative flex-shrink-0 overflow-hidden pt-[env(safe-area-inset-top,0px)]"
          animate={{ height: characterCollapsed ? '52px' : '40%' }}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
        >
          {/* 展开态：角色背景 + 覆盖层 */}
          {!characterCollapsed && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <img
                src="/mobile-character.png"
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-[#F3F4F6]" />

              {/* 展开态返回按钮 */}
              <button
                className="absolute top-4 left-4 z-20 w-8 h-8 rounded-full bg-white/25 backdrop-blur-sm border border-white/30 flex items-center justify-center"
                onClick={() => setMode('widget')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {/* 飞入动画：克隆头像从 Welcome 位置飞到角色区 */}
                {flyPhase === 'flying' && welcomeAvatarRect && flyTarget && (
                  <motion.div
                    className="fixed z-[60] rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 shadow-2xl overflow-hidden pointer-events-none"
                    style={{
                      left: welcomeAvatarRect.left,
                      top: welcomeAvatarRect.top,
                      width: welcomeAvatarRect.width,
                      height: welcomeAvatarRect.height,
                    }}
                    animate={{
                      left: flyTarget.left,
                      top: flyTarget.top,
                      width: flyTarget.width,
                      height: flyTarget.height,
                    }}
                    transition={{ duration: 0.45, ease: [0.32, 0.72, 0, 1] }}
                    onAnimationComplete={() => setFlyPhase('arrived')}
                  >
                    <img
                      src="/expressions/default.png"
                      alt=""
                      className="w-full h-full object-contain p-1"
                    />
                  </motion.div>
                )}

                {/* 正常头像（飞入期间隐藏） */}
                <motion.div
                  ref={mobileAvatarTargetRef}
                  className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/40 shadow-2xl overflow-hidden cursor-pointer"
                  animate={{ y: flyPhase === 'arrived' || !welcomeAvatarRect ? [0, -6, 0] : undefined }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  onClick={() => handleAvatarClick('mobile')}
                >
                  <motion.img
                    key={currentExpression}
                    src={expressionSrc[currentExpression]}
                    alt=""
                    className="w-full h-full object-contain p-1"
                    initial={flyPhase === 'idle' && welcomeAvatarRect ? { scale: 0, opacity: 0 } : { scale: 0.6, opacity: 0 }}
                    animate={flyPhase === 'idle' && welcomeAvatarRect ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                    transition={{ duration: flyPhase === 'arrived' || !welcomeAvatarRect ? 0.3 : 0 }}
                  />
                </motion.div>

                <motion.h1
                  className="text-2xl font-bold text-white mt-3 tracking-wide"
                  style={{ fontFamily: 'Poppins, sans-serif', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}
                >
                  社小会
                </motion.h1>
                <p className="text-white/70 text-xs mt-0.5" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.3)' }}>
                  独立开源 · 社会学学习陪伴
                </p>
                <motion.p
                  key={currentExpression + '-status'}
                  className="text-white/80 text-xs mt-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-sm"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {mobileStatus[currentExpression]}
                </motion.p>

                {onOpenSettings && (
                  <button
                    onClick={onOpenSettings}
                    className="mt-3 flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-white/15 backdrop-blur-sm border border-white/20 text-white/80 text-xs hover:bg-white/25 hover:text-white transition-all"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                    </svg>
                    设置
                  </button>
                )}
              </div>

              {/* 彩蛋气泡 */}
              <AnimatePresence>
                {easterEgg && easterEggPos === 'mobile' && (
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[120%] bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl px-4 py-2.5 border border-gray-100 z-30"
                    initial={{ opacity: 0, y: 10, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10 }}
                  >
                    <p className="text-sm text-[#2B5A8E] font-medium whitespace-nowrap">{easterEgg}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {/* 收起态：紧凑标题条 */}
          {characterCollapsed && (
            <motion.div
              className="absolute inset-0 flex items-center px-3 gap-2.5 bg-white/95 backdrop-blur-sm border-b border-gray-100 z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <button
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                onClick={() => setMode('widget')}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2B5A8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>

              <button
                className="flex items-center gap-2 flex-1 min-w-0"
                onClick={() => setCharacterCollapsed(false)}
              >
                <img
                  src={expressionSrc[currentExpression]}
                  alt=""
                  className="w-7 h-7 rounded-full border border-gray-100 flex-shrink-0"
                />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-[#1F2937]">社小会</span>
                  <span className="text-xs text-gray-400 ml-2">{mobileStatus[currentExpression]}</span>
                </div>
              </button>

              {onOpenSettings && (
                <button
                  onClick={onOpenSettings}
                  className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#2B5A8E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
                  </svg>
                </button>
              )}
            </motion.div>
          )}
        </motion.div>

        {/* 聊天区 — 下半部分 */}
        <motion.div
          className="flex-1 bg-[#F3F4F6] rounded-t-[1.75rem] -mt-5 relative z-10 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <ChatPanel onOpenSettings={onOpenSettings} onInputFocus={handleInputFocus} />
        </motion.div>
      </div>

      {/* ============== 桌面端: 左侧角色展示 ============== */}
      <motion.div
        className="hidden md:flex md:w-[45%] lg:w-[40%] h-full items-center justify-center relative"
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <img
          src="/background.png"
          alt=""
          className="absolute inset-0 w-full h-full object-cover opacity-15"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#e8f0f8]/70 via-[#f0f4f8]/50 to-[#F3F4F6]/90" />
        <div className="relative z-10">
          <CharacterStage onAvatarClick={() => handleAvatarClick('desktop')} />

          {/* 桌面端彩蛋气泡 */}
          <AnimatePresence>
            {easterEgg && easterEggPos === 'desktop' && (
              <motion.div
                className="absolute top-1/3 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl px-4 py-2.5 border border-gray-100 z-30"
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="text-sm text-[#2B5A8E] font-medium whitespace-nowrap">{easterEgg}</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* ============== 桌面端: 聊天面板 ============== */}
      <motion.div
        className="hidden md:flex flex-1 h-full md:rounded-l-2xl overflow-hidden relative"
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut', delay: 0.1 }}
      >
        <ChatPanel onOpenSettings={onOpenSettings} />
      </motion.div>
    </motion.div>
  )
}
