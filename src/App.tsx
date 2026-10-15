import { useState, useRef } from 'react'
import { useAppStore } from './store/useAppStore'
import WidgetBubble from './components/Widget/WidgetBubble'
import FullScreenView from './components/FullScreen/FullScreenView'
import InviteGate from './components/shared/InviteGate'
import SettingsPanel from './components/shared/SettingsPanel'
import { getInviteToken } from './utils/api'
import { AnimatePresence, motion } from 'framer-motion'

interface AvatarRect {
  left: number
  top: number
  width: number
  height: number
}

export default function App() {
  const mode = useAppStore((s) => s.mode)
  const setMode = useAppStore((s) => s.setMode)
  const [showInviteGate, setShowInviteGate] = useState(!getInviteToken())
  const [showWelcome, setShowWelcome] = useState(true)
  const [showSettings, setShowSettings] = useState(false)
  const [welcomeAvatarRect, setWelcomeAvatarRect] = useState<AvatarRect | null>(null)
  const welcomeAvatarRef = useRef<HTMLDivElement>(null)

  const handleEnter = () => {
    const el = welcomeAvatarRef.current
    if (el) {
      const r = el.getBoundingClientRect()
      setWelcomeAvatarRect({ left: r.left, top: r.top, width: r.width, height: r.height })
    }
    setShowWelcome(false)
    setMode('fullscreen')
  }

  return (
    <div className="h-full w-full relative overflow-hidden">
      {/* 邀请码验证 */}
      <AnimatePresence>
        {showInviteGate && (
          <InviteGate onVerified={() => setShowInviteGate(false)} />
        )}
      </AnimatePresence>

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel onClose={() => setShowSettings(false)} />
        )}
      </AnimatePresence>

      {/* 欢迎画面 — 每次都显示，点击进入 */}
      <AnimatePresence>
        {showWelcome && (
          <motion.div
            className="absolute inset-0 z-50 cursor-pointer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            onClick={handleEnter}
          >
            {/* 背景视频：全屏铺满 */}
            <video
              autoPlay
              muted
              loop
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            >
              <source src="/welcome.mp4" type="video/mp4" />
            </video>

            {/* 渐变遮罩 */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#2B5A8E]/60 via-[#2B5A8E]/30 to-[#1F2937]/70" />

            {/* 内容区 */}
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                className="text-center"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              >
                {/* 社小会头像 */}
                <motion.div
                  ref={welcomeAvatarRef}
                  className="w-32 h-32 mx-auto rounded-full bg-white/15 backdrop-blur-md border-2 border-white/30 shadow-2xl overflow-hidden mb-6"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <img
                    src="/expressions/default.png"
                    alt="社小会"
                    className="w-full h-full object-contain p-2"
                  />
                </motion.div>

                <motion.h1
                  className="text-4xl font-bold text-white mb-3 tracking-wide"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  style={{ fontFamily: 'Poppins, sans-serif', textShadow: '0 2px 20px rgba(0,0,0,0.3)' }}
                >
                  社小会
                </motion.h1>

                <motion.p
                  className="text-white/80 text-base mb-1"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  独立开源 · 社会学学习陪伴
                </motion.p>

                <motion.p
                  className="text-white/60 text-sm mb-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.0 }}
                >
                  一个温和、透明、可自托管的 AI 陪伴示例
                </motion.p>

                {/* 点击进入提示 */}
                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                >
                  <motion.div
                    className="inline-block px-8 py-3 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-white text-sm font-medium shadow-lg"
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    点 击 屏 幕 任 意 位 置 开 始 聊 天
                  </motion.div>
                </motion.div>
              </motion.div>
            </div>

            {/* 底部装饰文字 */}
            <motion.p
              className="absolute bottom-10 w-full text-center text-white/40 text-xs"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2 }}
            >
              " 一起观察社会，也照顾自己 "
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Widget 模式 */}
      <AnimatePresence>
        {mode === 'widget' && !showWelcome && (
          <WidgetBubble key="widget" />
        )}
        {mode === 'fullscreen' && !showWelcome && (
          <FullScreenView key="fullscreen" onOpenSettings={() => setShowSettings(true)} welcomeAvatarRect={welcomeAvatarRect} />
        )}
      </AnimatePresence>

      {/* Widget 引导提示（只显示一次） */}
      <AnimatePresence>
        {mode === 'widget' && !showWelcome && (
          <motion.div
            key="guide"
            className="fixed bottom-28 right-6 z-50 pointer-events-none"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 1.5 }}
          >
            <motion.div
              className="bg-white/95 backdrop-blur-sm shadow-lg rounded-2xl rounded-br-md px-4 py-2.5 border border-gray-100 max-w-[200px]"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <p className="text-xs text-gray-500 leading-relaxed">
                点我一起聊天吧~
              </p>
            </motion.div>
            <div className="w-3 h-3 bg-white/95 border-b border-r border-gray-100 rotate-45 absolute -bottom-1.5 right-6" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
