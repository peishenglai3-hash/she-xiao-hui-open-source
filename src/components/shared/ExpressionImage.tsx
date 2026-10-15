import type { Expression } from '../../store/useAppStore'

const expressionMap: Record<Expression, string> = {
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

interface ExpressionImageProps {
  expression: Expression
  size?: number
  className?: string
}

export default function ExpressionImage({
  expression,
  size = 200,
  className = '',
}: ExpressionImageProps) {
  return (
    <img
      src={expressionMap[expression]}
      alt={expression}
      width={size}
      height={size}
      className={`object-contain select-none pointer-events-none ${className}`}
      draggable={false}
    />
  )
}
