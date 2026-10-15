import { motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import ExpressionImage from '../shared/ExpressionImage'

export default function WidgetBubble() {
  const setMode = useAppStore((s) => s.setMode)
  const expression = useAppStore((s) => s.currentExpression)

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50 cursor-pointer group"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={() => setMode('fullscreen')}
    >
      <motion.div
        className="relative"
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="w-20 h-20 rounded-full bg-white shadow-lg border-2 border-[#5B8DC4] overflow-hidden flex items-center justify-center p-1 group-hover:shadow-xl group-hover:scale-105 transition-all duration-200">
          <ExpressionImage expression={expression} size={72} />
        </div>

        {/* 在线指示点 */}
        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#A64D4D] border-2 border-white flex items-center justify-center">
          <motion.span
            className="text-[10px]"
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            💬
          </motion.span>
        </div>

        {/* 悬停光环 */}
        <div className="absolute inset-0 rounded-full border-2 border-[#5B8DC4]/0 group-hover:border-[#5B8DC4]/30 group-hover:scale-125 transition-all duration-300 pointer-events-none" />
      </motion.div>

      <motion.p
        className="text-center text-xs text-[#2B5A8E] mt-1 font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        社小会
      </motion.p>
    </motion.div>
  )
}
