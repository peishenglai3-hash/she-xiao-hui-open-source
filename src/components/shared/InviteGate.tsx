import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { verifyInviteCode, setInviteToken, getInviteToken } from '../../utils/api'

interface Props {
  onVerified: () => void
}

export default function InviteGate({ onVerified }: Props) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (getInviteToken()) onVerified()
  }, [onVerified])

  const handleSubmit = async () => {
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      const result = await verifyInviteCode(code.trim())
      if (result.valid && result.token) {
        setInviteToken(result.token)
        onVerified()
      } else {
        setError(result.message || '邀请码不正确，请重试')
      }
    } catch {
      setError('验证失败，请检查网络后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center bg-white"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full max-w-sm px-6 text-center">
        <div className="text-6xl mb-4 select-none pointer-events-none">📋</div>
        <h2 className="text-xl font-bold text-[#2B5A8E] mb-2">欢迎来到社小会</h2>
        <p className="text-sm text-gray-500 mb-6">请输入访问口令以继续访问</p>

        <input
          type="text"
          value={code}
          onChange={(e) => { setCode(e.target.value); setError('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit() }}
          placeholder="请输入邀请码"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-center text-base focus:outline-none focus:border-[#2B5A8E] transition-colors"
          autoFocus
        />

        {error && (
          <p className="text-red-400 text-sm mt-3">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !code.trim()}
          className="mt-4 w-full py-3 rounded-xl bg-[#2B5A8E] text-white font-medium text-base hover:bg-[#1e4a73] disabled:opacity-40 transition-all"
        >
          {loading ? '验证中...' : '进入'}
        </button>
      </div>
    </motion.div>
  )
}
