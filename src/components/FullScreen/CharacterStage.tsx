import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import type { Expression } from '../../store/useAppStore'
import ExpressionImage from '../shared/ExpressionImage'

const expressionLabels: Record<Expression, string> = {
  default: '等你来聊天呢~',
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

export default function CharacterStage({ onAvatarClick }: { onAvatarClick?: () => void }) {
  const expression = useAppStore((s) => s.currentExpression)

  return (
    <div className="flex flex-col items-center justify-center h-full py-6">
      <motion.div
        className="relative"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div
          className="w-48 h-48 md:w-56 md:h-56 rounded-full bg-gradient-to-b from-[#e8f0f8] to-[#d0e0f0] shadow-lg border-3 border-white flex items-center justify-center overflow-hidden cursor-pointer"
          onClick={onAvatarClick}
        >
          <motion.div
            key={expression}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <ExpressionImage
              expression={expression}
              size={180}
              className="md:w-[200px] md:h-[200px]"
            />
          </motion.div>
        </div>

        <motion.div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm border border-gray-100"
          key={expression + '-label'}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <span className="text-xs text-[#2B5A8E] font-medium whitespace-nowrap">
            {expressionLabels[expression]}
          </span>
        </motion.div>
      </motion.div>

      <motion.div
        className="mt-10 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        <h1 className="text-2xl font-bold" style={{ fontFamily: 'Poppins, sans-serif', color: '#2B5A8E' }}>
          社小会
        </h1>
        <p className="text-xs text-gray-400 mt-1">独立开源 · 社会学学习陪伴</p>
      </motion.div>
    </div>
  )
}
